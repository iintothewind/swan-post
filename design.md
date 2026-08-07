# swan-post (swp) — Personal Static Blog Generator Design Document (v1.0)

> This document is intended for coding agent execution. **Please strictly follow the directory structure, file names, function signatures, and code skeletons given in this document. Do not change the architecture on your own, and do not introduce unmentioned dependencies or frameworks.** The HTML/CSS/JS code provided in this document can be used directly; you only need to fill in the logic or make minor replacements as described in the "Implementation Checklist".

---

## 0. Project Goals

Build a personal static blog generator in Node.js as a replacement for Hexo, with output deployed to GitHub Pages.

**Feature scope:**
1. Fixed layout: left sidebar (post list + navigation), hidden by default, slides out on button click; right side displays content. The sidebar supports two viewing modes: "by publish date (newest first)" and "by tag grouping".
2. Posts use Hexo-style Markdown (YAML front-matter + body).
3. CLI tool: can render a single `.md` file directly to `.html` and "publish" it (i.e. update the output directory + update the post index), without needing a full site rebuild.
4. Post header/footer injection: global HTML fragments under `source/_includes/` wrap the post body at build time (post pages only); per-post `header` / `footer` front-matter flags opt out (default on).
5. Agent-readable attribution (static GitHub Pages): per-post Markdown mirrors (`docs/posts/<slug>.md`), site-wide `docs/llms.txt`, and `<link rel="alternate" type="text/markdown">` on post pages; no edge proxy or User-Agent routing.
6. Post-body author/source attribution: `author:` / `source:` lines at the top and bottom of every post body via configurable HTML fragments (`postBodyMeta`, `postBodyAttribution`); same values prepended to agent `.md` mirrors.

**Explicitly out of scope (avoid over-engineering):**
- No pagination (a personal blog doesn't have many posts; the sidebar shows the full list directly).
- No comment system, no RSS, no search.
- No live-reload (hot reload); manually refresh the browser for local preview.
- No Chinese-to-pinyin slug generation; the filename slug is manually specified by the user on the command line (pure ASCII).
- No User-Agent / TLS-based content negotiation (unlike TIME's live edge routing; static build-time mirrors only).

---

## 1. Tech Stack and Dependencies

- **Runtime**: Node.js >= 18 (ESM or CommonJS both acceptable; this document uses **CommonJS** (`require`); the agent must not mix in `import`).
- **Dependency packages** (write into `package.json`, use `^` prefix for versions, do not specify higher major versions):

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
    "markdown-it-texmath": "^1.0.0",
    "katex": "^0.18.1",
    "mermaid": "^11.16.1",
    "fs-extra": "^11.0.0"
  }
}
```

Do not add any third-party packages beyond the seven listed above.

- `markdown-it-texmath` + `katex`: server-side LaTeX math rendering (`$...$` inline, `$$...$$` block, numbered equations via `$$ x $$ (1)`).
- `mermaid`: client-side diagram rendering; only `dist/mermaid.min.js` is shipped into the build output (see Section 7.1 `copyStaticAssets`).

---

## 2. Directory Structure

**The following directory structure and file names must be strictly followed** (the agent should check against this list one by one when creating files):

```
swan-post/
├── package.json
├── blog.config.json              # Site configuration
├── source/
│   ├── _posts/                   # Stores all Markdown posts
│   └── _includes/                # Post includes (optional)
│       ├── post-header.html
│       ├── post-body-meta.html
│       ├── post-body-attribution.html
│       ├── post-footer.html
│       └── agent-attribution.md
├── templates/                    # HTML templates (placeholder substitution, see Section 5)
│   ├── layout.html
│   ├── post.html
│   └── index.html
├── assets/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── main.js
│   └── prism/                    # Prism code highlighting
│       ├── prism.min.js
│       └── prism-monokai.min.css
├── scripts/
│   ├── cli.js                    # CLI entry point
│   ├── utils.js                  # Shared utility functions
│   ├── build.js                  # Full site build
│   ├── render.js                 # Single-post incremental render
│   ├── new-post.js               # Create new post
│   ├── serve.js                  # Local static preview server
│   ├── deploy.js                 # Build + git commit + push, trigger GitHub Pages update
│   ├── gist-sync.js              # Sync GitHub public gists as posts
│   └── test-attribution.sh       # Attribution channel acceptance tests (D1–D5)
├── docs/                         # [Output directory] Build artifacts, pushed to a separate Pages repo by deploy; do not edit manually
│   ├── index.html                # Homepage (recent N posts, server-rendered)
│   ├── posts.json                # Post index (fetched at runtime by frontend sidebar)
│   ├── llms.txt                  # Agent-readable site index (when agentMarkdown is on)
│   ├── katex/                    # KaTeX css + fonts (copied from node_modules/katex/dist, see Section 7.1)
│   └── posts/
│       ├── <slug>.html           # Post pages (js/ also contains mermaid.min.js for client-side diagrams)
│       └── <slug>.md             # Agent-readable Markdown mirror (when agentMarkdown is on)
└── README.md
```

> GitHub Pages deployment method: build artifacts are pushed by the `deploy` command to a separate Pages repository (`<user>.github.io`). In that repo's Settings → Pages, set Source to the `main` branch root (only needs to be done once). Everything under `docs/` is auto-generated/overwritten by scripts.

---

## 2.1 `.gitignore`

```gitignore
# Dependencies
node_modules/

# npm logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# System files
.DS_Store
Thumbs.db

# Editor
.vscode/
.idea/
*.swp

# Environment variables
.env

# Build artifacts — pushed to a separate GitHub Pages repo via the deploy command
docs/

# Temporary Pages repo clone used by the deploy command
.deploy/
```

**Note:** The source repo and Pages repo are separate. `docs/` is a build artifact and is not committed to the source repo (`swan-post`); it is pushed by the `deploy` command to a separate GitHub Pages repo (`<user>.github.io`).

---

## 3. Site Configuration File `blog.config.json`

```json
{
  "title": "My Blog",
  "author": "Ivar",
  "description": "Personal Blog",
  "baseUrl": "",
  "recentPostsCount": 10,
  "sidebarPostCount": 200,
  "postHeader": "source/_includes/post-header.html",
  "postFooter": "source/_includes/post-footer.html",
  "githubUser": "username",
  "deployTarget": "git@github.com:username/username.github.io.git",
  "siteUrl": "https://username.github.io",
  "agentMarkdown": true,
  "agentAttribution": "source/_includes/agent-attribution.md",
  "postAuthor": "Ivar.Chen",
  "postSource": "https://username.github.io/",
  "postBodyMeta": "source/_includes/post-body-meta.html",
  "postBodyAttribution": "source/_includes/post-body-attribution.html"
}
```

- `baseUrl`: If the blog is deployed at `https://username.github.io/` (root domain), leave `baseUrl` as an empty string `""`. If deployed at `https://username.github.io/reponame/` (project page), set `baseUrl` to `"/reponame"`.
- `recentPostsCount`: The number of "recent posts" displayed in the homepage content area, default `10`. Changing this number does not require code changes; the build script reads the config and falls back to `10` if the field is missing.
- `sidebarPostCount`: The maximum number of posts shown in the sidebar "Timeline" tab, default `200`. Only affects the frontend display count, not the `posts.json` content.
- `postHeader` / `postFooter`: Optional paths (relative to project root) to HTML fragments injected above/below the post body on **post pages only**. Default includes wrap content in `.agent-context` (hidden from humans). Defaults to `source/_includes/post-header.html` and `source/_includes/post-footer.html` when omitted. Missing files log a warning and render as empty strings; the build does not fail.
- `githubUser`: GitHub username, used by the `gist-sync` command to fetch public gists (can also be overridden via the `--user` CLI flag).
- `deployTarget`: SSH URL of the GitHub Pages repository. The deploy command pushes build artifacts to this repo. The source repo (`swan-post`) and Pages repo are separate.
- `siteUrl`: Canonical public site URL (no trailing slash). Used for `llms.txt`, `rel="alternate"` links, and absolute URLs inside agent mirrors. Falls back to `https://<githubUser>.github.io` when omitted.
- `agentMarkdown`: When `true` (default), each build/render writes `docs/posts/<slug>.md`, regenerates `docs/llms.txt`, and adds `<link rel="alternate" type="text/markdown">` in post page `<head>`. Set to `false` to disable all three.
- `agentAttribution`: Path (relative to project root) to the Markdown template prepended to each mirror file. Defaults to `source/_includes/agent-attribution.md`. Missing file logs a warning and uses an empty header.
- `postAuthor` / `postSource`: Default values for `author:` / `source:` lines injected into every post body and prepended to `.md` mirrors. Fall back to `author` and `siteUrl/` (with trailing slash) when omitted.
- `postBodyMeta` / `postBodyAttribution`: Paths to HTML fragments for top-of-body and end-of-body attribution inside `.post-body`. Controlled by `footer` front-matter (same as footer include); `header: false` does not affect body meta/attribution.
- When referencing static resources in all templates, the `{{BASE_URL}}` prefix must be concatenated (see Section 5), so that both root domain and sub-path deployments work correctly. **Do not hardcode absolute paths or relative `../` paths.**

---

## 4. Markdown Post Format (Hexo-style front-matter)

Each post is a `.md` file under `source/_posts/`, with a fixed filename format:

```
<slug>.md
```

`<slug>` is specified by the user on the command line (lowercase letters, digits, hyphens only; no Chinese characters or spaces).

File content format:

```markdown
---
title: Post Title
date: 2026-07-04 10:00:00
tags: [tag1, tag2]
header: true   # optional; default true — set false to skip post header include
footer: true   # optional; default true — set false to skip post footer/body attribution
author: Ivar.Chen   # optional; per-post override; new/gist-sync fill from blog.config.json
source: https://username.github.io/   # optional; per-post override
---

Body content, standard Markdown syntax.
```

Field descriptions:
- `title` (required, string): Post title, can be in Chinese.
- `date` (required, format `YYYY-MM-DD HH:mm:ss`): Publish time, used for sorting. Note: js-yaml parses dates without timezone as **UTC** (YAML 1.1 spec), so build results are independent of the build machine's timezone — in `posts.json`, `date` stores the UTC ISO string (for sorting), and `formattedDate` takes the UTC `YYYY-MM-DD` for display, which is always equal to the date manually written in the front-matter.
- `tags` (optional, string array): Default `[]`.
- `author` / `source` (optional, string): Per-post attribution overrides. When omitted, `new` and `gist-sync` fill them from `postAuthor` / `postSource` in `blog.config.json`; build uses front-matter values when present.
- `header` / `footer` (optional, boolean): Default `true`. Set to `false` to opt out of global post header/footer HTML fragments on that post. Only boolean `false` opts out. `footer: false` also skips body meta, body attribution, and the visible footer.

