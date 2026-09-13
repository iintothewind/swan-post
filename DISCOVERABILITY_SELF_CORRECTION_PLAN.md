# P1 Plan: Discoverability + Self-Correction

## Context
P1 spec (local `blog_rss_enhance.md`); P0 (RSS feed) is done. Items:
1. Per-post `meta name="description"` (~160 chars, first paragraph) + OG trio (og:title / og:description / og:url) + `<link rel="canonical">`.
2. CI link self-check: fetch every URL in llms.txt / sitemap.xml / posts.json, fail if any is not HTTP 200.
3. CI three-index parity: post counts in llms.txt == posts.json == sitemap.xml.
4. `.md` provenance frontmatter: accept `author` / `canonical` / `source` / `license`.

**Not doing (explicitly dropped):** the spec's "散文 Q&A 降级为脚注". No Q&A-to-footnote transformation, no heading-marker detection, nothing. Posts render exactly as they do today.

End state: every post page carries social meta + canonical; CI fails on any broken link or index drift; frontmatter accepts `canonical`/`license`.

### 修订记录（相对初版）
初版有 3 个会导致 P1 直接失败的问题和 3 个次要问题，均已在本版修正：
1. **补 `build.js`**：初版只改 `render.js`，但 `renderTemplate` 对未提供的占位符原样保留 → 全量构建会在 53 篇 post 和首页 head 里产出字面量 `{{POST_META_HTML}}`。改为统一 `renderLayout()` 入口，三处调用不可能再漏。
2. **CI 补 `npm ci` + build**：`docs/` 在 `.gitignore`，checkout 源仓库后没有 docs/。
3. **CI 改为查本地服务**：源仓库 push 不触发 Pages 发布（部署是手动 `npm run deploy` 到 `iintothewind.github.io`），查线上会在每次新增文章后必然误报失败。
4. **链接采集只取本站 URL**：llms.txt 描述文本里混有 14 个外站 URL。
5. **首段提取改在压空白之前**：初版"按 2+ 空格切首段"是空操作。
6. **复用 `CANONICAL_URL`**，不再引入重复的 `POST_CANONICAL`。
7. **删除 Q&A 脚注**整节。

## Approach

### 1. Per-post social meta + canonical (item 1)
- **markdown.js**
  - Export `escapeHtml` (= `md.utils.escapeHtml`).
  - Extract shared internal `plainTextFromHtml(html)`: mirrors the existing excerpt logic exactly (replace `<section><eqn>…</eqn>` and `<eq>` with `[math]`, `<div class="mermaid">…</div>` with `[diagram]`, strip tags, `unescapeAll`, collapse whitespace, trim). `parseMarkdownFile`'s excerpt computation calls it — identical output, no excerpt regression.
  - Add internal `firstParagraphHtml(html)`: returns the first `<p …>…</p>` block whose stripped text is non-empty (`/<p\b[^>]*>([\s\S]*?)<\/p>/gi`), or `""` when the post has no `<p>`.
    - Must run **before** whitespace collapsing. The excerpt path collapses `\s+` → single space, so a "split on 2+ spaces" paragraph split would never match and would silently degrade into "first 160 chars of the entire post".
  - Add exported `getPostMetaDescription(post)`: `plainTextFromHtml(firstParagraphHtml(post.contentHtml))` → `truncateGraphemes(…, 160)`; if empty, fall back to `truncateGraphemes(plainTextFromHtml(post.contentHtml), 160)`; if still empty, `post.excerpt`.
  - `parseMarkdownFile` already returns `author`/`source`; add optional `canonical` and `license` (frontmatter `data.canonical` / `data.license`, coerced to string, `""` when absent).
- **templates.js**
  - Add exported `renderPostSocialMeta(post, config)`. Returns the block:
    ```
    <meta name="description" content="DESC">
    <meta property="og:title" content="TITLE">
    <meta property="og:description" content="DESC">
    <meta property="og:url" content="URL">
    <link rel="canonical" href="URL">
    ```
    DESC/TITLE escaped via `escapeHtml`; `URL` = `post.canonical || getPostCanonicalUrl(config, post.slug)`, escaped. DESC falls back to `post.excerpt`.
  - Add exported `renderLayout(config, { pageTitle, content, postAlternateMd = "", postMetaHtml = "" })`. Wraps `templates/layout.html` and sets every layout variable in **one** place: `PAGE_TITLE`, `SITE_TITLE`, `BASE_URL`, `SIDEBAR_POST_COUNT`, `POST_ALTERNATE_MD`, `POST_META_HTML`, `CONTENT`.
    - Rationale: `renderTemplate` only substitutes keys present in `vars` and leaves the rest literal, so any call site that forgets `POST_META_HTML` ships `{{POST_META_HTML}}` into production HTML. A single choke point makes that impossible.
  - `buildPostTemplateVars`: set `CANONICAL_URL: post.canonical || getPostCanonicalUrl(config, post.slug)` (now honors a frontmatter override) and add `POST_LICENSE: post.license || ""`. No `POST_CANONICAL` — reuse the existing `CANONICAL_URL` key already consumed by `post-body-attribution.html` and `agent-attribution.md`.
