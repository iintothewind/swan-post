# P1 Plan: Discoverability + Self-Correction

## Context
P1 spec (local `blog_rss_enhance.md`); P0 (RSS feed) is done. Four items:
1. Per-post `meta name="description"` (~160 chars, first paragraph) + OG trio (og:title / og:description / og:url) + `<link rel="canonical">`.
2. CI link self-check (GitHub Actions): fetch every URL in llms.txt / sitemap.xml / posts.json, fail if any is not HTTP 200.
3. CI three-index parity: post counts in llms.txt == posts.json == sitemap.xml.
4. `.md` provenance block as YAML frontmatter (author / canonical / source / license); prose Q&A downgraded to footnotes.

End state: every post page carries social meta + canonical; CI fails on any broken link or index drift; frontmatter accepts `canonical`/`license`; Q&A sections render as footnotes.

## Approach

### 1. Per-post social meta + canonical (item 1)
- **markdown.js**
  - Add exported `escapeHtml` (= `md.utils.escapeHtml`).
  - Extract shared internal helper `plainTextFromHtml(html)` that mirrors the existing excerpt placeholder-stripping logic exactly (replace `<section><eqn>…</eqn>` and `<eq>` with `[math]`, `<div class="mermaid">…</div>` with `[diagram]`, strip tags, `unescapeAll`, collapse whitespace, trim). Replace the inline snippet in `parseMarkdownFile`'s excerpt computation with a call to it — identical output, no excerpt regression.
  - Add exported `getPostMetaDescription(post)`: `plainTextFromHtml(post.contentHtml)`, take the first paragraph (split on 2+ spaces), `truncateGraphemes` to 160; fallback to `post.excerpt` when empty.
  - `parseMarkdownFile` already returns `author`/`source`; add optional `canonical` and `license` fields (frontmatter `data.canonical` / `data.license`, coerced to string, `""` when absent).
- **templates.js**
  - Add exported `renderPostSocialMeta(post, config)`. Returns the block:
    ```
    <meta name="description" content="DESC">
    <meta property="og:title" content="TITLE">
    <meta property="og:description" content="DESC">
    <meta property="og:url" content="URL">
    <link rel="canonical" href="URL">
    ```
    DESC and TITLE escaped via `escapeHtml`; `URL` = `post.canonical || getPostCanonicalUrl(config, post.slug)` escaped (escapeHtml also covers `&<>"`). DESC falls back to `post.excerpt`.
  - `buildPostTemplateVars`: add `POST_CANONICAL: post.canonical || getPostCanonicalUrl(config, post.slug)` and `POST_LICENSE: post.license || ""`.
- **layout.html**
  - Insert `{{POST_META_HTML}}` in `<head>` immediately after the RSS `<link … href="{{BASE_URL}}/feed.xml">` line (line 11). Renders empty on the homepage because `renderHomepage` never sets `POST_META_HTML`.
- **render.js**
  - In `renderOne`, after parsing `post`, compute `const socialMeta = renderPostSocialMeta(post, config);` and pass `POST_META_HTML: socialMeta` to the `renderTemplate(layoutTpl, {...})` call. `renderHomepage` unchanged → homepage keeps no per-post meta (spec says "每篇" = each post).
- **new-post.js / gist-sync.js / posts.json**
  - No behavior change. `formatPostAttributionFrontMatter` still emits header/footer/author/source; `canonical`/`license` are optional frontmatter overrides the generator accepts. New posts omit them until authored. `toIndexEntry` stays slim (no canonical/license) so sitemap/llms counts are unaffected.

### 2. CI link self-check (item 2)
- **scripts/check-links.js** (new; Node 18+ builtins + global `fetch`, no new deps)
  - Usage: `node scripts/check-links.js <siteUrl>`.
  - Read `docs/llms.txt`, `docs/sitemap.xml`, `docs/posts.json` (cwd-relative).
  - Collect URLs: llms.txt → every `https?://…` via `/https?:\/\/[^\s\]\)]+/gi` (dedup, `Set`); sitemap.xml → every `<loc>…</loc>` text; posts.json → each `entry.url` via `new URL(entry.url, siteUrl)`.
  - Fetch in parallel (`Promise.allSettled`); per request `AbortController` timeout 15s. Failure = `res.status !== 200` OR fetch throws.
  - Print `ok N / failed M / total T`; `process.exit(1)` if any failed else `0`.
- **.github/workflows/ci.yml** (new)
  - `on: push (branches: [main]), workflow_dispatch, schedule (cron "0 6 * * *")`.
  - Job `check-links`: `runs-on: ubuntu-latest`; steps: `actions/checkout@v4` → `actions/setup-node@v4` (node 20) → `run: node scripts/check-links.js https://iintothewind.github.io`.
  - Deploy timing: workflow runs in the SOURCE repo on `main` push; `docs/` is gitignored so Pages publishes on demand — add a `sleep 20` step before the check so the latest commit has propagated.

