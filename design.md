# swan-post (swp) —— 个人静态博客生成器设计文档 (v1.0)

> 本文档面向 coding agent 执行。**请严格按照本文档给出的目录结构、文件名、函数签名、代码骨架实现,不要自行改变架构、不要引入未提及的依赖或框架。** 文档中给出的 HTML/CSS/JS 代码可以直接使用,只需按"实现步骤清单"里的说明填充逻辑或做少量替换。

---

## 0. 项目目标

用 Node.js 写一个替代 Hexo 的个人静态博客生成工具,输出结果部署到 GitHub Pages。

**功能范围(仅此三项,不做更多):**
1. 固定布局:左侧 sidebar(文章列表 + 导航),默认隐藏,点击按钮弹出;右侧显示正文。sidebar 支持"按发布时间倒序"和"按 tag 分组"两种查看方式。
2. 文章使用 Hexo 风格的 Markdown(YAML front-matter + 正文)。
3. 命令行工具:可以把单篇 `.md` 直接渲染成 `.html` 并"上线"(即更新到输出目录 + 更新文章索引),不需要全量重新构建整个站点。

**明确不做的事(避免过度设计):**
- 不做分页(个人博客文章量不大,sidebar 直接展示全部列表)。
- 不做评论系统、不做 RSS、不做搜索。
- 不做 live-reload(热更新),本地预览用手动刷新浏览器即可。
- 不做中文转拼音生成 slug,文件名 slug 由用户在命令行手动指定(纯 ASCII)。

---

## 1. 技术栈与依赖

- **运行环境**:Node.js >= 18(使用 ESM 或 CommonJS 均可,本文档以 **CommonJS**(`require`)为准,agent 不要混用 `import`)。
- **依赖包**(写入 `package.json`,版本号用 `^` 前缀,不要指定更高的大版本):

```json
{
  "name": "swan-post",
  "version": "1.0.0",
  "private": true,
  "bin": {
    "swp-cli": "./scripts/cli.js"
  },
  "scripts": {
    "build": "node scripts/cli.js build",
    "new": "node scripts/cli.js new",
    "render": "node scripts/cli.js render",
    "serve": "node scripts/cli.js serve",
    "deploy": "node scripts/cli.js deploy"
  },
  "dependencies": {
    "commander": "^12.0.0",
    "gray-matter": "^4.0.3",
    "markdown-it": "^14.0.0",
    "fs-extra": "^11.0.0"
  }
}
```

不要添加除以上四个依赖之外的第三方包。

---

## 2. 目录结构

**必须严格使用以下目录结构和文件名**(agent 创建文件时逐一对照):

```
swan-post/
├── package.json
├── blog.config.json              # 站点配置
├── source/
│   └── _posts/                   # 存放所有 Markdown 文章
│       └── 2026-07-04-hello-world.md   # 示例文章,见第 8 节
├── templates/                    # HTML 模板(占位符替换,见第 5 节)
│   ├── layout.html
│   ├── post.html
│   └── index.html
├── assets/
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── main.js
├── scripts/
│   ├── cli.js                    # CLI 入口
│   ├── utils.js                  # 公共函数
│   ├── build.js                  # 全量构建
│   ├── render.js                 # 单篇增量渲染
│   ├── new-post.js               # 新建文章
│   ├── serve.js                  # 本地静态预览服务器
│   └── deploy.js                 # 构建 + git 提交 + push,触发 GitHub Pages 更新
├── docs/                         # 【输出目录】GitHub Pages 从这里发布,不要手动编辑此目录下的文件
└── README.md
```

> GitHub Pages 部署方式:仓库 Settings → Pages → Source 选择 `main` 分支 `/docs` 目录。`docs/` 里的内容全部由脚本自动生成/覆盖。

---

## 2.1 `.gitignore`

```gitignore
# 依赖
node_modules/

# npm 日志
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# 系统文件
.DS_Store
Thumbs.db

# 编辑器
.vscode/
.idea/
*.swp

# 环境变量
.env
```

**注意:`docs/` 目录不要写进 `.gitignore`。** 它是构建产物,但同时也是 GitHub Pages 的发布来源(Settings → Pages → Source 设为 `/docs`),必须提交到 git 仓库里,`deploy` 命令依赖它被 git 追踪才能正常 `git add`。

---

## 3. 站点配置文件 `blog.config.json`

```json
{
  "title": "我的博客",
  "author": "Ivar",
  "description": "个人博客",
  "baseUrl": "",
  "recentPostsCount": 10
}
```

- `baseUrl`:如果博客部署在 `https://username.github.io/`(根域名),`baseUrl` 留空字符串 `""`。如果部署在 `https://username.github.io/reponame/`(项目页面),`baseUrl` 设为 `"/reponame"`。
- `recentPostsCount`:首页正文区域展示的"最近文章"数量,默认为 `10`。改这个数字不需要改代码,构建脚本读取配置时如果该字段缺失,兜底使用 `10`。
- 所有模板里引用静态资源时,必须拼接 `{{BASE_URL}}` 前缀(见第 5 节),这样无论根域名还是子路径都能正确工作,**不要写死绝对路径或相对路径 `../`**。

---

## 4. Markdown 文章格式(Hexo 风格 front-matter)

每篇文章是 `source/_posts/` 下的一个 `.md` 文件,文件名格式固定为:

```
<slug>.md
```