- **layout.html**
  - Insert `{{POST_META_HTML}}` in `<head>` immediately after the RSS `<link … href="{{BASE_URL}}/feed.xml">` line (line 11).
- **build.js / render.js**
  - Replace the three hand-rolled `renderTemplate(layoutTpl, …)` calls with `renderLayout(...)`:
    - `build.js` post loop (53 pages)
    - `renderHomepage` in `build.js` (homepage — passes no `postMetaHtml`, i.e. `""`)
    - `renderOne` in `render.js` (incremental path — passes `renderPostSocialMeta(post, config)`)
  - Homepage intentionally carries no per-post meta (spec says "每篇" = each post).
  - Minimal alternative if the refactor is skipped: pass `POST_META_HTML` explicitly at all three sites. Accepted but easy to regress — the refactor is preferred.
- **new-post.js / gist-sync.js / posts.json**
  - No behavior change. `toIndexEntry` stays slim (no canonical/license) so sitemap/llms counts are unaffected.

### 2. CI link self-check (item 2)
- **scripts/check-links.js** (new; Node 18+ builtins + global `fetch`, no new deps)
  - Usage: `node scripts/check-links.js [baseUrl]`. `baseUrl` defaults to `getSiteUrl(config)` from `blog.config.json`.
  - Read `docs/llms.txt`, `docs/sitemap.xml`, `docs/posts.json` (cwd-relative).
  - Collect URLs, **same-site only**:
    - llms.txt → only the link targets of `- [title](url)` lines. Do **not** sweep the raw text: descriptions embed 14 external URLs (bilibili, v2ex, DeepSeek docs, an example `http://www.aaa.com/123.htm`, and a truncated `https://gi`), which would make CI fail for reasons unrelated to this site.
    - sitemap.xml → every `<loc>…</loc>` text (all same-site, including `.md` mirrors).
    - posts.json → each `entry.url` via `new URL(entry.url, siteUrl)`.
    - Final filter: `url.startsWith(siteUrl)`.
  - Request `url.replace(siteUrl, baseUrl)` — this prefix swap is what lets the same script run against a local server and against production.
  - Fetch in parallel (`Promise.allSettled`); per request `AbortController` timeout 15s. Failure = `res.status !== 200` OR fetch throws.
  - Print `ok N / failed M / total T`; `process.exit(1)` if any failed else `0`.
- **.github/workflows/ci.yml** (new)
  - `on: push (branches: [main]), workflow_dispatch, schedule (cron "0 6 * * *")`.
  - Job `check-links` (`ubuntu-latest`): `actions/checkout@v4` → `actions/setup-node@v4` (node 20) → `npm ci` → `node scripts/cli.js build` → start `node scripts/cli.js serve -p 8123 &` → poll until `http://127.0.0.1:8123/` answers (serve.js has no readiness flag) → `node scripts/check-links.js http://127.0.0.1:8123` → stop server.
  - **Why local, not live:** the source repo (`iintothewind/swan-post`) is not the Pages repo (`iintothewind/iintothewind.github.io`). Pushing to `main` here publishes nothing — deployment is a manual `npm run deploy`. A live check would fail on every push that adds a post (its URLs 404 until someone deploys) and the scheduled run would just re-check a stale site. Checking the freshly built `docs/` over a local server is deterministic and still catches every generator-level breakage.
  - Live check stays available for humans: `workflow_dispatch` (or just run `node scripts/check-links.js` after a deploy, `baseUrl` defaults to production).

### 3. CI three-index parity (item 3)
- **scripts/check-index-parity.js** (new; no deps, **no network**)
  - Usage: `node scripts/check-index-parity.js` (operates purely on local `docs/`).
  - Count POST entries per file: posts.json → `JSON.parse(...).length`; llms.txt → lines matching `^- \[.+\]\(https?:\/\/[^\s)]+\.md\)` (verified: 53 hits on the current build); sitemap.xml → `<loc>` texts matching `/posts\/[^/]+\.html` (excludes root, `/llms.txt`, `.md` mirrors).
  - Print counts; `process.exit(1)` if any file is missing or the counts differ.
- **.github/workflows/ci.yml**: add job `check-parity` — same runner, needs only `npm ci` + build (no server, no sleep).

