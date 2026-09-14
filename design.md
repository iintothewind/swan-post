# swan-post (swp) — Design

> Behavior, decisions and invariants. **The repo is the source of truth for implementation** — this document deliberately does not list modules, exports or file layouts, because those change. It records the *why* and the rules that are easy to break.

## Goals

Node.js static blog generator → `docs/` → GitHub Pages. Content is rendered at build time; the browser only enhances it (sidebar, diagrams).

**Not planned:** pagination, comments, search, live-reload, pinyin slugs, User-Agent or TLS-based content negotiation.

## Architecture

Two entry points, one disposable output directory:

- `build` — full rebuild; empties `docs/` first.
- `render <file>` — renders one post, then refreshes everything derived from the post list: index, homepage, discovery artifacts, both feeds, and the 404 page. "Incremental" means *other posts are not re-rendered*, not that derived artifacts are skipped.

`docs/` is generated and gitignored. Anything hand-edited there is lost on the next build.

## Key decisions

**One source per artifact family.** Discovery artifacts (llms.txt, llms-full.txt, robots.txt, sitemap.xml) are all derived from the same resolved post list. Both feeds are serialized from the same normalized item builder. Two independent generators for the same data is exactly how they drift apart.

**One layout choke point.** The template engine only substitutes keys it is given and leaves the rest verbatim, so a forgotten variable ships `{{PLACEHOLDER}}` straight into production HTML. Every page-shell variable is therefore set in the single layout function; new head/shell variables go through it, never through a hand-rolled render call.

**Conditional output is built in code.** The template engine has no conditionals, so anything that must vanish entirely (a license line with no license configured) is produced as a whole string in JS rather than as an empty row in a template.

**Markdown mirrors are read back, not re-rendered.** llms-full.txt concatenates the already-generated per-post `.md`, so mirror, index and corpus cannot disagree.

**Absolute URLs throughout generated output.** Templates use `{{BASE_URL}}`; code uses the site-URL builder. The 404 page is served at arbitrary path depth, where relative links would resolve against the wrong base.

**Feeds need fully parsed posts**, not the slim index entries — full content and per-post author are not in the index. The incremental path re-parses every post for this reason.

**Optional features are opt-out, not opt-in.** Agent mirrors, license declarations and social meta render only when configured, so a minimal config still builds.

## Outputs

| Artifact | Purpose |
|---|---|
| `posts/<slug>.html`, `index.html` | Site pages |
| `posts.json` | Slim index (title, date, tags, slug, url, excerpt) — drives the sidebar |
| `posts/<slug>.md` | Markdown mirror per post |
| `llms.txt` | Post index with mirror URLs |
| `llms-full.txt` | Every mirror concatenated, newest first |
| `robots.txt`, `sitemap.xml` | Crawler discovery |
| `feed.xml` (RSS 2.0), `feed.json` (JSON Feed 1.1) | Newest 50 posts, full content, from one source |
| `404.html` | Fallback that routes lost readers back to `posts.json` / `llms.txt` |

Sitemap intentionally omits the `.md` mirrors and `llms-full.txt`: search engines do not index plain text, and `llms.txt` is the right entry point for those surfaces.

## Invariants

Things that are easy to break and expensive to notice:

- **Dates are format-specific.** RSS uses RFC 822, JSON Feed uses RFC 3339. An unparseable date yields an empty field, never an `Invalid Date` string.
- **Feed ids are permalinks.** Stable and equal to the item URL, in both formats.
- **Both feeds agree** on item ids and their order — asserted in tests.
- **The three indexes agree** on post count: llms.txt == posts.json == sitemap.xml.
- **Only same-site URLs are link-checked.** llms.txt descriptions embed external references; they are not this site's responsibility.
- **CI checks the locally built output**, not the live site. The source repo is not the Pages repo and pushing here publishes nothing, so a live check would fail on every new post until someone deploys.
- **External links inside index descriptions are never fetched.**
- **`agentMarkdown: false`** drops mirrors, llms.txt and llms-full.txt; robots.txt and sitemap.xml still generate.

## Configuration

`blog.config.json` — only what changes behavior:

| Field | Purpose |
|---|---|
| `title`, `author`, `description` | Site metadata |
| `siteUrl` | Canonical public URL, no trailing slash |
| `baseUrl` | `""` for user pages, `"/reponame"` for project pages |
| `license`, `licenseUrl` | Optional; drives llms.txt, post footer and mirror headers |
| `recentPostsCount`, `sidebarPostCount` | Homepage list and sidebar cap |
| `postHeader`, `postFooter`, `postBodyMeta`, `postBodyAttribution` | Include fragment paths |
| `postAuthor`, `postSource` | Defaults for attribution |
| `agentMarkdown`, `agentAttribution` | Mirrors on/off and their header template |
| `githubUser`, `deployTarget` | Gist sync and Pages repo |
| `llmsFullMaxPosts` | Optional cap for llms-full.txt |

Deployment is a separate Pages repo; `deploy` builds, replaces its contents with `docs/`, commits and force-pushes. The source repo and Pages repo are independent.

## Content model

`source/_posts/<slug>.md`, parsed with `gray-matter`.

| Front-matter | Notes |
|---|---|
| `title`, `date` | Required; dates parse as UTC |
| `tags`, `categories` | Optional arrays |
| `author`, `source` | Override site defaults |
| `canonical`, `license` | Optional per-post overrides |
| `header`, `footer` | `false` opts out of includes |

Markdown extensions: `$…$` / `$$…$$` → server-rendered KaTeX; ```` ```mermaid ```` → client-rendered diagram (bundle loads only on pages that have one); other fences → Prism. Excerpts replace math and diagrams with `[math]` / `[diagram]`.

Diagrams carry their alt text in the source: `accTitle:` and `accDescr:` as statements **inside the diagram body**. Mermaid turns them into the SVG's `<title>`/`<desc>` plus `aria-labelledby`/`aria-describedby`, and they are the only natural-language description of the diagram that reaches the `.md` mirror — the surface an agent actually reads. The front-matter form produces nothing, so it does not count. A block missing either annotation warns at build time and still renders: the diagram keeps working, it just loses its alt text.

## Verification

`npm test` builds, runs the unit suites, and runs the attribution/crawler acceptance script. Two standalone checks exist for CI:

- link self-check — every same-site URL in the three indexes resolves; run against a local server in CI, against production manually after a deploy.
- index parity — the three indexes report the same post count.

Both fail loudly, and both are verified to fail when the site is deliberately broken.
