"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { renderTagsHtml, renderRecentPostsHtml, truncateGraphemes, findUnannotatedMermaidBlocks } = require("../scripts/lib/markdown");

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

describe("findUnannotatedMermaidBlocks", () => {
  it("reports nothing when the block carries both annotations", () => {
    const md = "```mermaid\ngraph TD\n  accTitle: Login flow\n  accDescr: User submits credentials\n  A --> B\n```\n";
    assert.deepEqual(findUnannotatedMermaidBlocks(md), []);
  });

  it("reports both annotations when neither is present", () => {
    const md = "```mermaid\ngraph TD\n  A --> B\n```\n";
    assert.deepEqual(findUnannotatedMermaidBlocks(md), [{ line: 1, missing: ["accTitle", "accDescr"] }]);
  });

  it("reports only the missing annotation", () => {
    const md = "```mermaid\nsequenceDiagram\n  accDescr: Alice calls Bob\n  Alice->>Bob: hi\n```\n";
    assert.deepEqual(findUnannotatedMermaidBlocks(md), [{ line: 1, missing: ["accTitle"] }]);
  });

  it("does not accept the front-matter form", () => {
    // mermaid only honours these as statements inside the diagram body
    const md = "```mermaid\n---\naccTitle: Login flow\naccDescr: User submits credentials\n---\ngraph TD\n  A --> B\n```\n";
    assert.deepEqual(findUnannotatedMermaidBlocks(md), [{ line: 1, missing: ["accTitle", "accDescr"] }]);
  });

  it("still finds body annotations below a front-matter title", () => {
    const md = "```mermaid\n---\ntitle: Login flow\n---\ngraph TD\n  accTitle: Login flow\n  accDescr: User submits credentials\n  A --> B\n```\n";
    assert.deepEqual(findUnannotatedMermaidBlocks(md), []);
  });

  it("reports the fence line and ignores other fences", () => {
    const md = "# Title\n\n```js\nconst a = 1;\n```\n\n```mermaid\ngraph TD\n  A --> B\n```\n";
    assert.deepEqual(findUnannotatedMermaidBlocks(md), [{ line: 7, missing: ["accTitle", "accDescr"] }]);
  });

  it("shifts reported lines by lineOffset", () => {
    const md = "```mermaid\ngraph TD\n  A --> B\n```\n";
    assert.deepEqual(findUnannotatedMermaidBlocks(md, 6), [{ line: 7, missing: ["accTitle", "accDescr"] }]);
  });

  it("ignores a mermaid example inside a longer fence", () => {
    const md = "````md\n```mermaid\ngraph TD\n```\n````\n";
    assert.deepEqual(findUnannotatedMermaidBlocks(md), []);
  });

  it("reports every block in a post, in document order", () => {
    const md = "```mermaid\ngraph TD\n  accTitle: A\n  accDescr: a\n  A --> B\n```\n\n```mermaid\ngraph TD\n  A --> B\n```\n";
    assert.deepEqual(findUnannotatedMermaidBlocks(md), [{ line: 8, missing: ["accTitle", "accDescr"] }]);
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
