const { getPostCanonicalUrl, buildAbsoluteUrl } = require("./config");
const { escapeXml } = require("./discovery-artifacts");
const { sortPostsByDateDesc } = require("./posts-index");
const { getPostAuthor } = require("./attribution");

// Spec: the feed carries at most the 50 newest posts.
const FEED_ITEM_LIMIT = 50;

// Wrap raw HTML in CDATA, splitting on the CDATA close sequence so content that
// happens to contain "]]>" still yields well-formed XML.
function cdataWrap(html) {
return "<![CDATA[" + String(html).split("]]>").join("]]]]><![CDATA[>") + "]]>";
}

// Render the full RSS 2.0 feed as a string.
// posts: full parsed post objects (parseMarkdownFile output) — contentHtml and
// author are read per item, which slim posts.json index entries do not carry.
// Sorted by date descending internally; callers may pass an unsorted array.
function renderFeedXml(config, posts) {
const sorted = sortPostsByDateDesc(posts);
const items = sorted.slice(0, FEED_ITEM_LIMIT);
const lines = [];
lines.push('<?xml version="1.0" encoding="UTF-8"?>');
lines.push('<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" ' +
'xmlns:content="http://purl.org/rss/1.0/modules/content/" ' +
'xmlns:atom="http://www.w3.org/2005/Atom">');
lines.push("  <channel>");
lines.push("    <title>" + escapeXml(config.title) + "</title>");
lines.push("    <link>" + escapeXml(buildAbsoluteUrl(config, "/")) + "</link>");
lines.push("    <description>" + escapeXml(config.description || "") + "</description>");
lines.push("    <language>en-us</language>");
lines.push('    <atom:link rel="self" href="' + escapeXml(buildAbsoluteUrl(config, "/feed.xml")) + '"/>');
if (items.length > 0 && items[0].date) {
const latestPubDate = new Date(items[0].date).toUTCString();
lines.push("    <pubDate>" + latestPubDate + "</pubDate>");
lines.push("    <lastBuildDate>" + latestPubDate + "</lastBuildDate>");
}
items.forEach((post) => {
const link = getPostCanonicalUrl(config, post.slug);
const pubDate = post.date ? new Date(post.date).toUTCString() : "";
lines.push("    <item>");
lines.push("      <title>" + escapeXml(post.title) + "</title>");
lines.push("      <link>" + escapeXml(link) + "</link>");
lines.push('      <guid isPermaLink="true">' + escapeXml(link) + "</guid>");
if (pubDate) lines.push("      <pubDate>" + pubDate + "</pubDate>");
lines.push("      <description>" + escapeXml(post.excerpt || "") + "</description>");
lines.push("      <dc:creator>" + escapeXml(getPostAuthor(config, post)) + "</dc:creator>");
lines.push("      <content:encoded>" + cdataWrap(post.contentHtml) + "</content:encoded>");
lines.push("    </item>");
});
lines.push("  </channel>");
lines.push("</rss>");
return lines.join("\n") + "\n";
}

module.exports = { renderFeedXml };
