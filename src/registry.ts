import type { MilkdownPlugin } from "@milkdown/kit/ctx";
import type { WechatElementRenderer, WechatMarkdownPlugin, WechatPluginDoc } from "./types.js";
import { builtinHighlightPlugin } from "./builtin-highlight.js";
import { builtinCalloutPlugin } from "./builtin-callout.js";
import { builtinKbdPlugin } from "./builtin-kbd.js";
import { builtinBadgePlugin } from "./builtin-badge.js";
import { builtinArticleCardsPlugin } from "./builtin-article-cards.js";
import { articleSerializationPlugins } from "./serialization.js";
import { articleInputPlugins } from "./input.js";

const BUILTIN_PLUGINS: WechatMarkdownPlugin[] = [
  builtinHighlightPlugin,
  builtinCalloutPlugin,
  builtinKbdPlugin,
  builtinBadgePlugin,
  builtinArticleCardsPlugin,
];

const customPlugins: WechatMarkdownPlugin[] = [];

export function registerPlugin(plugin: WechatMarkdownPlugin): void {
  // Avoid duplicate plugin IDs
  const existingIndex = customPlugins.findIndex((p) => p.doc.id === plugin.doc.id);
  if (existingIndex >= 0) {
    customPlugins[existingIndex] = plugin;
  } else {
    customPlugins.push(plugin);
  }
}

export function getAllPlugins(): WechatMarkdownPlugin[] {
  return [...BUILTIN_PLUGINS, ...customPlugins];
}

export function getPluginDocs(): WechatPluginDoc[] {
  return getAllPlugins().map((p) => p.doc);
}

export function getCombinedMilkdownPlugins(): MilkdownPlugin[] {
  const plugins: MilkdownPlugin[] = [...articleSerializationPlugins, ...articleInputPlugins];
  for (const plugin of getAllPlugins()) {
    plugins.push(...plugin.milkdownPlugins);
  }
  return plugins;
}

export function getCombinedWechatRenderers(): WechatElementRenderer[] {
  const renderers: WechatElementRenderer[] = [];
  for (const plugin of getAllPlugins()) {
    if (plugin.wechatRenderer) {
      renderers.push(plugin.wechatRenderer);
    }
  }
  return renderers;
}

export function getCombinedDefaultCss(): string {
  const cssBlocks: string[] = [];
  for (const plugin of getAllPlugins()) {
    if (plugin.defaultCss) {
      cssBlocks.push(plugin.defaultCss);
    }
  }
  return cssBlocks.join("\n\n");
}
