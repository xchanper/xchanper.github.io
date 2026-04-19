---
title: 现代博客迁移小记
date: 2026-04-19
---

这次迁移的起点很简单：原来的 VuePress 博客能用，但作为一个长期写东西的地方，它开始显得有些重了。依赖多、构建链长、目录里混着框架配置和内容资源，真正重要的东西反而被包在一层厚厚的工程外壳里。

于是这次干脆把博客重新收拾了一遍：文章还是那些文章，图片还是那些图片，但站点生成器换成了一套更轻的静态构建脚本。

## 从 VuePress 到自定义静态生成器

新的博客没有继续使用 VuePress，也没有换成另一个复杂框架，而是用 Node.js 写了一个小型生成器。核心流程很直接：

- 从 `content` 目录读取 Markdown 文档
- 用 `gray-matter` 解析 frontmatter
- 用 `markdown-it` 渲染正文
- 按文章路径生成对应的 HTML
- 复制 `public` 里的静态资源
- 生成首页、分类页、搜索索引和 RSS 相关页面

这样做的好处是可控。博客需要什么页面，就生成什么页面；不需要的功能，就不把它带进来。

## 内容清理

迁移过程中先把文档本身整理了一轮。

原来 frontmatter 里有一些历史字段，比如 `tag`、`excerpt`、`category`、`icon`、`article`、`timeline`、`index` 等。新站点暂时不依赖这些字段，所以都删掉了。大部分文章只保留：

```yaml
---
title: 标题
date: 日期
---
```

`README.md` 也从内容目录里移除了。新的生成逻辑不会把目录 README 当成分类首页，而是显式生成 `Coding`、`Life` 这样的文章列表页。

## 路径兼容

这一步很重要。

老博客里已经被搜索引擎收录的路径，比如：

```text
/life/travel-tibet.html
```

不能在新站点里变成：

```text
/life-travel-tibet.html
```

否则旧链接都会 404。所以新的生成器保留了目录层级，`content/life/travel-tibet.md` 会继续生成到 `/life/travel-tibet.html`。这比重新设计 URL 更重要，因为博客的 URL 本身也是内容的一部分。

## 图片资源

图片也重新梳理了一遍。

新的约定是：文章里的图片统一使用站点根路径，例如：

图片放在 `public` 目录下的图片目录或通用资源目录里，Markdown 中从站点根路径开始引用。也就是路径开头先写 `/`，后面接对应资源目录和文件名。

构建时会检查这些本地资源是否真实存在。如果文章引用了不存在的图片，构建会直接报错。这样可以尽早发现问题，而不是等部署之后才发现页面里图片消失。

后来又加了 `audit:assets`，它会同时检查：

- Markdown 和 HTML 里引用到的资源是否存在
- `public/img` 和 `public/assets` 里是否还有没被使用的文件

最后清掉了一批无用图片，保留下来的资源都能被页面追踪到。

## 旅行地图

原来的旅行地图一度被搬到首页，又被撤回来。最后的设计是：旅行地图作为一篇独立文章存在于 `Life` 分类下。

这样更自然。它既不是首页装饰，也不是孤立资源，而是一篇可以被访问、被搜索、被归档的内容。

地图相关的 HTML 没有再通过 iframe 单独嵌入，而是尽量合并到 Markdown 渲染后的页面里。这样页面结构更完整，阅读体验也更像博客本身的一部分。

## 视觉和交互

新站点做了一些轻量但实用的界面调整：

- 首页使用 `never_stop_exploring` 作为 hero 背景图
- 首页、Coding、Life 的文章卡片统一样式
- 文章列表按时间倒序排列
- 每篇文章卡片展示日期
- 搜索框改成右上角按钮
- 深色模式支持系统自动识别，也支持用户手动切换
- 页脚文案改成 `Build by Codex`
- About 页面改成更克制的个人坐标展示

About 页面的坐标数据也从硬编码挪到了 `content/intro.md` 的 frontmatter 里。页面结构和内容数据分开之后，以后改文字不用动构建脚本。

## 统计和评论

老博客里原本有 51.la 和 Google Analytics 的 head 注入脚本。迁移后把它们放进了统一配置：

```js
analytics: {
  la51: "...",
  googleAnalytics: "..."
}
```

构建时根据配置把脚本注入到页面 `<head>` 中。

评论区接入了 Giscus，配置也放进 `site.config.mjs`。这部分最后对齐了 giscus.app 生成的脚本参数，包括：

- `repo`
- `repoId`
- `category`
- `categoryId`
- `mapping`
- `theme`
- `lang`
- `inputPosition`

本地预览时，Giscus 可能因为网络或 GitHub 授权加载较慢，所以页面里保留了一个加载提示。加载成功后，提示会自动隐藏。

## 配置收敛

迁移过程中把站点文案和功能配置都集中到了 `site.config.mjs`，包括：

- 站点标题
- 导航
- 首页文案
- 列表页文案
- 页脚文案
- 统计脚本
- Giscus 评论配置

这样生成器本身只负责生成页面，站点内容和开关尽量放在配置里。

## GitHub Pages 部署

新的仓库关联到了：

```text
git@github.com:xchanper/xchanper.github.io.git
```

部署方式改成 GitHub Pages 官方 Actions 流程：

- checkout 代码
- 安装 pnpm
- 设置 Node.js 24
- 安装依赖
- 构建静态页面
- 执行资源审计
- 上传 Pages artifact
- 部署到 GitHub Pages

后来 GitHub Actions 提示 Node.js 20 runtime 即将弃用，于是把 workflow 里的 Actions 版本整体升级到了 Node 24 对应版本：

```yaml
actions/checkout@v6
pnpm/action-setup@v5
actions/setup-node@v6
actions/configure-pages@v6
actions/upload-pages-artifact@v5
actions/deploy-pages@v5
```

这样比单独设置临时环境变量更干净。

## 最后的目录迁移

最开始新博客是在 `chanper-modern-blog` 目录里搭起来的。确认构建、资源审计、评论、统计、部署都没问题后，最后把这个目录的内容同步回原来的 `blog_src`。

旧 `blog_src` 里的 VuePress 工程可以不要了。现在 `blog_src` 就是新的博客源码目录。

## 迁移后的状态

现在的博客更像一个小而明确的静态 archive：

- 内容在 `content`
- 图片在 `public/img` 和 `public/assets`
- 构建脚本在 `scripts`
- 全站配置在 `site.config.mjs`
- 构建产物在 `dist`

以后写新文章，只需要新增 Markdown，配好 `title` 和 `date`，图片放进 `public/img` 或 `public/assets`，然后运行：

```bash
pnpm run build
pnpm run audit:assets
```

如果图片路径错了，构建会拦住；如果资源没人用，审计会提醒。

这次迁移最大的收获不是页面变好看了，而是博客重新变轻了。它又回到了一个个人博客最应该有的状态：内容优先，结构清楚，能长期维护。