`<slug>` 由用户通过命令行指定(纯小写字母、数字、短横线,不含中文、空格)。

文件内容格式:

```markdown
---
title: 文章标题
date: 2026-07-04 10:00:00
tags: [标签1, 标签2]
categories: [分类1]
---

正文内容,标准 Markdown 语法。
```

字段说明:
- `title`(必填,字符串):文章标题,可以是中文。
- `date`(必填,格式 `YYYY-MM-DD HH:mm:ss`):发布时间,用于排序。
- `tags`(选填,字符串数组):默认 `[]`。
- `categories`(选填,字符串数组):默认 `[]`,当前版本先解析存储,暂不在 UI 中使用分类(仅 tags 用于分组展示)。

解析这个 front-matter 统一使用 `gray-matter` 库,**不要自己写 YAML parser**。

---

## 5. 页面与交互设计

### 5.1 布局说明

- Sidebar:固定定位,宽度 280px,高度 100vh,贴左边,**默认通过 CSS transform 隐藏在屏幕外**,点击左上角悬浮按钮滑入(覆盖在内容上方,不挤压正文,即"overlay"模式)。
- Sidebar 顶部:站点标题 + 两个 tab 按钮「时间线」「标签」。
- 「时间线」tab:按 `date` 倒序(最新在前)展示全部文章标题 + 日期。
- 「标签」tab:展示所有 tag 的列表(带每个 tag 下文章数量),点击某个 tag 展开该 tag 下的文章列表(可从时间线跳到某 tag 直接过滤)。
- 右侧内容区:占满全屏宽度(不受 sidebar 影响,因为是 overlay),顶部有一个固定的"☰"按钮用来开关 sidebar。
- 首页 (`docs/index.html`):内容区展示"欢迎信息 + 最新一篇文章摘要链接"(见 `templates/index.html`)。
- 文章页 (`docs/posts/<slug>.html`):内容区展示文章正文渲染出的 HTML。

### 5.2 模板占位符规则

所有模板文件使用 `{{KEY}}` 占位符,构建脚本用简单的字符串 `replaceAll` 完成替换(**不要引入 EJS / Handlebars 等模板引擎**)。占位符替换函数写在 `scripts/utils.js` 里,签名见第 7 节。

`templates/layout.html`(整站公共外壳,sidebar 是静态 HTML,数据由 `main.js` 运行时通过 fetch `posts.json` 填充):

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{{PAGE_TITLE}} - {{SITE_TITLE}}</title>
<link rel="stylesheet" href="{{BASE_URL}}/css/style.css">
</head>
<body>

<button id="sidebar-toggle" aria-label="打开菜单">☰</button>

<aside id="sidebar">
  <div class="sidebar-header">
    <a href="{{BASE_URL}}/index.html" class="site-title">{{SITE_TITLE}}</a>
  </div>
  <div class="sidebar-tabs">
    <button class="tab-btn active" data-tab="timeline">时间线</button>
    <button class="tab-btn" data-tab="tags">标签</button>
  </div>
  <div id="tab-timeline" class="tab-panel active">
    <ul id="post-list-timeline" class="post-list"></ul>
  </div>
  <div id="tab-tags" class="tab-panel">
    <div id="tag-cloud"></div>
    <ul id="post-list-by-tag" class="post-list"></ul>
  </div>
</aside>

<div id="overlay-mask"></div>

<main id="content">
{{CONTENT}}
</main>

<script>window.BASE_URL = "{{BASE_URL}}";</script>
<script src="{{BASE_URL}}/js/main.js"></script>
</body>
</html>
```

`templates/index.html`(首页内容区片段,构建时会被塞进 layout 的 `{{CONTENT}}`。`{{RECENT_POSTS_HTML}}` 由构建脚本在服务端直接生成好整段 HTML 后替换进来,**不是**靠前端 JS 异步渲染——这样首页打开瞬间就能看到文章列表,不用等 `posts.json` fetch 回来):

```html
<div class="home">
  <h1>{{SITE_TITLE}}</h1>
  <p class="home-desc">{{SITE_DESCRIPTION}}</p>
  <div class="recent-posts">
    {{RECENT_POSTS_HTML}}
  </div>
</div>
```

`templates/post.html`(文章页内容区片段):

```html
<article class="post">
  <h1>{{POST_TITLE}}</h1>
  <div class="post-meta">
    <span class="post-date">{{POST_DATE}}</span>
    <span class="post-tags">{{POST_TAGS_HTML}}</span>
  </div>
  <div class="post-body">
    {{POST_CONTENT_HTML}}
  </div>
</article>
```

`{{POST_TAGS_HTML}}` 的生成规则:每个 tag 渲染成 `<span class="tag-pill">标签名</span>`,多个 tag 直接拼接,中间无分隔符(CSS 里 `.tag-pill` 自带 margin)。

### 5.3 CSS(`assets/css/style.css`,直接使用,不要改动整体结构)

```css
:root {
  --sidebar-width: 280px;
  --accent: #3a6ea5;
  --text: #222;
  --bg: #fff;
  --muted: #888;
  --border: #e5e5e5;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  font-family: -apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
  color: var(--text);
  background: var(--bg);
  line-height: 1.7;
}

#sidebar-toggle {
  position: fixed;
  top: 16px;
  left: 16px;
  z-index: 30;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 6px;
  background: var(--accent);
  color: #fff;
  font-size: 18px;
  cursor: pointer;
}

#sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: var(--sidebar-width);
  height: 100vh;
  background: #fafafa;
  border-right: 1px solid var(--border);
  transform: translateX(-100%);
  transition: transform 0.25s ease;
  z-index: 20;
  overflow-y: auto;
  padding-top: 64px;
}

body.sidebar-open #sidebar {
  transform: translateX(0);
}

#overlay-mask {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.15);
  z-index: 15;
}

body.sidebar-open #overlay-mask {
  display: block;
}

.sidebar-header {
  padding: 0 20px 12px;
  border-bottom: 1px solid var(--border);
}

.site-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text);
  text-decoration: none;
}

.sidebar-tabs {
  display: flex;
  border-bottom: 1px solid var(--border);
}

.tab-btn {
  flex: 1;
  padding: 10px 0;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  color: var(--muted);
}

.tab-btn.active {
  color: var(--accent);
  font-weight: 600;
  border-bottom: 2px solid var(--accent);
}

.tab-panel { display: none; padding: 12px 0; }
.tab-panel.active { display: block; }

.post-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.post-list li a {
  display: block;
  padding: 8px 20px;
  color: var(--text);
  text-decoration: none;
  font-size: 14px;
}

.post-list li a:hover {
  background: #eee;
}

.post-list .post-item-date {
  display: block;
  font-size: 12px;
  color: var(--muted);
}

#tag-cloud {
  padding: 0 20px 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-chip {
  padding: 4px 10px;
  border-radius: 12px;
  background: #eef3f9;
  color: var(--accent);
  font-size: 12px;
  cursor: pointer;
  border: 1px solid transparent;
}

.tag-chip.active {
  border-color: var(--accent);
}

#content {
  max-width: 760px;
  margin: 0 auto;
  padding: 80px 24px 60px;
}

.post-meta {
  color: var(--muted);
  font-size: 13px;
  margin-bottom: 24px;
}

.tag-pill {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 8px;
  background: #eef3f9;
  color: var(--accent);
  border-radius: 10px;
  font-size: 12px;
}

.post-body img { max-width: 100%; }
.post-body pre {
  background: #f5f5f5;
  padding: 12px;
  overflow-x: auto;
  border-radius: 6px;
}
.post-body code {
  background: #f5f5f5;
  padding: 2px 4px;
  border-radius: 4px;
}

.home-desc {
  color: var(--muted);
  margin-bottom: 32px;
}

.recent-posts {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.recent-post-item {
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border);
}

.recent-post-item h2 {
  margin: 0 0 6px;
  font-size: 20px;
}

.recent-post-item h2 a {
  color: var(--text);
  text-decoration: none;
}

.recent-post-item h2 a:hover {
  color: var(--accent);
}

.post-excerpt {
  color: #555;
  margin: 10px 0 0;
  font-size: 14px;
}
```

### 5.4 JS(`assets/js/main.js`,直接使用)

```javascript
(function () {
  var BASE_URL = window.BASE_URL || "";
  var body = document.body;
  var toggleBtn = document.getElementById("sidebar-toggle");
  var overlayMask = document.getElementById("overlay-mask");

  toggleBtn.addEventListener("click", function () {
    body.classList.toggle("sidebar-open");
  });
  overlayMask.addEventListener("click", function () {
    body.classList.remove("sidebar-open");
  });

  // Tab 切换
  var tabBtns = document.querySelectorAll(".tab-btn");
  tabBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      tabBtns.forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      document.querySelectorAll(".tab-panel").forEach(function (p) {
        p.classList.remove("active");
      });
      document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
    });
  });

  fetch(BASE_URL + "/posts.json")
    .then(function (res) { return res.json(); })
    .then(function (posts) {
      renderTimeline(posts);
      renderTagCloud(posts);
    })
    .catch(function (err) {
      console.error("加载 posts.json 失败:", err);
    });

  function renderTimeline(posts) {
    var ul = document.getElementById("post-list-timeline");
    ul.innerHTML = "";
    posts.forEach(function (post) {
      ul.appendChild(buildPostItem(post));
    });
  }

  function buildPostItem(post) {
    var li = document.createElement("li");
    var a = document.createElement("a");
    a.href = BASE_URL + "/" + post.url;
    a.innerHTML = post.title + '<span class="post-item-date">' + post.date + "</span>";
    li.appendChild(a);
    return li;
  }

  function renderTagCloud(posts) {
    var tagMap = {};
    posts.forEach(function (post) {
      (post.tags || []).forEach(function (tag) {
        tagMap[tag] = tagMap[tag] || [];
        tagMap[tag].push(post);
      });
    });

    var cloud = document.getElementById("tag-cloud");
    var listEl = document.getElementById("post-list-by-tag");
    cloud.innerHTML = "";
    listEl.innerHTML = "";

    var tagNames = Object.keys(tagMap).sort();
    tagNames.forEach(function (tag) {
      var chip = document.createElement("span");
      chip.className = "tag-chip";
      chip.textContent = tag + " (" + tagMap[tag].length + ")";
      chip.addEventListener("click", function () {
        document.querySelectorAll(".tag-chip").forEach(function (c) {
          c.classList.remove("active");
        });
        chip.classList.add("active");
        listEl.innerHTML = "";
        tagMap[tag].forEach(function (post) {
          listEl.appendChild(buildPostItem(post));
        });
      });
      cloud.appendChild(chip);
    });
  }
})();
```

---

## 6. `posts.json` 数据结构(构建时生成,输出到 `docs/posts.json`)

```json
[
  {
    "title": "Hello World",
    "date": "2026-07-04 10:00:00",
    "tags": ["随笔"],
    "categories": [],
    "slug": "2026-07-04-hello-world",
    "url": "posts/2026-07-04-hello-world.html",
    "excerpt": "正文前 100 个字符(去除 Markdown 语法符号)..."
  }
]
```

- 数组按 `date` **倒序**排列(最新的在最前)。
- `url` 是相对于 `baseUrl` 之后的路径(不含开头的 `baseUrl`,拼接逻辑在前端 JS 里已经处理:`BASE_URL + "/" + post.url`)。
- `excerpt` 字段用于**首页最近文章列表**的摘要展示(第 5.2 / 7.2 节),生成方式:取正文纯文本前 100 字符。

---

## 7. 脚本模块设计

### 7.1 `scripts/utils.js`

必须导出以下函数,函数名和参数不要改变:

```javascript
const fs = require("fs-extra");
const path = require("path");
const matter = require("gray-matter");
const MarkdownIt = require("markdown-it");

