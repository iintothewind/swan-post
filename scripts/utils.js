const fs = require("fs-extra");
const path = require("path");
const matter = require("gray-matter");
const MarkdownIt = require("markdown-it");

const md = new MarkdownIt({
html: true,
linkify: true,
});

// 读取 blog.config.json，返回配置对象
function loadConfig() {
const configPath = path.join(process.cwd(), "blog.config.json");
return fs.readJsonSync(configPath);
}

// 解析单个 markdown 文件，返回:
// { title, date, formattedDate, tags, categories, slug, contentHtml, excerpt }
// slug 从文件名去掉 .md 后缀得到
function parseMarkdownFile(filePath) {
const raw = fs.readFileSync(filePath, "utf-8");
const { data, content } = matter(raw);
const slug = path.basename(filePath, ".md");
const contentHtml = md.render(content);
// 生成摘要：剥 HTML 标签 → 解码实体（&amp; → &，用 markdown-it 自带的 unescapeAll，
// 避免手写不完整的实体表）→ 空白归一 → 按 grapheme 截断 100 个可见字符
// （Intl.Segmenter 按用户可感知字符切分，不会截出半个 emoji / 代理对）。
const plainText = md.utils.unescapeAll(contentHtml.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim());
const excerpt = truncateGraphemes(plainText, 100);
const rawDate = data.date instanceof Date ? data.date : (data.date ? new Date(data.date) : null);
const dateStr = rawDate ? rawDate.toISOString() : "";
// 显示日期取 UTC 的 YYYY-MM-DD：js-yaml 把无时区的 front-matter 日期按 UTC 解析（YAML 1.1 规范），
// 所以 UTC 日期恒等于作者在 front-matter 里写的日期。若用本地时间（getFullYear/getMonth/getDate），
// 在 UTC+7/8 等时区会把深夜发布的文章显示成"次日"，导致时间线日期错位。
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

// 简单占位符替换：template 是模板字符串，vars 是 { KEY: value } 对象
// 把模板中所有 {{KEY}} 替换为 value
// 注意：替换前先把每个 value 里的 "{{" 打上哨兵，避免 value 中恰好出现的 {{KEY}} 字面量
// （例如正文里讲到模板引擎时写的 {{PAGE_TITLE}}）被后续占位符的全局替换误伤；
// 全部替换完成后再把哨兵还原为 "{{"。
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

// 按“用户可感知字符”(grapheme) 截断字符串到 n 个字符，
// 避免 String.prototype.slice 按 UTF-16 code unit 切出半个 emoji / 代理对
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

// 返回 source/_posts 目录下所有 .md 文件的绝对路径数组
function listPostFiles() {
const dir = path.join(process.cwd(), "source", "_posts");
fs.ensureDirSync(dir);
return fs.readdirSync(dir)
.filter((f) => f.endsWith(".md"))
.map((f) => path.join(dir, f));
}

// 把 tags 数组渲染成 HTML: <span class="tag-pill">xxx</span> 拼接
// tag 来自 front-matter，属于不可信文本，先转义再拼 HTML
function renderTagsHtml(tags) {
const list = Array.isArray(tags) ? tags : [];
return list.map((t) => `<span class="tag-pill">${md.utils.escapeHtml(t)}</span>`).join("");
}

// 按 date 字段对文章数组做倒序排序 (最新在前)，返回新数组，不修改传入的原数组
// 无 date 字段的文章排到末尾（"不知道什么时候写的"当作最旧），避免空串排到最前
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

// 生成首页"最近文章"列表的 HTML。
// posts: 已经按 date 倒序排好的 posts.json 条目数组
// count: 展示条数 (来自 blog.config.json 的 recentPostsCount，缺省 10)
// config: blog.config.json 内容，用来拼接 baseUrl
function renderRecentPostsHtml(posts, count, config) {
const list = posts.slice(0, count);
if (list.length === 0) {
return '<p class="post-excerpt">还没有发布任何文章。</p>';
}
return list.map((post) => {
// title / excerpt 来自文章 front-matter 与正文，属于不可信文本，先转义再拼 HTML
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

// 读取/写入 docs/posts.json(数组)，自动按 date 倒序排序后写回
function loadPostsIndex() {
const p = path.join(process.cwd(), "docs", "posts.json");
if (!fs.existsSync(p)) return [];
return fs.readJsonSync(p);
}

// 排序后写入 docs/posts.json，并返回排序后的数组供调用方直接复用
// (调用方通常紧接着要用这个排序好的数组去生成首页最近文章列表，不需要再排一次)
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
