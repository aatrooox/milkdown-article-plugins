import { DOMSerializer } from "@milkdown/kit/prose/model";
import type { DOMOutputSpec } from "@milkdown/kit/prose/model";
import type { NodeViewConstructor } from "@milkdown/kit/prose/view";
import type { WechatElementRenderer } from "./types.js";

/** 标题留在不可编辑区域，正文交给 ProseMirror 管理。 */
export function createArticleNodeView(renderer: WechatElementRenderer): NodeViewConstructor {
  return (node) => {
    const spec = node.type.spec.toDOM!(node) as [string, Record<string, string>, number];
    const { dom, contentDOM } = DOMSerializer.renderSpec(document, [
      spec[0], spec[1], ["section", { "data-article-content": "" }, 0],
    ] as DOMOutputSpec);
    const root = dom as HTMLElement;
    renderer.prepare?.(root, { document });
    root.firstElementChild?.setAttribute("contenteditable", "false");
    return {
      dom: root,
      contentDOM,
      update: (next) => next.type === node.type && next.attrs.type === node.attrs.type && next.attrs.title === node.attrs.title,
      ignoreMutation: (mutation) => mutation.type !== "selection" && !contentDOM!.contains(mutation.target),
    };
  };
}
