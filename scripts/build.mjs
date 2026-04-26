import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import MarkdownIt from "markdown-it";
import anchor from "markdown-it-anchor";
import hljs from "highlight.js";
import site from "../site.config.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const contentDir = path.join(root, "content");
const publicDir = path.join(root, "public");
const distDir = path.join(root, "dist");

const missingImageRefs = [];

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight(code, lang) {
    const language = lang && hljs.getLanguage(lang) ? lang : null;
    const highlighted = language
      ? hljs.highlight(code, { language, ignoreIllegals: true }).value
      : hljs.highlightAuto(code).value;
    return `<pre><code class="hljs${language ? ` language-${language}` : ""}">${highlighted}</code></pre>`;
  },
})
  .use(anchor, {
    slugify,
    tabIndex: false,
  });

const defaultImageRenderer = md.renderer.rules.image;
const defaultLinkOpenRenderer = md.renderer.rules.link_open;

md.renderer.rules.image = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  const srcIndex = token.attrIndex("src");

  if (srcIndex >= 0) {
    token.attrs[srcIndex][1] = assetPath(token.attrs[srcIndex][1], env.depth || 0);
  }

  if (token.attrIndex("loading") < 0) {
    token.attrPush(["loading", "lazy"]);
  }

  return defaultImageRenderer
    ? defaultImageRenderer(tokens, idx, options, env, self)
    : self.renderToken(tokens, idx, options);
};

md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  const hrefIndex = token.attrIndex("href");

  if (hrefIndex >= 0) {
    const href = linkPath(token.attrs[hrefIndex][1], env.depth || 0);
    token.attrs[hrefIndex][1] = href;
    // 外部链接在新标签页打开，并切断 opener 引用
    if (/^https?:\/\//.test(href)) {
      if (token.attrIndex("target") < 0) token.attrPush(["target", "_blank"]);
      if (token.attrIndex("rel") < 0) token.attrPush(["rel", "noopener noreferrer"]);
    }
  }

  return defaultLinkOpenRenderer
    ? defaultLinkOpenRenderer(tokens, idx, options, env, self)
    : self.renderToken(tokens, idx, options);
};

// 表格加横向滚动容器，防止宽表格在移动端溢出
md.renderer.rules.table_open = () => '<div class="table-wrap"><table>';
md.renderer.rules.table_close = () => "</table></div>";

build();

function build() {
  resetDir(distDir);
  copyDir(publicDir, distDir);

  const posts = readPosts();
  const normalPosts = posts.filter((post) => post.kind === "post");
  const intro = posts.find((post) => post.slug === "intro");

  for (const post of posts) {
    writePage(
      path.join(distDir, post.url),
      post.slug === "intro" ? renderAbout(post, normalPosts) : renderPost(post, posts),
    );
  }

  writePage(path.join(distDir, "index.html"), renderHome(normalPosts, intro));
  writePage(path.join(distDir, "coding.html"), renderListing("Coding", normalPosts.filter((p) => p.section === "coding")));
  writePage(path.join(distDir, "life.html"), renderListing("Life", normalPosts.filter((p) => p.section === "life")));
  writePage(path.join(distDir, "404.html"), renderShell({ title: "Not Found", body: notFoundTemplate() }));

  fs.writeFileSync(
    path.join(distDir, "search-index.json"),
    JSON.stringify(normalPosts.map(({ title, url, section, excerpt, date }) => ({ title, url, section, excerpt, date })), null, 2),
  );

  writeSitemap(normalPosts);
  writeFeed(normalPosts);
  assertNoMissingImages();

  console.log(`Built ${posts.length} pages into ${path.relative(root, distDir)}`);
}