### 3. CI three-index parity (item 3)
- **scripts/check-index-parity.js** (new; same deps as check-links.js)
  - Usage: `node scripts/check-index-parity.js <siteUrl>`.
  - Count POST entries per file: posts.json → `JSON.parse(...).length`; llms.txt → lines matching `^- \[.+\]\(https?:\/\/[^\s)]+\.md\)`; sitemap.xml → `<loc>` texts matching `/posts\/[^/]+\.html` (excludes root, `/llms.txt`, `.md` mirrors).
  - Print counts; `process.exit(1)` if any file missing or counts differ.
- **.github/workflows/ci.yml**: add job `check-parity` (same runner + `sleep 20`), `run: node scripts/check-index-parity.js https://iintothewind.github.io`.

### 4. Frontmatter provenance + Q&A footnotes (item 4)
- **4a. Generator accepts `canonical` + `license` (extend, not replace):** `parseMarkdownFile` reads `data.canonical`/`data.license`; `buildPostTemplateVars` exposes `POST_CANONICAL`/`POST_LICENSE`; `source/_includes/post-body-meta.html` shows a `license:` line only when `POST_LICENSE` is non-empty (author/source lines unchanged). `renderPostSocialMeta` uses `post.canonical || getPostCanonicalUrl(...)` so frontmatter `canonical` overrides the page meta/canonical. Sitemap/llms keep the derived canonical (frontmatter `canonical` does not thread into them) — documented limitation; thread-through is a follow-up. Existing `header`/`footer`/`author`/`source` frontmatter untouched.
- **4b. Q&A → footnotes (explicit-marker, safe-by-default):** only body sections whose heading contains `Q&A` / `问答` / `FAQ` / `常见问题` (case-insensitive) are collected and appended as one `<div class="post-qa-footnotes">…</div>` at the end of the post body; prose containing `问` is untouched. Existing 53 posts have no such headings → zero behavior change; new posts opt in by adding a `## 问答` section.
- **4c. Content relabeling is NOT generator code:** the spec's "改 YAML frontmatter" means renaming the provenance block in the 53 source `.md` files to `author/canonical/source/license`. That is authoring work; the generator already accepts `canonical`/`license` optionally and existing posts are unaffected. Out of this plan's code scope.

## Critical files & anchors
- `scripts/lib/markdown.js` — `parseMarkdownFile` (add canonical/license), `plainTextFromHtml` (new shared helper), `getPostMetaDescription`, `escapeHtml`, `truncateGraphemes`.
- `scripts/lib/templates.js` — `buildPostTemplateVars` (POST_CANONICAL/POST_LICENSE), `renderPostSocialMeta` (new).
- `scripts/render.js` — `renderOne` (pass POST_META_HTML).
- `templates/layout.html` — add `{{POST_META_HTML}}` after RSS link (line 11).
- `scripts/check-links.js`, `scripts/check-index-parity.js`, `.github/workflows/ci.yml` — new CI artifacts.

## Verification
- Build: `node scripts/cli.js build` in repo root → `docs/` regenerated (53 posts).
- Social meta present: `grep -o 'name="description"\|property="og:[a-z]*"\|rel="canonical"' docs/posts/<newest>.html` → all 5 matches; `grep -o 'property="og:url" content="[^"]*"' docs/posts/<newest>.html` ends in the post's `.html` slug; `docs/index.html` has NO `property="og:title"`.
- Meta length: `grep -o '<meta name="description" content="[^"]*"' docs/posts/<newest>.html | sed -e 's/.*content="//' -e 's/"$//' | wc -m` ≈ 160.
- Link self-check (live): `node scripts/check-links.js https://iintothewind.github.io` → exit 0, "0 failed". Locally: `npx serve docs` in repo root, then `node scripts/check-links.js http://127.0.0.1:<port>` → exit 0.
- Parity: `node scripts/check-index-parity.js https://iintothewind.github.io` → "53 / 53 / 53 equal", exit 0.
- Frontmatter override: add `canonical: https://example.test/x` + `license: CC-BY-4.0` to a temp post, `render` it, assert `rel="canonical" href="…/x"` and the license line; delete temp post.
- CI: push a change to `main` → both jobs run; with all links 200 and parity equal, both pass. Break one link (temporarily delete a post's `docs/posts/<slug>.html`) → `check-links` job exits 1.

## Assumptions & contingencies
- **CI repo/layout:** CI runs in the SOURCE repo on push to `main`; the site URL is hardcoded in the workflow (`https://iintothewind.github.io`) because the deployed repo holds no `blog.config.json`. If the user deploys via a separate Pages repo or runs CI there, the trigger and URL must be adjusted.
- **Deploy timing:** Pages publishes on demand after the `main` push; the workflow `sleep 20` before checking to avoid racing the deploy. If deploy is manual or triggered differently, increase the sleep or add a deploy step.
- **Item 4 frontmatter scope:** "改 YAML frontmatter" is implemented as *extend* (add optional `canonical`/`license`, keep `header`/`footer` opt-out) rather than a hard *rename* that drops header/footer. If the user wants header/footer removed from the provenance block, that is a follow-up change.
- **Item 4 Q&A definition:** Q&A = sections headed by `Q&A`/`问答`/`FAQ`/`常见问题`; prose containing `问` is untouched. Adjust the trigger strings to the author's actual convention.
- **Item 4 content relabeling:** bulk relabeling of the 53 source `.md` files is authoring work, out of this plan's code scope.