Always use the `gray-matter` library to parse this front-matter. **Do not write your own YAML parser.**

### Markdown extensions

Beyond standard Markdown, the renderer (Section 7.1) supports:

**Math (server-side, KaTeX):**
- Inline: `$...$`, e.g. `$E = mc^2$` → inline KaTeX HTML.
- Block: `$$...$$` on its own line → `<section><eqn><span class="katex-display">…</span></eqn></section>` (numbered form `$$ x^2 $$ (1)` emits `<section class="eqno">` with the number after `</eqn>`).
- `throwOnError: false` renders malformed math with KaTeX's red error styling instead of throwing.
- Literal `$` (currency, shell vars) must be escaped as `\$` in Markdown; unescaped `$...$` pairs are always treated as math.

**Mermaid diagrams (client-side):**
- A fenced block whose language is exactly `mermaid` is rendered to `<div class="mermaid">…</div>` (content HTML-escaped). `layout.html` loads `mermaid.min.js` only when `.mermaid` nodes exist, then draws them client-side. All other code fences keep the Prism path.

Both are masked in the post excerpt (see Section 7.1 `parseMarkdownFile`): inline and block math → `[math]`, diagrams → `[diagram]`.

### 4.1 Post header/footer includes

Global HTML fragments live under `source/_includes/`. Paths are configured in `blog.config.json` (`postHeader`, `postFooter`, `postBodyMeta`, `postBodyAttribution`). Both `scripts/build.js` and `scripts/render.js` call `buildPostIncludes(config, post)` and pass the rendered strings into `templates/post.html` as `{{POST_HEADER_HTML}}`, `{{POST_BODY_META_HTML}}`, `{{POST_BODY_ATTRIBUTION_HTML}}`, and `{{POST_FOOTER_HTML}}`. All body fragments are inside `.post-body`, wrapping `{{POST_CONTENT_HTML}}`.

**Starter files** (ship with the repo; user-editable):

**Visibility model:** Only `post-body-meta.html` (top `author:` / `source:`) is shown to humans. `post-header.html`, `post-body-attribution.html`, and `post-footer.html` each wrap content in a visually hidden `.agent-context` block (`aria-hidden="true"` + inline `!important` styles) so attribution stays in the HTML/DOM for scrapers but is hidden from sighted readers. CSS in `assets/css/style.css` reinforces hiding.

`source/_includes/post-header.html` — hidden `.agent-context` with copyright and citation instructions (see shipped file).

`source/_includes/post-body-meta.html` (top of body, **human-visible**):
```html
<p class="post-body-meta" lang="en">
  author: {{POST_AUTHOR}}<br>
  source: {{POST_SOURCE}}
</p>
```

`source/_includes/post-body-attribution.html` (end of body, **hidden** inside `.agent-context`):
```html
<div class="agent-context" data-purpose="body-attribution" aria-hidden="true" style="...">
  <p class="post-body-attribution" lang="en">
    author: {{POST_AUTHOR}}<br>
    source: {{POST_SOURCE}}<br>
    Written by <strong>{{POST_AUTHOR}}</strong>.
    Canonical: <a href="{{CANONICAL_URL}}" rel="canonical">{{CANONICAL_URL}}</a>.
    GitHub: <a href="{{GITHUB_URL}}" rel="me">{{GITHUB_USER}}</a>.
  </p>
</div>
```

`source/_includes/post-footer.html` (end of body, **hidden** inside `.agent-context`):
```html
<div class="agent-context" data-purpose="post-footer" aria-hidden="true" style="...">
  <footer class="post-footer" lang="en">
    <p>Written by <strong>{{POST_AUTHOR}}</strong>. Personal blog: <a href="{{POST_SOURCE}}">{{POST_SOURCE}}</a></p>
    <p class="post-footer-note">{{SITE_DESCRIPTION}}</p>
  </footer>
</div>
```

Fragment placeholders include `{{POST_AUTHOR}}`, `{{POST_SOURCE}}`, `{{CANONICAL_URL}}`, `{{GITHUB_USER}}`, `{{GITHUB_URL}}` (from `buildPostTemplateVars` in `utils.js`).

Fragments may reference external assets, e.g. `<script src="{{BASE_URL}}/js/your-file.js"></script>`. Inline `<script>` is allowed (trusted local files, same model as templates).

Append minimal styles to `assets/css/style.css` (do not replace existing rules):
```css
.post-body .agent-context {
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  padding: 0 !important;
  margin: -1px !important;
  overflow: hidden !important;
  clip: rect(0, 0, 0, 0) !important;
  clip-path: inset(50%) !important;
  white-space: nowrap !important;
  border: 0 !important;
  opacity: 0 !important;
  visibility: hidden !important;
  pointer-events: none !important;
  z-index: -1 !important;
}
/* Visible top-of-body author/source (human-readable) */
.post-body-meta {
  margin: 0 0 1.25rem;
  padding: 0.5rem 0 0.75rem;
  border-bottom: 1px dashed var(--border);
  font-size: 0.82rem;
  color: var(--muted);
  line-height: 1.6;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
}
/* Attribution/footer inside .agent-context: hidden from humans */
.post-body .agent-context .post-body-attribution,
.post-body .agent-context .post-footer {
  margin: 0;
  padding: 0;
  border: 0;
}
```

**Out of scope for this version:** per-post custom fragment paths (`headerFile` / `footerFile` front-matter). Only global fragments + per-post boolean opt-out.

### 4.2 Agent-readable Markdown mirrors (static attribution)

On pure static GitHub Pages (no edge proxy), swan-post emits agent-readable content at **build time**:

| Output | Path | Purpose |
|--------|------|---------|
| Per-post mirror | `docs/posts/<slug>.md` | FAQ-style attribution header + `author:`/`source:` lines + original Markdown body + copyright footer |
| Site index | `docs/llms.txt` | Site description + list of Markdown mirror URLs |
| HTML discovery | `<link rel="alternate" type="text/markdown" href="...">` in post `<head>` | Points agents to the `.md` mirror |

Controlled by `agentMarkdown` (default `true`). Set `false` to disable all three.

`source/_includes/agent-attribution.md` is the mirror header template. Placeholders: `{{SITE_AUTHOR}}`, `{{SITE_URL}}`, `{{GITHUB_USER}}`, `{{GITHUB_URL}}`, `{{CANONICAL_URL}}`, `{{POST_TITLE}}`, `{{POST_DATE}}`, `{{POST_SLUG}}`, `{{POST_TAGS}}`, `{{POST_AUTHOR}}`, `{{POST_SOURCE}}`.

`scripts/utils.js` provides: `getDefaultPostAuthor`, `getDefaultPostSource`, `getPostAuthor`, `getPostSource`, `formatPostAttributionFrontMatter`, `buildPostTemplateVars`, `getSiteUrl`, `getPostCanonicalUrl`, `getPostMarkdownUrl`, `buildAgentMarkdown`, `writeAgentMarkdownFile`, `renderLlmsTxt`, `writeLlmsTxt`, `renderPostAlternateLink`.

`parseMarkdownFile` must also return raw `content` (Markdown body string) for mirror generation.

> **Limitation:** Unlike TIME's live edge routing, static GitHub Pages cannot serve different HTML vs. Markdown per User-Agent at request time. Markdown mirrors and `llms.txt` are the most reliable agent path. Hidden `.agent-context` blocks (header, body attribution, footer) help raw HTML crawlers but may be stripped by readability extractors; the visible `post-body-meta` is what humans see.


---

## 5. Page and Interaction Design

### 5.1 Layout Description

