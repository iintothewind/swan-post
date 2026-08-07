"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { renderTagsHtml, renderRecentPostsHtml, truncateGraphemes } = require("../scripts/lib/markdown");

describe("renderTagsHtml", () => {
  it("renders tags as pill spans", () => {
    const html = renderTagsHtml(["essay", "tech"]);
    assert.match(html, /tag-pill.*essay/);
    assert.match(html, /tag-pill.*tech/);
  });

  it("escapes HTML in tag names", () => {
    const html = renderTagsHtml(['<script>alert(1)</script>']);
    assert.doesNotMatch(html, /<script>/);
    assert.match(html, /&lt;script&gt;/);
  });

  it("returns empty string for empty array", () => {
    assert.equal(renderTagsHtml([]), "");
  });
});

describe("renderRecentPostsHtml", () => {
  it("renders recent posts list", () => {
    const posts = [
      { title: "Post 1", url: "posts/1.html", formattedDate: "2026-01-01", tags: [], excerpt: "excerpt 1" },
      { title: "Post 2", url: "posts/2.html", formattedDate: "2026-01-02", tags: ["essay"], excerpt: "excerpt 2" },
    ];
    const html = renderRecentPostsHtml(posts, 2, { baseUrl: "" });
    assert.match(html, /Post 1/);
    assert.match(html, /Post 2/);
    assert.match(html, /excerpt 1/);
    assert.match(html, /excerpt 2/);
  });

  it("shows placeholder when no posts", () => {
    const html = renderRecentPostsHtml([], 10, { baseUrl: "" });
    assert.match(html, /No posts published yet/);
  });

  it("escapes HTML in titles and excerpts", () => {
    const posts = [
      { title: '<b>Bold</b>', url: "posts/x.html", formattedDate: "2026-01-01", tags: [], excerpt: '<i>italic</i>' },
    ];
    const html = renderRecentPostsHtml(posts, 1, { baseUrl: "" });
    assert.doesNotMatch(html, /<b>/);
    assert.match(html, /&lt;b&gt;/);
    assert.doesNotMatch(html, /<i>/);
    assert.match(html, /&lt;i&gt;/);
  });
});

describe("truncateGraphemes", () => {
  it("truncates to n graphemes", () => {
    assert.equal(truncateGraphemes("hello world", 5), "hello");
  });

  it("returns full string when shorter than n", () => {
    assert.equal(truncateGraphemes("hi", 10), "hi");
  });

  it("handles multi-byte characters", () => {
    const result = truncateGraphemes("你好世界", 2);
    assert.equal(result, "你好");
  });

  it("handles emoji without splitting", () => {
    const result = truncateGraphemes("a😀b", 2);
    assert.equal(result, "a😀");
  });
});
