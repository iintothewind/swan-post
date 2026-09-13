const { getPostCanonicalUrl, buildAbsoluteUrl } = require("./config");
const { escapeXml } = require("./discovery-artifacts");
const { sortPostsByDateDesc } = require("./posts-index");
const { getPostAuthor } = require("./attribution");

// Spec: the feed carries at most the 50 newest posts.
const FEED_ITEM_LIMIT = 50;

// JSON Feed 1.1 identifies itself by URL, not by a bare version number.
const JSON_FEED_VERSION = "https://jsonfeed.org/version/1.1";

// RSS wants RFC 822, JSON Feed wants RFC 3339. Both fall back to "" for a missing
// or unparseable date: an "Invalid Date" string would poison the feed, and
// toISOString() would outright throw on a bad date.
function toRfc822(value) {
if (!value) return "";
const d = new Date(value);
return Number.isNaN(d.getTime()) ? "" : d.toUTCString();
}

function toRfc3339(value) {
if (!value) return "";
const d = new Date(value);
return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

// The single normalization step behind both feeds. Two serializers, one source:
// separate per-format item builders would drift the moment a field changes.
// posts: full parsed post objects (parseMarkdownFile output) — contentHtml and
// author are read per item, which slim posts.json index entries do not carry.
// Sorted by date descending internally; callers may pass an unsorted array.
function buildFeedItems(config, posts) {
const sorted = sortPostsByDateDesc(posts);
return sorted.slice(0, FEED_ITEM_LIMIT).map((post) => {
const link = getPostCanonicalUrl(config, post.slug);
return {
title: post.title || "",
link,
// The permalink is permanent, so it serves as both URL and id/guid.
guid: link,
pubDate: toRfc822(post.date),
datePublished: toRfc3339(post.date),
excerpt: post.excerpt || "",
author: getPostAuthor(config, post),
contentHtml: post.contentHtml || "",
tags: Array.isArray(post.tags) ? post.tags.slice() : []
};
});
}

// Wrap raw HTML in CDATA, splitting on the CDATA close sequence so content that
// happens to contain "]]>" still yields well-formed XML.
function cdataWrap(html) {
return "<![CDATA[" + String(html).split("]]>").join("]]]]><![CDATA[>") + "]]>";
}

// Render the full RSS 2.0 feed as a string.
function renderFeedXml(config, posts) {
const items = buildFeedItems(config, posts);
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
if (items.length > 0 && items[0].pubDate) {
lines.push("    <pubDate>" + items[0].pubDate + "</pubDate>");
lines.push("    <lastBuildDate>" + items[0].pubDate + "</lastBuildDate>");
}
items.forEach((item) => {
lines.push("    <item>");
lines.push("      <title>" + escapeXml(item.title) + "</title>");
lines.push("      <link>" + escapeXml(item.link) + "</link>");
lines.push('      <guid isPermaLink="true">' + escapeXml(item.guid) + "</guid>");
if (item.pubDate) lines.push("      <pubDate>" + item.pubDate + "</pubDate>");
lines.push("      <description>" + escapeXml(item.excerpt) + "</description>");
lines.push("      <dc:creator>" + escapeXml(item.author) + "</dc:creator>");
lines.push("      <content:encoded>" + cdataWrap(item.contentHtml) + "</content:encoded>");
lines.push("    </item>");
});
lines.push("  </channel>");
lines.push("</rss>");
return lines.join("\n") + "\n";
}

// Render the JSON Feed 1.1 document as a string. Same items as renderFeedXml.
function renderFeedJson(config, posts) {
const items = buildFeedItems(config, posts);
const feed = {
version: JSON_FEED_VERSION,
title: config.title || "",
home_page_url: buildAbsoluteUrl(config, "/"),
feed_url: buildAbsoluteUrl(config, "/feed.json"),
description: config.description || "",
language: "en-us",
authors: config.author ? [{ name: String(config.author) }] : [],
items: items.map((item) => ({
id: item.guid,
url: item.link,
title: item.title,
summary: item.excerpt || undefined,
content_html: item.contentHtml,
date_published: item.datePublished || undefined,
authors: item.author ? [{ name: item.author }] : [],
tags: item.tags.length ? item.tags : undefined
}))
};
// JSON.stringify drops undefined fields, so optional keys simply disappear
// instead of being emitted as null.
return JSON.stringify(feed, null, 2) + "\n";
}

module.exports = {
renderFeedXml,
renderFeedJson,
buildFeedItems,
JSON_FEED_VERSION,
FEED_ITEM_LIMIT,
};
