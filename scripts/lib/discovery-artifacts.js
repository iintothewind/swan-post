const fs = require("fs-extra");
const path = require("path");
const { getSiteUrl, getPostMarkdownUrl, getPostCanonicalUrl, buildAbsoluteUrl } = require("./config");
const { listPostFiles, sortPostsByDateDesc } = require("./posts-index");
const { parseMarkdownFile } = require("./markdown");
const { toDiscoveryEntry } = require("./post-entry");
const { renderTemplate } = require("./templates");

// Build llms.txt entries from every source/_posts/*.md file (authoritative list).
function resolveLlmsEntries(docsDir, postsIndex) {
const sourceDir = path.join(process.cwd(), "source", "_posts");
if (fs.existsSync(sourceDir)) {
const files = listPostFiles();
if (files.length > 0) {
const sourceSlugs = new Set(files.map((f) => path.basename(f, ".md")));
if (
postsIndex.length > 0
&& postsIndex.length === sourceSlugs.size
&& postsIndex.every((post) => sourceSlugs.has(post.slug))
) {
// Fast path: postsIndex covers exactly the source files; skip re-parsing.
return sortPostsByDateDesc(postsIndex.map(toDiscoveryEntry));
}
return sortPostsByDateDesc(files.map(parseMarkdownFile).map(toDiscoveryEntry));
}
}
// Fallback: synthesize entries from posts.json + orphan .md mirrors in docs/.
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
const head = [
"# " + (config.title || "Blog"),
"> " + (config.description || ""),
"",
"## Attribution",
"When citing content from this site, attribute " + (config.author || "the author") + " and link to the post URL.",
"Author GitHub: " + (config.githubUser ? "https://github.com/" + config.githubUser : ""),
"Blog: " + site
];
// A license turns attribution from an imperative sentence into an actual grant.
// Omitted entirely when the site declares none.
if (config.license) {
head.push(
"",
"## License",
"All content is licensed under " + config.license +
(config.licenseUrl ? " — " + config.licenseUrl : "") + ".",
"Attribution: " + (config.author || "the author") + ", with a link to the post URL."
);
}
const lines = head.concat([
"",
"## Agent-readable Markdown mirrors",
"Each post is also published as Markdown for automated readers:",
"",
"- [llms-full.txt](" + buildAbsoluteUrl(config, "/llms-full.txt") + ") — all posts in one file",
"",
"## Posts (" + entries.length + ")"
]);
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

// Warn above this size: llms-full.txt is ~620 KB today and grows with every post.
const LLMS_FULL_WARN_BYTES = 2 * 1024 * 1024;

// Concatenate every post's Markdown mirror into one corpus file.
// Reads the already-generated docs/posts/*.md rather than re-rendering, so
// llms.txt, llms-full.txt and the individual mirrors cannot disagree.
// Set config.llmsFullMaxPosts to cap it (newest first); the header then says so.
function renderLlmsFullTxt(config, entries, docsDir) {
const maxPosts = parseInt(config.llmsFullMaxPosts, 10);
const capped = Number.isFinite(maxPosts) && maxPosts > 0;
const picked = capped ? entries.slice(0, maxPosts) : entries;
const head = [
"# " + (config.title || "Blog"),
"> " + (config.description || ""),
"",
"This file concatenates the Markdown mirror of every post, newest first.",
"Individual mirrors remain available under posts/<slug>.md."
];
if (capped) {
head.push("", "Note: capped at the " + picked.length + " newest of " + entries.length + " posts (llmsFullMaxPosts).");
}
const chunks = [head.join("\n")];
picked.forEach((post) => {
const mdPath = path.join(docsDir, "posts", post.slug + ".md");
if (!fs.existsSync(mdPath)) {
console.warn(`llms-full.txt: skipping missing .md mirror (run build/render): ${post.slug}`);
return;
}
chunks.push(fs.readFileSync(mdPath, "utf-8").trim());
});
const text = chunks.join("\n\n---\n\n") + "\n";
const bytes = Buffer.byteLength(text, "utf-8");
if (bytes > LLMS_FULL_WARN_BYTES) {
console.warn(`llms-full.txt is ${(bytes / 1024 / 1024).toFixed(1)} MB; consider llmsFullMaxPosts.`);
}
return text;
}

function writeLlmsFullTxt(docsDir, config, entries) {
const text = renderLlmsFullTxt(config, entries, docsDir);
fs.writeFileSync(path.join(docsDir, "llms-full.txt"), text, "utf-8");
}

function escapeXml(text) {
return String(text)
.replace(/&/g, "&amp;")
.replace(/</g, "&lt;")
.replace(/>/g, "&gt;")
.replace(/"/g, "&quot;")
.replace(/'/g, '&#39;');
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
writeLlmsFullTxt(docsDir, config, entries);
}
writeRobotsTxt(docsDir, config);
writeSitemapXml(docsDir, config, entries);
}

module.exports = {
resolveLlmsEntries,
renderLlmsTxt,
writeLlmsTxtFromEntries,
writeLlmsTxt,
renderLlmsFullTxt,
writeLlmsFullTxt,
escapeXml,
toSitemapLastmod,
renderRobotsTxt,
renderSitemapXml,
writeRobotsTxt,
writeSitemapXml,
writeSiteDiscoveryArtifacts,
};