- Sidebar: fixed positioning, width 280px, height 100vh, attached to the left edge, **hidden off-screen by default via CSS transform**. Click the floating button in the top-left corner to slide it in (overlays on top of content without squeezing the main area, i.e. "overlay" mode).
- Sidebar top: site title + two tab buttons "Timeline" and "Tags".
- "Timeline" tab: displays all post titles + dates in reverse chronological order (newest first).
- "Tags" tab: displays a list of all tags (with post count per tag). Click a tag to expand the list of posts under that tag (you can jump from the timeline to filter by a specific tag).
- Right content area: fills the full screen width (unaffected by the sidebar since it's an overlay), with a fixed "☰" button at the top to toggle the sidebar.
- Homepage (`docs/index.html`): content area shows the site name + a summary list of the most recent `recentPostsCount` posts (see `templates/index.html`).
- Post page (`docs/posts/<slug>.html`): content area shows the rendered HTML of the post body.

### 5.2 Template Placeholder Rules

All template files use `{{KEY}}` placeholders. The build script performs simple string replacement (**do not introduce template engines like EJS or Handlebars**). The placeholder replacement function is written in `scripts/utils.js`; see Section 7 for the signature.

`templates/layout.html` (site-wide shared shell; the sidebar is static HTML, with data populated at runtime by `main.js` via fetching `posts.json`):

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{{PAGE_TITLE}} - {{SITE_TITLE}}</title>
<link rel="stylesheet" href="{{BASE_URL}}/prism/prism-monokai.min.css">
<link rel="stylesheet" href="{{BASE_URL}}/katex/katex.min.css">
<link rel="stylesheet" href="{{BASE_URL}}/css/style.css">
{{POST_ALTERNATE_MD}}
</head>
<body>
<button id="sidebar-toggle" aria-label="Open menu">☰</button>

<aside id="sidebar">
<div class="sidebar-header">
<a href="{{BASE_URL}}/index.html" class="site-title">{{SITE_TITLE}}</a>
</div>
<div class="sidebar-tabs">
<button class="tab-btn active" data-tab="timeline">Timeline</button>
<button class="tab-btn" data-tab="tags">Tags</button>
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
<script>window.SIDEBAR_POST_COUNT = {{SIDEBAR_POST_COUNT}};</script>
<script src="{{BASE_URL}}/prism/prism.min.js"></script>
<script>
(function () {
  // Mermaid is loaded only when the page contains diagrams, so homepage / plain
  // posts skip the ~3.5MB bundle. Source is cached in data-src because mermaid
  // replaces innerHTML with SVG; theme changes must restore text before re-run.
  var nodes = document.querySelectorAll(".mermaid");
  if (!nodes.length) return;

  var darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
  var script = document.createElement("script");
  script.src = (window.BASE_URL || "") + "/js/mermaid.min.js";
  script.onload = function () {
    function renderDiagrams() {
      mermaid.initialize({
        startOnLoad: false,
        theme: darkQuery.matches ? "dark" : "default",
        securityLevel: "strict"
      });
      document.querySelectorAll(".mermaid").forEach(function (el) {
        if (!el.getAttribute("data-src")) {
          el.setAttribute("data-src", el.textContent);
        }
        el.removeAttribute("data-processed");
        el.textContent = el.getAttribute("data-src");
      });
      mermaid.run();
    }
    renderDiagrams();
    if (darkQuery.addEventListener) {
      darkQuery.addEventListener("change", renderDiagrams);
    }
  };
  document.body.appendChild(script);
})();
</script>
<script src="{{BASE_URL}}/js/main.js"></script>
</body>
</html>
```

- `katex.min.css` is referenced so server-rendered formula HTML picks up KaTeX styles and fonts (fonts resolve via relative paths from `docs/katex/`).
- Mermaid is loaded on demand: the inline initializer bails out when there are no `.mermaid` nodes; otherwise it injects `docs/js/mermaid.min.js`, caches each node's source in `data-src`, and calls `mermaid.run()`. On `prefers-color-scheme` changes it restores `textContent` from `data-src` before re-running (mermaid replaces innerHTML with SVG, so clearing `data-processed` alone is not enough). `startOnLoad: false` because rendering is driven manually.

> Placeholder list: `PAGE_TITLE` (page title), `SITE_TITLE` (site name), `BASE_URL` (deployment root path; all static resource/link references must prepend this prefix), `SIDEBAR_POST_COUNT` (max posts shown in the sidebar timeline, from `blog.config.json`'s `sidebarPostCount`, default 200), `POST_ALTERNATE_MD` (optional `<link rel="alternate" type="text/markdown">` on post pages; empty string on homepage), `CONTENT` (content area fragment: homepage or post page).

`templates/index.html` (homepage content area fragment; will be inserted into the layout's `{{CONTENT}}` during build. `{{RECENT_POSTS_HTML}}` is generated by the build script as a complete HTML block on the server side and then substituted in — **not** rendered asynchronously by frontend JS — so the post list is visible immediately when the homepage opens, without waiting for `posts.json` to be fetched):

```html
<div class="home">
  <h1>{{SITE_TITLE}}</h1>
  <p class="home-desc">{{SITE_DESCRIPTION}}</p>
  <div class="recent-posts">
    {{RECENT_POSTS_HTML}}
  </div>
</div>
```

`templates/post.html` (post page content area fragment):

```html
<article class="post">
<a href="{{BASE_URL}}/index.html" class="back-home">← Back to Home</a>
<h1>{{POST_TITLE}}</h1>
<div class="post-meta">
<span class="post-date">{{POST_DATE_FORMATTED}}</span>
<span class="post-tags">{{POST_TAGS_HTML}}</span>
</div>
<div class="post-body">
{{POST_HEADER_HTML}}
{{POST_BODY_META_HTML}}
{{POST_CONTENT_HTML}}
{{POST_BODY_ATTRIBUTION_HTML}}
{{POST_FOOTER_HTML}}
</div>
</article>
```

`{{POST_TAGS_HTML}}` generation rule: each tag is rendered as `<span class="tag-pill">tag name</span>`, multiple tags are concatenated directly with no separator (`.tag-pill` has its own margin in CSS).

### 5.3 CSS (`assets/css/style.css`, use directly, do not change the overall structure)

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
position: sticky;
top: 0;
background: #fafafa;
z-index: 1;
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

/* ===== Markdown Content Typography ===== */
.post-body {
font-size: 16px;
line-height: 1.75;
color: #333;
}
.post-body h1, .post-body h2, .post-body h3,
.post-body h4, .post-body h5, .post-body h6 {
margin-top: 1.5em;
margin-bottom: 0.5em;
font-weight: 600;
line-height: 1.3;
color: #1a1a1a;
}
.post-body h1 { font-size: 2em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
.post-body h2 { font-size: 1.5em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
.post-body h3 { font-size: 1.25em; }
.post-body h4 { font-size: 1em; }
.post-body h5 { font-size: 0.875em; }
.post-body h6 { font-size: 0.85em; color: #666; }
.post-body p, .post-body ul, .post-body ol {
margin: 0 0 1em;
}
.post-body ul, .post-body ol {
padding-left: 2em;
}
.post-body li {
margin: 0.25em 0;
}
.post-body li > ul, .post-body li > ol {
margin: 0;
}
.post-body a {
color: var(--accent);
text-decoration: none;
}
.post-body a:hover {
text-decoration: underline;
}
.post-body blockquote {
margin: 0 0 1em;
padding: 0.5em 1em;
border-left: 4px solid var(--accent);
background: #f8f9fa;
color: #555;
}
.post-body blockquote > :last-child { margin-bottom: 0; }
.post-body blockquote > :first-child { margin-top: 0; }
.post-body code:not([class*="language-"]) {
background: #f0f2f4;
padding: 2px 6px;
border-radius: 4px;
font-size: 0.9em;
color: #d63384;
}
.post-body pre:not([class*="language-"]) {
background: #f5f5f5;
padding: 16px;
overflow-x: auto;
border-radius: 6px;
margin: 0 0 1em;
line-height: 1.5;
}
.post-body pre:not([class*="language-"]) code {
background: none;
padding: 0;
border-radius: 0;
color: inherit;
font-size: 0.9em;
}
.post-body pre[class*="language-"] {
margin: 0 0 1em;
border-radius: 6px;
}
.post-body table {
width: 100%;
max-width: 100%;
margin: 0 0 1em;
border-collapse: collapse;
font-size: 0.9em;
}
.post-body th, .post-body td {
padding: 8px 12px;
border: 1px solid #dfe2e5;
text-align: left;
}
.post-body th {
font-weight: 600;
background: #f6f8fa;
}
.post-body tr:nth-child(even) {
background: #f8f9fa;
}
.post-body hr {
height: 1px;
margin: 2em 0;
background: #e5e5e5;
border: none;
}
.post-body img {
max-width: 100%;
margin: 1em 0;
border-radius: 4px;
}
.post-body strong { font-weight: 600; }
.post-body input[type="checkbox"] { margin-right: 6px; }

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

.back-home {
display: inline-block;
margin: 0 0 16px;
padding: 6px 12px;
background: #f5f5f5;
color: var(--accent);
text-decoration: none;
border-radius: 6px;
font-size: 13px;
font-weight: 500;
transition: background 0.2s;
}

.back-home:hover {
background: var(--accent);
color: #fff;
}
```

Additional styles for math and diagrams (appended in `assets/css/style.css` after the code-block rules):

```css
/* Mermaid diagrams: centered, horizontally scrollable on narrow screens */
.post-body .mermaid {
  margin: 1.4em 0;
  text-align: center;
  overflow-x: auto;
}
.post-body .mermaid svg {
  max-width: 100%;
  height: auto;
}

/* Math: block formulas scroll instead of overflowing the column; keep the
   custom <eq>/<eqn> wrappers emitted by markdown-it-texmath inline/block */
.post-body eq {
  display: inline-block;
}
.post-body eqn {
  display: block;
}
.post-body .katex-display {
  margin: 1.4em 0;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 0.2em 0;
}
```

### 5.4 JS (`assets/js/main.js`, use directly)

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

// Tab switching
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
console.error("Failed to load posts.json:", err);
});

function renderTimeline(posts) {
var count = window.SIDEBAR_POST_COUNT || 200;
var ul = document.getElementById("post-list-timeline");
ul.innerHTML = "";
posts.slice(0, count).forEach(function (post) {
ul.appendChild(buildPostItem(post));
});
}

function buildPostItem(post) {
var li = document.createElement("li");
var a = document.createElement("a");
a.href = BASE_URL + "/" + post.url;
var dateText = post.formattedDate || post.date || "";
// Title comes from front-matter and is untrusted text: use textContent instead of innerHTML,
// so that even if the title contains HTML like <script>, it will only be displayed as literal text and not executed
a.textContent = post.title;
var dateSpan = document.createElement("span");
dateSpan.className = "post-item-date";
dateSpan.textContent = dateText;
a.appendChild(dateSpan);
li.appendChild(a);
return li;
}