function writeSitemap(posts) {
  const base = (site.siteUrl || "").replace(/\/$/, "");
  if (!base) return;

  const staticPages = [
    { url: "index.html", priority: "1.0" },
    { url: "coding.html", priority: "0.8" },
    { url: "life.html", priority: "0.8" },
    { url: "intro.html", priority: "0.6" },
  ];

  const allEntries = [
    ...staticPages.map(({ url, priority }) => `  <url>\n    <loc>${base}/${url}</loc>\n    <priority>${priority}</priority>\n  </url>`),
    ...posts.map((p) => {
      const loc = `${base}/${p.url}`;
      const lastmod = p.date ? `\n    <lastmod>${p.date}</lastmod>` : "";
      return `  <url>\n    <loc>${loc}</loc>${lastmod}\n    <priority>0.7</priority>\n  </url>`;
    }),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${allEntries.join("\n")}\n</urlset>`;
  fs.writeFileSync(path.join(distDir, "sitemap.xml"), xml);
}

function writeFeed(posts) {
  const base = (site.siteUrl || "").replace(/\/$/, "");
  if (!base) return;

  const recent = [...posts].sort(comparePosts).slice(0, 20);
  const buildDate = new Date().toUTCString();

  const items = recent.map((p) => {
    const link = `${base}/${p.url}`;
    const pubDate = p.date ? new Date(p.date).toUTCString() : buildDate;
    return [
      "  <item>",
      `    <title>${escapeXml(p.title)}</title>`,
      `    <link>${link}</link>`,
      `    <guid isPermaLink="true">${link}</guid>`,
      `    <pubDate>${pubDate}</pubDate>`,
      `    <description>${escapeXml(p.excerpt)}</description>`,
      "  </item>",
    ].join("\n");
  });

  const xml = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">`,
    `<channel>`,
    `  <title>${escapeXml(site.title)}</title>`,
    `  <link>${base}/</link>`,
    `  <description>${escapeXml(site.description)}</description>`,
    `  <language>zh-CN</language>`,
    `  <lastBuildDate>${buildDate}</lastBuildDate>`,
    `  <atom:link href="${base}/feed.xml" rel="self" type="application/rss+xml"/>`,
    ...items,
    `</channel>`,
    `</rss>`,
  ].join("\n");

  fs.writeFileSync(path.join(distDir, "feed.xml"), xml);
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function readPosts() {
  return walk(contentDir)
    .filter((file) => file.endsWith(".md") && path.basename(file).toLowerCase() !== "readme.md")
    .map((file) => {
      const rel = path.relative(contentDir, file);
      const raw = fs.readFileSync(file, "utf8");
      const { data, body } = parseFrontmatter(raw);
      const section = rel.includes(path.sep) ? rel.split(path.sep)[0] : "about";
      const base = path.basename(rel, ".md");
      const slug = rel.replace(/\.md$/, "").split(path.sep).join("-").toLowerCase();
      const url = pageUrl(rel);
      const depth = path.dirname(url) === "." ? 0 : path.dirname(url).split("/").length;
      const title = cleanTitle(data.title || firstHeading(body) || titleFromFilename(base));
      const article = slug !== "intro";
      const html = renderMarkdown(body, depth);
      const text = stripMarkdown(body);
      const date = normalizeDate(data.date);
      return {
        file,
        rel,
        section,
        slug,
        url,
        depth,
        title,
        kind: article ? "post" : "page",
        excerpt: slug === "intro" ? "把学到的、走过的、想明白的东西留下来。" : excerptFrom(text),
        
        date,
        data,
        html,
      };
    })
    .sort(comparePosts);
}

function parseFrontmatter(raw) {
  const parsed = matter(raw);
  return { data: parsed.data || {}, body: parsed.content.trim() };
}

function pageUrl(rel) {
  return rel.split(path.sep).join("/").replace(/\.md$/, ".html");
}

function renderMarkdown(markdown, depth) {
  const normalized = markdown.replace(
    /<iframe\s+src=(["'][^"']+["'])\s+iframe\s*\/>/gi,
    "<iframe src=$1></iframe>",
  );

  return rewriteAssetPaths(md.render(normalized, { depth }), depth);
}

function renderHome(posts, intro) {
  const latest = [...posts].sort(comparePosts).slice(0, 12);
  const stats = [
    [site.home.stats.posts, posts.length],
    [site.home.stats.coding, posts.filter((p) => p.section === "coding").length],
    [site.home.stats.life, posts.filter((p) => p.section === "life").length],
  ];

  const body = `
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">${escapeHtml(site.home.eyebrow)}</p>
        <h1>${site.title}</h1>
        <p class="lead">${site.description}</p>
        <div class="hero-actions">
          <a class="button primary" href="coding.html">${escapeHtml(site.home.primaryAction)}</a>
          <a class="button ghost" href="life.html">${escapeHtml(site.home.secondaryAction)}</a>
        </div>
      </div>
      <div class="hero-panel">
        <div class="orbital-card">
          <span>${escapeHtml(site.home.panelEyebrow)}</span>
          <strong>${site.subtitle}</strong>
          <p>${intro?.excerpt || escapeHtml(site.home.introFallback)}</p>
        </div>
      </div>
    </section>

    <section class="stats">${stats.map(([label, value]) => `<div><strong>${value}</strong><span>${label}</span></div>`).join("")}</section>

    <section class="section-head">
      <div>
        <p class="eyebrow">${escapeHtml(site.home.libraryEyebrow)}</p>
        <h2>${escapeHtml(site.home.libraryTitle)}</h2>
      </div>
    </section>
    <div class="article-list">${latest.map((post) => row(post)).join("")}</div>
  `;

  return renderShell({ title: site.title, body, current: "home", pageUrl: "index.html", description: site.description });
}

function renderListing(title, posts) {
  const key = title.toLowerCase();
  const listing = site.listings[key];
  const body = `
    <section class="page-hero compact">
      <p class="eyebrow">${escapeHtml(listing.eyebrow)}</p>
      <h1>${title}</h1>
      <p>${escapeHtml(listing.description)}</p>
    </section>
    <div class="article-list roomy">${posts.map((post) => row(post)).join("")}</div>
  `;
  return renderShell({ title: pageTitle(title), body, current: key, pageUrl: `${key}.html`, description: listing.description });
}

function renderAbout(post, posts) {
  const links = Array.isArray(post.data.links) ? post.data.links : [];
  const meta = Array.isArray(post.data.meta) ? post.data.meta : [];

  const metaHtml = meta.length ? `
    <dl class="about-meta">
      ${meta.map((item) => `
        <div>
          <dt>${escapeHtml(item.label)}</dt>
          <dd>${item.url ? `<a href="${escapeAttr(item.url)}">${escapeHtml(item.value)}</a>` : escapeHtml(item.value)}</dd>
        </div>
      `).join("")}
    </dl>` : "";

  const body = `
    <section class="about-hero">
      <div class="about-identity">
        <img class="about-avatar" src="assets/avatar.jpg" alt="">
        <div>
          <h1>${escapeHtml(post.title)}</h1>
          <p class="about-bio">${escapeHtml(site.description)}</p>
        </div>
      </div>
      ${metaHtml}
    </section>
    <section class="about-links">
      <p class="eyebrow">On the internet</p>
      <div class="profile-grid">
        ${links.map((link) => `
          <a class="profile-card" href="${linkPath(link.url || "#", 0)}">
            <img src="${assetPath(link.icon || "", 0)}" alt="">
            <span>${escapeHtml(link.title || "")}</span>
            <p>${escapeHtml(link.description || "")}</p>
          </a>
        `).join("")}
      </div>
    </section>
  `;

  return renderShell({ title: pageTitle(post.title), body, current: "about", pageUrl: post.url, description: site.description });
}

function renderPost(post, posts) {
  const related = posts
    .filter((item) => item.slug !== post.slug && item.section === post.section && item.kind === "post")
    .slice(0, 4);

  const tocHtml = toc(post.html);
  const body = `
    <article class="post-shell">
      <header class="post-header">
        <a class="crumb" href="${relativeUrl(post.section === "coding" ? "coding.html" : post.section === "life" ? "life.html" : "index.html", post.depth)}">${sectionLabel(post.section)}</a>
        <h1>${post.title}</h1>
        <p>${post.excerpt}</p>
        ${post.date ? `<time class="post-date" datetime="${post.date}">${formatDate(post.date)}</time>` : ""}
      </header>
      ${tocHtml
        ? `<div class="post-layout"><aside class="toc">${tocHtml}</aside><div class="prose">${post.html}</div></div>`
        : `<div class="prose">${post.html}</div>`}
      ${giscusComments(post)}
      ${related.length ? `<section class="related"><h2>继续阅读</h2><div class="feature-grid small">${related.map((item) => card(item, post.depth)).join("")}</div></section>` : ""}
    </article>
  `;

  return renderShell({ title: pageTitle(post.title), body, current: post.section, depth: post.depth, pageUrl: post.url, description: post.excerpt });
}

function pageTitle(title) {
  return `${title}${site.titleSeparator || " | "}${site.title}`;
}

function renderShell({ title, body, current = "", depth = 0, pageUrl: rawPageUrl = "", description = "" }) {
  const desc = description || site.description;
  const base = (site.siteUrl || "").replace(/\/$/, "");
  const canonical = base && rawPageUrl ? `${base}/${rawPageUrl}` : "";
  const ogType = rawPageUrl && rawPageUrl !== "index.html" && rawPageUrl !== "coding.html" && rawPageUrl !== "life.html" ? "article" : "website";

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <script>
    (() => {
      try {
        const theme = localStorage.getItem("theme");
        document.documentElement.dataset.theme = theme === "dark" ? "dark" : "light";
      } catch {}
    })();
  </script>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escapeAttr(desc)}">
  <title>${escapeHtml(title)}</title>
  ${canonical ? `<link rel="canonical" href="${escapeAttr(canonical)}">` : ""}
  ${base ? `<meta property="og:title" content="${escapeAttr(title)}">
  <meta property="og:description" content="${escapeAttr(desc)}">
  <meta property="og:type" content="${ogType}">
  ${canonical ? `<meta property="og:url" content="${escapeAttr(canonical)}">` : ""}
  <meta property="og:site_name" content="${escapeAttr(site.title)}">` : ""}
  ${base ? `<link rel="alternate" type="application/rss+xml" title="${escapeAttr(site.title)}" href="${base}/feed.xml">` : ""}
  <link rel="icon" href="${relativeUrl("assets/favicon.ico", depth)}">
  ${analytics()}
  <style>${css()}</style>
</head>
<body data-search-index="${relativeUrl("search-index.json", depth)}" data-url-prefix="${"../".repeat(depth)}">
  <div class="progress" aria-hidden="true"></div>
  <header class="site-header">
    <a class="brand" href="${relativeUrl("index.html", depth)}"><img src="${relativeUrl("assets/avatar.jpg", depth)}" alt=""> <span>chanper</span></a>
    <div class="header-actions">
      <nav>
        ${site.nav.map((item) => navLink(item.label, relativeUrl(item.href, depth), current === item.key)).join("")}
      </nav>
      <div class="site-search">
        <button class="icon-button search-toggle" type="button" aria-label="搜索文章" aria-expanded="false" aria-controls="site-search-panel">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.8 5.4a5.4 5.4 0 1 1 0 10.8 5.4 5.4 0 0 1 0-10.8Zm0-1.8a7.2 7.2 0 1 0 4.38 12.91l3.15 3.15 1.27-1.27-3.15-3.15A7.2 7.2 0 0 0 10.8 3.6Z"/></svg>
        </button>
        <div id="site-search-panel" class="search-popover" hidden>
          <input id="site-search" type="search" placeholder="搜索文章" autocomplete="off" aria-label="搜索文章">
          <div id="site-search-results" class="search-results" aria-live="polite"></div>
        </div>
      </div>
      <button id="theme-toggle" class="icon-button theme-toggle" type="button" aria-label="切换深色模式" title="切换深色模式">
        <svg class="sun-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7.2a4.8 4.8 0 1 1 0 9.6 4.8 4.8 0 0 1 0-9.6Zm0-4.2 1.2 2.6h-2.4L12 3Zm0 18-1.2-2.6h2.4L12 21ZM3 12l2.6-1.2v2.4L3 12Zm18 0-2.6 1.2v-2.4L21 12ZM5.64 4.36l2.69.99-1.7 1.7-.99-2.69Zm12.72 15.28-2.69-.99 1.7-1.7.99 2.69Zm1.28-14-2.69.99-1.7-1.7 2.69-.99ZM4.36 18.36l.99-2.69 1.7 1.7-2.69.99Z"/></svg>
        <svg class="moon-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.1 14.15A7.78 7.78 0 0 1 9.85 3.9 8.55 8.55 0 1 0 20.1 14.15Z"/></svg>
      </button>
    </div>
  </header>
  <main>${body}</main>
  <footer class="site-footer">
    <span>${escapeHtml(site.footer.left)}</span>
    <span>${escapeHtml(site.footer.right)}</span>
  </footer>
  <script>${js()}</script>
</body>
</html>`;
}

function navLink(label, href, active) {
  return `<a class="${active ? "active" : ""}" href="${href}">${label}</a>`;
}

function analytics() {
  const config = site.analytics;
  if (!config?.enabled) return "";

  const scripts = [];
  if (config.cnzz51laId) {
    scripts.push(`<script type="text/javascript" src="//js.users.51.la/${escapeAttr(config.cnzz51laId)}.js"></script>`);
  }
  if (config.googleAnalyticsId) {
    const id = escapeAttr(config.googleAnalyticsId);
    scripts.push(`<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>`);
    scripts.push(`<script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){ dataLayer.push(arguments); }
    gtag('js', new Date());
    gtag('config', '${id}');
  </script>`);
  }

  return `
  ${scripts.join("\n  ")}`;
}

function giscusComments(post) {
  const config = site.comments;
  if (!config?.enabled || config.provider !== "Giscus" || !config.repo || !config.repoId || !config.category || !config.categoryId) {
    return "";
  }
  const lightTheme = escapeAttr(config.lightTheme || "light");
  const darkTheme = escapeAttr(config.darkTheme || "dark");

  return `
      <section class="comments" aria-label="评论">
        <p class="comments-fallback">评论加载中。如果这里长期空白，请检查 giscus.app / GitHub 是否可访问。</p>
        <script>
          (function() {
            var theme = "light";
            try { theme = localStorage.getItem("theme") === "dark" ? "${darkTheme}" : "${lightTheme}"; } catch {}
            var s = document.createElement("script");
            s.src = "https://giscus.app/client.js";
            s.setAttribute("data-repo", "${escapeAttr(config.repo)}");
            s.setAttribute("data-repo-id", "${escapeAttr(config.repoId)}");
            s.setAttribute("data-category", "${escapeAttr(config.category)}");
            s.setAttribute("data-category-id", "${escapeAttr(config.categoryId)}");
            s.setAttribute("data-mapping", "${escapeAttr(config.mapping || "pathname")}");
            s.setAttribute("data-strict", "${config.strict ? "1" : "0"}");
            s.setAttribute("data-reactions-enabled", "${config.reactionsEnabled ? "1" : "0"}");
            s.setAttribute("data-emit-metadata", "0");
            s.setAttribute("data-input-position", "${escapeAttr(config.inputPosition || "bottom")}");
            s.setAttribute("data-theme", theme);
            s.setAttribute("data-lang", "zh-CN");${config.lazyLoading ? '\n            s.setAttribute("data-loading", "lazy");' : ""}
            s.setAttribute("crossorigin", "anonymous");
            s.async = true;
            document.currentScript.parentNode.appendChild(s);
          })();
        </script>
      </section>`;
}

function card(post, depth = 0) {
  return `<a class="article-card" href="${relativeUrl(post.url, depth)}" data-search="${searchText(post)}">
    <span>${sectionLabel(post.section)}</span>
    <h3>${post.title}</h3>
    <p>${post.excerpt}</p>
    <small>${postMeta(post)}</small>
  </a>`;
}

function row(post, depth = 0) {
  return `<a class="article-row" href="${relativeUrl(post.url, depth)}" data-search="${searchText(post)}">
    <div>
      <span>${sectionLabel(post.section)}</span>
      <h3>${post.title}</h3>
      <p>${post.excerpt}</p>
    </div>
    <small>${postMeta(post)}</small>
  </a>`;
}

function postMeta(post) {
  return formatDate(post.date) || "";
}

function formatDate(date) {
  if (!date) return "";
  return String(date).replaceAll("-", ".");
}

function searchText(post) {
  return escapeAttr(`${post.title} ${post.section} ${post.excerpt}`.toLowerCase());
}

function toc(html) {
  const headings = [...html.matchAll(/<h([23]) id="([^"]+)">([\s\S]*?)<\/h[23]>/g)]
    .map((match) => ({ level: Number(match[1]), id: match[2], title: stripHtml(match[3]) }))
    .slice(0, 18);
  if (!headings.length) return "";
  return `<strong>目录</strong>${headings.map((item) => `<a class="l${item.level}" href="#${item.id}">${item.title}</a>`).join("")}`;
}

function css() {
  return `