const md = new MarkdownIt({ html: true, linkify: true });

// 读取 blog.config.json,返回配置对象
function loadConfig() {
  const configPath = path.join(process.cwd(), "blog.config.json");
  return fs.readJsonSync(configPath);
}

// 解析单个 markdown 文件,返回:
// { title, date, tags, categories, slug, contentHtml, excerpt }
// slug 从文件名去掉 .md 后缀得到
function parseMarkdownFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  const slug = path.basename(filePath, ".md");
  const contentHtml = md.render(content);
  const plainText = content.replace(/[#*`>\-\[\]!]/g, "").replace(/\n+/g, " ").trim();
  const excerpt = plainText.slice(0, 100);
  return {
    title: data.title || slug,
    date: data.date ? String(data.date) : "",
    tags: data.tags || [],
    categories: data.categories || [],
    slug,
    contentHtml,
    excerpt
  };
}

// 简单占位符替换:template 是模板字符串,vars 是 { KEY: value } 对象
// 把模板中所有 {{KEY}} 替换为 value
function renderTemplate(template, vars) {
  let result = template;
  for (const key in vars) {
    const re = new RegExp("{{" + key + "}}", "g");
    result = result.replace(re, vars[key]);
  }
  return result;
}

// 返回 source/_posts 目录下所有 .md 文件的绝对路径数组
function listPostFiles() {
  const dir = path.join(process.cwd(), "source", "_posts");
  fs.ensureDirSync(dir);
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => path.join(dir, f));
}

// 把 tags 数组渲染成 HTML: <span class="tag-pill">xxx</span> 拼接
function renderTagsHtml(tags) {
  return (tags || []).map((t) => `<span class="tag-pill">${t}</span>`).join("");
}

// 按 date 字段对文章数组做倒序排序(最新在前),返回新数组,不修改传入的原数组
function sortPostsByDateDesc(posts) {
  return posts.slice().sort((a, b) => (a.date < b.date ? 1 : -1));
}

// 生成首页"最近文章"列表的 HTML。
// posts: 已经按 date 倒序排好的 posts.json 条目数组
// count: 展示条数(来自 blog.config.json 的 recentPostsCount,缺省 10)
// config: blog.config.json 内容,用来拼接 baseUrl
function renderRecentPostsHtml(posts, count, config) {
  const list = posts.slice(0, count);
  if (list.length === 0) {
    return '<p class="post-excerpt">还没有发布任何文章。</p>';
  }
  return list.map((post) => {
    return `<article class="recent-post-item">
  <h2><a href="${config.baseUrl}/${post.url}">${post.title}</a></h2>
  <div class="post-meta">
    <span class="post-date">${post.date}</span>
    <span class="post-tags">${renderTagsHtml(post.tags)}</span>
  </div>
  <p class="post-excerpt">${post.excerpt}...</p>
</article>`;
  }).join("\n");
}

// 读取/写入 docs/posts.json(数组),自动按 date 倒序排序后写回
function loadPostsIndex() {
  const p = path.join(process.cwd(), "docs", "posts.json");
  if (!fs.existsSync(p)) return [];
  return fs.readJsonSync(p);
}

// 排序后写入 docs/posts.json,并返回排序后的数组供调用方直接复用
// (调用方通常紧接着要用这个排序好的数组去生成首页最近文章列表,不需要再排一次)
function savePostsIndex(posts) {
  const sorted = sortPostsByDateDesc(posts);
  const p = path.join(process.cwd(), "docs", "posts.json");
  fs.writeJsonSync(p, sorted, { spaces: 2 });
  return sorted;
}

module.exports = {
  loadConfig,
  parseMarkdownFile,
  renderTemplate,
  listPostFiles,
  renderTagsHtml,
  sortPostsByDateDesc,
  renderRecentPostsHtml,
  loadPostsIndex,
  savePostsIndex
};
```

### 7.2 `scripts/build.js`(全量构建)

**算法步骤(必须按此顺序执行):**

```javascript
const fs = require("fs-extra");
const path = require("path");
const {
  loadConfig, parseMarkdownFile, renderTemplate,
  listPostFiles, renderTagsHtml, renderRecentPostsHtml, savePostsIndex
} = require("./utils");

