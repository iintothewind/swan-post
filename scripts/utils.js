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
// { title, date, tags, categories, slug, contentHtml, excerpt }
// slug 从文件名去掉 .md 后缀得到
function parseMarkdownFile(filePath) {
const raw = fs.readFileSync(filePath, "utf-8");
const { data, content } = matter(raw);
const slug = path.basename(filePath, ".md");
const contentHtml = md.render(content);
const plainText = content.replace(/[#*`>\-\[\]!]/g, "").replace(/\n+/g, " ").trim();
const excerpt = plainText.slice(0, 100);
const dateStr = data.date ? String(data.date) : "";
const formattedDate = dateStr ? new Date(dateStr).toISOString().split("T")[0] : "";
return {
title: data.title || slug,
date: dateStr,
formattedDate,
tags: data.tags || [],
categories: data.categories || [],
slug,
contentHtml,
excerpt
};
}

// 简单占位符替换：template 是模板字符串，vars 是 { KEY: value } 对象
// 把模板中所有 {{KEY}} 替换为 value
function renderTemplate(template, vars) {
let result = template;
for (const key in vars) {
const re = new RegExp("{{" + key + "}}", "g");
result = result.replace(re, vars[key]);
}
return result;
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
function renderTagsHtml(tags) {
const list = Array.isArray(tags) ? tags : (typeof tags === "string" && tags.trim() ? tags.split(",").map((s) => s.trim()).filter(Boolean) : []);
return list.map((t) => `<span class="tag-pill">${t}</span>`).join("");
}

// 按 date 字段对文章数组做倒序排序 (最新在前)，返回新数组，不修改传入的原数组
function sortPostsByDateDesc(posts) {
return posts.slice().sort((a, b) => (b.formattedDate || "").localeCompare(a.formattedDate || ""));
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
return `<article class="recent-post-item">
<h2><a href="${config.baseUrl}/${post.url}">${post.title}</a></h2>
<div class="post-meta">
<span class="post-date">${post.formattedDate}</span>
<span class="post-tags">${renderTagsHtml(post.tags)}</span>
</div>
<p class="post-excerpt">${post.excerpt}...</p>
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