function renderTagCloud(posts) {
var tagMap = {};
posts.forEach(function (post) {
var tags = Array.isArray(post.tags) ? post.tags : [];
tags.forEach(function (tag) {
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
})();
```

---

## 6. `posts.json` Data Structure (generated during build, output to `docs/posts.json`)

```json
[
  {
    "title": "Hello World",
    "date": "2026-07-04T10:00:00.000Z",
    "formattedDate": "2026-07-04",
    "tags": ["essay"],
    "categories": [],
    "slug": "hello-world",
    "url": "posts/hello-world.html",
    "excerpt": "First 100 graphemes of the body..."
  }
]
```

- The array is sorted by `date` in **descending** order (newest first).
- `date` is the ISO string from `toISOString()` after js-yaml parses the front-matter date as UTC; it is only used for sorting. `formattedDate` takes the UTC `YYYY-MM-DD` for page display, which is always equal to the date the author wrote in the front-matter (see Section 4).
- `url` is the path relative to `baseUrl` (without the leading `baseUrl`; the concatenation logic is already handled in the frontend JS: `BASE_URL + "/" + post.url`).
- The `excerpt` field is used for the **homepage recent posts list** summary display (Sections 5.2 / 7.2). Generation method: after rendering the body, strip HTML tags, decode entities (`&amp;` → `&`), normalize whitespace, then take the first 100 graphemes (truncated by user-perceived characters, won't cut a half emoji).

---

## 7. Script Module Design

### 7.1 `scripts/utils.js`

Must export the following functions; do not change function names or parameters:

```javascript
const fs = require("fs-extra");
const path = require("path");
const matter = require("gray-matter");
const MarkdownIt = require("markdown-it");
const texmath = require("markdown-it-texmath");
const katex = require("katex");

const md = new MarkdownIt({
html: true,
linkify: true,
});
// Math support: $...$ inline and $$...$$ block (LaTeX), rendered server-side to KaTeX HTML.
// throwOnError: false → render malformed math as KaTeX's red error output instead of throwing.
md.use(texmath, { engine: katex, delimiters: "dollars", katexOptions: { throwOnError: false } });

// Mermaid support: turn ```mermaid fenced blocks into a <div class="mermaid"> for client-side
// rendering (mermaid.js renders these on page load). Content is HTML-escaped to keep diagram
// syntax intact; all other code fences keep the default Prism path.
const defaultFence = md.renderer.rules.fence;
md.renderer.rules.fence = function (tokens, idx, options, env, self) {
const token = tokens[idx];
if (token.info.trim() === "mermaid") {
return `<div class="mermaid">${md.utils.escapeHtml(token.content)}</div>`;
}
return defaultFence(tokens, idx, options, env, self);
};

// Read blog.config.json and return the config object
function loadConfig() {
const configPath = path.join(process.cwd(), "blog.config.json");
return fs.readJsonSync(configPath);
}

// Copy render-time static assets into the docs output directory.
// overwrite=true → always copy (used by build(), which empties docs/ first).
// overwrite=false → copy only missing targets (used by render(), preserving any
// resources the user has manually tweaked in docs/). After upgrading katex /
// mermaid (or editing assets/), run a full build so docs/ picks up the new files.
// Covers: css/js/prism from assets/, plus KaTeX css+fonts and mermaid.min.js from node_modules.
function copyStaticAssets(docsDir, overwrite) {
const copyIfNeeded = (src, dest) => {
if (overwrite) {
fs.copySync(src, dest);
} else if (!fs.existsSync(dest)) {
fs.copySync(src, dest);
}
};
copyIfNeeded(path.join(process.cwd(), "assets", "css"), path.join(docsDir, "css"));
copyIfNeeded(path.join(process.cwd(), "assets", "js"), path.join(docsDir, "js"));
copyIfNeeded(path.join(process.cwd(), "assets", "prism"), path.join(docsDir, "prism"));
// KaTeX: katex.min.css references fonts via relative paths, so keep the katex/ dir layout intact
copyIfNeeded(path.join(process.cwd(), "node_modules", "katex", "dist", "katex.min.css"), path.join(docsDir, "katex", "katex.min.css"));
copyIfNeeded(path.join(process.cwd(), "node_modules", "katex", "dist", "fonts"), path.join(docsDir, "katex", "fonts"));
// Mermaid: rendered client-side, shipped as a single JS bundle next to main.js
copyIfNeeded(path.join(process.cwd(), "node_modules", "mermaid", "dist", "mermaid.min.js"), path.join(docsDir, "js", "mermaid.min.js"));
}

// Parse a single markdown file, returning:
// { title, date, formattedDate, tags, categories, author, source, slug, content, contentHtml, excerpt, showHeader, showFooter }
// slug is derived from the filename by stripping the .md extension
function parseMarkdownFile(filePath) {
const raw = fs.readFileSync(filePath, "utf-8");
const { data, content } = matter(raw);
const slug = path.basename(filePath, ".md");
const contentHtml = md.render(content);
// Generate excerpt: replace math/diagram markup with placeholders first, then strip HTML tags → decode
// entities (&amp; → &, using markdown-it's built-in unescapeAll to avoid a hand-rolled incomplete entity
// table) → normalize whitespace → truncate to 100 visible graphemes (Intl.Segmenter splits by
// user-perceived characters, won't cut a half emoji / surrogate pair). The placeholders keep
// server-rendered KaTeX markup and Mermaid source from flooding the excerpt with broken text.
// The section regex matches both plain and numbered (`<section class="eqno">`) block formulas.
const excerptSource = contentHtml
.replace(/<section[^>]*>\s*<eqn>[\s\S]*?<\/eqn>[\s\S]*?<\/section>/g, " [math] ")
.replace(/<eq>[\s\S]*?<\/eq>/g, " [math] ")
.replace(/<div class="mermaid">[\s\S]*?<\/div>/g, " [diagram] ");
const plainText = md.utils.unescapeAll(excerptSource.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim());
const excerpt = truncateGraphemes(plainText, 100);
const rawDate = data.date instanceof Date ? data.date : (data.date ? new Date(data.date) : null);
const dateStr = rawDate ? rawDate.toISOString() : "";
// Display date uses UTC YYYY-MM-DD: js-yaml parses timezone-less front-matter dates as UTC (YAML 1.1 spec),
// so the UTC date is always equal to the date the author wrote in the front-matter. If local time
// (getFullYear/getMonth/getDate) were used, posts published late at night in UTC+7/8 etc. timezones
// would show as "the next day", causing timeline date misalignment.
const formattedDate = rawDate ? rawDate.toISOString().slice(0, 10) : "";
return {
title: data.title || slug,
date: dateStr,
formattedDate,
tags: Array.isArray(data.tags) ? data.tags : (typeof data.tags === "string" && data.tags.trim() ? [data.tags] : []),
categories: Array.isArray(data.categories) ? data.categories : (typeof data.categories === "string" && data.categories.trim() ? [data.categories] : []),
author: data.author ? String(data.author) : "",
source: data.source ? String(data.source) : "",
slug,
content,
contentHtml,
excerpt,
showHeader: data.header !== false,
showFooter: data.footer !== false
};
}

function resolvePostIncludeFlags(frontMatter) {
return {
showHeader: frontMatter.header !== false,
showFooter: frontMatter.footer !== false
};
}

function loadPostIncludeFile(relativePath) {
const absPath = path.join(process.cwd(), relativePath);
if (!fs.existsSync(absPath)) {
console.warn(`Post include not found: ${relativePath}`);
return "";
}
const content = fs.readFileSync(absPath, "utf-8");
return content || "";
}

function getDefaultPostAuthor(config) {
return config.postAuthor || config.author || "";
}

function getDefaultPostSource(config) {
if (config.postSource) return String(config.postSource);
const site = getSiteUrl(config);
return site ? site.replace(/\/$/, "") + "/" : "";
}

function getPostAuthor(config, post) {
if (post && post.author) return String(post.author);
return getDefaultPostAuthor(config);
}

function getPostSource(config, post) {
if (post && post.source) return String(post.source);
return getDefaultPostSource(config);
}

function formatPostAttributionFrontMatter(config) {
const author = getDefaultPostAuthor(config);
const source = getDefaultPostSource(config);
return "header: true\n"
+ "footer: true\n"
+ "author: " + JSON.stringify(author) + "\n"
+ "source: " + JSON.stringify(source) + "\n";
}

function buildPostTemplateVars(config, post) {
return {
SITE_TITLE: config.title || "",
SITE_AUTHOR: config.author || "",
SITE_DESCRIPTION: config.description || "",
BASE_URL: config.baseUrl || "",
SITE_URL: getSiteUrl(config),
POST_AUTHOR: getPostAuthor(config, post),
POST_SOURCE: getPostSource(config, post),
POST_TITLE: post.title,
POST_DATE: post.formattedDate,
POST_SLUG: post.slug,
POST_TAGS_HTML: renderTagsHtml(post.tags),
CANONICAL_URL: getPostCanonicalUrl(config, post.slug),
GITHUB_USER: config.githubUser || "",
GITHUB_URL: config.githubUser ? "https://github.com/" + config.githubUser : ""
};
}

function buildPostIncludes(config, post) {
const headerPath = config.postHeader || "source/_includes/post-header.html";
const footerPath = config.postFooter || "source/_includes/post-footer.html";
const bodyMetaPath = config.postBodyMeta || "source/_includes/post-body-meta.html";
const bodyAttributionPath = config.postBodyAttribution || "source/_includes/post-body-attribution.html";
const templateVars = buildPostTemplateVars(config, post);
const headerHtml = post.showHeader ? renderTemplate(loadPostIncludeFile(headerPath), templateVars) : "";
const bodyMetaHtml = post.showFooter ? renderTemplate(loadPostIncludeFile(bodyMetaPath), templateVars) : "";
const footerHtml = post.showFooter ? renderTemplate(loadPostIncludeFile(footerPath), templateVars) : "";
const bodyAttributionHtml = post.showFooter ? renderTemplate(loadPostIncludeFile(bodyAttributionPath), templateVars) : "";
return { headerHtml, bodyMetaHtml, footerHtml, bodyAttributionHtml };
}

function getSiteUrl(config) {
if (config.siteUrl) return String(config.siteUrl).replace(/\/$/, "");
if (config.githubUser) return "https://" + config.githubUser + ".github.io";
return "";
}

function getPostCanonicalUrl(config, slug) {
const site = getSiteUrl(config);
const base = String(config.baseUrl || "").replace(/\/$/, "");
return site + base + "/posts/" + slug + ".html";
}

function getPostMarkdownUrl(config, slug) {
const site = getSiteUrl(config);
const base = String(config.baseUrl || "").replace(/\/$/, "");
return site + base + "/posts/" + slug + ".md";
}

function buildAgentMarkdown(config, post) {
if (config.agentMarkdown === false) return "";
const templatePath = config.agentAttribution || "source/_includes/agent-attribution.md";
const template = loadPostIncludeFile(templatePath);
const tags = Array.isArray(post.tags) ? post.tags.join(", ") : "";
const templateVars = buildPostTemplateVars(config, post);
templateVars.POST_TAGS = tags;
const header = renderTemplate(template, templateVars);
const bodyMeta = "author: " + getPostAuthor(config, post) + "\nsource: " + getPostSource(config, post) + "\n\n";
const footer = "\n---\n\n> © " + getPostAuthor(config, post) + " · " + getSiteUrl(config) + "\n";
return header + "\n" + bodyMeta + (post.content || "").trim() + footer;
}

function writeAgentMarkdownFile(docsDir, post, markdown) {
if (!markdown) return;
const outPath = path.join(docsDir, "posts", post.slug + ".md");
fs.writeFileSync(outPath, markdown, "utf-8");
}

function renderLlmsTxt(config, postsIndex) {
const site = getSiteUrl(config);
const base = String(config.baseUrl || "").replace(/\/$/, "");
const lines = [
"# " + (config.title || "Blog"),
"> " + (config.description || ""),
"",
"## Attribution",
"When citing content from this site, attribute " + (config.author || "the author") + " and link to the post URL.",
"Author GitHub: " + (config.githubUser ? "https://github.com/" + config.githubUser : ""),
"Blog: " + site,
"",
"## Agent-readable Markdown mirrors",
"Each post is also published as Markdown for automated readers:",
"",
"## Posts"
];
postsIndex.forEach((post) => {
const mdUrl = site + base + "/posts/" + post.slug + ".md";
const title = post.title || post.slug;
const excerpt = post.excerpt ? " — " + post.excerpt : "";
lines.push("- [" + title + "](" + mdUrl + ")" + excerpt);
});
lines.push("");
return lines.join("\n");
}

function writeLlmsTxt(docsDir, config, postsIndex) {
if (config.agentMarkdown === false) return;
const txt = renderLlmsTxt(config, postsIndex);
fs.writeFileSync(path.join(docsDir, "llms.txt"), txt, "utf-8");
}

function renderPostAlternateLink(config, slug) {
if (config.agentMarkdown === false) return "";
const mdUrl = getPostMarkdownUrl(config, slug);
return '<link rel="alternate" type="text/markdown" href="' + mdUrl + '">';
}

// Simple placeholder substitution: template is a template string, vars is a { KEY: value } object
// Replaces all {{KEY}} in the template with value
// Note: before substitution, each value's "{{" is guarded with a sentinel to prevent literal {{KEY}}
// occurrences within values (e.g. when the body text mentions template engines and writes {{PAGE_TITLE}})
// from being accidentally matched by subsequent global placeholder replacements;
// after all replacements are done, the sentinel is restored to "{{".
const TEMPLATE_BRACE_SENTINEL = "\u0000SWP_OPEN_BRACE\u0000";
function renderTemplate(template, vars) {
let result = template;
const escaped = {};
for (const key in vars) {
escaped[key] = String(vars[key]).split("{{").join(TEMPLATE_BRACE_SENTINEL);
}
for (const key in escaped) {
const re = new RegExp("{{" + key + "}}", "g");
result = result.replace(re, escaped[key]);
}
return result.split(TEMPLATE_BRACE_SENTINEL).join("{{");
}

// Truncate a string to n "user-perceived characters" (graphemes),
// avoiding String.prototype.slice cutting a half emoji / surrogate pair by UTF-16 code unit
function truncateGraphemes(str, n) {
const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
let out = "";
let count = 0;
for (const { segment } of seg.segment(str)) {
if (count >= n) break;
out += segment;
count++;
}
return out;
}

// Return an array of absolute paths for all .md files under source/_posts
function listPostFiles() {
const dir = path.join(process.cwd(), "source", "_posts");
fs.ensureDirSync(dir);
return fs.readdirSync(dir)
.filter((f) => f.endsWith(".md"))
.map((f) => path.join(dir, f));
}

// Render a tags array as HTML: concatenate <span class="tag-pill">xxx</span>
// Tags come from front-matter and are untrusted text; escape before concatenating into HTML
function renderTagsHtml(tags) {
const list = Array.isArray(tags) ? tags : [];
return list.map((t) => `<span class="tag-pill">${md.utils.escapeHtml(t)}</span>`).join("");
}

// Sort an array of posts by the date field in descending order (newest first).
// Returns a new array; does not mutate the original.
// Posts without a date field are placed at the end ("unknown when written" treated as oldest),
// to avoid empty strings sorting to the front.
function sortPostsByDateDesc(posts) {
return posts.slice().sort((a, b) => {
const da = a.date || "";
const db = b.date || "";
if (!da && !db) return (b.title || "").localeCompare(a.title || "");
if (!da) return 1;
if (!db) return -1;
const dateCmp = db.localeCompare(da);
if (dateCmp !== 0) return dateCmp;
return (b.title || "").localeCompare(a.title || "");
});
}

// Generate the HTML for the homepage "recent posts" list.
// posts: array of posts.json entries already sorted by date descending
// count: number of items to show (from blog.config.json's recentPostsCount, default 10)
// config: blog.config.json content, used to concatenate baseUrl
function renderRecentPostsHtml(posts, count, config) {
const list = posts.slice(0, count);
if (list.length === 0) {
return '<p class="post-excerpt">No posts published yet.</p>';
}
return list.map((post) => {
// title / excerpt come from post front-matter and body; they are untrusted text, escape before concatenating into HTML
const escTitle = md.utils.escapeHtml(post.title);
const escExcerpt = md.utils.escapeHtml(post.excerpt);
return `<article class="recent-post-item">
<h2><a href="${config.baseUrl}/${post.url}">${escTitle}</a></h2>
<div class="post-meta">
<span class="post-date">${post.formattedDate}</span>
<span class="post-tags">${renderTagsHtml(post.tags)}</span>
</div>
<p class="post-excerpt">${escExcerpt}...</p>
</article>`
}).join("\n");
}

// Read/write docs/posts.json
function loadPostsIndex() {
const p = path.join(process.cwd(), "docs", "posts.json");
if (!fs.existsSync(p)) return [];
return fs.readJsonSync(p);
}

// Sort and write to docs/posts.json, returning the sorted array for the caller to reuse directly
// (the caller typically needs this sorted array next to generate the homepage recent posts list, avoiding a second sort)
function savePostsIndex(posts) {
const sorted = sortPostsByDateDesc(posts);
const p = path.join(process.cwd(), "docs", "posts.json");
fs.writeJsonSync(p, sorted, { spaces: 2 });
return sorted;
}

module.exports = {
loadConfig, copyStaticAssets, parseMarkdownFile, renderTemplate, listPostFiles,
renderTagsHtml, sortPostsByDateDesc, renderRecentPostsHtml,
loadPostsIndex, savePostsIndex,
resolvePostIncludeFlags, loadPostIncludeFile, buildPostIncludes,
getDefaultPostAuthor, getDefaultPostSource, getPostAuthor, getPostSource, formatPostAttributionFrontMatter, buildPostTemplateVars, getSiteUrl, getPostCanonicalUrl, getPostMarkdownUrl,
buildAgentMarkdown, writeAgentMarkdownFile, renderLlmsTxt, writeLlmsTxt, renderPostAlternateLink
};
```

### 7.2 `scripts/build.js` (Full Build)

**Algorithm steps (must execute in this order):**

```javascript
const fs = require("fs-extra");
const path = require("path");
const {
loadConfig, parseMarkdownFile, renderTemplate, copyStaticAssets,
listPostFiles, renderTagsHtml, renderRecentPostsHtml, savePostsIndex, buildPostIncludes,
buildAgentMarkdown, writeAgentMarkdownFile, writeLlmsTxt, renderPostAlternateLink
} = require("./utils");

// Generate the homepage docs/index.html.
// postsIndexSorted must be an array of posts.json entries already sorted by date descending
// (savePostsIndex's return value is already sorted; pass it directly, do not sort again).
// render.js also calls this function during incremental rendering, so that new posts
// that fall within the recent N are immediately reflected on the homepage.
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
  PAGE_TITLE: "Home",
  SITE_TITLE: config.title,
  BASE_URL: config.baseUrl,
  SIDEBAR_POST_COUNT: config.sidebarPostCount || 200,
  POST_ALTERNATE_MD: "",
  CONTENT: homeContent
});
fs.writeFileSync(path.join(docsDir, "index.html"), homeHtml, "utf-8");
}

