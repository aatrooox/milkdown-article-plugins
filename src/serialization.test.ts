import { expect, test } from "bun:test";
import { Clock, Container, Ctx } from "@milkdown/kit/ctx";
import { InitReady, SchemaReady, marksCtx, markViewCtx, nodesCtx, nodeViewCtx, prosePluginsCtx, remarkCtx, remarkPluginsCtx, remarkStringifyOptionsCtx, schemaCtx, schemaTimerCtx } from "@milkdown/kit/core";
import { commonmark } from "@milkdown/kit/preset/commonmark";
import { Schema } from "@milkdown/kit/prose/model";
import { ParserState, SerializerState } from "@milkdown/kit/transformer";
import { getCombinedMilkdownPlugins } from "./registry";
import { createArticleNodeView } from "./editor-view";
import { calloutWechatRenderer } from "./builtin-callout";
import { articleCardWechatRenderer } from "./builtin-article-cards";

/** 使用真实插件、Schema 和转换器检查保存后重新打开。 */
export async function createArticleCodec() {
  const ctx = new Ctx(new Container(), new Clock());
  ctx.inject(nodesCtx, []).inject(marksCtx, []).inject(schemaTimerCtx, [])
    .inject(nodeViewCtx, []).inject(markViewCtx, []).inject(schemaCtx).inject(prosePluginsCtx, [])
    .inject(remarkPluginsCtx, []).inject(remarkCtx, remarkCtx.create(new Map()).get()()).inject(remarkStringifyOptionsCtx)
    .record(InitReady).record(SchemaReady);
  const plugins = getCombinedMilkdownPlugins();
  const schemaPlugins = commonmark.filter((plugin: any) => plugin.key?.name || plugin.type);
  const loaders = [...schemaPlugins, ...plugins].map(plugin => plugin(ctx));
  const ready = Promise.all(loaders.map(load => load()));
  const schemaReady = ctx.waitTimers(schemaTimerCtx);
  ctx.done(InitReady);
  await schemaReady;
  const schema = new Schema({
    nodes: Object.fromEntries(ctx.get(nodesCtx)),
    marks: Object.fromEntries(ctx.get(marksCtx)),
  });
  ctx.set(schemaCtx, schema);
  ctx.done(SchemaReady);
  await ready;
  const remark = ctx.get(remarkPluginsCtx).reduce((processor, entry) =>
    processor.use(entry.plugin, entry.options), ctx.get(remarkCtx));
  return { schema, parse: ParserState.create(schema, remark), serialize: SerializerState.create(schema, remark) };
}

test("preserves article cards, alert titles and inline components after editing", async () => {
  const codec = await createArticleCodec();
  const source = [
    "> [!INTRO] 导读\n> 第一段 **加粗**。\n>\n> 第二段 ==高亮==。",
    ...["NOTE", "TIP", "IMPORTANT", "WARNING", "CAUTION"].map(type => `> [!${type}] ${type} 标题\n> 内容。`),
    "快捷键 [[kbd:Cmd]] + [[kbd:S]]。",
    ...["brand", "success", "warning", "danger", "info"].map(type => `[badge:${type}|${type} 状态]`),
    "> [!CTA] 文末交流\n> 继续讨论。",
    "> [!preface]\n> 旧导读。\n\n> [!outro]\n> 旧文末。",
    "`[[kbd:Cmd]]` 和 `[badge:brand|字面]`。",
    "```text\n> [!INTRO] 字面\n[[kbd:Cmd]]\n```",
  ].join("\n\n");
  const document = codec.parse(source);
  const saved = codec.serialize(document);
  for (const marker of ["[!INTRO]", "[!CTA]", "[[kbd:Cmd]]", "[[kbd:S]]", ...["NOTE", "TIP", "IMPORTANT", "WARNING", "CAUTION"].map(type => `[!${type}]`), ...["brand", "success", "warning", "danger", "info"].map(type => `[badge:${type}|`)]) {
    expect(saved).toContain(marker);
  }
  expect(saved).toContain("NOTE 标题");
  expect(saved).toContain("文末交流");
  expect(codec.parse(saved).toJSON()).toEqual(document.toJSON());
  expect(codec.parse(codec.serialize(codec.parse(saved))).toJSON()).toEqual(document.toJSON());
});

test("shows a non-editable component heading without mixing it into the saved body", async () => {
  const codec = await createArticleCodec();
  const previous = globalThis.document;
  const document = {
    createElement(tagName: string) {
      return {
        nodeType: 1, tagName, attributes: {} as Record<string, string>, children: [] as any[],
        get firstElementChild() { return this.children[0]; },
        setAttribute(name: string, value: string) { this.attributes[name] = value; },
        getAttribute(name: string) { return this.attributes[name]; },
        appendChild(child: any) { this.children.push(child); },
        prepend(child: any) { this.children.unshift(child); },
        querySelectorAll() { return []; },
        contains(target: any): boolean { return target === this || this.children.some(child => child.contains?.(target)); },
      };
    },
  };
  globalThis.document = document as any;
  try {
    for (const [source, renderer] of [
      ["> [!TIP] 实用技巧\n> 正文。", calloutWechatRenderer],
      ["> [!INTRO] 开篇导读\n> 正文。", articleCardWechatRenderer],
      ["> [!CTA] 交流反馈\n> 正文。", articleCardWechatRenderer],
    ] as const) {
      const node = codec.parse(source).firstChild!;
      const view = createArticleNodeView(renderer)(node, null as any, () => 0, [], null as any);
      const header = (view.dom as any).firstElementChild;
      expect(header.attributes.contenteditable).toBe("false");
      expect(header.children[0].textContent || header.children[0].children[0].textContent).toBeTruthy();
      expect(view.contentDOM).not.toBe(header);
      expect(view.ignoreMutation!({ type: "attributes", target: header } as any)).toBe(true);
      expect(view.ignoreMutation!({ type: "childList", target: view.contentDOM } as any)).toBe(false);
      expect(view.update!(node, [], null as any)).toBe(true);
      expect(view.update!(node.type.create({ ...node.attrs, title: "新标题" }, node.content), [], null as any)).toBe(false);
    }
  } finally {
    globalThis.document = previous;
  }
});
