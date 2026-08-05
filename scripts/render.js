const fs = require("fs-extra");
const path = require("path");
const {
loadConfig, parseMarkdownFile, renderTemplate, copyStaticAssets,
renderTagsHtml, loadPostsIndex, savePostsIndex
} = require("./utils");
const { renderHomepage } = require("./build");

function renderOne(mdFilePath) {
const config = loadConfig();
const docsDir = path.join(process.cwd(), "docs");

// 1. If the docs directory doesn't have the basic structure yet, do minimal init (css/js/prism/posts dirs)
fs.ensureDirSync(path.join(docsDir, "posts"));
// Copy static assets (css/js/prism from assets/, katex + mermaid from node_modules);
// only copy missing files, to avoid overwriting resources the user may have manually updated
copyStaticAssets(docsDir, false);

// 2. Parse this markdown file
const absPath = path.isAbsolute(mdFilePath) ? mdFilePath : path.join(process.cwd(), mdFilePath);
const post = parseMarkdownFile(absPath);

// 3. Render the post HTML and write to docs/posts/<slug>.html
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
  SIDEBAR_POST_COUNT: config.sidebarPostCount || 200,
  CONTENT: postHtml
});
const outputPath = path.join(docsDir, "posts", post.slug + ".html");
fs.writeFileSync(outputPath, fullHtml, "utf-8");

// 4. Update docs/posts.json: replace if the slug already exists, otherwise append, then re-sort by date and save
const index = loadPostsIndex();
const entry = {
title: post.title,
date: post.date,
formattedDate: post.formattedDate,
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

// 5. Regenerate the homepage — this step cannot be skipped. The post may just happen to enter the
// "recent N posts" list; without regenerating the homepage, the new post would be reachable from
// the sidebar but invisible in the homepage body area.
renderHomepage(config, sortedIndex);

console.log(`Rendered: ${outputPath}`);
console.log(`Index updated: docs/posts.json`);
console.log(`Homepage refreshed: docs/index.html`);
}

module.exports = { renderOne };
