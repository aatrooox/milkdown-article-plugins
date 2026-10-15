# @akairos/milkdown-article-plugins

用于公众号与长文排版的 Milkdown 插件扩展集合。提供从 Markdown 语法扩展（Remark AST）、ProseMirror 视图绑定，到微信排版 HTML 安全渲染器的完整支持。

配套排版 CSS 样式包：[`@akairos/milkdown-article-style`](https://www.npmjs.com/package/@akairos/milkdown-article-style)

## 生态与使用者

| 项目 | 使用关系 |
| --- | --- |
| [myno](https://github.com/k7airos/myno) | 直接依赖本包，封装编辑器、菜单、上传接线和排版工作台；需要开箱即用编辑器时优先使用 myno |
| [zzhub-pipeline](https://github.com/k7airos/zzhub-pipeline) | 直接依赖本包用于内置 Markdown 导出，也可通过 myno 插件渲染；负责发布状态机和微信草稿操作 |
| [Milkdown Article Style](https://github.com/k7airos/milkdown-article-style) | 配套纯 CSS 包；使用本包语法时按需显式安装和引入，共享样式不是本包的运行时依赖 |
| [Kairos Skills](https://github.com/k7airos/kairos-skills) | `milkdown-writing` 将本包语法和微信导出限制提供给写作 Agent |

Nezus 也是现有宿主，通过 myno 和本包复用文章组件。本包自身不依赖 Pipeline、后端服务或浏览器自动化；它扩展语法与组件，不提供完整编辑器 UI 或发布能力。

## 特性与组件

1. **高亮标记 (`highlight`)**
   - 语法：`==高亮文本==`
   - 效果：黄色荧光笔质感高亮背景

2. **提示卡片 (`callout`)**
   - 语法：GFM 标准 Alert 语法 `> [!NOTE]` / `> [!TIP]` / `> [!WARNING]` / `> [!IMPORTANT]` / `> [!CAUTION]`
   - 支持自定义标题与 Emoji，例如 `> [!TIP] 💡 实用技巧`
   - 效果：左侧色条、卡片圆角背景、图标与加粗标题

3. **按键胶囊 (`kbd`)**
   - 语法：`[[kbd:Cmd]] + [[kbd:K]]`
   - 效果：拟物键盘小按键立体外观

4. **状态徽章 (`badge`)**
   - 语法：`[badge:brand|重点推荐]`、`[badge:success|已上线]`、`[badge:warning|待确认]`、`[badge:danger|异常]`、`[badge:info|提示]`
   - 效果：圆角胶囊状态标签

5. **篇章结构卡片 (`article-card`)**
   - 导读卡片：`> [!INTRO] 导读`，支持作者元信息悬挂行 `**文 / 作者** · 预计阅读 5 分钟`、导读正文与关注引导
   - 互动卡片：`> [!CTA] 欢迎交流与关注`，底部点赞在看号召

## 安装

```bash
bun add @akairos/milkdown-article-plugins
# 或
npm install @akairos/milkdown-article-plugins
```

Peer Dependencies:
- `@milkdown/kit`：`^7.0.0`，应与宿主 Milkdown 使用同一份实例。

## 快速使用

### 1. 在 Milkdown 编辑器中加载插件

```ts
import { Editor } from "@milkdown/kit/core";
import { commonmark } from "@milkdown/kit/preset/commonmark";
import { getCombinedMilkdownPlugins } from "@akairos/milkdown-article-plugins";

const editor = await Editor.make()
  .use(commonmark)
  .use(getCombinedMilkdownPlugins())
  .create();
```

Crepe 宿主同样在创建前调用 `crepe.editor.use(getCombinedMilkdownPlugins())`。
配套加载 `@akairos/milkdown-article-style/tokens-default.css` 与 `article.css`。
插件保留编辑后的卡片类型、标题、徽章及快捷键 Markdown 标记，支持保存后重新打开。

徽章和快捷键不要嵌套到加粗、链接等其他标记内；宿主菜单应用这两类标记前应清除选区现有标记，myno 菜单已处理这个 Markdown 往返限制。

编辑器中直接输入 `==高亮==`、`[[kbd:Cmd]]`、`[badge:brand|重点]` 会在闭合标记时转换。
块标记 `[!INTRO] 导读`、`[!CTA]` 或 `[!TIP] 标题` 独占一行后按回车即可转换；
也支持先输入 `> ` 进入引用，再输入块标记。代码与转义文本不触发转换。

### 2. 获取内置微信渲染器 (Wechat Element Renderers)

```ts
import { getCombinedWechatRenderers } from "@akairos/milkdown-article-plugins";

// 在公众号 HTML 生成器（如 wechat-renderer）中注册并使用
const renderers = getCombinedWechatRenderers();
```

### 3. 获取组件元信息与说明（用于 UI 工具栏或插入面板）

```ts
import { getPluginDocs } from "@akairos/milkdown-article-plugins";

const docs = getPluginDocs();
// 返回包含每个插件的 id, name, category, sampleMarkdown, syntaxGuide 的列表
```

## 许可证

MIT © [Kairos](https://github.com/k7airos)
