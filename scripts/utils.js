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

// Wrap tables in a horizontal scroll container so wide markdown tables don't overflow on mobile.
function wrapTablesInScrollContainer(html) {
return html.replace(/<table\b/gi, '<div class="table-scroll"><table').replace(/<\/table>/gi, '</table></div>');
}

// Read blog.config.json, return the config object
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

// Parse a single markdown file, returns:
// { title, date, formattedDate, tags, categories, slug, content, contentHtml, excerpt, showHeader, showFooter }
// slug is derived from the filename by stripping the .md extension
function parseMarkdownFile(filePath) {
const raw = fs.readFileSync(filePath, "utf-8");
const { data, content } = matter(raw);
const slug = path.basename(filePath, ".md");
const contentHtml = wrapTablesInScrollContainer(md.render(content));
// Generate excerpt: replace math/diagram markup with placeholders first, then strip HTML tags → decode
// entities (&amp; → &, using markdown-it's built-in unescapeAll to avoid a hand-rolled incomplete entity
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


function getSiteUrl(config) {
if (config.siteUrl) return String(config.siteUrl).replace(/\/$/, "");
if (config.githubUser) return "https://" + config.githubUser + ".github.io";
return "";
}

function getBasePath(config) {
return String(config.baseUrl || "").replace(/\/$/, "");
}

function buildAbsoluteUrl(config, relPath) {
const site = getSiteUrl(config);
const base = getBasePath(config);
const normalized = relPath.startsWith("/") ? relPath : "/" + relPath;
return site + base + normalized;
}

function getPostCanonicalUrl(config, slug) {
return buildAbsoluteUrl(config, "/posts/" + slug + ".html");
}

function getPostMarkdownUrl(config, slug) {
return buildAbsoluteUrl(config, "/posts/" + slug + ".md");
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

// Build llms.txt entries from every source/_posts/*.md file (authoritative list).
function resolveLlmsEntries(docsDir, postsIndex) {
const sourceDir = path.join(process.cwd(), "source", "_posts");
if (fs.existsSync(sourceDir)) {
const files = listPostFiles();
if (files.length > 0) {
return sortPostsByDateDesc(files.map(parseMarkdownFile).map((post) => ({
title: post.title,
slug: post.slug,
date: post.date,
excerpt: post.excerpt
})));
}
}
const bySlug = new Map();
postsIndex.forEach((post) => bySlug.set(post.slug, post));
const postsDir = path.join(docsDir, "posts");
if (fs.existsSync(postsDir)) {
fs.readdirSync(postsDir)
.filter((f) => f.endsWith(".md"))
.forEach((f) => {
const slug = f.slice(0, -3);
if (!bySlug.has(slug)) {
console.warn(`llms.txt: adding orphan .md mirror not in posts.json: ${slug}`);
bySlug.set(slug, { slug, title: slug, excerpt: "" });
}
});
}
const ordered = [];
const seen = new Set();
postsIndex.forEach((post) => {
if (bySlug.has(post.slug)) {
ordered.push(bySlug.get(post.slug));
seen.add(post.slug);
}
});
bySlug.forEach((post, slug) => {
if (!seen.has(slug)) ordered.push(post);
});
return ordered;
}

function renderLlmsTxt(config, entries) {
const site = getSiteUrl(config);
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
"## Posts (" + entries.length + ")"
];
entries.forEach((post) => {
const mdUrl = getPostMarkdownUrl(config, post.slug);
const title = post.title || post.slug;
const excerpt = post.excerpt ? " — " + post.excerpt : "";
lines.push("- [" + title + "](" + mdUrl + ")" + excerpt);
});
lines.push("");
return lines.join("\n");
}

function writeLlmsTxtFromEntries(docsDir, config, entries) {
const postsDir = path.join(docsDir, "posts");
entries.forEach((post) => {
const mdPath = path.join(postsDir, post.slug + ".md");
if (!fs.existsSync(mdPath)) {
console.warn(`llms.txt: source post listed but .md mirror missing (run build/render): ${post.slug}`);
}
});
const txt = renderLlmsTxt(config, entries);
fs.writeFileSync(path.join(docsDir, "llms.txt"), txt, "utf-8");
}

function writeLlmsTxt(docsDir, config, postsIndex) {
if (config.agentMarkdown === false) return;
writeLlmsTxtFromEntries(docsDir, config, resolveLlmsEntries(docsDir, postsIndex));
}

function escapeXml(text) {
return String(text)
.replace(/&/g, "&amp;")
.replace(/</g, "&lt;")
.replace(/>/g, "&gt;")
.replace(/"/g, "&quot;")
.replace(/'/g, "&apos;");
}

function toSitemapLastmod(dateValue) {
if (!dateValue) return "";
const d = new Date(dateValue);
if (Number.isNaN(d.getTime())) return "";
return d.toISOString().slice(0, 10);
}

function renderRobotsTxt(config) {
const sitemapUrl = buildAbsoluteUrl(config, "/sitemap.xml");
return [
"User-agent: *",
"Allow: /",
"",
"Sitemap: " + sitemapUrl,
""
].join("\n");
}

function renderSitemapXml(config, entries) {
const urls = [
{ loc: buildAbsoluteUrl(config, "/"), changefreq: "daily", priority: "1.0" }
];
entries.forEach((post) => {
urls.push({
loc: getPostCanonicalUrl(config, post.slug),
lastmod: toSitemapLastmod(post.date),
changefreq: "monthly",
priority: "0.8"
});
});
if (config.agentMarkdown !== false) {
urls.push({
loc: buildAbsoluteUrl(config, "/llms.txt"),
changefreq: "weekly",
priority: "0.6"
});
entries.forEach((post) => {
urls.push({
loc: getPostMarkdownUrl(config, post.slug),
lastmod: toSitemapLastmod(post.date),
changefreq: "monthly",
priority: "0.5"
});
});
}
const body = urls.map((entry) => {
let chunk = "  <url>\n    <loc>" + escapeXml(entry.loc) + "</loc>";
if (entry.lastmod) chunk += "\n    <lastmod>" + entry.lastmod + "</lastmod>";
if (entry.changefreq) chunk += "\n    <changefreq>" + entry.changefreq + "</changefreq>";
if (entry.priority) chunk += "\n    <priority>" + entry.priority + "</priority>";
chunk += "\n  </url>";
return chunk;
}).join("\n");
return '<?xml version="1.0" encoding="UTF-8"?>\n'
+ '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
+ body + "\n"
+ "</urlset>\n";
}

function writeRobotsTxt(docsDir, config) {
const txt = renderRobotsTxt(config);
fs.writeFileSync(path.join(docsDir, "robots.txt"), txt, "utf-8");
}

function writeSitemapXml(docsDir, config, entries) {
const xml = renderSitemapXml(config, entries);
fs.writeFileSync(path.join(docsDir, "sitemap.xml"), xml, "utf-8");
}

// Regenerate llms.txt, robots.txt, and sitemap.xml (shared by build + render).
function writeSiteDiscoveryArtifacts(docsDir, config, postsIndex) {
const entries = resolveLlmsEntries(docsDir, postsIndex);
if (config.agentMarkdown !== false) {
writeLlmsTxtFromEntries(docsDir, config, entries);
}
writeRobotsTxt(docsDir, config);
writeSitemapXml(docsDir, config, entries);
}

function renderPostAlternateLink(config, slug) {
if (config.agentMarkdown === false) return "";
const mdUrl = getPostMarkdownUrl(config, slug);
return '<link rel="alternate" type="text/markdown" href="' + mdUrl + '">';
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

function buildPostIncludes(config, post) {
const headerPath = config.postHeader || "source/_includes/post-header.html";
const footerPath = config.postFooter || "source/_includes/post-footer.html";
const bodyMetaPath = config.postBodyMeta || "source/_includes/post-body-meta.html";
const bodyAttributionPath = config.postBodyAttribution || "source/_includes/post-body-attribution.html";
const templateVars = buildPostTemplateVars(config, post);
const headerHtml = post.showHeader
? renderTemplate(loadPostIncludeFile(headerPath), templateVars)
: "";
const bodyMetaHtml = post.showFooter
? renderTemplate(loadPostIncludeFile(bodyMetaPath), templateVars)
: "";
const footerHtml = post.showFooter
? renderTemplate(loadPostIncludeFile(footerPath), templateVars)
: "";
const bodyAttributionHtml = post.showFooter
? renderTemplate(loadPostIncludeFile(bodyAttributionPath), templateVars)
: "";
return { headerHtml, bodyMetaHtml, footerHtml, bodyAttributionHtml };
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
loadConfig, copyStaticAssets, parseMarkdownFile, renderTemplate, listPostFiles,
renderTagsHtml, sortPostsByDateDesc, renderRecentPostsHtml,
loadPostsIndex, savePostsIndex,
resolvePostIncludeFlags, loadPostIncludeFile, buildPostIncludes,
getDefaultPostAuthor, getDefaultPostSource, getPostAuthor, getPostSource, formatPostAttributionFrontMatter, buildPostTemplateVars, getSiteUrl, getPostCanonicalUrl, getPostMarkdownUrl,
buildAgentMarkdown, writeAgentMarkdownFile, renderLlmsTxt, writeLlmsTxt, renderPostAlternateLink,
renderRobotsTxt, renderSitemapXml, writeRobotsTxt, writeSitemapXml, writeSiteDiscoveryArtifacts,
buildAbsoluteUrl, resolveLlmsEntries
};
