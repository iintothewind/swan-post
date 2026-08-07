const fs = require("fs-extra");
const path = require("path");
const {
loadConfig, parseMarkdownFile, renderTemplate, copyStaticAssets,
listPostFiles, renderTagsHtml, renderRecentPostsHtml, savePostsIndex, buildPostIncludes,
buildAgentMarkdown, writeAgentMarkdownFile, writeLlmsTxt, renderPostAlternateLink
} = require("./utils");

// Generate the homepage docs/index.html.
// postsIndexSorted must be the posts.json entries array already sorted by date descending
// (savePostsIndex returns a sorted array — pass it directly, don't re-sort).
// render.js also calls this function during incremental rendering, so new posts
// appear on the homepage as soon as they enter the recent N list.
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
  PAGE_TITLE: "Home",
  SITE_TITLE: config.title,
  BASE_URL: config.baseUrl,
  SIDEBAR_POST_COUNT: config.sidebarPostCount || 200,
  POST_ALTERNATE_MD: "",
  CONTENT: homeContent
});
fs.writeFileSync(path.join(docsDir, "index.html"), homeHtml, "utf-8");
}

function build() {
const config = loadConfig();
const docsDir = path.join(process.cwd(), "docs");

// 1. Clear and rebuild the docs directory structure
fs.emptyDirSync(docsDir);
fs.ensureDirSync(path.join(docsDir, "posts"));

  // 2. Copy static assets (css/js/prism from assets/, katex + mermaid from node_modules)
  copyStaticAssets(docsDir, true);

// 3. Read post templates (layout and homepage templates are read later during homepage generation, handled internally by renderHomepage)
const layoutTpl = fs.readFileSync(path.join(process.cwd(), "templates", "layout.html"), "utf-8");
const postTpl = fs.readFileSync(path.join(process.cwd(), "templates", "post.html"), "utf-8");

// 4. Parse all markdown posts
const files = listPostFiles();
const posts = files.map(parseMarkdownFile);

// 5. Generate an HTML page for each post
posts.forEach((post) => {
const { headerHtml, footerHtml, bodyAttributionHtml } = buildPostIncludes(config, post);
const postHtml = renderTemplate(postTpl, {
POST_TITLE: post.title,
POST_DATE_FORMATTED: post.formattedDate,
POST_TAGS_HTML: renderTagsHtml(post.tags),
POST_HEADER_HTML: headerHtml,
POST_CONTENT_HTML: post.contentHtml,
POST_BODY_ATTRIBUTION_HTML: bodyAttributionHtml,
POST_FOOTER_HTML: footerHtml,
BASE_URL: config.baseUrl
});
const agentMd = buildAgentMarkdown(config, post);
const fullHtml = renderTemplate(layoutTpl, {
  PAGE_TITLE: post.title,
  SITE_TITLE: config.title,
  BASE_URL: config.baseUrl,
  SIDEBAR_POST_COUNT: config.sidebarPostCount || 200,
  POST_ALTERNATE_MD: renderPostAlternateLink(config, post.slug),
  CONTENT: postHtml
});
fs.writeFileSync(path.join(docsDir, "posts", post.slug + ".html"), fullHtml, "utf-8");
writeAgentMarkdownFile(docsDir, post, agentMd);
});

// 6. Generate posts.json index (note the url field format: posts/<slug>.html)
// savePostsIndex automatically sorts by date descending, writes docs/posts.json, and returns the sorted array
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

// 7. Use the sorted index to generate the homepage (the homepage body shows the most recent N posts, where N comes from blog.config.json's recentPostsCount)
renderHomepage(config, sortedIndex);

// 8. Agent-readable Markdown mirrors + llms.txt (static GitHub Pages; no UA routing)
writeLlmsTxt(docsDir, config, sortedIndex);

console.log(`Build complete, ${posts.length} posts, output to docs/`);
}

module.exports = { build, renderHomepage };
