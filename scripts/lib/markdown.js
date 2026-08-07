const fs = require("fs-extra");
const path = require("path");
const matter = require("gray-matter");

// Lazy-init markdown-it renderer so modules that only need config/attribution
// (e.g. deploy, gist-sync, tests with agentMarkdown:false) don't load KaTeX.
let _md = null;
function getMd() {
if (_md) return _md;
const MarkdownIt = require("markdown-it");
const texmath = require("markdown-it-texmath");
const katex = require("katex");
const md = new MarkdownIt({ html: true, linkify: true });
// Math support: $...$ inline and $$...$$ block (LaTeX), rendered server-side to KaTeX HTML.
// throwOnError: false → render malformed math as KaTeX's red error output instead of throwing.
md.use(texmath, { engine: katex, delimiters: "dollars", katexOptions: { throwOnError: false } });
// Mermaid support: turn ```mermaid fenced blocks into <div class="mermaid"> for client-side
// rendering. Content is HTML-escaped to keep diagram syntax intact; all other fences keep Prism.
const defaultFence = md.renderer.rules.fence;
md.renderer.rules.fence = function (tokens, idx, options, env, self) {
const token = tokens[idx];
if (token.info.trim() === "mermaid") {
return `<div class="mermaid">${md.utils.escapeHtml(token.content)}</div>`;
}
return defaultFence(tokens, idx, options, env, self);
};
_md = md;
return md;
}

// Wrap tables in a horizontal scroll container so wide markdown tables don't overflow on mobile.
function wrapTablesInScrollContainer(html) {
return html.replace(/<table\b/gi, '<div class="table-scroll"><table').replace(/<\/table>/gi, '</table></div>');
}

// Truncate a string to n user-perceived characters (graphemes),
// avoiding String.prototype.slice cutting in the middle of an emoji / surrogate pair (UTF-16 code units)
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

// Parse a single markdown file, returns:
// { title, date, formattedDate, tags, categories, slug, content, contentHtml, excerpt, showHeader, showFooter }
// slug is derived from the filename by stripping the .md extension
function parseMarkdownFile(filePath) {
const md = getMd();
const raw = fs.readFileSync(filePath, "utf-8");
const { data, content } = matter(raw);
const slug = path.basename(filePath, ".md");
const contentHtml = wrapTablesInScrollContainer(md.render(content));
// Generate excerpt: replace math/diagram markup with placeholders first, then strip HTML tags → decode
// entities (& → &, using markdown-it's built-in unescapeAll to avoid a hand-rolled incomplete entity
// table) → normalize whitespace → truncate to 100 visible graphemes (Intl.Segmenter splits by
// user-perceived characters, won't cut in the middle of an emoji / surrogate pair). The placeholders
// keep server-rendered KaTeX markup and Mermaid source from flooding the excerpt with broken text.
const excerptSource = contentHtml
.replace(/<section[^>]*>\s*<eqn>[\s\S]*?<\/eqn>[\s\S]*?<\/section>/g, " [math] ")
.replace(/<eq>[\s\S]*?<\/eq>/g, " [math] ")
.replace(/<div class="mermaid">[\s\S]*?<\/div>/g, " [diagram] ");
const plainText = md.utils.unescapeAll(excerptSource.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim());
const excerpt = truncateGraphemes(plainText, 100);
const rawDate = data.date instanceof Date ? data.date : (data.date ? new Date(data.date) : null);
const dateStr = rawDate ? rawDate.toISOString() : "";
// Display date uses UTC YYYY-MM-DD: js-yaml parses front-matter dates without timezone as UTC (YAML 1.1 spec),
// so the UTC date always equals the date the author wrote in front-matter. Using local time
// (getFullYear/getMonth/getDate) would shift late-night posts to "the next day" in UTC+7/8 etc. timezones,
// causing timeline date misalignment.
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

// Render a tags array as HTML: concatenated <span class="tag-pill">xxx</span> elements.
// Tags come from front-matter and are untrusted text; escape before embedding in HTML.
function renderTagsHtml(tags) {
const md = getMd();
const list = Array.isArray(tags) ? tags : [];
return list.map((t) => `<span class="tag-pill">${md.utils.escapeHtml(t)}</span>`).join("");
}

// Generate the "recent posts" list HTML for the homepage.
// posts: posts.json entries already sorted by date descending
// count: number of posts to show (from blog.config.json's recentPostsCount, default 10)
// config: blog.config.json content, used to build baseUrl
function renderRecentPostsHtml(posts, count, config) {
const md = getMd();
const list = posts.slice(0, count);
if (list.length === 0) {
return '<p class="post-excerpt">No posts published yet.</p>';
}
return list.map((post) => {
// title / excerpt come from front-matter and post body — untrusted text; escape before embedding in HTML
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

module.exports = {
getMd,
parseMarkdownFile,
renderTagsHtml,
renderRecentPostsHtml,
truncateGraphemes,
};
