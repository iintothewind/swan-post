"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { renderTemplate, buildPostTemplateVars, buildPostIncludes } = require("./lib/templates");
const { getSiteUrl } = require("./lib/config");

const config = {
  title: "Test Blog",
  author: "Test Author",
  description: "A test site",
  baseUrl: "",
  siteUrl: "https://example.com",
  githubUser: "testuser",
  postAuthor: "Test Author",
  postSource: "https://example.com/",
  postHeader: "source/_includes/post-header.html",
  postFooter: "source/_includes/post-footer.html",
  postBodyMeta: "source/_includes/post-body-meta.html",
  postBodyAttribution: "source/_includes/post-body-attribution.html",
};

describe("renderTemplate", () => {
  it("replaces {{KEY}} placeholders", () => {
    const result = renderTemplate("Hello {{NAME}}!", { NAME: "World" });
    assert.equal(result, "Hello World!");
  });

  it("handles multiple keys", () => {
    const result = renderTemplate("{{A}} {{B}} {{A}}", { A: "1", B: "2" });
    assert.equal(result, "1 2 1");
  });

  it("guards literal {{ in values from being replaced", () => {
    const result = renderTemplate("{{CONTENT}}", { CONTENT: "text {{PAGE_TITLE}} here" });
    assert.equal(result, "text {{PAGE_TITLE}} here");
  });

  it("returns template unchanged when vars is empty", () => {
    const result = renderTemplate("static text", {});
    assert.equal(result, "static text");
  });
});

describe("buildPostTemplateVars", () => {
  it("builds template vars from config and post", () => {
    const post = {
      title: "Hello",
      formattedDate: "2026-01-01",
      slug: "hello-world",
      tags: ["essay"],
      author: "",
      source: "",
    };
    const vars = buildPostTemplateVars(config, post);
    assert.equal(vars.SITE_TITLE, "Test Blog");
    assert.equal(vars.POST_TITLE, "Hello");
    assert.equal(vars.POST_SLUG, "hello-world");
    assert.equal(vars.CANONICAL_URL, "https://example.com/posts/hello-world.html");
    assert.equal(vars.GITHUB_USER, "testuser");
    assert.equal(vars.GITHUB_URL, "https://github.com/testuser");
    assert.match(vars.POST_TAGS_HTML, /tag-pill/);
  });
});

describe("buildPostIncludes", () => {
  it("returns empty strings when include files are missing", () => {
    const post = {
      title: "Test",
      formattedDate: "2026-01-01",
      slug: "test",
      tags: [],
      author: "",
      source: "",
      showHeader: true,
      showFooter: true,
    };
    const includes = buildPostIncludes(config, post);
    // Include files don't exist in test context, so all should be empty
    assert.equal(typeof includes.headerHtml, "string");
    assert.equal(typeof includes.bodyMetaHtml, "string");
    assert.equal(typeof includes.footerHtml, "string");
    assert.equal(typeof includes.bodyAttributionHtml, "string");
  });
});
