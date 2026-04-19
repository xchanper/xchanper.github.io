---
title: AI 辅助博客重构
date: 2026-04-19
---

这次博客重构本来只是一个念头：原来的 VuePress 博客还能用，但作为一个长期写东西的地方，它开始显得有些重了。依赖多、构建链长、目录里混着框架配置和内容资源，真正重要的 Markdown 文章反而被包在一层厚厚的工程外壳里。

如果完全靠自己动手，我大概率会先纠结技术选型，再一点点翻旧配置，最后在某个样式细节或者构建报错里耗掉耐心。真正让我把这件事从“想想”推进到“完成”的，是这次直接和 Codex 协同完成了迁移。

所以这篇不只是博客迁移记录，更像是一次小型实验：一个偏后端的工程师，如何借助 AI 把一个前端博客工程重构成自己能长期维护的样子。

## AI 在这次重构里的角色

这次最明显的感受是，AI 不是单纯帮忙写几段代码，而是在很多细碎环节里持续补位。

我负责判断方向：要不要保留 tag、路径能不能变、旅行地图应该放哪里、评论区用什么、页面看起来是不是顺眼。Codex 负责把这些判断落到工程里：读代码、改脚本、迁移内容、跑构建、查部署、排查资源引用和 GitHub Actions warning。

这种协作方式很适合个人项目。个人项目常常不是缺“技术上能不能做”，而是缺一个能一起把边角磨完的搭子。比如：

- 想法可以很快变成一个可运行版本
- 看到页面别扭，可以直接调整设计
- 发现功能没用，可以马上删掉
- 担心图片丢失，可以补构建检查
- 线上部署有 warning，可以顺手查文档和升级 workflow

它不是替代工程判断，而是把执行成本压低。执行成本一低，人才更愿意反复迭代。

## 对后端工程师来说最有帮助的地方

后端工程师做前端，常见问题不是完全不会写页面，而是不太愿意在一堆样式、资源、构建工具、部署配置之间来回切上下文。

这次 Codex 帮忙承担了很多“上下文切换成本”：

- 读旧 VuePress 目录，判断核心内容在哪里
- 新建现代静态博客结构
- 用 `markdown-it` 替代原来的 VuePress Markdown 管线
- 处理 frontmatter 清理、文章路由、分类列表、搜索索引
- 统一图片引用规则
- 给资源缺失和未使用资源加审计脚本
- 调整深色模式、搜索入口、首页 hero、文章卡片、About 页面
- 接入 51.la、Google Analytics 和 Giscus
- 配置 GitHub Pages 自动部署
- 根据 GitHub 官方文档升级 Actions 版本

这些事情单独看都不复杂，但合起来很容易把一个周末吃掉。AI 的价值在这里很朴素：它让重构保持连续。

## 从 VuePress 到自定义静态生成器

新的博客没有继续使用 VuePress，也没有换成另一个复杂框架，而是用 Node.js 写了一个小型生成器。核心流程很直接：

- 从 `content` 目录读取 Markdown 文档
- 用 `gray-matter` 解析 frontmatter
- 用 `markdown-it` 渲染正文
- 按文章路径生成对应的 HTML
- 复制 `public` 里的静态资源
- 生成首页、分类页、搜索索引和 RSS 相关页面

这样做的好处是可控。博客需要什么页面，就生成什么页面；不需要的功能，就不把它带进来。

以前用 VuePress，很多能力是框架默认给的。现在用自定义生成器，能力变少了，但掌控感变强了。对于个人博客来说，这反而更舒服。

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

这个过程很像一次内容断舍离：不是因为旧字段错了，而是现在不需要了。

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

新的约定是：文章里的图片统一使用站点根路径。图片放在 `public` 目录下的图片目录或通用资源目录里，Markdown 中从站点根路径开始引用。也就是路径开头先写 `/`，后面接对应资源目录和文件名。

构建时会检查这些本地资源是否真实存在。如果文章引用了不存在的图片，构建会直接报错。这样可以尽早发现问题，而不是等部署之后才发现页面里图片消失。

后来又加了 `audit:assets`，它会同时检查：

- Markdown 和 HTML 里引用到的资源是否存在
- `public` 下的图片目录和通用资源目录里是否还有没被使用的文件

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

这里也能看出 AI 协同的一个特点：设计不是一次性想完的，而是边看边改。觉得首页地图丑，就撤回；觉得深色模式文字看不清，就改对比度；觉得搜索框占地方，就变成按钮。

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

这个重构方向对我来说很重要。配置可以不完美，但一定要集中；脚本可以很小，但边界要清楚。以后再加评论、统计、页面文案、导航项，都不需要在构建脚本里翻来翻去。

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

后来 GitHub Actions 提示 Node.js 20 runtime 即将弃用，于是对照 GitHub 官方文档，把 workflow 里的 Actions 版本整体升级到了 Node 24 对应版本：

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

## 这次协作带来的启发

这次重构让我对 AI 协同写代码的感觉更具体了。

首先，AI 很适合做连续的小步迭代。博客这种项目不会一次性有完整需求，很多决定都是看到了页面才知道要不要改。AI 能跟着反馈持续调整，整个过程就不会卡在“我还没想清楚完整方案”上。