### 4. Frontmatter provenance (item 4)
- **4a. Generator accepts `canonical` + `license` (extend, not replace):** `parseMarkdownFile` reads `data.canonical`/`data.license`; `buildPostTemplateVars` exposes `CANONICAL_URL` (frontmatter-aware) and `POST_LICENSE`. `source/_includes/post-body-meta.html` shows a `license:` line only when `POST_LICENSE` is non-empty (author/source lines unchanged). Because `CANONICAL_URL` is shared, a frontmatter `canonical` also flows into `post-body-attribution.html` and `agent-attribution.md` — intended. Sitemap/llms keep the derived canonical (frontmatter `canonical` does not thread into them) — documented limitation, thread-through is a follow-up. Existing `header`/`footer`/`author`/`source` frontmatter untouched.
- **4b. Content relabeling is NOT generator code:** renaming the provenance block in the 53 source `.md` files to `author/canonical/source/license` is authoring work; the generator already accepts `canonical`/`license` optionally and existing posts are unaffected. Out of this plan's code scope.

## Critical files & anchors
- `scripts/lib/markdown.js` — `parseMarkdownFile` (add canonical/license), `plainTextFromHtml` (new shared helper), `firstParagraphHtml` (new), `getPostMetaDescription`, `escapeHtml`, `truncateGraphemes` (exists at line 38).
- `scripts/lib/templates.js` — `renderPostSocialMeta` (new), `renderLayout` (new), `buildPostTemplateVars` (`CANONICAL_URL` frontmatter-aware, add `POST_LICENSE`), `renderTemplate` (line 14 — only substitutes provided keys).
- `scripts/build.js` — post loop (line ~73) and `renderHomepage` (line ~28): both switch to `renderLayout`.
- `scripts/render.js` — `renderOne` (line ~42): switch to `renderLayout`, pass `postMetaHtml`.
- `templates/layout.html` — add `{{POST_META_HTML}}` after the RSS link (line 11).
- `source/_includes/post-body-meta.html` — conditional `license:` line.
- `scripts/check-links.js`, `scripts/check-index-parity.js`, `.github/workflows/ci.yml` — new CI artifacts.

## Verification
- Build: `node scripts/cli.js build` in repo root → `docs/` regenerated (53 posts).
- No literal placeholders left: `grep -rl '{{POST_META_HTML}}\|{{POST_ALTERNATE_MD}}' docs/ --include=*.html` → empty. (This is the regression the `renderLayout` refactor exists to prevent; run it first.)
- Social meta present: `grep -o 'name="description"\|property="og:[a-z]*"\|rel="canonical"' docs/posts/<newest>.html` → all 5 matches; `grep -o 'property="og:url" content="[^"]*"' docs/posts/<newest>.html` ends in the post's `.html` slug; `docs/index.html` has NO `property="og:title"` and no `{{POST_META_HTML}}`.
- Meta length ≤ 160 graphemes — measure in node with `Intl.Segmenter`, not `wc -m` (which counts the trailing newline and mishandles emoji).
- First paragraph, not whole post: pick a post whose first `<p>` is short; assert its `meta description` is shorter than the truncated whole-text fallback and matches the first `<p>`'s text.
- Link self-check (local): `node scripts/cli.js build && node scripts/cli.js serve -p 8123 &`, then `node scripts/check-links.js http://127.0.0.1:8123` → exit 0, "0 failed".
- Link self-check (live, manual after a deploy): `node scripts/check-links.js` → exit 0.
- Parity: `node scripts/check-index-parity.js` → "53 / 53 / 53 equal", exit 0.
- Frontmatter override: add `canonical: https://example.test/x` + `license: CC-BY-4.0` to a temp post, `render` it, assert `rel="canonical" href="…/x"` and the license line; delete temp post.
- Negative checks: delete one `docs/posts/<slug>.html` → `check-links` exits 1; remove one llms.txt entry line → `check-parity` exits 1.
- CI: push to `main` → both jobs run and pass; the negative checks above fail the corresponding job.

## Assumptions & contingencies
- **Source repo ≠ Pages repo:** CI runs in `iintothewind/swan-post` on push to `main`; deployment to `iintothewind/iintothewind.github.io` is a manual `npm run deploy`. Hence the local-server check. A live check is reachable via `workflow_dispatch` / manual run after deploying.
- **Local check ≠ live check:** it validates generated artifacts, not Pages-level 404s, caching, or CDN behavior. If live coverage is wanted on every push, add a deploy step to the workflow (needs an SSH deploy key secret) and run `check-links` after it.
- **serve.js readiness:** it binds the port synchronously but has no health flag; CI must poll until the port answers.
- **External URLs are out of scope:** only same-site URLs are fetched. llms.txt currently embeds 14 external URLs in its descriptions; they are deliberately not checked.
- **Item 4 scope:** "改 YAML frontmatter" is implemented as *extend* (add optional `canonical`/`license`, keep `header`/`footer` opt-out), not a hard rename that drops header/footer. Bulk relabeling of the 53 source `.md` files is authoring work, out of this plan's code scope.
- **Q&A footnotes are dropped** at the user's request. If ever revived, note that `source/_posts/2026-08-25-2d58bdcedf8255d3352add512e8c7d47.md:12` is an **H1** containing 问答 (`# DeepSeek Harness 核心机制调研笔记(供问答使用)`), so any heading-contains marker must exclude H1 or that post's entire body gets relocated.