function build() {
const config = loadConfig();
const docsDir = path.join(process.cwd(), "docs");

// 1. Clear and recreate the docs directory structure
fs.emptyDirSync(docsDir);
fs.ensureDirSync(path.join(docsDir, "posts"));

  // 2. Copy static assets (css/js/prism from assets/, katex + mermaid from node_modules)
  copyStaticAssets(docsDir, true);

// 3. Read post templates (layout and homepage templates are read later in the homepage generation step, handled internally by renderHomepage)
const layoutTpl = fs.readFileSync(path.join(process.cwd(), "templates", "layout.html"), "utf-8");
const postTpl = fs.readFileSync(path.join(process.cwd(), "templates", "post.html"), "utf-8");

// 4. Parse all markdown posts
const files = listPostFiles();
const posts = files.map(parseMarkdownFile);

// 5. Generate an HTML page for each post
posts.forEach((post) => {
const { headerHtml, bodyMetaHtml, footerHtml, bodyAttributionHtml } = buildPostIncludes(config, post);
const postHtml = renderTemplate(postTpl, {
POST_TITLE: post.title,
POST_DATE_FORMATTED: post.formattedDate,
POST_TAGS_HTML: renderTagsHtml(post.tags),
POST_HEADER_HTML: headerHtml,
POST_BODY_META_HTML: bodyMetaHtml,
POST_CONTENT_HTML: post.contentHtml,
POST_BODY_ATTRIBUTION_HTML: bodyAttributionHtml,
POST_FOOTER_HTML: footerHtml,
BASE_URL: config.baseUrl
});
const agentMd = buildAgentMarkdown(config, post);
const fullHtml = renderTemplate(layoutTpl, {
  PAGE_TITLE: post.title,
  SITE_TITLE: config.title,
  BASE_URL: config.baseUrl,
  SIDEBAR_POST_COUNT: config.sidebarPostCount || 200,
  POST_ALTERNATE_MD: renderPostAlternateLink(config, post.slug),
  CONTENT: postHtml
});
fs.writeFileSync(path.join(docsDir, "posts", post.slug + ".html"), fullHtml, "utf-8");
writeAgentMarkdownFile(docsDir, post, agentMd);
});

// 6. Generate posts.json index (note the url field format: posts/<slug>.html)
// savePostsIndex automatically sorts by date descending, writes to docs/posts.json, and returns the sorted array
const postsIndex = posts.map((post) => ({
title: post.title,
date: post.date,
formattedDate: post.formattedDate,
tags: post.tags,
categories: post.categories,
slug: post.slug,
url: "posts/" + post.slug + ".html",
excerpt: post.excerpt
}));
const sortedIndex = savePostsIndex(postsIndex);

// 7. Use the sorted index to generate the homepage (homepage content area shows the most recent N posts, N from blog.config.json's recentPostsCount)
renderHomepage(config, sortedIndex);

// 8. Agent-readable Markdown mirrors + llms.txt (static GitHub Pages; no UA routing)
writeLlmsTxt(docsDir, config, sortedIndex);

console.log(`Build complete, ${posts.length} posts, output to docs/`);
}

module.exports = { build, renderHomepage };
```

### 7.3 `scripts/render.js` (Single-Post Incremental Render — corresponding to the "CLI md directly rendered to html and then loaded" requirement)

**This is a core new requirement; the logic must be as follows and must not be merged into build.js:**

```javascript
const fs = require("fs-extra");
const path = require("path");
const {
loadConfig, parseMarkdownFile, renderTemplate, copyStaticAssets,
renderTagsHtml, loadPostsIndex, savePostsIndex, buildPostIncludes,
buildAgentMarkdown, writeAgentMarkdownFile, writeLlmsTxt, renderPostAlternateLink
} = require("./utils");
const { renderHomepage } = require("./build");

