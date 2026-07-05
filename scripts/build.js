const fs = require("fs-extra");
const path = require("path");
const {
loadConfig, parseMarkdownFile, renderTemplate,
listPostFiles, renderTagsHtml, renderRecentPostsHtml, savePostsIndex
} = require("./utils");

// 生成首页 docs/index.html。
// postsIndexSorted 必须是已经按 date 倒序排好的 posts.json 条目数组
// (savePostsIndex 的返回值就是排好序的，直接传进来用即可，不要重复排序)。
// render.js 增量渲染时也会调用这个函数，保证新文章一旦进入最近 N 篇就能立刻反映到首页。
function renderHomepage(config, postsIndexSorted) {
const docsDir = path.join(process.cwd(), "docs");
const layoutTpl = fs.readFileSync(path.join(process.cwd(), "templates", "layout.html"), "utf-8");
const indexTpl = fs.readFileSync(path.join(process.cwd(), "templates", "index.html"), "utf-8");

const recentCount = config.recentPostsCount || 10;
const recentPostsHtml = renderRecentPostsHtml(postsIndexSorted, recentCount, config);

const homeContent = renderTemplate(indexTpl, {
SITE_TITLE: config.title,
SITE_DESCRIPTION: config.description,
RECENT_POSTS_HTML: recentPostsHtml
});
const homeHtml = renderTemplate(layoutTpl, {
PAGE_TITLE: "首页",
SITE_TITLE: config.title,
BASE_URL: config.baseUrl,
CONTENT: homeContent
});
fs.writeFileSync(path.join(docsDir, "index.html"), homeHtml, "utf-8");
}

function build() {
const config = loadConfig();
const docsDir = path.join(process.cwd(), "docs");

// 1. 清空并重建 docs 目录结构
fs.emptyDirSync(docsDir);
fs.ensureDirSync(path.join(docsDir, "posts"));
fs.ensureDirSync(path.join(docsDir, "css"));
fs.ensureDirSync(path.join(docsDir, "js"));
fs.ensureDirSync(path.join(docsDir, "prism"));

  // 2. 拷贝静态资源
  fs.copySync(path.join(process.cwd(), "assets", "css"), path.join(docsDir, "css"));
  fs.copySync(path.join(process.cwd(), "assets", "js"), path.join(docsDir, "js"));
  fs.copySync(path.join(process.cwd(), "assets", "prism"), path.join(docsDir, "prism"));

// 3. 读取文章模板 (布局模板和首页模板留到生成首页那一步再读，由 renderHomepage 内部处理)
const layoutTpl = fs.readFileSync(path.join(process.cwd(), "templates", "layout.html"), "utf-8");
const postTpl = fs.readFileSync(path.join(process.cwd(), "templates", "post.html"), "utf-8");

// 4. 解析所有 markdown 文章
const files = listPostFiles();
const posts = files.map(parseMarkdownFile);

// 5. 为每篇文章生成 html 页面
posts.forEach((post) => {
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
fs.writeFileSync(path.join(docsDir, "posts", post.slug + ".html"), fullHtml, "utf-8");
});

// 6. 生成 posts.json 索引 (注意 url 字段格式：posts/<slug>.html)
// savePostsIndex 会自动按 date 倒序排序并写入 docs/posts.json，同时把排好序的数组 return 回来
const postsIndex = posts.map((post) => ({
title: post.title,
date: post.date,
formattedDate: post.formattedDate,
tags: post.tags,
categories: post.categories,
slug: post.slug,
url: "posts/" + post.slug + ".html",
excerpt: post.excerpt
}));
const sortedIndex = savePostsIndex(postsIndex);

// 7. 用排好序的索引生成首页 (首页正文区域展示最近 N 篇文章，N 来自 blog.config.json 的 recentPostsCount)
renderHomepage(config, sortedIndex);

console.log(`构建完成，共 ${posts.length} 篇文章，输出到 docs/`);
}

module.exports = { build, renderHomepage };
