import { schemaCtx } from "@milkdown/kit/core";
import { inputRules, InputRule } from "@milkdown/kit/prose/inputrules";
import type { Schema } from "@milkdown/kit/prose/model";
import { Plugin, TextSelection } from "@milkdown/kit/prose/state";
import { $prose } from "@milkdown/kit/utils";

/** 行内语法在最后一个定界符输入后转换，代码和转义文本保持原样。 */
export function createArticleInputRules(schema: Schema): InputRule[] {
  return [
    { pattern: /==([^=\n]+)==$/, name: "highlight", text: 1 },
    { pattern: /\[\[kbd:([^\]\n]+)\]\]$/, name: "kbd", text: 1 },
    { pattern: /\[badge:(brand|success|warning|danger|info)\|([^\]\n]+)\]$/i, name: "badge", text: 2 },
  ].map(({ pattern, name, text }) => new InputRule(pattern, (state, match, start, end) => {
    const $start = state.doc.resolve(start);
    const before = $start.parent.textBetween(0, $start.parentOffset);
    if ((before.match(/\\+$/)?.[0].length ?? 0) % 2) return null;
    const value = match[text];
    const mark = schema.marks[name].create(name === "badge" ? { type: match[1].toLowerCase() } : {});
    return state.tr.insertText(value, start, end).addMark(start, start + value.length, mark).removeStoredMark(mark.type);
  }, { inCodeMark: false }));
}

/** 块标记独占一行，回车后转换并将光标留在正文内。 */
export function createArticleBlockInput(): Plugin {
  return new Plugin({
    props: {
      handleKeyDown(view, event) {
        if (event.key !== "Enter" || event.shiftKey || event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return false;
        const { state } = view;
        const { $from, empty } = state.selection;
        if (!empty || $from.parent.type.name !== "paragraph" || $from.parentOffset !== $from.parent.content.size) return false;
        const match = $from.parent.textContent.match(/^\[!(INTRO|PREFACE|CTA|OUTRO|NOTE|TIP|IMPORTANT|WARNING|CAUTION)\](?:[ \t]+(.*))?$/i);
        if (!match) return false;
        const tag = match[1].toUpperCase();
        const card = ["INTRO", "PREFACE", "CTA", "OUTRO"].includes(tag);
        const type = state.schema.nodes[card ? "articleCard" : "callout"];
        const attrs = { type: card ? (["CTA", "OUTRO"].includes(tag) ? "cta" : "intro") : tag.toLowerCase(), title: match[2]?.trim() || "" };
        let depth = $from.depth;
        if (depth > 1 && $from.node(depth - 1).type.name === "blockquote" && $from.node(depth - 1).childCount === 1) depth--;
        const start = $from.before(depth);
        const tr = state.tr.replaceWith(start, $from.after(depth), type.create(attrs, state.schema.nodes.paragraph.create()));
        tr.setSelection(TextSelection.near(tr.doc.resolve(start + 2)));
        view.dispatch(tr.scrollIntoView());
        return true;
      },
    },
  });
}

export const articleInputPlugins = [
  $prose(ctx => inputRules({ rules: createArticleInputRules(ctx.get(schemaCtx)) })),
  $prose(() => createArticleBlockInput()),
];
