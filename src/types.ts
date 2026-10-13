import type { MilkdownPlugin } from "@milkdown/kit/ctx";

export type WechatPluginCategory = "inline" | "block" | "container" | "component";

export interface WechatLinkReference {
  index: number;
  text: string;
  url: string;
}

export interface ArticleStructure {
  numberedHeadings?: boolean;
  headingLabel?: string;
  quoteLabel?: string;
  headerImageUrl?: string | null;
  calloutPresets?: Record<string, { title?: string; icon?: string }>;
  [key: string]: unknown;
}

export interface WechatRenderContext {
  document: Document;
  root?: HTMLElement;
  theme?: unknown;
  references?: WechatLinkReference[];
  structure?: ArticleStructure;
}

export interface WechatElementRenderer {
  kind: string;
  selector: string;
  /** Optional selector used after CSS has been inlined. Defaults to selector. */
  finalizeSelector?: string;
  prepare?: (element: HTMLElement, context: WechatRenderContext) => void | Promise<void>;
  finalize?: (element: HTMLElement, context: WechatRenderContext) => void;
}

export interface WechatPluginDoc {
  /** 插件唯一 ID，如 "callout"、"highlight"、"kbd"、"badge"、"article-card" */
  id: string;
  /** 展示名称，如 "提示卡片 (Callout)" */
  name: string;
  /** 插件分类 */
  category: WechatPluginCategory;
  /** 简明说明 */
  description: string;
  /** 语法示例，点击展台可直接插入当前光标处 */
  sampleMarkdown: string;
  /** 语法规则速查说明 */
  syntaxGuide: string;
  /** 支持的可调节 CSS 类名或选择器，如 [data-callout-type="warning"] */
  cssSelectors?: string[];
}

export interface WechatMarkdownPlugin {
  doc: WechatPluginDoc;
  /** 注入到 Milkdown 的插件集合（包含 Remark 解析器、ProseMirror Schema 等） */
  milkdownPlugins: MilkdownPlugin[];
  /** 注入到微信 HTML 生成链路的渲染器扩展（负责结构预处理、标签替换、微信兼容） */
  wechatRenderer?: WechatElementRenderer;
  /** 插件内置的微信/排版默认样式 */
  defaultCss?: string;
}
