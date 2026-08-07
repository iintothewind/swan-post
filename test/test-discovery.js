"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  escapeXml,
  renderRobotsTxt,
  renderSitemapXml,
  buildAbsoluteUrl,
} = require("../scripts/utils");

const config = {
  siteUrl: "https://example.com",
  agentMarkdown: true,
  title: "Test Blog",
  description: "A test site",
  author: "Test Author",
};

const entries = [
  {
    title: "First Post",
    slug: "2026-01-01-first",
    date: "2026-01-01",
    excerpt: "Hello",
  },
  {
    title: "Second & Post",
    slug: "2026-01-02-second",
    date: "2026-01-02T12:00:00Z",
    excerpt: "World",
  },
];

describe("escapeXml", () => {
  it("escapes XML special characters", () => {
    assert.equal(
      escapeXml('a&b<c>d"e\'f'),
      "a&amp;b&lt;c&gt;d&quot;e&#39;f"
    );
  });
});

describe("buildAbsoluteUrl", () => {
  it("joins siteUrl and path", () => {
    assert.equal(buildAbsoluteUrl(config, "/sitemap.xml"), "https://example.com/sitemap.xml");
  });
});

describe("renderRobotsTxt", () => {
  it("allows all crawlers and declares sitemap", () => {
    const txt = renderRobotsTxt(config);
    assert.match(txt, /^User-agent: \*\nAllow: \/\n\nSitemap: https:\/\/example\.com\/sitemap\.xml\n$/);
  });
});

describe("renderSitemapXml", () => {
  it("includes homepage, posts, llms.txt, and md mirrors", () => {
    const xml = renderSitemapXml(config, entries);
    assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    assert.match(xml, /<loc>https:\/\/example\.com\/<\/loc>/);
    assert.match(xml, /<loc>https:\/\/example\.com\/posts\/2026-01-01-first\.html<\/loc>/);
    assert.match(xml, /<loc>https:\/\/example\.com\/posts\/2026-01-02-second\.html<\/loc>/);
    assert.match(xml, /<loc>https:\/\/example\.com\/llms\.txt<\/loc>/);
    assert.match(xml, /<loc>https:\/\/example\.com\/posts\/2026-01-01-first\.md<\/loc>/);
    assert.match(xml, /<loc>https:\/\/example\.com\/posts\/2026-01-02-second\.md<\/loc>/);
    const locCount = (xml.match(/<loc>/g) || []).length;
    assert.equal(locCount, 2 * entries.length + 2);
  });

  it("omits md mirrors when agentMarkdown is false", () => {
    const xml = renderSitemapXml({ ...config, agentMarkdown: false }, entries);
    const locCount = (xml.match(/<loc>/g) || []).length;
    assert.equal(locCount, entries.length + 1);
    assert.doesNotMatch(xml, /\.md<\/loc>/);
    assert.doesNotMatch(xml, /llms\.txt/);
  });
});