其次，AI 适合帮后端工程师补齐前端工程里的杂活。比如 CSS 细节、构建脚本、资源路径、部署 YAML、前端交互，这些都不是高深问题，但很吃耐心。Codex 可以一直把这些细节推进到可验证状态。

最后，工程判断还是要自己做。AI 可以建议，但是否保留旧 URL、是否删除 tag、是否把旅行地图放首页、是否重写 Git 历史，这些都应该由人决定。它擅长执行和补全上下文，人负责方向和取舍。

一个比较舒服的协作节奏是：

- 我提出目标或指出哪里不对
- Codex 读项目并给出可执行方案
- Codex 直接改代码、跑命令、验证结果
- 我再基于真实页面继续调整

这比“先写一份完美需求文档”更适合个人项目。

## 迁移后的状态

现在的博客更像一个小而明确的静态 archive：

- 内容在 `content`
- 图片在 `public` 里的图片目录和通用资源目录
- 构建脚本在 `scripts`
- 全站配置在 `site.config.mjs`
- 构建产物在 `dist`

以后写新文章，只需要新增 Markdown，配好 `title` 和 `date`，图片放到对应的公共资源目录，然后运行：

```bash
pnpm run build
pnpm run audit:assets
```

如果图片路径错了，构建会拦住；如果资源没人用，审计会提醒。

这次迁移最大的收获不是页面变好看了，而是博客重新变轻了。它又回到了一个个人博客最应该有的状态：内容优先，结构清楚，能长期维护。

## 用到的 CLI 命令

下面这些命令基本覆盖了这次迁移中反复用到的操作。

### 文件和内容检查

```bash
pwd
```

查看当前工作目录，避免在错的目录里执行构建或 Git 操作。

```bash
ls -la
```

查看目录下的文件、隐藏文件和权限信息。迁移前后用来确认 `.git`、`content`、`public`、`scripts` 等目录是否在预期位置。

```bash
find content -maxdepth 2 -type f | sort
```

列出内容目录下的 Markdown 文件，用来确认文章是否完整迁移，以及 `coding`、`life` 目录里有哪些文档会被生成。

```bash
sed -n '1,120p' content/life/example.md
```

查看文件前几行，常用来检查 frontmatter、标题、日期和正文开头。

```bash
rg "keyword" content scripts public
```

快速搜索关键词。比普通 `grep` 更适合在项目里查配置、路径、文案和旧字段。

### 构建和预览

```bash
pnpm install
```

安装依赖。迁移到新目录或 GitHub Actions 首次构建时会用到。

```bash
pnpm run build
```

执行静态站点构建。它会读取 `content`，渲染 Markdown，复制静态资源，并输出到 `dist`。

```bash
pnpm run audit:assets
```

执行资源审计。它会检查文章和脚本引用到的本地资源是否存在，也会检查公共资源目录里是否有未使用文件。

```bash
pnpm run preview
```

本地启动预览服务，用来在浏览器里检查页面样式、深色模式、搜索、评论区等交互效果。

### Git 状态和提交

```bash
git status --short --branch
```

查看当前分支和工作区变更。每次改动前后都会用它确认是否有非预期文件被修改。

```bash
git log --oneline --decorate --max-count=12
```

查看最近提交记录，用来确认迁移历史、当前 HEAD、远端分支指向。

```bash
git remote -v
```

查看远端仓库地址。这次最终确认 `origin` 指向 `git@github.com:xchanper/xchanper.github.io.git`。

```bash
git add path/to/file
```

把指定文件加入暂存区。适合只提交当前任务相关改动，避免把无关文件带进 commit。

```bash
git commit -m "message"
```

创建提交。每个阶段尽量使用清晰的提交信息，比如升级 workflow、记录迁移过程。

```bash
git push origin main
```

推送到 GitHub，触发 GitHub Pages 自动部署。

### 目录同步和迁移

```bash
rsync -a --delete source/ target/
```

把源目录精确同步到目标目录。`-a` 保留文件属性和目录结构，`--delete` 会删除目标目录里源目录没有的文件。这次用它把 `chanper-modern-blog` 同步回原来的 `blog_src`。

这个命令很强，也很危险。目标目录如果写错，可能会删除不该删的文件，所以执行前一定要确认 source 和 target。

### 仓库体积检查

```bash
git count-objects -vH
```

查看 Git 对象数量和仓库体积。之前用它判断旧历史里是否有大量对象，以及 `git gc` 能解决什么、不能解决什么。

```bash
git gc
```

压缩和清理本地 Git 对象。它能优化 `.git` 目录，但不会删除仍然存在于历史里的大文件。

如果想彻底移除旧历史，需要重写 Git 历史，而不是只跑 `git gc`。

### GitHub Actions 检查

```bash
curl -s 'https://api.github.com/repos/xchanper/xchanper.github.io/actions/runs?branch=main&per_page=1'
```

查看 `main` 分支最新一次 GitHub Actions run，用来确认 push 后 workflow 是否触发。

```bash
curl -s https://api.github.com/repos/xchanper/xchanper.github.io/actions/runs/RUN_ID
```

查看某次 workflow 的整体状态，比如是否 `completed`、结论是否 `success`。

```bash
curl -s https://api.github.com/repos/xchanper/xchanper.github.io/actions/runs/RUN_ID/jobs
```

查看某次 workflow 下各个 job 和 step 的状态。构建成功但部署仍在等待时，可以用它确认卡在哪一步。