// 生成首页 docs/index.html。
// postsIndexSorted 必须是已经按 date 倒序排好的 posts.json 条目数组
// (savePostsIndex 的返回值就是排好序的,直接传进来用即可,不要重复排序)。
// render.js 增量渲染时也会调用这个函数,保证新文章一旦进入最近 N 篇就能立刻反映到首页。
function renderHomepage(config, postsIndexSorted) {
  const docsDir = path.join(process.cwd(), "docs");
  const layoutTpl = fs.readFileSync(path.join(process.cwd(), "templates", "layout.html"), "utf-8");
  const indexTpl = fs.readFileSync(path.join(process.cwd(), "templates", "index.html"), "utf-8");

  const recentCount = config.recentPostsCount || 10;
  const recentPostsHtml = renderRecentPostsHtml(postsIndexSorted, recentCount, config);

  const homeContent = renderTemplate(indexTpl, {
    SITE_TITLE: config.title,
    SITE_DESCRIPTION: config.description,
    RECENT_POSTS_HTML: recentPostsHtml
  });
  const homeHtml = renderTemplate(layoutTpl, {
    PAGE_TITLE: "首页",
    SITE_TITLE: config.title,
    BASE_URL: config.baseUrl,
    CONTENT: homeContent
  });
  fs.writeFileSync(path.join(docsDir, "index.html"), homeHtml, "utf-8");
}

function build() {
  const config = loadConfig();
  const docsDir = path.join(process.cwd(), "docs");

  // 1. 清空并重建 docs 目录结构
  fs.emptyDirSync(docsDir);
  fs.ensureDirSync(path.join(docsDir, "posts"));
  fs.ensureDirSync(path.join(docsDir, "css"));
  fs.ensureDirSync(path.join(docsDir, "js"));

  // 2. 拷贝静态资源
  fs.copySync(path.join(process.cwd(), "assets", "css"), path.join(docsDir, "css"));
  fs.copySync(path.join(process.cwd(), "assets", "js"), path.join(docsDir, "js"));

  // 3. 读取文章模板(布局模板和首页模板留到生成首页那一步再读,由 renderHomepage 内部处理)
  const layoutTpl = fs.readFileSync(path.join(process.cwd(), "templates", "layout.html"), "utf-8");
  const postTpl = fs.readFileSync(path.join(process.cwd(), "templates", "post.html"), "utf-8");

  // 4. 解析所有 markdown 文章
  const files = listPostFiles();
  const posts = files.map(parseMarkdownFile);

  // 5. 为每篇文章生成 html 页面
  posts.forEach((post) => {
    const postHtml = renderTemplate(postTpl, {
      POST_TITLE: post.title,
      POST_DATE: post.date,
      POST_TAGS_HTML: renderTagsHtml(post.tags),
      POST_CONTENT_HTML: post.contentHtml
    });
    const fullHtml = renderTemplate(layoutTpl, {
      PAGE_TITLE: post.title,
      SITE_TITLE: config.title,
      BASE_URL: config.baseUrl,
      CONTENT: postHtml
    });
    fs.writeFileSync(path.join(docsDir, "posts", post.slug + ".html"), fullHtml, "utf-8");
  });

  // 6. 生成 posts.json 索引(注意 url 字段格式:posts/<slug>.html)
  //    savePostsIndex 会自动按 date 倒序排序并写入 docs/posts.json,同时把排好序的数组 return 回来
  const postsIndex = posts.map((post) => ({
    title: post.title,
    date: post.date,
    tags: post.tags,
    categories: post.categories,
    slug: post.slug,
    url: "posts/" + post.slug + ".html",
    excerpt: post.excerpt
  }));
  const sortedIndex = savePostsIndex(postsIndex);

  // 7. 用排好序的索引生成首页(首页正文区域展示最近 N 篇文章,N 来自 blog.config.json 的 recentPostsCount)
  renderHomepage(config, sortedIndex);

  console.log(`构建完成,共 ${posts.length} 篇文章,输出到 docs/`);
}

module.exports = { build, renderHomepage };
```

### 7.3 `scripts/render.js`(单篇增量渲染 —— 对应"命令行 md 直接渲染成 html 然后加载"需求)

**这是核心新增需求,逻辑必须如下,不要合并到 build.js 里:**

```javascript
const fs = require("fs-extra");
const path = require("path");
const {
  loadConfig, parseMarkdownFile, renderTemplate,
  renderTagsHtml, loadPostsIndex, savePostsIndex
} = require("./utils");
const { renderHomepage } = require("./build");

