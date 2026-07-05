const fs = require("fs-extra");
const path = require("path");
const {
loadConfig, parseMarkdownFile, renderTemplate,
renderTagsHtml, loadPostsIndex, savePostsIndex
} = require("./utils");
const { renderHomepage } = require("./build");

function renderOne(mdFilePath) {
const config = loadConfig();
const docsDir = path.join(process.cwd(), "docs");

// 1. 如果 docs 目录还不存在基础结构，先做最基础的初始化 (css/js/prism/posts 目录)
fs.ensureDirSync(path.join(docsDir, "posts"));
fs.ensureDirSync(path.join(docsDir, "css"));
fs.ensureDirSync(path.join(docsDir, "js"));
fs.ensureDirSync(path.join(docsDir, "prism"));
// 只在文件不存在时才拷贝，避免覆盖用户可能已手动更新的资源
if (!fs.existsSync(path.join(docsDir, "css", "style.css"))) {
fs.copySync(path.join(process.cwd(), "assets", "css"), path.join(docsDir, "css"));
}
if (!fs.existsSync(path.join(docsDir, "js", "main.js"))) {
fs.copySync(path.join(process.cwd(), "assets", "js"), path.join(docsDir, "js"));
}
if (!fs.existsSync(path.join(docsDir, "prism", "prism.min.js"))) {
fs.copySync(path.join(process.cwd(), "assets", "prism"), path.join(docsDir, "prism"));
}

// 2. 解析这一篇 markdown
const absPath = path.isAbsolute(mdFilePath) ? mdFilePath : path.join(process.cwd(), mdFilePath);
const post = parseMarkdownFile(absPath);

// 3. 渲染该文章的 html 并写入 docs/posts/<slug>.html
const postTpl = fs.readFileSync(path.join(process.cwd(), "templates", "post.html"), "utf-8");
const layoutTpl = fs.readFileSync(path.join(process.cwd(), "templates", "layout.html"), "utf-8");

const postHtml = renderTemplate(postTpl, {
POST_TITLE: post.title,
POST_DATE_FORMATTED: post.formattedDate,
POST_TAGS_HTML: renderTagsHtml(post.tags),
POST_CONTENT_HTML: post.contentHtml,
BASE_URL: config.baseUrl
});
const fullHtml = renderTemplate(layoutTpl, {
PAGE_TITLE: post.title,
SITE_TITLE: config.title,
BASE_URL: config.baseUrl,
CONTENT: postHtml
});
const outputPath = path.join(docsDir, "posts", post.slug + ".html");
fs.writeFileSync(outputPath, fullHtml, "utf-8");

// 4. 更新 docs/posts.json：如果该 slug 已存在则替换，否则新增，然后按 date 重新排序保存
const index = loadPostsIndex();
const entry = {
title: post.title,
date: post.date,
tags: post.tags,
categories: post.categories,
slug: post.slug,
url: "posts/" + post.slug + ".html",
excerpt: post.excerpt
};
const existingIdx = index.findIndex((p) => p.slug === post.slug);
if (existingIdx >= 0) {
index[existingIdx] = entry;
} else {
index.push(entry);
}
const sortedIndex = savePostsIndex(index);

// 5. 重新生成首页 —— 这一步不能省略。因为这篇文章有可能刚好进入"最近 N 篇"的名单，
// 如果不重新生成首页，新文章能在 sidebar 里点开，但首页正文区域看不到它。
renderHomepage(config, sortedIndex);

console.log(`已渲染：${outputPath}`);
console.log(`已更新索引：docs/posts.json`);
console.log(`已刷新首页：docs/index.html`);
}

module.exports = { renderOne };
