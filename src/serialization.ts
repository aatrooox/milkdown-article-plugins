import { $remark } from "@milkdown/kit/utils";

/** 保存组件标记，避免编辑后的 Markdown 丢失类型和标题。 */
export function remarkArticleSerialization(this: any) {
  const data = this.data();
  const phrasing = (node: any, state: any, info: any) => state.containerPhrasing(node, {
    ...info, before: "", after: "",
  });
  const block = (node: any, state: any, info: any, tag: string) => {
    const title = node.customTitle ? ` ${node.customTitle}` : "";
    const body = state.containerFlow(node, info);
    return `> [!${tag}]${title}\n>\n${body.split("\n").map((line: string) => line ? `> ${line}` : ">").join("\n")}`;
  };
  (data.toMarkdownExtensions ??= []).push({
    handlers: {
      callout: (node: any, _parent: any, state: any, info: any) =>
        block(node, state, info, node.calloutType.toUpperCase()),
      articleCard: (node: any, _parent: any, state: any, info: any) =>
        block(node, state, info, node.cardType === "cta" ? "CTA" : "INTRO"),
      kbd: (node: any, _parent: any, state: any, info: any) =>
        `[[kbd:${phrasing(node, state, info)}]]`,
      badge: (node: any, _parent: any, state: any, info: any) =>
        `[badge:${node.badgeType}|${phrasing(node, state, info)}]`,
    },
  });
}

export const articleSerializationPlugins = $remark("remarkArticleSerialization", () => remarkArticleSerialization);