function renderOne(mdFilePath) {
  const config = loadConfig();
  const docsDir = path.join(process.cwd(), "docs");

  // 1. 如果 docs 目录还不存在基础结构,先做最基础的初始化(css/js/posts 目录)
  fs.ensureDirSync(path.join(docsDir, "posts"));
  fs.ensureDirSync(path.join(docsDir, "css"));
  fs.ensureDirSync(path.join(docsDir, "js"));
  // 只在文件不存在时才拷贝,避免覆盖用户可能已手动更新的资源
  if (!fs.existsSync(path.join(docsDir, "css", "style.css"))) {
    fs.copySync(path.join(process.cwd(), "assets", "css"), path.join(docsDir, "css"));
  }
  if (!fs.existsSync(path.join(docsDir, "js", "main.js"))) {
    fs.copySync(path.join(process.cwd(), "assets", "js"), path.join(docsDir, "js"));
  }

  // 2. 解析这一篇 markdown
  const absPath = path.isAbsolute(mdFilePath) ? mdFilePath : path.join(process.cwd(), mdFilePath);
  const post = parseMarkdownFile(absPath);

  // 3. 渲染该文章的 html 并写入 docs/posts/<slug>.html
  const postTpl = fs.readFileSync(path.join(process.cwd(), "templates", "post.html"), "utf-8");
  const layoutTpl = fs.readFileSync(path.join(process.cwd(), "templates", "layout.html"), "utf-8");

  const postHtml = renderTemplate(postTpl, {
    POST_TITLE: post.title,
    POST_DATE: post.date,
    POST_TAGS_HTML: renderTagsHtml(post.tags),
    POST_CONTENT_HTML: post.contentHtml
  });
  const fullHtml = renderTemplate(layoutTpl, {
    PAGE_TITLE: post.title,
    SITE_TITLE: config.title,
    BASE_URL: config.baseUrl,
    CONTENT: postHtml
  });
  const outputPath = path.join(docsDir, "posts", post.slug + ".html");
  fs.writeFileSync(outputPath, fullHtml, "utf-8");

  // 4. 更新 docs/posts.json:如果该 slug 已存在则替换,否则新增,然后按 date 重新排序保存
  const index = loadPostsIndex();
  const entry = {
    title: post.title,
    date: post.date,
    tags: post.tags,
    categories: post.categories,
    slug: post.slug,
    url: "posts/" + post.slug + ".html",
    excerpt: post.excerpt
  };
  const existingIdx = index.findIndex((p) => p.slug === post.slug);
  if (existingIdx >= 0) {
    index[existingIdx] = entry;
  } else {
    index.push(entry);
  }
  const sortedIndex = savePostsIndex(index);

  // 5. 重新生成首页 —— 这一步不能省略。因为这篇文章有可能刚好进入"最近 N 篇"的名单,
  //    如果不重新生成首页,新文章能在 sidebar 里点开,但首页正文区域看不到它。
  renderHomepage(config, sortedIndex);

  console.log(`已渲染: ${outputPath}`);
  console.log(`已更新索引: docs/posts.json`);
  console.log(`已刷新首页: docs/index.html`);
}

module.exports = { renderOne };
```

### 7.4 `scripts/new-post.js`(新建文章脚手架)

```javascript
const fs = require("fs-extra");
const path = require("path");

function newPost(slug, titleOption) {
  if (!slug || !/^[a-z0-9\-]+$/.test(slug)) {
    console.error("slug 必须是小写字母、数字、短横线组成,例如: my-first-post");
    process.exit(1);
  }
  const dir = path.join(process.cwd(), "source", "_posts");
  fs.ensureDirSync(dir);
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 19).replace("T", " ");
  const filename = today.toISOString().slice(0, 10) + "-" + slug + ".md";
  const filePath = path.join(dir, filename);

  if (fs.existsSync(filePath)) {
    console.error("文件已存在: " + filePath);
    process.exit(1);
  }

  const title = titleOption || slug;
  const content = `---
title: ${title}
date: ${dateStr}
tags: []
categories: []
---

正文写在这里。
`;
  fs.writeFileSync(filePath, content, "utf-8");
  console.log("已创建: " + filePath);
}

module.exports = { newPost };
```

### 7.5 `scripts/serve.js`(本地静态预览,无需 live-reload)

```javascript
const http = require("http");
const fs = require("fs");
const path = require("path");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml"
};

function serve(port) {
  const root = path.join(process.cwd(), "docs");
  const server = http.createServer((req, res) => {
    let urlPath = decodeURIComponent(req.url.split("?")[0]);
    if (urlPath === "/") urlPath = "/index.html";
    const filePath = path.join(root, urlPath);
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end("Not Found: " + urlPath);
        return;
      }
      const ext = path.extname(filePath);
      res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
      res.end(data);
    });
  });
  server.listen(port, () => {
    console.log(`本地预览: http://localhost:${port}`);
  });
}

module.exports = { serve };
```

### 7.6 `scripts/deploy.js`(构建 + git 提交 + push,触发 GitHub Pages 更新)

**这是新增需求:一条命令完成"重新构建 → git 提交 → 推送到远程",不需要手动敲 git 命令。**

```javascript
const { execSync } = require("child_process");
const { build } = require("./build");

function runInherit(cmd) {
  execSync(cmd, { stdio: "inherit" });
}

function runCapture(cmd) {
  return execSync(cmd, { stdio: ["pipe", "pipe", "pipe"] }).toString().trim();
}

function hasUncommittedChanges() {
  const status = runCapture("git status --porcelain");
  return status.length > 0;
}

function deploy(message) {
  try {
    console.log("== 第 1 步:重新构建站点 ==");
    build();

    console.log("== 第 2 步:检查 git 状态 ==");
    if (!hasUncommittedChanges()) {
      console.log("没有检测到任何文件变化,无需部署。");
      return;
    }

    const commitMsg = message || ("deploy: " + new Date().toISOString());

    console.log("== 第 3 步:git add -A ==");
    runInherit("git add -A");

    console.log(`== 第 4 步:git commit -m "${commitMsg}" ==`);
    runInherit(`git commit -m "${commitMsg}"`);

    console.log("== 第 5 步:git push ==");
    const branch = runCapture("git rev-parse --abbrev-ref HEAD");
    runInherit(`git push origin ${branch}`);

    console.log("部署完成。GitHub Pages 通常需要 1~2 分钟生效,过一会刷新网站查看。");
  } catch (err) {
    console.error("部署失败:", err.message);
    console.error("请检查:1) 是否已执行 git init 并 git remote add origin <仓库地址>;2) 是否有推送权限;3) 是否有未解决的 git 冲突。");
    process.exit(1);
  }
}