function renderOne(mdFilePath) {
const config = loadConfig();
const docsDir = path.join(process.cwd(), "docs");

// 1. If the docs directory doesn't yet have the basic structure, do minimal initialization first (posts dir)
fs.ensureDirSync(path.join(docsDir, "posts"));
// Copy static assets (css/js/prism from assets/, katex + mermaid from node_modules);
// only copy missing files, to avoid overwriting resources the user may have manually updated
copyStaticAssets(docsDir, false);

// 2. Parse this single markdown file
const absPath = path.isAbsolute(mdFilePath) ? mdFilePath : path.join(process.cwd(), mdFilePath);
const post = parseMarkdownFile(absPath);

// 3. Render this post's HTML and write to docs/posts/<slug>.html
const postTpl = fs.readFileSync(path.join(process.cwd(), "templates", "post.html"), "utf-8");
const layoutTpl = fs.readFileSync(path.join(process.cwd(), "templates", "layout.html"), "utf-8");

const { headerHtml, bodyMetaHtml, footerHtml, bodyAttributionHtml } = buildPostIncludes(config, post);
const postHtml = renderTemplate(postTpl, {
POST_TITLE: post.title,
POST_DATE_FORMATTED: post.formattedDate,
POST_TAGS_HTML: renderTagsHtml(post.tags),
POST_HEADER_HTML: headerHtml,
POST_BODY_META_HTML: bodyMetaHtml,
POST_CONTENT_HTML: post.contentHtml,
POST_BODY_ATTRIBUTION_HTML: bodyAttributionHtml,
POST_FOOTER_HTML: footerHtml,
BASE_URL: config.baseUrl
});
const agentMd = buildAgentMarkdown(config, post);
const fullHtml = renderTemplate(layoutTpl, {
  PAGE_TITLE: post.title,
  SITE_TITLE: config.title,
  BASE_URL: config.baseUrl,
  SIDEBAR_POST_COUNT: config.sidebarPostCount || 200,
  POST_ALTERNATE_MD: renderPostAlternateLink(config, post.slug),
  CONTENT: postHtml
});
const outputPath = path.join(docsDir, "posts", post.slug + ".html");
fs.writeFileSync(outputPath, fullHtml, "utf-8");
writeAgentMarkdownFile(docsDir, post, agentMd);

// 4. Update docs/posts.json: if this slug already exists, replace it; otherwise add it, then re-sort by date and save
const index = loadPostsIndex();
const entry = {
title: post.title,
date: post.date,
formattedDate: post.formattedDate,
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

// 5. Regenerate the homepage — this step must not be skipped. This post might just happen to fall
// within the "recent N" list; if the homepage is not regenerated, the new post will be accessible
// from the sidebar but won't appear in the homepage content area.
renderHomepage(config, sortedIndex);
writeLlmsTxt(docsDir, config, sortedIndex);

console.log(`Rendered: ${outputPath}`);
console.log(`Index updated: docs/posts.json`);
console.log(`Homepage refreshed: docs/index.html`);
}

module.exports = { renderOne };
```

### 7.4 `scripts/new-post.js` (New Post Scaffold)

```javascript
const fs = require("fs-extra");
const path = require("path");
const { loadConfig, formatPostAttributionFrontMatter } = require("./utils");

function newPost(slug, titleOption) {
if (!slug || !/^[a-z0-9\-]+$/.test(slug)) {
console.error("slug must consist of lowercase letters, digits, and hyphens, e.g.: my-first-post");
process.exit(1);
}
const dir = path.join(process.cwd(), "source", "_posts");
fs.ensureDirSync(dir);
const today = new Date();
const pad = (n) => String(n).padStart(2, "0");
const dateStr = today.getFullYear() + "-" + pad(today.getMonth() + 1) + "-" + pad(today.getDate()) + " " + pad(today.getHours()) + ":" + pad(today.getMinutes()) + ":" + pad(today.getSeconds());
const filename = today.getFullYear() + "-" + pad(today.getMonth() + 1) + "-" + pad(today.getDate()) + "-" + slug + ".md";
const filePath = path.join(dir, filename);

if (fs.existsSync(filePath)) {
console.error("File already exists: " + filePath);
process.exit(1);
}

const title = titleOption || slug;
const config = loadConfig();
const attributionFields = formatPostAttributionFrontMatter(config);
const content = `---
title: ${title}
date: ${dateStr}
tags: []
${attributionFields}---

Write your content here.
`;
fs.writeFileSync(filePath, content, "utf-8");
console.log("Created: " + filePath);
}

module.exports = { newPost };
```

### 7.5 `scripts/serve.js` (Local Static Preview, no live-reload needed)

```javascript
const http = require("http");
const fs = require("fs");
const path = require("path");

const MIME = {
".html": "text/html; charset=utf-8",
".css": "text/css; charset=utf-8",
".js": "application/javascript; charset=utf-8",
".json": "application/json; charset=utf-8",
".png": "image/png",
".jpg": "image/jpeg",
".svg": "image/svg+xml"
};

function serve(port) {
const root = path.resolve(process.cwd(), "docs");
const server = http.createServer((req, res) => {
let urlPath;
try {
urlPath = decodeURIComponent(req.url.split("?")[0]);
} catch {
res.writeHead(400);
res.end("Bad Request");
return;
}
if (urlPath === "/") urlPath = "/index.html";
const filePath = path.resolve(root, urlPath.slice(1));
if (!filePath.startsWith(root + path.sep) && filePath !== root) {
res.writeHead(403);
res.end("Forbidden");
return;
}
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
console.log(`Local preview: http://localhost:${port}`);
});
}

module.exports = { serve };
```

### 7.6 `scripts/deploy.js` (Build + git commit + push, trigger GitHub Pages update)

**One command to complete "build → push to separate Pages repo". The source repo (`swan-post`) and Pages repo (`<user>.github.io`) are separate.**

```javascript
const { execFileSync } = require("child_process");
const path = require("path");
const fs = require("fs-extra");
const { build } = require("./build");
const { loadConfig, formatPostAttributionFrontMatter } = require("./utils");

function deploy(message, force) {
const config = loadConfig();
const repoUrl = config.deployTarget;
if (!repoUrl) {
console.error("Please set deployTarget in blog.config.json (your GitHub Pages repo URL)");
process.exit(1);
}

const docsDir = path.join(process.cwd(), "docs");
const deployDir = path.join(process.cwd(), ".deploy");
// Use execFileSync + argument array instead of execSync + string concatenation: arguments are passed
// directly to the child process without going through a shell, preventing characters like quotes,
// $(), ; in repoUrl / commitMsg from being interpreted as shell commands (command injection prevention).
// Therefore commitMsg no longer needs manual double-quote-to-single-quote escaping; whatever the user writes is what gets committed.
const commitMsg = message || ("deploy: " + new Date().toISOString());

try {
// Step 1: Build
console.log("== Step 1: Rebuilding site ==");
build();

// Step 2: Clone/pull the target Pages repo
console.log("== Step 2: Syncing GitHub Pages repo ==");
if (!fs.existsSync(path.join(deployDir, ".git"))) {
// First deploy: .deploy may have leftover partial clone from a previous interrupted run
// (non-empty but without .git). git clone refuses to clone into a non-empty directory,
// so clear it first before cloning; emptyDirSync creates the directory if it doesn't exist
fs.emptyDirSync(deployDir);
execFileSync("git", ["clone", "--depth", "1", repoUrl, deployDir], { stdio: "inherit" });
} else {
execFileSync("git", ["-C", deployDir, "pull", "--ff-only"], { stdio: "inherit" });
}

// Step 3: Replace Pages repo content with build artifacts
console.log("== Step 3: Updating static files ==");
fs.readdirSync(deployDir).forEach(function (f) {
if (f !== ".git") fs.removeSync(path.join(deployDir, f));
});
fs.copySync(docsDir, deployDir);

// Step 4: Commit and force push to Pages repo
// Using force push is safe because the Pages repo content is entirely generated by the build; no need to preserve history
console.log("== Step 4: Pushing to GitHub Pages ==");
var status = execFileSync("git", ["-C", deployDir, "status", "--porcelain"], { encoding: "utf-8" }).trim();
if (status) {
execFileSync("git", ["-C", deployDir, "add", "-A"], { stdio: "inherit" });
execFileSync("git", ["-C", deployDir, "commit", "-m", commitMsg], { stdio: "inherit" });
}
if (status || force) {
execFileSync("git", ["-C", deployDir, "push", "--force"], { stdio: "inherit" });
console.log(status ? "Pushed to GitHub Pages." : "No file changes; force-pushed to GitHub Pages.");
} else {
console.log("No file changes, skipping push.");
}

console.log("Deploy complete. GitHub Pages typically takes 1–2 minutes to take effect.");
} catch (err) {
console.error("Deploy failed:", err.message);
process.exit(1);
}
}

module.exports = { deploy };
```

Behavior notes:
- `deploy` always runs a full `build()` to generate `docs/` first, ensuring content is up to date.
- The Pages repo URL is specified via the `deployTarget` field in `blog.config.json`, independent of the source repo's `origin` remote.
- Uses `git clone --depth 1` for a shallow clone into `.deploy/` on first run; subsequent runs use `git pull --ff-only` for incremental updates.
- Before the first clone, `fs.emptyDirSync` clears `.deploy/` (creates the directory if it doesn't exist), preventing leftover partial clones from a previous interrupted run from causing `git clone` to fail.
- Replaces all content in `.deploy/` with `docs/` build artifacts (only the `.git` directory is preserved).
- Uses `git push --force` to push to the Pages repo. Since these are purely machine-generated static files with no multi-contributor conflict concerns, force push is safe.
- All git calls use `execFileSync` + argument arrays, bypassing the shell; special characters like quotes, `$()`, `;` in `repoUrl` / `commitMsg` are treated as literals and not executed as commands (command injection prevention). Therefore the commit message supports being passed via `-m`; if not provided, it defaults to `deploy: <ISO timestamp>`, and no quote escaping is needed.
- `docs/` is already in `.gitignore` and will not be committed to the source repo.
- `.deploy/` is already in `.gitignore`; the temporary clone will not appear in the source repo.
- `--force` (`-f`): When build output matches `.deploy/` (no new commit), still run `git push --force` — useful when local `.deploy` has unpushed commits or the remote has diverged.
- All git command failures are caught, printing a readable error message before `process.exit(1)`.

### 7.7 `scripts/cli.js` (CLI Entry Point, using commander)

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
.description("Personal static blog generator");

program
.command("build")
.description("Full build of the entire site into the docs/ directory")
.action(() => {
build();
});

program
.command("render <file>")
.description("Render a single markdown file to HTML and update the index, without rebuilding the entire site")
.action((file) => {
renderOne(file);
});

program
.command("new <slug>")
.description("Create a new post; slug should be in lowercase-hyphen format, e.g. my-first-post")
.option("-t, --title <title>", "Post title (can be in Chinese)")
.action((slug, options) => {
newPost(slug, options.title);
});

program
.command("serve")
.description("Local preview of the docs/ directory")
.option("-p, --port <port>", "Port number", "8080")
.action((options) => {
serve(parseInt(options.port, 10));
});

program
.command("deploy")
.description("Rebuild the site, then auto git add/commit/push to trigger GitHub Pages update")
.option("-m, --message <message>", "Custom commit message")
.option("-f, --force", "Force push from .deploy even when build output is unchanged")
.action((options) => {
deploy(options.message, options.force);
});

program.parse(process.argv);
```

---

### 7.8 `scripts/gist-sync.js` (Sync GitHub Public Gists as Posts)

**Sync a GitHub user's public gists as blog posts and merge them into existing posts.** No new third-party dependencies (Node 18+ has built-in `fetch`).

- Filtering rules: only sync gists containing `.md` files; for multi-file gists, take the first `.md` file; gists without Markdown files (code snippets, etc.) are skipped.
- Generated post front-matter: `title` from gist `description` (with `_by_agent_zero` signature suffix stripped; falls back to filename if empty), `date` from `created_at` (UTC glyph `YYYY-MM-DD HH:mm:ss`, consistent with js-yaml's parsing of timezone-less dates), `tags` fixed as `["gist", "summary"]` (automatic keyword extraction is infeasible: Chinese requires word segmentation, and dependencies are limited to 4 packages), `header`/`footer`/`author`/`source` from `formatPostAttributionFrontMatter(config)`, and `gist_id` records the source id (deletion sync depends on this field).
- Filename: `<date>-<gist_id>.md` (e.g. `2026-08-02-3474dbaa807b54028c3411f18827c7da.md`); gist ids are unique, stable, and conform to `[a-z0-9-]` rules.
- Deletion sync: local posts with a `gist_id` marker but whose remote gist no longer exists will be deleted.
- Automatically runs `build()` after completion to refresh the entire site.
- Username: `--user` flag takes priority, otherwise reads `blog.config.json`'s `githubUser`; optional `GITHUB_TOKEN` environment variable to increase API rate limit (anonymous: 60 req/hour).
- Gist body is fetched via `raw_url` (gist.githubusercontent.com), which does not count against the GitHub API quota.

```javascript
// scripts/gist-sync.js
// Sync a GitHub user's public gists as blog posts:
// Fetch gists → pick the first Markdown file → generate front-matter → write to source/_posts/<date>-<gist_id>.md
// → delete local posts whose remote gist no longer exists (gist_id marker) → full build to refresh the site.
// No new dependencies: Node 18+ has built-in fetch. Gist body fetched via raw_url (gist.githubusercontent.com, not counted against API quota).
const fs = require("fs-extra");
const path = require("path");
const matter = require("gray-matter");
const { build } = require("./build");
const { loadConfig, formatPostAttributionFrontMatter } = require("./utils");

// Field in front-matter marking the post's gist source (deletion sync depends on it)
const GIST_ID_FIELD = "gist_id";
// Agent signature suffix in the title (user gist descriptions look like "..._by_agent_zero")
const AGENT_SUFFIX_RE = /_by_agent_zero\s*$/;

// Fetch all public gists of a GitHub user (paginated), returns the raw array
async function fetchPublicGists(user, token) {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "swan-post-gist-sync"
  };
  if (token) headers.Authorization = "token " + token;
  const all = [];
  for (let page = 1; ; page++) {
    const url = "https://api.github.com/users/" + encodeURIComponent(user) + "/gists?per_page=100&page=" + page;
    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error("GitHub API request failed: HTTP " + res.status + " " + (await res.text()).slice(0, 200));
    }
    const batch = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    all.push(...batch);
    if (batch.length < 100) break;
  }
  return all;
}

// Pick one Markdown file from a gist's multiple files (the first one with a .md extension)
function pickMarkdownFile(gist) {
  const files = Object.values(gist.files || {});
  return files.find((f) => f.filename && f.filename.toLowerCase().endsWith(".md")) || null;
}

// Derive the post title: strip the agent signature suffix from description; fall back to filename if empty
function gistTitle(gist, filename) {
  const desc = (gist.description || "").replace(AGENT_SUFFIX_RE, "").trim();
  if (desc) return desc;
  return filename.replace(/\.md$/i, "");
}

// created_at (UTC ISO string) → "YYYY-MM-DD HH:mm:ss" (UTC glyph, consistent with js-yaml's parsing of timezone-less dates)
function toLocalDateStr(iso) {
  return (iso || "").slice(0, 19).replace("T", " ");
}

// Generate post content with front-matter; title uses JSON-style double-quoted strings, safe for any special characters.
// tags are fixed as ["gist", "summary"]: gist-synced commentary/summary content, uniformly English tags.
// Automatic keyword extraction is infeasible (Chinese requires word segmentation, and project dependencies are limited to 4 packages by design.md), so tags are fixed.
function buildPostContent(gist, filename, content, config) {
  const attributionFields = formatPostAttributionFrontMatter(config || {});
  return "---\n"
    + "title: " + JSON.stringify(gistTitle(gist, filename)) + "\n"
    + "date: " + toLocalDateStr(gist.created_at) + "\n"
    + "tags: [\"gist\", \"summary\"]\n"
    + attributionFields
    + GIST_ID_FIELD + ": " + gist.id + "\n"
    + "---\n\n"
    + content.replace(/^\s+/, "");
}

// Sync core. baseDir is injectable (CLI uses cwd by default; tests pass a temp directory).
// Returns stats { total, added, updated, removed, skipped }
async function syncGistsCore({ user, token, baseDir, config, onProgress }) {
  const postsDir = path.join(baseDir, "source", "_posts");
  fs.ensureDirSync(postsDir);
  const blogConfig = config || loadConfig();

  const gists = await fetchPublicGists(user, token);
  const remoteIds = new Set();
  let added = 0, updated = 0, skipped = 0;

  for (const gist of gists) {
    const file = pickMarkdownFile(gist);
    if (!file) { skipped++; continue; }
    remoteIds.add(gist.id);

    const res = await fetch(file.raw_url);
    if (!res.ok) {
      throw new Error("Failed to fetch gist content: HTTP " + res.status + " " + file.raw_url);
    }
    const content = await res.text();

    const datePrefix = toLocalDateStr(gist.created_at).slice(0, 10);
    const target = path.join(postsDir, datePrefix + "-" + gist.id + ".md");
    const existed = fs.existsSync(target);
    fs.writeFileSync(target, buildPostContent(gist, file.filename, content, blogConfig), "utf-8");
    if (existed) { updated++; } else { added++; }
    if (onProgress) onProgress((existed ? "Updated" : "Added") + ": " + file.filename);
  }

  // Deletion: local posts with a gist_id marker whose remote gist no longer exists
  // (gist id doesn't change on edit/rename; it can only disappear entirely)
  let removed = 0;
  fs.readdirSync(postsDir).filter((f) => f.endsWith(".md")).forEach((f) => {
    const p = path.join(postsDir, f);
    let data = null;
    try { data = matter(fs.readFileSync(p, "utf-8")).data; } catch { return; }
    if (data && data[GIST_ID_FIELD] && !remoteIds.has(String(data[GIST_ID_FIELD]))) {
      fs.removeSync(p);
      removed++;
      if (onProgress) onProgress("Deleted (gist no longer exists): " + f);
    }
  });

  return { total: gists.length, added, updated, removed, skipped };
}

// CLI entry: --user takes priority, otherwise reads blog.config.json's githubUser;
// the GITHUB_TOKEN environment variable can be used to increase API rate limit (anonymous: 60 req/hour)
async function syncGists(userOption) {
  const config = loadConfig();
  const user = userOption || config.githubUser;
  if (!user) {
    console.error("Please specify a GitHub username: CLI --user <name>, or configure githubUser in blog.config.json");
    process.exit(1);
  }
  const token = process.env.GITHUB_TOKEN || "";
  try {
    const stats = await syncGistsCore({
      user,
      token,
      baseDir: process.cwd(),
      onProgress: (line) => console.log("  " + line)
    });
    console.log("Sync complete: fetched " + stats.total + " gists, "
      + "added " + stats.added + ", updated " + stats.updated + ", deleted " + stats.removed + ", "
      + "skipped " + stats.skipped + " (no Markdown file)");
    console.log("== Rebuilding site ==");
    build();
  } catch (err) {
    console.error("Gist sync failed:", err.message);
    process.exit(1);
  }
}

module.exports = {
  syncGists, syncGistsCore,
  fetchPublicGists, pickMarkdownFile, gistTitle, toLocalDateStr, buildPostContent
};
```

---

## 8. Example Post (include when creating the repo)

`source/_posts/2026-07-04-hello-world.md`:

```markdown
---
title: Hello World
date: 2026-07-04 10:00:00
tags: [essay]
header: true
footer: true
author: Ivar.Chen
source: https://username.github.io/
---

This is my first post. Welcome to my blog.
```

---

## 9. CLI Usage Instructions (write into README.md)

```bash
# Install dependencies
npm install

# (Optional) Register swp-cli as a global command, so you can type swp-cli directly instead of node scripts/cli.js
npm link

# Create a new post
swp-cli new my-first-post --title "My First Post"
# Without npm link, the equivalent is: node scripts/cli.js new my-first-post --title "My First Post"
# This generates 2026-07-04-my-first-post.md under source/_posts/; open it to edit the body

# Render only this one post and add it to the site (no full build needed)
swp-cli render source/_posts/2026-07-04-my-first-post.md

# Full rebuild of the entire site (e.g. after changing templates/CSS)
swp-cli build

# Local preview
swp-cli serve
# Open your browser and visit http://localhost:8080

# Sync a GitHub user's public gists as posts and merge them into the site
# (configure githubUser in blog.config.json; optionally set the GITHUB_TOKEN env var to increase API rate limit)
swp-cli gist-sync
# Or temporarily specify a username:
swp-cli gist-sync --user iintothewind

# One-command deploy: rebuild the site and push to the separate GitHub Pages repo (URL in blog.config.json's deployTarget)
swp-cli deploy
# You can also customize the commit message:
swp-cli deploy -m "Wrote a new post"
swp-cli deploy --force   # push even when docs/ output is unchanged
# Prerequisite for first use: the Pages repo must already exist on GitHub, and blog.config.json must have deployTarget configured (SSH URL)

# After deploying: in the Pages repo's (<user>.github.io) Settings → Pages, set Source to the main branch root (only needs to be done once)
```

---

## 10. Implementation Checklist (agent, please complete in order, self-check after each step)

1. Create the complete directory structure and empty files from Section 2 (including `source/_includes/post-header.html`, `post-body-meta.html`, `post-body-attribution.html`, `post-footer.html`, and `agent-attribution.md` per Sections 4.1–4.2).
2. Write `.gitignore` (Section 2.1 content, use as-is).
3. Write `package.json` (Section 1 content), run `npm install`.
4. Write `blog.config.json` (Section 3 content).
5. Write `templates/layout.html`, `templates/post.html`, `templates/index.html` (Section 5.2 content, use as-is).
6. Write `assets/css/style.css` (Section 5.3 content, use as-is).
7. Write `assets/js/main.js` (Section 5.4 content, use as-is).
8. Write `scripts/utils.js` (Section 7.1 content, use as-is).
9. Write `scripts/build.js` (Section 7.2 content, use as-is).
10. Write `scripts/render.js` (Section 7.3 content, use as-is).
11. Write `scripts/new-post.js` (Section 7.4 content, use as-is).
12. Write `scripts/serve.js` (Section 7.5 content, use as-is).
13. Write `scripts/deploy.js` (Section 7.6 content, use as-is).
14. Write `scripts/cli.js` (Section 7.7 content, use as-is), grant execute permission (`chmod +x scripts/cli.js`, optional).
15. Write the example post `source/_posts/2026-07-04-hello-world.md` (Section 8 content).
16. Write `README.md` (Section 9 content).
17. Run `node scripts/cli.js build`, verify that `docs/` contains `index.html`, `posts/2026-07-04-hello-world.html`, `posts.json`, `css/style.css`, `js/main.js`.
18. Run `node scripts/cli.js serve`, open in browser and verify:
    - The homepage content area (without opening the sidebar) directly shows the "recent posts" list. Currently there is only one Hello World post; you should see its title, date, tag, and excerpt. Clicking the title navigates to the post page.
    - Clicking the ☰ button in the top-left corner slides the sidebar out from the left.
    - The sidebar "Timeline" tab shows the Hello World post; clicking it navigates to the post page.
    - The sidebar "Tags" tab shows "essay (1)"; clicking it displays the corresponding post in the list below.
    - Clicking the overlay mask area outside the sidebar dismisses the sidebar.
19. Test incremental rendering: run `node scripts/cli.js new second-post --title "Second Post"`, verify the generated md front-matter includes `header`, `footer`, `author`, and `source` (from `formatPostAttributionFrontMatter`), edit the body, then run `node scripts/cli.js render source/_posts/<generated filename>.md`, verify:
    - `docs/posts/<slug>.html` is created.
    - `docs/posts.json` has a new entry for this post, and the overall order is still by date descending.
    - **Without re-running the `build` command**, refreshing the homepage (`docs/index.html`) shows this new post at the top of the recent posts list (because its date is the newest), and refreshing the sidebar also shows it.
20. Test the `recentPostsCount` config: change `recentPostsCount` in `blog.config.json` to `1`, re-run `node scripts/cli.js build`, verify the homepage content area shows only 1 most recent post, not all. After testing, remember to change it back to `10` (or the desired number) and `build` again.
21. Test the deploy command (requires the Pages repo to already exist on GitHub and `deployTarget` in `blog.config.json` to be configured):
    - First, run `node scripts/cli.js deploy` with no changes, verify it outputs "No file changes, skipping push." without errors.
    - After modifying a post or creating a new one, run `node scripts/cli.js deploy -m "test deploy"`, verify it prints build, git clone/pull, git add, git commit, git push logs in sequence, and that `.deploy/`'s git log contains a commit with message "test deploy".
    - Deliberately set `deployTarget` to a non-existent repo URL and run once, verify the command catches the error and prints a readable message instead of throwing an unhandled exception that crashes the process without any output.
22. After all verifications pass, enable GitHub Pages in the Pages repo's (`<user>.github.io`) Settings (Source: `main` branch root; only needs to be done once; every subsequent `deploy` will auto-update).
23. Test gist-sync: after configuring `githubUser` in `blog.config.json`, run `node scripts/cli.js gist-sync`, verify that posts with `gist_id` front-matter are generated under `source/_posts/` and `docs/` is rebuilt; run again and verify it outputs "Updated N posts" instead of adding duplicates; delete a gist on GitHub and run again, verify the corresponding local post is deleted.
24. Test post header/footer: run `node scripts/cli.js build`, verify post HTML contains `.post-footer` inside `.agent-context` (hidden, not visible to humans) and homepage has no footer fragment; add `header: false` / `footer: false` to one post and rebuild — that post omits fragments while others keep them; confirm `posts.json` excerpts exclude footer text; run incremental `render` on a post and confirm same behavior; temporarily rename `post-header.html` and rebuild — expect a console warning, successful build, empty header.
25. Test agent Markdown: run `node scripts/cli.js build`, verify each post has `docs/posts/<slug>.md`, `docs/llms.txt` exists and lists mirrors, post HTML `<head>` contains `rel="alternate" type="text/markdown"`; set `agentMarkdown: false` and rebuild — `.md` mirrors, `llms.txt`, and alternate links are absent; run incremental `render` and confirm `llms.txt` updates.
26. Test body author/source attribution: run `node scripts/cli.js build`, verify post HTML `.post-body` contains visible `.post-body-meta` at the top and hidden `.agent-context` blocks for body attribution and footer (`data-purpose="body-attribution"`, `data-purpose="post-footer"`); `.md` mirrors start body with `author:` / `source:` lines; set `footer: false` on one post and rebuild — that post omits body meta, body attribution, and footer; run `bash scripts/test-attribution.sh` against local `serve` or deployed site.

---

## 11. Acceptance Criteria (Definition of Done)

- [ ] `node scripts/cli.js build` (or `swp-cli build` after `npm link`) runs without errors and generates a complete `docs/` directory.
- [ ] `swp-cli new <slug> --title "<title>"` (or the equivalent `node scripts/cli.js new ...`) correctly generates an md file with front-matter including `header`, `footer`, `author`, and `source`.
- [ ] `swp-cli render <file>` (or the equivalent `node scripts/cli.js render <file>`) can render a single post and correctly update `posts.json` (test both adding a new slug and overwriting an existing one).
- [ ] `swp-cli deploy` (or the equivalent `node scripts/cli.js deploy`) reads the `deployTarget` config from `blog.config.json`, clones the Pages repo to `.deploy/`, replaces its content, and force pushes to the remote; `docs/` is not committed to the source repo. Git command errors print readable messages instead of raw exceptions.
- [ ] The homepage content area (without opening the sidebar) directly server-renders the most recent `recentPostsCount` posts (title, date, tag, excerpt), rather than relying on frontend JS async fetch to display them; after changing `recentPostsCount` and re-running `build`, the homepage display count changes accordingly.
- [ ] After incrementally rendering a single post with the `render` command, even without running `build`, the homepage's recent posts list is synchronously updated (because `render.js` internally calls `renderHomepage`).
- [ ] The sidebar is hidden by default; clicking the button opens/closes it.
- [ ] The sidebar timeline view correctly displays all posts in reverse chronological order.
- [ ] The sidebar tags view correctly groups by tag; clicking a tag filters to show the corresponding post list.
- [ ] Post pages correctly display the title, date, tags, and Markdown-rendered body (code blocks, images, lists, and other common Markdown syntax all render correctly).
- [ ] Math renders correctly: `$...$` inline and `$$...$$` block (including numbered `$$ x $$ (1)`) appear as KaTeX HTML in the post page with no JS required; `docs/katex/katex.min.css` and `docs/katex/fonts/` are present; the homepage excerpt shows `[math]` for both inline and block formulas instead of raw formula markup; literal `\$` is left as `$`.
- [ ] Mermaid renders correctly: a ` ```mermaid ` fenced block appears as `<div class="mermaid">` in the post page; `mermaid.min.js` is loaded only on pages that contain diagrams; dark/light theme follows `prefers-color-scheme` and survives theme changes via `data-src` restore; `docs/js/mermaid.min.js` is present; the homepage excerpt shows `[diagram]`.
- [ ] All static resource paths (css/js/posts.json) on every page load correctly under both empty and non-empty `baseUrl` configurations (at minimum verify `baseUrl: ""`; for non-empty `baseUrl`, manually check that the code logic is self-consistent).
- [ ] The `docs/` directory is a build artifact, already in `.gitignore`, and not committed to the source repo. It is pushed to a separate GitHub Pages repo via the `deploy` command.
- [ ] `swp-cli gist-sync` (or `node scripts/cli.js gist-sync`) can fetch all public gists of `githubUser` that contain Markdown files, generate posts with `gist_id`, `header`, `footer`, `author`, and `source` front-matter into `source/_posts/`, and rebuild; when a gist is deleted, the corresponding local post is cleaned up.
- [ ] Post pages inject global header/footer HTML from `source/_includes/` (configurable via `postHeader` / `postFooter`); per-post `header: false` / `footer: false` opts out; excerpts exclude fragment text; missing include files warn and continue.
- [ ] When `agentMarkdown` is enabled: each post outputs `docs/posts/<slug>.md`, `docs/llms.txt` is regenerated on build/render, and post pages include `<link rel="alternate" type="text/markdown">`; setting `agentMarkdown: false` disables all three.
- [ ] Post-body attribution: `.post-body-meta` is human-visible; `.post-body-attribution` and `.post-footer` are inside `.agent-context` (hidden from humans, in DOM for scrapers); `footer: false` opts out of body meta, attribution, and footer; `.md` mirrors prepend `author:` / `source:` lines; front-matter overrides site defaults; `new` and `gist-sync` scaffold all four fields; `scripts/test-attribution.sh` passes hard assertions after deploy.

---

## 12. Future Extensions (not implemented in this version; recorded here to avoid forgetting)

- `<!-- more -->` manual excerpt cutoff within posts.
- Previous/next post navigation.
- Dark mode toggle (automatic dark mode via `prefers-color-scheme` is implemented; a manual toggle is not).
- Category-based grouped view (currently only tags are implemented).
