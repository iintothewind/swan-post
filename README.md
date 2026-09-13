# swan-post (swp)

A personal static blog generator in Node.js — Hexo alternative, output deployed to GitHub Pages. See `design.md` for architecture and invariants.

## Features

- Fixed layout: overlay sidebar (timeline / tags), full-width content
- Hexo-style Markdown with YAML front-matter
- Incremental render of a single post, without a full rebuild
- Server-side KaTeX math; client-side Mermaid, loaded only on pages that need it
- Per-post header/footer/attribution fragments, opt-out per post
- Agent-readable surfaces: per-post `.md` mirrors, `llms.txt`, `llms-full.txt`
- Crawler discovery: `robots.txt` + `sitemap.xml` on every build
- Feeds: `feed.xml` (RSS 2.0) and `feed.json` (JSON Feed 1.1), newest 50, from one source
- Social meta + canonical per post; site-wide license declaration
- `404.html` that routes lost readers back to `posts.json` / `llms.txt`

**Not planned:** pagination, comments, search, live-reload, pinyin slugs, User-Agent content negotiation.

## Install

```bash
npm install
```

With [Bun](https://bun.sh) instead of Node: `bun install`, then `bun scripts/cli.js <command>`.

Commands below use `npx swp-cli`; the Bun equivalent is `bun scripts/cli.js`.

## Usage

```bash
npx swp-cli new my-first-post --title "My First Article"
npx swp-cli render source/_posts/2026-07-04-my-first-post.md   # single post + refresh derived artifacts
npx swp-cli build                                              # full rebuild
npx swp-cli serve                                              # preview at http://localhost:8080
npx swp-cli deploy -m "Wrote a new article"                    # build + push to Pages repo
npx swp-cli gist-sync                                          # import public gists as posts, then build
```

`render` updates the post, then refreshes the index, homepage, discovery artifacts, feeds and 404 — it does not re-render the other posts.

After a build, locally available: `/llms.txt`, `/llms-full.txt`, `/posts/<slug>.md`, `/robots.txt`, `/sitemap.xml`, `/feed.xml`, `/feed.json`.

### Deploy

Dual-repo model: the source repo holds the generator and Markdown; the Pages repo (`<user>.github.io`) holds `docs/`. Set `deployTarget` in `blog.config.json`, then `swp-cli deploy` builds, replaces the Pages repo contents, commits and force-pushes.

`deploy` pushes only when the rebuilt output differs. Use `--force` when the output matches but the remote needs updating (for example after only editing front-matter that does not change HTML).

The **Sync & deploy** workflow (Actions tab, manual only) runs `gist-sync` → `deploy` → commits the synced posts back to this repo. It needs a `DEPLOY_KEY` repository secret: an SSH key whose public half is registered as a write-enabled deploy key on the Pages repo.

## Article format

`source/_posts/<slug>.md` — slug is `[a-z0-9-]+`, given on the command line.

```markdown
---
title: Article Title
date: 2026-07-04 10:00:00
tags: [tag1, tag2]
header: true     # false skips the header include
footer: true     # false skips body meta, body attribution and footer
author: Ivar.Chen                    # optional, overrides config
source: https://username.github.io/  # optional, overrides config
---

Body content in standard Markdown.
```

`canonical` and `license` are optional per-post overrides; `gist_id` is written by `gist-sync`.

### Includes

Fragments in `source/_includes/` (paths configured in `blog.config.json`), rendered with the same `{{KEY}}` placeholders as templates:

| Fragment | Visible to humans | Role |
|---|---|---|
| `post-header.html` | no | Camouflaged copyright / citation block |
| `post-body-meta.html` | **yes** | `author:` / `source:` at top of body |
| `post-body-attribution.html` | no | Camouflaged canonical / GitHub links |
| `post-footer.html` | yes | License line, when one is configured |

Camouflage is 1px text with theme-matched color — hidden from humans, still in the DOM for extractors.

### Agent-readable output

Static attribution without edge routing: a Markdown mirror per post, a site index, and a concatenated corpus. `.md` mirrors are the most reliable channel; camouflaged HTML is a bonus for Jina-style extractors. Set `agentMarkdown: false` to drop mirrors and `llms.txt` (robots/sitemap still generate).

## Markdown extensions

- Math: `$…$` inline, `$$…$$` block, rendered at build time — displays without JavaScript. Escape literal dollars as `\$`.
- Diagrams: ` ```mermaid ` blocks, rendered client-side; the bundle loads only on pages containing a diagram.

After upgrading `katex` / `mermaid` or editing `assets/`, run a full `build`; incremental `render` does not refresh already-copied vendor files.

## Configuration

`blog.config.json` — the fields that change behavior are documented in `design.md`. Essentials:

- `siteUrl` — canonical public URL, no trailing slash; falls back to `https://<githubUser>.github.io`
- `baseUrl` — `""` for user pages, `"/reponame"` for project pages
- `license`, `licenseUrl` — optional; appears in llms.txt, post footer and mirror headers
- `recentPostsCount`, `sidebarPostCount` — homepage list length, sidebar cap
- `agentMarkdown`, `agentAttribution` — mirrors on/off and their header template
- `githubUser`, `deployTarget` — gist sync and the Pages repo

## Tests

```bash
npm test                                       # build + unit suites + attribution acceptance
node scripts/check-index-parity.js             # llms.txt == posts.json == sitemap.xml
node scripts/cli.js serve -p 8123 &            # then:
node scripts/check-links.js http://127.0.0.1:8123
node scripts/check-links.js                    # production, after a deploy
```