module.exports = { deploy };
```

行为说明:
- `deploy` 每次都会先执行完整的 `build()`,保证提交的 `docs/` 内容一定是最新的,不依赖用户提前手动 build。
- 如果 `git status --porcelain` 为空(没有任何改动),直接打印提示并 `return`,不执行 add/commit/push,避免产生空 commit 报错。
- commit message 支持通过参数传入,不传则使用 `deploy: <ISO时间戳>`。
- push 的分支通过 `git rev-parse --abbrev-ref HEAD` 自动获取当前分支,不写死 `main`,避免用户本地分支名不同时出错。
- 所有 git 命令失败(比如没配置 remote、没有推送权限、有冲突)都会被 catch 住,打印可读的中文错误提示后 `process.exit(1)`,不会抛出裸的 Node 报错栈。

### 7.7 `scripts/cli.js`(CLI 入口,使用 commander)

```javascript
#!/usr/bin/env node
const { program } = require("commander");
const { build } = require("./build");
const { renderOne } = require("./render");
const { newPost } = require("./new-post");
const { serve } = require("./serve");
const { deploy } = require("./deploy");

program
  .name("swp-cli")
  .description("个人静态博客生成工具");

program
  .command("build")
  .description("全量构建整个站点到 docs/ 目录")
  .action(() => {
    build();
  });

program
  .command("render <file>")
  .description("渲染单篇 markdown 文件为 html 并更新索引,不重建全站")
  .action((file) => {
    renderOne(file);
  });

program
  .command("new <slug>")
  .description("创建一篇新文章,slug 为纯英文短横线格式,例如 my-first-post")
  .option("-t, --title <title>", "文章标题(可以是中文)")
  .action((slug, options) => {
    newPost(slug, options.title);
  });

program
  .command("serve")
  .description("本地预览 docs/ 目录")
  .option("-p, --port <port>", "端口号", "8080")
  .action((options) => {
    serve(parseInt(options.port, 10));
  });

program
  .command("deploy")
  .description("重新构建站点,并自动 git add/commit/push,触发 GitHub Pages 更新")
  .option("-m, --message <message>", "自定义 commit message")
  .action((options) => {
    deploy(options.message);
  });

program.parse(process.argv);
```

---

## 8. 示例文章(创建仓库时一并放入)

`source/_posts/2026-07-04-hello-world.md`:

```markdown
---
title: Hello World
date: 2026-07-04 10:00:00
tags: [随笔]
categories: []
---

这是我的第一篇文章。欢迎来到我的博客。
```

---

## 9. 命令行使用说明(写入 README.md)

```bash
# 安装依赖
npm install

# (可选)把 swp-cli 注册为全局命令,之后就能直接敲 swp-cli 而不用 node scripts/cli.js
npm link

# 创建新文章
swp-cli new my-first-post --title "我的第一篇文章"
# 不执行 npm link 的话,等价写法是:node scripts/cli.js new my-first-post --title "我的第一篇文章"
# 会在 source/_posts/ 下生成 2026-07-04-my-first-post.md,打开编辑正文

# 只渲染这一篇并加入站点(不用全量 build)
swp-cli render source/_posts/2026-07-04-my-first-post.md

# 全量重新构建整个站点(比如改了模板/CSS 之后)
swp-cli build

# 本地预览
swp-cli serve
# 打开浏览器访问 http://localhost:8080

# 一条命令部署:自动重新构建 + git add/commit/push,触发 GitHub Pages 更新
swp-cli deploy
# 也可以自定义 commit message:
swp-cli deploy -m "写了一篇新文章"
# 首次使用前提:仓库已 git init,并且已经 git remote add origin <你的仓库地址>

