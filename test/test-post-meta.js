"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const {
  escapeHtml,
  plainTextFromHtml,
  firstParagraphHtml,
  getPostMetaDescription,
  META_DESCRIPTION_LENGTH,
} = require("../scripts/lib/markdown");
const {
  renderPostSocialMeta,
  renderLayout,
  buildPostTemplateVars,
} = require("../scripts/lib/templates");
const { loadConfig } = require("../scripts/utils");

const config = loadConfig();
const docsDir = path.join(__dirname, "..", "docs");

function graphemeLength(text) {
  return Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text)).length;
}

function makePost(overrides) {
  return Object.assign(
    {
      title: "Title",
      slug: "2026-01-01-post",
      formattedDate: "2026-01-01",
      tags: [],
      excerpt: "",
      contentHtml: "<h1>Title</h1>\n<p>First paragraph.</p>\n<p>Second paragraph.</p>",
    },
    overrides
  );
}

describe("escapeHtml", () => {
  it("escapes HTML special characters", () => {
    assert.equal(escapeHtml('a&b<c>d"e'), "a&amp;b&lt;c&gt;d&quot;e");
  });
});

describe("plainTextFromHtml", () => {
  it("strips tags and decodes entities", () => {
    assert.equal(plainTextFromHtml("<p>Tom &amp; Jerry</p>"), "Tom & Jerry");
  });

  it("replaces math and diagrams with placeholders", () => {
    const html = '<div class="mermaid">graph TD</div><p>After</p>';
    assert.match(plainTextFromHtml(html), /\[diagram\] After/);
  });

  it("collapses whitespace", () => {
    assert.equal(plainTextFromHtml("<p>a\n\n   b</p>"), "a b");
  });
});

describe("firstParagraphHtml", () => {
  it("returns the first paragraph", () => {
    assert.equal(firstParagraphHtml(makePost().contentHtml), "<p>First paragraph.</p>");
  });

  it("skips empty paragraphs", () => {
    assert.equal(firstParagraphHtml("<p></p><p>   </p><p>Real</p>"), "<p>Real</p>");
  });

  it("returns empty string when there is no paragraph", () => {
    assert.equal(firstParagraphHtml("<h1>Only a heading</h1>"), "");
  });
});

describe("getPostMetaDescription", () => {
  it("uses the first paragraph, not the whole post", () => {
    const desc = getPostMetaDescription(makePost());
    assert.equal(desc, "First paragraph.");
    assert.doesNotMatch(desc, /Second/);
  });

  it("caps length at the meta description limit", () => {
    const long = "字".repeat(500);
    const desc = getPostMetaDescription(makePost({ contentHtml: "<p>" + long + "</p>" }));
    assert.equal(graphemeLength(desc), META_DESCRIPTION_LENGTH);
  });

  it("falls back to the whole text when there is no paragraph", () => {
    const desc = getPostMetaDescription(makePost({ contentHtml: "<ul><li>only a list</li></ul>" }));
    assert.equal(desc, "only a list");
  });

  it("falls back to the excerpt when the body is empty", () => {
    assert.equal(getPostMetaDescription(makePost({ contentHtml: "", excerpt: "fallback" })), "fallback");
  });
});