:root {
  color-scheme: light dark;
  --bg: #f7f4ee;
  --paper: #fffdf8;
  --ink: #1d2524;
  --muted: #69736f;
  --line: rgba(29, 37, 36, .12);
  --green: #2d6a4f;
  --rust: #b65f3a;
  --blue: #315f8a;
  --gold: #c29a44;
  --shadow: 0 24px 80px rgba(24, 31, 30, .10);
  --header-bg: rgba(247, 244, 238, .78);
  --panel-bg: rgba(255, 253, 248, .76);
  --panel-strong: rgba(255, 253, 248, .96);
  --nav-bg: rgba(255, 253, 248, .72);
  --nav-link: #42504b;
  --nav-active-bg: var(--ink);
  --nav-active-ink: var(--paper);
  --code-bg: #f0eee6;
  --pre-bg: #18201f;
  --pre-ink: #eef6ef;
  --hero-image-opacity: .46;
  --hero-image-fade: rgba(247, 244, 238, .12);
}
:root[data-theme="dark"] {
  --bg: #121716;
  --paper: #1b2220;
  --ink: #edf4ef;
  --muted: #a5b2ad;
  --line: rgba(237, 244, 239, .14);
  --green: #74c69d;
  --rust: #e29a72;
  --blue: #90b8df;
  --gold: #e0c06f;
  --shadow: 0 24px 90px rgba(0, 0, 0, .36);
  --header-bg: rgba(18, 23, 22, .82);
  --panel-bg: rgba(27, 34, 32, .76);
  --panel-strong: rgba(27, 34, 32, .96);
  --nav-bg: rgba(237, 244, 239, .86);
  --nav-link: #26312e;
  --nav-active-bg: #111716;
  --nav-active-ink: #f4fbf7;
  --code-bg: #252d2a;
  --pre-bg: #090d0c;
  --pre-ink: #edf4ef;
  --hero-image-opacity: .5;
  --hero-image-fade: rgba(18, 23, 22, .18);
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  background:
    radial-gradient(circle at 15% 5%, rgba(194, 154, 68, .16), transparent 30rem),
    linear-gradient(180deg, #fbf7ef 0%, var(--bg) 36%, #eef3ef 100%);
  color: var(--ink);
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  line-height: 1.7;
}
:root[data-theme="dark"] body {
  background:
    radial-gradient(circle at 12% 4%, rgba(116, 198, 157, .12), transparent 32rem),
    radial-gradient(circle at 88% 12%, rgba(144, 184, 223, .11), transparent 34rem),
    linear-gradient(180deg, #111514 0%, var(--bg) 42%, #151b19 100%);
}
a { color: inherit; text-decoration: none; }
img { max-width: 100%; }
.progress { position: fixed; inset: 0 auto auto 0; z-index: 20; height: 3px; width: 0; background: linear-gradient(90deg, var(--green), var(--rust), var(--blue)); }
.site-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 1rem clamp(1rem, 4vw, 4rem);
  background: var(--header-bg);
  border-bottom: 1px solid var(--line);
  backdrop-filter: blur(18px);
}
.brand { display: inline-flex; align-items: center; gap: .75rem; font-weight: 800; letter-spacing: .02em; }
.brand img { width: 2.2rem; height: 2.2rem; border-radius: 50%; object-fit: cover; }
.header-actions { display: flex; align-items: center; justify-content: flex-end; gap: .8rem; min-width: 0; }
nav { display: flex; gap: .2rem; padding: .25rem; border: 1px solid var(--line); border-radius: 999px; background: var(--nav-bg); }
nav a { padding: .45rem .85rem; border-radius: 999px; color: var(--nav-link); font-size: .93rem; font-weight: 650; }
nav a.active, nav a:hover { background: var(--nav-active-bg); color: var(--nav-active-ink); }
.icon-button {
  display: inline-grid;
  place-items: center;
  flex: 0 0 auto;
  width: 2.55rem;
  height: 2.55rem;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--panel-bg);
  color: var(--ink);
  cursor: pointer;
}
.icon-button:hover, .icon-button:focus-visible { border-color: rgba(49, 95, 138, .45); box-shadow: 0 0 0 4px rgba(49, 95, 138, .10); outline: none; }
.icon-button svg { width: 1.15rem; height: 1.15rem; fill: currentColor; }
.theme-toggle .moon-icon { display: none; }
:root[data-theme="dark"] .theme-toggle .sun-icon { display: none; }
:root[data-theme="dark"] .theme-toggle .moon-icon { display: block; }
.site-search { position: relative; }
.search-popover {
  position: absolute;
  top: calc(100% + .55rem);
  right: 0;
  z-index: 30;
  width: min(28rem, calc(100vw - 2rem));
  padding: .55rem;
  border: 1px solid var(--line);
  border-radius: .5rem;
  background: var(--panel-strong);
  box-shadow: var(--shadow);
  backdrop-filter: blur(18px);
}
.site-search input {
  width: 100%;
  min-height: 2.55rem;
  padding: .55rem .8rem;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--panel-bg);
  color: var(--ink);
  font: inherit;
  outline: none;
}
.site-search input:focus { border-color: rgba(49, 95, 138, .45); box-shadow: 0 0 0 4px rgba(49, 95, 138, .10); }
.site-search .search-results {
  display: grid;
  gap: .45rem;
  max-height: min(34rem, calc(100vh - 6rem));
  overflow: auto;
  margin-top: .55rem;
}
.site-search .search-results:empty { display: none; }
main { width: min(1160px, calc(100% - 2rem)); margin: 0 auto; }
.hero { position: relative; isolation: isolate; min-height: 76vh; display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(18rem, .85fr); align-items: center; gap: clamp(2rem, 8vw, 6rem); padding: clamp(3rem, 9vw, 7rem) 0 3rem; }
.hero::before {
  content: "";
  position: absolute;
  inset: clamp(1rem, 4vw, 3rem) max(-4vw, -3rem) auto 44%;
  z-index: -1;
  height: min(44rem, 72vh);
  border-radius: .75rem;
  background:
    linear-gradient(90deg, var(--bg) 0%, var(--hero-image-fade) 28%, rgba(247, 244, 238, 0) 74%),
    url("assets/never_stop_exploring.png") center / cover no-repeat;
  opacity: var(--hero-image-opacity);
  filter: saturate(1.04) contrast(1.08);
}
.eyebrow { margin: 0 0 .7rem; color: var(--rust); text-transform: uppercase; font-weight: 800; font-size: .78rem; letter-spacing: .14em; }
h1, h2, h3 { line-height: 1.12; letter-spacing: 0; }
.hero h1 { margin: 0; font-size: clamp(4rem, 11vw, 9.6rem); letter-spacing: 0; }
.lead { max-width: 42rem; color: var(--muted); font-size: clamp(1.15rem, 2vw, 1.45rem); }
.hero-actions { display: flex; flex-wrap: wrap; gap: .8rem; margin-top: 2rem; }
.button { display: inline-flex; align-items: center; justify-content: center; min-height: 2.8rem; padding: .72rem 1.1rem; border: 1px solid var(--line); border-radius: .5rem; font-weight: 760; }
.button.primary { background: var(--ink); color: var(--paper); }
.button.ghost { background: var(--panel-bg); }
.hero-panel { min-height: 25rem; display: grid; place-items: center; border-left: 1px solid var(--line); }
.orbital-card { width: min(24rem, 100%); padding: 2rem; border: 1px solid var(--line); border-radius: .5rem; background: var(--panel-bg); box-shadow: var(--shadow); transform: rotate(-2deg); }
.orbital-card span { color: var(--blue); font-weight: 800; text-transform: uppercase; font-size: .75rem; letter-spacing: .12em; }
.orbital-card strong { display: block; margin: .4rem 0 1rem; font-size: clamp(2rem, 4vw, 3.3rem); line-height: 1; }
.orbital-card p { color: var(--muted); margin: 0; }
.stats { display: grid; grid-template-columns: repeat(3, 1fr); border: 1px solid var(--line); background: color-mix(in srgb, var(--panel-bg) 58%, transparent); }
.stats div { padding: 1.2rem; border-right: 1px solid var(--line); }
.stats div:last-child { border-right: 0; }
.stats strong { display: block; font-size: 2rem; }
.stats span { color: var(--muted); }
.search-result { display: block; padding: .8rem .95rem; border: 1px solid var(--line); border-radius: .5rem; background: var(--panel-bg); }
.search-result strong { display: block; }
.search-result span { color: var(--green); font-size: .78rem; font-weight: 800; text-transform: uppercase; letter-spacing: .11em; }
.search-result p { margin: .25rem 0 0; color: var(--muted); }
.search-empty { color: var(--muted); }
.section-head, .page-hero { display: flex; justify-content: space-between; align-items: end; gap: 2rem; margin: 5rem 0 1.2rem; }
.section-head h2, .page-hero h1 { margin: 0; font-size: clamp(2.1rem, 5vw, 4.5rem); }
.section-head > a { color: var(--blue); font-weight: 760; }
.page-hero.compact { display: block; max-width: 48rem; padding-top: 3rem; }
.page-hero p:last-child { color: var(--muted); font-size: 1.12rem; }
.about-hero { padding: clamp(3rem, 8vw, 5rem) 0 2rem; border-bottom: 1px solid var(--line); margin-bottom: 3rem; }
.about-identity { display: flex; align-items: center; gap: 1.5rem; margin-bottom: 2rem; }
.about-avatar { width: 5rem; height: 5rem; border-radius: 50%; object-fit: cover; border: 2px solid var(--line); flex-shrink: 0; }
.about-identity h1 { margin: 0 0 .35rem; font-size: clamp(2rem, 5vw, 3.5rem); }
.about-bio { margin: 0; color: var(--muted); font-size: 1.1rem; }
.about-meta { display: flex; flex-wrap: wrap; gap: .6rem; margin: 0; padding: 0; list-style: none; }
.about-meta div { display: flex; align-items: center; gap: .5rem; padding: .45rem .85rem; border: 1px solid var(--line); border-radius: 999px; background: var(--panel-bg); font-size: .9rem; }
.about-meta dt { color: var(--muted); font-weight: 700; }
.about-meta dt::after { content: ":"; }
.about-meta dd { margin: 0; font-weight: 650; }
.about-meta a { color: var(--blue); }
.about-links { margin-bottom: 5rem; }
.about-links > .eyebrow { margin-bottom: 1.2rem; }
.profile-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: .8rem; }
.profile-card { min-height: 12.5rem; display: flex; flex-direction: column; justify-content: space-between; padding: 1rem; border: 1px solid var(--line); border-radius: .5rem; background: var(--panel-bg); transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease; }
.profile-card:hover { transform: translateY(-3px); border-color: rgba(49, 95, 138, .36); box-shadow: 0 16px 50px rgba(24, 31, 30, .08); }
.profile-card img { width: 3rem; height: 3rem; object-fit: contain; }
.profile-card span { margin-top: auto; color: var(--ink); font-size: 1.2rem; font-weight: 820; }
.profile-card p { margin: .35rem 0 0; color: var(--muted); }
.feature-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
.feature-grid.small { grid-template-columns: repeat(4, 1fr); }
.article-card, .article-row {
  background: var(--panel-bg);
  border: 1px solid var(--line);
  border-radius: .5rem;
  transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease;
}
.article-card { min-height: 15rem; display: flex; flex-direction: column; padding: 1.25rem; }
.article-card:hover, .article-row:hover { transform: translateY(-3px); border-color: rgba(45, 106, 79, .35); box-shadow: 0 16px 50px rgba(24, 31, 30, .08); }
.article-card span, .article-row span, .crumb { color: var(--green); font-weight: 800; font-size: .78rem; text-transform: uppercase; letter-spacing: .11em; }
.article-card h3, .article-row h3 { margin: .7rem 0 .55rem; font-size: 1.28rem; }
.article-card p, .article-row p { color: var(--muted); margin: 0; }
.article-card small { margin-top: auto; }
.article-list { display: grid; gap: .75rem; }
.article-list.roomy { margin: 2rem 0 5rem; }
.article-row { display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; padding: 1rem 1.1rem; }
.article-card small, .article-row small { color: var(--rust); font-weight: 800; font-size: .82rem; white-space: nowrap; }
.post-shell { padding-bottom: 5rem; }
.post-header { max-width: 52rem; padding: 4rem 0 2rem; }
.post-header h1 { margin: .45rem 0 1rem; font-size: clamp(2.6rem, 7vw, 6rem); }
.post-header p { color: var(--muted); font-size: 1.15rem; }
.post-date { display: inline-block; margin-top: .9rem; color: var(--rust); font-size: .88rem; font-weight: 800; letter-spacing: .04em; }
.meta { display: flex; flex-wrap: wrap; gap: .55rem; align-items: center; color: var(--muted); }
.meta span { margin-right: .3rem; font-weight: 800; color: var(--rust); }
.post-layout { display: grid; grid-template-columns: 13rem minmax(0, 1fr); gap: 3rem; align-items: start; }
.toc { position: sticky; top: 5.7rem; display: grid; gap: .35rem; max-height: calc(100vh - 7rem); overflow: auto; color: var(--muted); font-size: .9rem; }
.toc strong { color: var(--ink); margin-bottom: .4rem; }
.toc a { border-left: 2px solid var(--line); padding-left: .7rem; }
.toc .l3 { margin-left: .65rem; }
.prose { min-width: 0; padding: 2rem; border: 1px solid var(--line); border-radius: .5rem; background: color-mix(in srgb, var(--panel-strong) 92%, transparent); }
.prose h1, .prose h2, .prose h3, .prose h4 { scroll-margin-top: 6rem; margin-top: 2.2rem; }
.prose h1 a, .prose h2 a, .prose h3 a, .prose h4 a { color: inherit; }
.prose p, .prose li { color: color-mix(in srgb, var(--ink) 88%, var(--muted)); }
.prose a { color: var(--blue); font-weight: 700; }
.prose img { display: block; margin: 1.3rem auto; border-radius: .5rem; border: 1px solid var(--line); }
.prose code { border: 1px solid var(--line); border-radius: .32rem; padding: .08rem .3rem; background: var(--code-bg); font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
.prose pre { position: relative; overflow: auto; padding: 1rem; border-radius: .5rem; background: var(--pre-bg); color: var(--pre-ink); }
.prose pre code { padding: 0; border: 0; background: transparent; color: inherit; }
.copy-btn {
  position: absolute;
  top: .55rem;
  right: .55rem;
  display: inline-grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  border: 1px solid rgba(237,244,239,.18);
  border-radius: .32rem;
  background: rgba(255,255,255,.07);
  color: rgba(237,244,239,.55);
  cursor: pointer;
  opacity: 0;
  transition: opacity .15s, color .15s, background .15s;
}
.copy-btn svg { width: .95rem; height: .95rem; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.prose pre:hover .copy-btn { opacity: 1; }
.copy-btn:hover { background: rgba(255,255,255,.14); color: #edf4ef; }
.copy-btn.copied { color: #74c69d; border-color: rgba(116,198,157,.4); }
.hljs-comment,.hljs-quote { color: #8fa89e; font-style: italic; }
.hljs-keyword,.hljs-selector-tag,.hljs-addition { color: #74c69d; }
.hljs-number,.hljs-literal,.hljs-variable,.hljs-template-variable,.hljs-tag .hljs-attr { color: #90b8df; }
.hljs-string,.hljs-doctag { color: #e29a72; }
.hljs-title,.hljs-section,.hljs-selector-id { color: #e0c06f; font-weight: bold; }
.hljs-subst { font-weight: normal; color: #edf4ef; }
.hljs-type,.hljs-class .hljs-title { color: #e0c06f; }
.hljs-tag,.hljs-name,.hljs-attribute { color: #90b8df; }
.hljs-regexp,.hljs-link { color: #e29a72; }
.hljs-symbol,.hljs-bullet { color: #a6e3c2; }
.hljs-built_in,.hljs-builtin-name { color: #90b8df; }
.hljs-meta { color: #8fa89e; }
.hljs-deletion { color: #e07070; }
.hljs-emphasis { font-style: italic; }
.hljs-strong { font-weight: bold; }
.prose blockquote { margin: 1.3rem 0; padding: .5rem 1rem; border-left: 3px solid var(--gold); background: rgba(194, 154, 68, .09); color: var(--muted); }
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; margin: 1.3rem 0; }
th, td { border: 1px solid var(--line); padding: .6rem .7rem; text-align: left; vertical-align: top; }
th { background: rgba(45, 106, 79, .08); }
.comments { width: min(100%, calc(100% - 16rem)); margin: 3rem 0 0 auto; }
.comments:has(.giscus) .comments-fallback { display: none; }
.comments-fallback { margin: 0; color: var(--muted); font-size: .92rem; }
.comments .giscus, .comments .giscus-frame { width: 100%; min-height: 150px; }
.comments .giscus-frame { border: 0; color-scheme: light dark; }
.related { margin-top: 4rem; }
.site-footer { width: min(1160px, calc(100% - 2rem)); margin: 5rem auto 2rem; padding-top: 1rem; border-top: 1px solid var(--line); display: flex; justify-content: space-between; color: var(--muted); }
::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}
@media (max-width: 860px) {
  .site-header { align-items: flex-start; flex-direction: column; }
  .header-actions { width: 100%; align-items: stretch; flex-direction: column; }
  nav { width: 100%; overflow-x: auto; }
  .site-search { position: static; }
  .search-popover { left: 1rem; right: 1rem; width: auto; }
  .hero { grid-template-columns: 1fr; min-height: auto; }
  .hero::before { inset: 1rem -1rem auto 12%; height: 24rem; }
  .hero-panel { border-left: 0; min-height: auto; justify-content: start; }
  .about-identity { flex-direction: column; align-items: flex-start; }
  .profile-grid { grid-template-columns: 1fr 1fr; }
  .profile-card { min-height: 8.5rem; }
  .feature-grid, .feature-grid.small { grid-template-columns: 1fr; }
  .stats { grid-template-columns: 1fr; }
  .stats div { border-right: 0; border-bottom: 1px solid var(--line); }
  .post-layout { grid-template-columns: 1fr; }
  .toc { display: none; }
  .prose { padding: 1rem; }
  .comments { width: 100%; }
  .article-row { align-items: flex-start; flex-direction: column; }
  .site-footer { flex-direction: column; gap: .4rem; }
}`;
}

function js() {
  return `
const progress = document.querySelector(".progress");
const update = () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  progress.style.width = max > 0 ? (scrollY / max * 100) + "%" : "0";
};
addEventListener("scroll", update, { passive: true });
update();

const themeToggle = document.querySelector("#theme-toggle");
// mode: "light" | "dark"
let themeMode = (() => { try { return localStorage.getItem("theme") === "dark" ? "dark" : "light"; } catch { return "light"; } })();
const applyMode = (mode) => {
  themeMode = mode;
  document.documentElement.dataset.theme = mode;
  try { localStorage.setItem("theme", mode); } catch {}
  updateThemeButton();
  syncGiscusTheme();
};
const giscusThemes = ${JSON.stringify({
    light: site.comments?.lightTheme || "light",
    dark: site.comments?.darkTheme || "dark",
  })};
const giscusTheme = () => themeMode === "dark" ? giscusThemes.dark : giscusThemes.light;
const syncGiscusTheme = () => {
  const frame = document.querySelector("iframe.giscus-frame");
  if (!frame) return;
  frame.contentWindow?.postMessage({ giscus: { setConfig: { theme: giscusTheme() } } }, "https://giscus.app");
};
const updateThemeButton = () => {
  if (!themeToggle) return;
  const label = themeMode === "light" ? "切换深色模式" : "切换浅色模式";
  themeToggle.setAttribute("aria-label", label);
  themeToggle.title = label;
};
if (themeToggle) {
  themeToggle.addEventListener("click", (event) => {
    const next = themeMode === "light" ? "dark" : "light";
    const doApply = () => applyMode(next);
    if (!document.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      doApply();
      return;
    }
    const x = event.clientX ?? innerWidth / 2;
    const y = event.clientY ?? innerHeight / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const transition = document.startViewTransition(doApply);
    transition.ready.then(() => {
      const clipPath = [
        \`circle(0px at \${x}px \${y}px)\`,
        \`circle(\${radius}px at \${x}px \${y}px)\`,
      ];
      document.documentElement.animate(
        { clipPath },
        { duration: 400, easing: "ease-in-out", pseudoElement: "::view-transition-new(root)" },
      );
    });
  });
  updateThemeButton();
}

// bfcache 恢复时重新应用主题（浏览器前进/后退不重新执行脚本，需手动同步）
window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    const saved = (() => { try { return localStorage.getItem("theme") === "dark" ? "dark" : "light"; } catch { return "light"; } })();
    applyMode(saved);
  }
});

// 监听 giscus 就绪消息，加载完成后立即同步一次主题
window.addEventListener("message", (event) => {
  if (event.origin !== "https://giscus.app") return;
  if (event.data?.giscus?.discussion !== undefined || event.data?.giscus?.error !== undefined) return;
  // giscus 首次渲染完成会发一条含 resizeHeight 的消息
  if (typeof event.data?.giscus?.resizeHeight === "number") {
    syncGiscusTheme();
  }
});

const searchToggle = document.querySelector(".search-toggle");
const search = document.querySelector("#site-search");
const searchPanel = document.querySelector("#site-search-panel");
const closeSearch = () => {
  if (!searchPanel || !searchToggle) return;
  searchPanel.hidden = true;
  searchToggle.setAttribute("aria-expanded", "false");
};
if (searchToggle && searchPanel && search) {
  searchToggle.addEventListener("click", () => {
    const open = searchPanel.hidden;
    searchPanel.hidden = !open;
    searchToggle.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) {
      search.focus();
    }
  });
  addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeSearch();
  });
  document.addEventListener("click", (event) => {
    if (!searchPanel.hidden && !event.target.closest(".site-search")) {
      closeSearch();
    }
  });
}
if (search) {
  const items = [...document.querySelectorAll("[data-search]")];
  const results = document.querySelector("#site-search-results");
  let indexPromise;
  const renderResults = (matches, query) => {
    if (!results) return;
    if (!query) {
      results.innerHTML = "";
      return;
    }
    if (!matches.length) {
      results.innerHTML = '<p class="search-empty">没有找到相关文章。</p>';
      return;
    }
    const prefix = document.body.dataset.urlPrefix || "";
    results.innerHTML = matches.slice(0, 12).map((post) => '<a class="search-result" href="' + escapeHtmlClient(toPageUrl(post.url, prefix)) + '"><span>' + escapeHtmlClient(post.section) + '</span><strong>' + escapeHtmlClient(post.title) + '</strong><p>' + escapeHtmlClient(post.excerpt) + '</p></a>').join("");
  };
  search.addEventListener("input", async () => {
    const query = search.value.trim().toLowerCase();
    if (results) {
      indexPromise ||= fetch(document.body.dataset.searchIndex).then((res) => res.json());
      const index = await indexPromise;
      renderResults(index.filter((post) => [post.title, post.section, post.excerpt].join(" ").toLowerCase().includes(query)), query);
    } else {
      for (const item of items) {
        item.hidden = query && !item.dataset.search.includes(query);
      }
    }
  });
}

function escapeHtmlClient(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function toPageUrl(url, prefix) {
  return /^(https?:|mailto:|#|\\/\\/|data:)/.test(url) ? url : prefix + url;
}

document.querySelectorAll(".prose pre").forEach((pre) => {
  const btn = document.createElement("button");
  btn.className = "copy-btn";
  btn.setAttribute("aria-label", "复制代码");
  btn.innerHTML = '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
  btn.addEventListener("click", () => {
    const code = pre.querySelector("code")?.innerText ?? pre.innerText;
    navigator.clipboard.writeText(code).then(() => {
      btn.classList.add("copied");
      btn.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>';
      setTimeout(() => {
        btn.classList.remove("copied");
        btn.innerHTML = '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
      }, 2000);
    });
  });
  pre.appendChild(btn);
});
`;
}

function notFoundTemplate() {
  return `<section class="page-hero compact"><p class="eyebrow">404</p><h1>页面没有找到</h1><p><a href="index.html">回到首页</a></p></section>`;
}

function comparePosts(a, b) {
  return postTime(b) - postTime(a) || a.title.localeCompare(b.title, "zh-CN");
}

function postTime(post) {
  return post.date ? new Date(post.date).getTime() : 0;
}

function normalizeDate(value) {
  if (!value) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  const date = new Date(String(value));
  if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);
  return String(value);
}

function firstHeading(body) {
  return body.match(/^#\s+(.+)$/m)?.[1];
}

function titleFromFilename(file) {
  return file.replace(/[-_]/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function cleanTitle(value) {
  return String(value).replace(/^["']|["']$/g, "").trim();
}

function excerptFrom(text) {
  return text.replace(/\s+/g, " ").trim().slice(0, 118) || "一篇保存在个人知识库里的笔记。";
}

function sectionLabel(section) {
  if (section === "coding") return "Coding";
  if (section === "life") return "Life";
  return "About";
}

function stripMarkdown(text) {
  return text
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<link[\s\S]*?>/gi, " ")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/\[[^\]]+]\([^)]+\)/g, " ")
    .replace(/[#>*_`|-]/g, " ");
}

function stripHtml(text) {
  return text.replace(/<[^>]+>/g, "");
}

function slugify(text) {
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "") || "section";
}

function assetPath(src, depth) {
  const normalized = normalizeLocalAsset(src);
  if (/^(https?:|mailto:|#|\/\/|data:|blob:)/.test(normalized)) return normalized;
  if (normalized.startsWith("/")) return `${"../".repeat(depth)}${normalized.slice(1)}`;
  return normalized;
}

function linkPath(href, depth) {
  if (/^(https?:|mailto:|#|\/\/)/.test(href)) return href;
  const routes = new Map([
    ["/", "index.html"],
    ["/coding/", "coding.html"],
    ["/coding", "coding.html"],
    ["/life/", "life.html"],
    ["/life", "life.html"],
    ["/intro", "intro.html"],
    ["/intro/", "intro.html"],
  ]);

  if (routes.has(href)) return `${"../".repeat(depth)}${routes.get(href)}`;
  if (href.startsWith("/")) return `${"../".repeat(depth)}${href.slice(1)}`;
  return href;
}

function relativeUrl(url, depth) {
  if (/^(https?:|mailto:|#|\/\/|data:)/.test(url)) return url;
  return `${"../".repeat(depth)}${url}`;
}

function rewriteAssetPaths(html, depth) {
  return html.replace(/(src|href)=["']\/(?!\/)([^"']+)["']/g, (_, attr, src) => {
    const raw = `/${src}`;
    return `${attr}="${attr === "href" ? linkPath(raw, depth) : assetPath(raw, depth)}"`;
  });
}

function normalizeLocalAsset(src) {
  if (/^(https?:|mailto:|#|\/\/|data:|blob:)/.test(src)) return src;
  if (!src.startsWith("/img/") && !src.startsWith("/assets/")) return src;

  const [withoutHash] = src.split("#");
  const [withoutQuery] = withoutHash.split("?");

  try {
    return decodeURI(withoutQuery);
  } catch {
    return withoutQuery;
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/"/g, "&quot;");
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    if (entry.name === ".DS_Store") return [];
    return entry.isDirectory() ? walk(file) : [file];
  });
}

function validateLocalImages(file, html) {
  const matches = html.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi);

  for (const match of matches) {
    const src = match[1];
    if (/^(https?:|\/\/|data:|blob:|#)/.test(src)) continue;

    const cleanSrc = src.split("#")[0].split("?")[0];
    const decodedSrc = decodeURIComponent(cleanSrc);
    const imagePath = path.resolve(path.dirname(file), decodedSrc);

    if (!fs.existsSync(imagePath)) {
      missingImageRefs.push({
        page: path.relative(distDir, file),
        src,
        resolved: path.relative(root, imagePath),
      });
    }
  }
}

function assertNoMissingImages() {
  if (!missingImageRefs.length) return;

  const details = missingImageRefs
    .map(({ page, src, resolved }) => `- ${page}: ${src} -> ${resolved}`)
    .join("\n");

  throw new Error(`Missing local image resources:\n${details}`);
}

function resetDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function copyDir(from, to) {
  if (!fs.existsSync(from)) return;
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    if (entry.name === ".DS_Store") continue;
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(dest, { recursive: true });
      copyDir(src, dest);
    } else {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(src, dest);
    }
  }
}

function writePage(file, html) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  validateLocalImages(file, html);
  fs.writeFileSync(file, html);
}