# 部署后:在仓库 Settings -> Pages 设置 Source 为 main 分支 /docs 目录(只需设置一次)
```

---

## 10. 实现步骤清单(agent 请按顺序逐条完成,每完成一步自查一次)

1. 创建第 2 节的完整目录结构和空文件。
2. 写入 `.gitignore`(第 2.1 节内容,原样使用)。
3. 写入 `package.json`(第 1 节内容),运行 `npm install`。
4. 写入 `blog.config.json`(第 3 节内容)。
5. 写入 `templates/layout.html`、`templates/post.html`、`templates/index.html`(第 5.2 节内容,原样使用)。
6. 写入 `assets/css/style.css`(第 5.3 节内容,原样使用)。
7. 写入 `assets/js/main.js`(第 5.4 节内容,原样使用)。
8. 写入 `scripts/utils.js`(第 7.1 节内容,原样使用)。
9. 写入 `scripts/build.js`(第 7.2 节内容,原样使用)。
10. 写入 `scripts/render.js`(第 7.3 节内容,原样使用)。
11. 写入 `scripts/new-post.js`(第 7.4 节内容,原样使用)。
12. 写入 `scripts/serve.js`(第 7.5 节内容,原样使用)。
13. 写入 `scripts/deploy.js`(第 7.6 节内容,原样使用)。
14. 写入 `scripts/cli.js`(第 7.7 节内容,原样使用),赋予可执行权限(`chmod +x scripts/cli.js`,可选)。
15. 写入示例文章 `source/_posts/2026-07-04-hello-world.md`(第 8 节内容)。
16. 写入 `README.md`(第 9 节内容)。
17. 运行 `node scripts/cli.js build`,检查 `docs/` 目录是否生成了 `index.html`、`posts/2026-07-04-hello-world.html`、`posts.json`、`css/style.css`、`js/main.js`。
18. 运行 `node scripts/cli.js serve`,浏览器打开验证:
    - 首页正文区域(不用打开 sidebar)直接显示"最近文章"列表,当前只有一篇 Hello World,应该能看到它的标题、日期、tag、摘要,点击标题能跳转到文章页。
    - 点击左上角 ☰ 按钮 sidebar 从左侧滑出。
    - sidebar「时间线」tab 显示 Hello World 文章,点击能跳转到文章页。
    - sidebar「标签」tab 显示"随笔 (1)",点击后下方列表显示对应文章。
    - 点击 sidebar 外的遮罩区域,sidebar 收起。
19. 测试增量渲染:运行 `node scripts/cli.js new second-post --title "第二篇"`,编辑生成的 md 文件写点正文,然后运行 `node scripts/cli.js render source/_posts/<生成的文件名>.md`,确认:
    - `docs/posts/<slug>.html` 被创建。
    - `docs/posts.json` 中新增了这篇文章的条目,且整体仍按日期倒序排列。
    - **不需要重新运行 `build` 命令**,刷新首页(`docs/index.html`)就能在最近文章列表里看到这篇新文章排在最前面(因为日期最新),刷新 sidebar 也能看到。
20. 测试 `recentPostsCount` 配置项:把 `blog.config.json` 里的 `recentPostsCount` 改成 `1`,重新运行 `node scripts/cli.js build`,确认首页正文区域只显示 1 篇最新文章,而不是全部。测试完成后记得改回 `10`(或用户想要的数字)并重新 `build` 一次。
21. 测试 deploy 命令(需要仓库已经 `git init` 且配置了 `origin` 远程地址):
    - 先在没有任何改动的情况下运行 `node scripts/cli.js deploy`,确认输出"没有检测到任何文件变化,无需部署。"且不报错。
    - 改动一篇文章或新建一篇文章后,运行 `node scripts/cli.js deploy -m "test deploy"`,确认依次打印出构建、git add、git commit、git push 的日志,且本地 git log 里出现了一条 message 为 "test deploy" 的提交。
    - 故意在没有配置 `origin` 远程的仓库里运行一次,确认命令捕获错误并打印出可读的中文提示,而不是抛出未处理的异常导致进程崩溃且无提示。
22. 全部验证通过后,在仓库 Settings 里开启 GitHub Pages(Source: `main` 分支 `/docs` 目录,只需设置一次,后续每次 `deploy` 都会自动更新)。

---

## 11. 验收标准(Definition of Done)

- [ ] `node scripts/cli.js build`(或 `npm link` 后的 `swp-cli build`)无报错,生成完整 `docs/` 目录。
- [ ] `swp-cli new <slug> --title "<标题>"`(或等价的 `node scripts/cli.js new ...`)能正确生成带 front-matter 的 md 文件。
- [ ] `swp-cli render <file>`(或等价的 `node scripts/cli.js render <file>`)能单独渲染一篇文章并正确更新 `posts.json`(新增和覆盖已存在 slug 两种情况都要测试)。
- [ ] `swp-cli deploy`(或等价的 `node scripts/cli.js deploy`)在无变更时能正确跳过提交;有变更时能自动完成构建 + git add + commit + push;git 命令出错时能打印可读提示而不是裸异常。
- [ ] 首页正文区域(不打开 sidebar)直接服务端渲染显示最近 `recentPostsCount` 篇文章(标题、日期、tag、摘要),而不是靠前端 JS 异步 fetch 后再显示;修改 `recentPostsCount` 并重新 `build` 后,首页展示条数相应变化。
- [ ] 用 `render` 命令增量渲染单篇文章后,即使不执行 `build`,首页的最近文章列表也会同步更新(因为 `render.js` 内部调用了 `renderHomepage`)。
- [ ] sidebar 默认隐藏,点击按钮可以打开/关闭。
- [ ] sidebar 时间线视图按日期倒序正确显示所有文章。
- [ ] sidebar 标签视图正确按 tag 分组,点击 tag 能过滤出对应文章列表。
- [ ] 文章页正确显示标题、日期、tag、Markdown 渲染后的正文(代码块、图片、列表等常见 Markdown 语法均正常渲染)。
- [ ] 所有页面内的静态资源路径(css/js/posts.json)在 `baseUrl` 为空和非空两种配置下都能正确加载(至少验证 `baseUrl: ""` 这一种,`baseUrl` 非空的情况人工检查代码逻辑是否自洽即可)。
- [ ] `docs/` 目录可以直接作为 GitHub Pages 的发布目录使用,无需额外构建步骤。

---

## 12. 后续可扩展方向(本版本不实现,仅记录以免遗忘)

- 文章内 `<!-- more -->` 手动截断摘要。
- 上一篇/下一篇文章导航。
- 深色模式切换。
- 按分类(categories)分组视图(目前只做了 tags)。
- Markdown 数学公式 / mermaid 图表支持。
