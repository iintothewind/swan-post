const fs = require("fs-extra");
const path = require("path");
const {
loadConfig, parseMarkdownFile, renderTemplate, copyStaticAssets,
listPostFiles, renderTagsHtml, renderRecentPostsHtml, savePostsIndex, buildPostIncludes,
buildAgentMarkdown, writeAgentMarkdownFile, renderPostAlternateLink,
writeSiteDiscoveryArtifacts, renderFeedXml, renderFeedJson, renderPostSocialMeta,
renderLayout, renderPostLinkList
} = require("./utils");

// Generate the homepage docs/index.html.
// postsIndexSorted must be the posts.json entries array already sorted by date descending
// (savePostsIndex returns a sorted array — pass it directly, don't re-sort).
// render.js also calls this function during incremental rendering, so new posts
// appear on the homepage as soon as they enter the recent N list.
function renderHomepage(config, postsIndexSorted) {
const docsDir = path.join(process.cwd(), "docs");
const indexTpl = fs.readFileSync(path.join(process.cwd(), "templates", "index.html"), "utf-8");

const recentCount = config.recentPostsCount || 10;
const recentPostsHtml = renderRecentPostsHtml(postsIndexSorted, recentCount, config);

const homeContent = renderTemplate(indexTpl, {
SITE_TITLE: config.title,
SITE_DESCRIPTION: config.description,
RECENT_POSTS_HTML: recentPostsHtml
});
const homeHtml = renderLayout(config, {
  pageTitle: "Home",
  content: homeContent
});
fs.writeFileSync(path.join(docsDir, "index.html"), homeHtml, "utf-8");
}

// Generate the 404 fallback (docs/404.html). GitHub Pages serves it for any path
// that doesn't resolve, which makes it the natural place to hand a lost agent a
// route back: a static post list plus pointers to posts.json / llms.txt.
// The suggestions depend on the post index, so it is regenerated alongside the
// homepage on every build and every incremental render.
function render404(config, postsIndexSorted) {
const docsDir = path.join(process.cwd(), "docs");
const tpl = fs.readFileSync(path.join(process.cwd(), "templates", "404.html"), "utf-8");
const count = config.notFoundPostCount || 20;
const content = renderTemplate(tpl, {
SITE_TITLE: config.title,
BASE_URL: config.baseUrl,
NOT_FOUND_POSTS_HTML: renderPostLinkList(postsIndexSorted, count, config)
});
const html = renderLayout(config, {
pageTitle: "404 Not Found",
content,
// A 404 is served at arbitrary URLs; keep them out of the index.
headHtml: '<meta name="robots" content="noindex">'
});
fs.writeFileSync(path.join(docsDir, "404.html"), html, "utf-8");
}

function build() {
const config = loadConfig();
const docsDir = path.join(process.cwd(), "docs");

// 1. Clear and rebuild the docs directory structure
fs.emptyDirSync(docsDir);
fs.ensureDirSync(path.join(docsDir, "posts"));

  // 2. Copy static assets (css/js/prism from assets/, katex + mermaid from node_modules)
  copyStaticAssets(docsDir, true);

// 3. Read post template (the layout is rendered by renderLayout; the homepage
// template is read later, internally by renderHomepage)
const postTpl = fs.readFileSync(path.join(process.cwd(), "templates", "post.html"), "utf-8");

// 4. Parse all markdown posts
const files = listPostFiles();
const posts = files.map(parseMarkdownFile);

// 5. Generate an HTML page for each post
posts.forEach((post) => {
const { headerHtml, bodyMetaHtml, footerHtml, bodyAttributionHtml } = buildPostIncludes(config, post);
const postHtml = renderTemplate(postTpl, {
POST_TITLE: post.title,
POST_DATE_FORMATTED: post.formattedDate,
POST_TAGS_HTML: renderTagsHtml(post.tags),
POST_HEADER_HTML: headerHtml,
POST_BODY_META_HTML: bodyMetaHtml,
POST_CONTENT_HTML: post.contentHtml,
POST_BODY_ATTRIBUTION_HTML: bodyAttributionHtml,
POST_FOOTER_HTML: footerHtml,
BASE_URL: config.baseUrl
});
const agentMd = buildAgentMarkdown(config, post);
const fullHtml = renderLayout(config, {
  pageTitle: post.title,
  content: postHtml,
  postAlternateMd: renderPostAlternateLink(config, post.slug),
  postMetaHtml: renderPostSocialMeta(post, config)
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
render404(config, sortedIndex);

// 8. Agent-readable mirrors + crawler discovery (llms.txt, robots.txt, sitemap.xml)
writeSiteDiscoveryArtifacts(docsDir, config, sortedIndex);

// 9. RSS + JSON feeds (docs/feed.xml, docs/feed.json) — both are serialized from
// buildFeedItems, so they cannot disagree on which posts they carry. Full parsed
// posts are needed because contentHtml/author are not in the posts.json index.
// renderFeedXml/renderFeedJson sort by date descending and keep the newest 50.
fs.writeFileSync(path.join(docsDir, "feed.xml"), renderFeedXml(config, posts), "utf-8");
fs.writeFileSync(path.join(docsDir, "feed.json"), renderFeedJson(config, posts), "utf-8");
console.log(`Build complete, ${posts.length} posts, output to docs/`);
}

module.exports = { build, renderHomepage, render404 };
