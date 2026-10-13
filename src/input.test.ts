import { expect, test } from "bun:test";
import { inputRules } from "@milkdown/kit/prose/inputrules";
import { EditorState, TextSelection } from "@milkdown/kit/prose/state";
import { createArticleBlockInput, createArticleInputRules } from "./input";
import { createArticleCodec } from "./serialization.test";

test("typed inline markers convert and serialize without leaking into code or escaped text", async () => {
  const { schema, serialize } = await createArticleCodec();
  const plugin = inputRules({ rules: createArticleInputRules(schema) });
  for (const [source, mark, expected] of [
    ["==重点==", "highlight", "重点"], ["[[kbd:Cmd]]", "kbd", "Cmd"],
    ...["brand", "success", "warning", "danger", "info"].map(type => [`[badge:${type}|状态]`, "badge", "状态"]),
  ]) {
    const value = source.slice(0, -1);
    let state = EditorState.create({ schema, doc: schema.node("doc", null, schema.node("paragraph", null, schema.text(value))) });
    state = state.apply(state.tr.setSelection(TextSelection.atEnd(state.doc)));
    const view: any = { state, composing: false, dispatch: (tr: any) => { view.state = view.state.apply(tr); } };
    expect(plugin.props.handleTextInput!.call(plugin, view, state.selection.from, state.selection.to, source.at(-1)!, () => state.tr)).toBe(true);
    expect(view.state.doc.textContent).toBe(expected);
    expect(view.state.doc.firstChild.firstChild.marks[0].type.name).toBe(mark);
    expect(serialize(view.state.doc)).toContain(source);
  }
  for (const kind of ["code_block", "inlineCode", "escaped"]) {
    const prefix = kind === "escaped" ? "\\[[kbd:Cmd]" : "[[kbd:Cmd]";
    const doc = schema.node("doc", null, schema.node(kind === "code_block" ? "code_block" : "paragraph", null,
      schema.text(prefix, kind === "inlineCode" ? [schema.mark("inlineCode")] : [])));
    let state = EditorState.create({ schema, doc });
    state = state.apply(state.tr.setSelection(TextSelection.atEnd(doc)));
    const view: any = { state, composing: false, dispatch() { throw Error("literal input was converted"); } };
    expect(plugin.props.handleTextInput!.call(plugin, view, state.selection.from, state.selection.to, "]", () => state.tr)).toBe(false);
  }
});

test("Enter converts standalone component markers and keeps the cursor inside the new body", async () => {
  const { schema, serialize } = await createArticleCodec();
  const plugin = createArticleBlockInput();
  for (const quote of [false, true]) {
    for (const tag of ["INTRO", "CTA", "PREFACE", "OUTRO", "NOTE", "TIP", "IMPORTANT", "WARNING", "CAUTION"]) {
      const paragraph = schema.node("paragraph", null, schema.text(`[!${tag}] 自定义标题`));
      const doc = schema.node("doc", null, quote ? schema.node("blockquote", null, paragraph) : paragraph);
      let state = EditorState.create({ schema, doc });
      state = state.apply(state.tr.setSelection(TextSelection.atEnd(doc)));
      const view: any = { state, dispatch: (tr: any) => { view.state = view.state.apply(tr); } };
      expect(plugin.props.handleKeyDown!.call(plugin, view, { key: "Enter" } as any)).toBe(true);
      const card = ["INTRO", "CTA", "PREFACE", "OUTRO"].includes(tag);
      expect(view.state.doc.firstChild.type.name).toBe(card ? "articleCard" : "callout");
      expect(view.state.doc.firstChild.attrs.title).toBe("自定义标题");
      expect(view.state.selection.$from.parent.type.name).toBe("paragraph");
      expect(serialize(view.state.doc)).toContain(`[!${tag === "PREFACE" ? "INTRO" : tag === "OUTRO" ? "CTA" : tag}] 自定义标题`);
    }
  }
});
