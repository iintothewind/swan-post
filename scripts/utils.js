const fs = require("fs-extra");
const path = require("path");
const matter = require("gray-matter");
const MarkdownIt = require("markdown-it");

const md = new MarkdownIt({
html: true,
linkify: true,
});

// Read blog.config.json, return the config object
function loadConfig() {
const configPath = path.join(process.cwd(), "blog.config.json");
return fs.readJsonSync(configPath);
}

// Parse a single markdown file, returns:
// { title, date, formattedDate, tags, categories, slug, contentHtml, excerpt }
// slug is derived from the filename by stripping the .md extension
function parseMarkdownFile(filePath) {
const raw = fs.readFileSync(filePath, "utf-8");
const { data, content } = matter(raw);
const slug = path.basename(filePath, ".md");
const contentHtml = md.render(content);
// Generate excerpt: strip HTML tags → decode entities (&amp; → &, using markdown-it's built-in unescapeAll
// to avoid a hand-rolled incomplete entity table) → normalize whitespace → truncate to 100 visible graphemes
// (Intl.Segmenter splits by user-perceived characters, won't cut in the middle of an emoji / surrogate pair).
const plainText = md.utils.unescapeAll(contentHtml.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim());
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
slug,
contentHtml,
excerpt
};
}

// Simple placeholder substitution: template is a template string, vars is a { KEY: value } object.
// Replaces every {{KEY}} in the template with its value.
// Note: before substitution, each value's "{{" is replaced with a sentinel to prevent literal {{KEY}}
// occurrences inside a value (e.g. {{PAGE_TITLE}} written in body text when discussing template engines)
// from being accidentally replaced by a later global placeholder substitution.
// After all substitutions are done, the sentinel is restored to "{{".
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

// Return an array of absolute paths for all .md files under source/_posts
function listPostFiles() {
const dir = path.join(process.cwd(), "source", "_posts");
fs.ensureDirSync(dir);
return fs.readdirSync(dir)
.filter((f) => f.endsWith(".md"))
.map((f) => path.join(dir, f));
}

// Render a tags array as HTML: concatenated <span class="tag-pill">xxx</span> elements.
// Tags come from front-matter and are untrusted text; escape before embedding in HTML.
function renderTagsHtml(tags) {
const list = Array.isArray(tags) ? tags : [];
return list.map((t) => `<span class="tag-pill">${md.utils.escapeHtml(t)}</span>`).join("");
}

// Sort a posts array by the date field in descending order (newest first). Returns a new array;
// does not mutate the original. Posts without a date field are pushed to the end
// ("unknown when written" treated as oldest), to avoid empty strings sorting first.
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

// Generate the "recent posts" list HTML for the homepage.
// posts: posts.json entries already sorted by date descending
// count: number of posts to show (from blog.config.json's recentPostsCount, default 10)
// config: blog.config.json content, used to build baseUrl
function renderRecentPostsHtml(posts, count, config) {
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

// Read/write docs/posts.json (array), auto-sort by date descending before writing back
function loadPostsIndex() {
const p = path.join(process.cwd(), "docs", "posts.json");
if (!fs.existsSync(p)) return [];
return fs.readJsonSync(p);
}

// Sort and write to docs/posts.json, then return the sorted array for the caller to reuse directly.
// (The caller typically needs this sorted array right after to generate the homepage recent-posts list,
// avoiding a second sort.)
function savePostsIndex(posts) {
const sorted = sortPostsByDateDesc(posts);
const p = path.join(process.cwd(), "docs", "posts.json");
fs.writeJsonSync(p, sorted, { spaces: 2 });
return sorted;
}

module.exports = {
loadConfig, parseMarkdownFile, renderTemplate, listPostFiles,
renderTagsHtml, sortPostsByDateDesc, renderRecentPostsHtml,
loadPostsIndex, savePostsIndex
};