describe("renderPostSocialMeta", () => {
  const post = makePost();

  it("emits description, OG trio and canonical", () => {
    const html = renderPostSocialMeta(post, config);
    ['name="description"', 'property="og:title"', 'property="og:description"',
      'property="og:url"', 'rel="canonical"'].forEach((needle) => {
      assert.match(html, new RegExp(needle));
    });
  });

  it("points og:url and canonical at the permalink", () => {
    const url = "https://iintothewind.github.io/posts/" + post.slug + ".html";
    const html = renderPostSocialMeta(post, config);
    assert.equal((html.match(/content="([^"]+)"\s*>\s*\n?<link rel="canonical"/) || [])[1], url);
    assert.match(html, new RegExp('href="' + url.replace(/\./g, "\\.") + '"'));
  });

  it("lets front-matter canonical override the permalink", () => {
    const html = renderPostSocialMeta(makePost({ canonical: "https://example.test/x" }), config);
    assert.match(html, /href="https:\/\/example\.test\/x"/);
  });

  it("escapes title and description", () => {
    const html = renderPostSocialMeta(makePost({ title: 'A & B <script>' }), config);
    assert.match(html, /content="A &amp; B &lt;script&gt;"/);
    assert.doesNotMatch(html, /<script>/);
  });

  it("renders nothing without a post", () => {
    assert.equal(renderPostSocialMeta(null, config), "");
  });
});

describe("renderLayout", () => {
  it("substitutes every layout variable", () => {
    const html = renderLayout(config, {
      pageTitle: "T",
      content: "<p>c</p>",
      postAlternateMd: '<link rel="alternate" type="text/markdown" href="/x.md">',
      postMetaHtml: "<meta name=\"description\" content=\"d\">",
    });
    assert.doesNotMatch(html, /\{\{[A-Z_]+\}\}/);
    assert.match(html, /<title>T - iintothewind blog<\/title>/);
    assert.match(html, /<meta name="description" content="d">/);
  });

  it("leaves no literal placeholder when optional slots are omitted", () => {
    // renderTemplate keeps unknown placeholders verbatim, so an unset slot would
    // ship {{POST_META_HTML}} into production. This is the guard for that.
    const html = renderLayout(config, { pageTitle: "Home", content: "<p>c</p>" });
    assert.doesNotMatch(html, /\{\{POST_META_HTML\}\}/);
    assert.doesNotMatch(html, /\{\{POST_ALTERNATE_MD\}\}/);
  });
});

describe("buildPostTemplateVars", () => {
  it("emits no license line by default", () => {
    assert.equal(buildPostTemplateVars(config, makePost()).POST_LICENSE_LINE, "");
  });

  it("emits a license line when front matter sets one", () => {
    const vars = buildPostTemplateVars(config, makePost({ license: "CC-BY-4.0" }));
    assert.match(vars.POST_LICENSE_LINE, /license: CC-BY-4\.0/);
  });

  it("honors a front-matter canonical", () => {
    const vars = buildPostTemplateVars(config, makePost({ canonical: "https://example.test/x" }));
    assert.equal(vars.CANONICAL_URL, "https://example.test/x");
  });
});

describe("built output", () => {
  const postPages = fs.existsSync(docsDir)
    ? fs.readdirSync(path.join(docsDir, "posts")).filter((f) => f.endsWith(".html"))
    : [];

  it("has no literal placeholders anywhere", () => {
    assert.ok(postPages.length > 0, "docs/ not built — run `npm run build` first");
    const all = postPages.map((f) => path.join(docsDir, "posts", f)).concat([path.join(docsDir, "index.html")]);
    all.forEach((file) => {
      assert.doesNotMatch(fs.readFileSync(file, "utf-8"), /\{\{[A-Z_]+\}\}/, "placeholder left in " + file);
    });
  });

  it("gives every post social meta and canonical", () => {
    assert.ok(postPages.length > 0, "docs/ not built — run `npm run build` first");
    postPages.forEach((file) => {
      const html = fs.readFileSync(path.join(docsDir, "posts", file), "utf-8");
      ['name="description"', 'property="og:title"', 'property="og:description"',
        'property="og:url"', 'rel="canonical"'].forEach((needle) => {
        assert.ok(html.includes(needle), "missing " + needle + " in " + file);
      });
    });
  });

  it("keeps per-post meta off the homepage", () => {
    assert.ok(postPages.length > 0, "docs/ not built — run `npm run build` first");
    const home = fs.readFileSync(path.join(docsDir, "index.html"), "utf-8");
    assert.doesNotMatch(home, /property="og:title"/);
    assert.doesNotMatch(home, /name="description"/);
  });
});
