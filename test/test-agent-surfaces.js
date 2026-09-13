"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadConfig } = require("../scripts/utils");

const config = loadConfig();
const docsDir = path.join(__dirname, "..", "docs");

function read(relativePath) {
  const file = path.join(docsDir, relativePath);
  assert.ok(fs.existsSync(file), "docs/" + relativePath + " not found — run `npm run build` first");
  return fs.readFileSync(file, "utf-8");
}

function postPages() {
  const dir = path.join(docsDir, "posts");
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(".html"));
}

describe("llms-full.txt", () => {
  it("carries every post", () => {
    const text = read("llms-full.txt");
    const index = JSON.parse(read("posts.json"));
    assert.ok(index.length > 0);
    const missing = index.filter((post) => !text.includes(post.title));
    assert.deepEqual(missing.map((p) => p.title), [], "posts missing from llms-full.txt");
  });

  it("starts with the site header", () => {
    const text = read("llms-full.txt");
    assert.match(text, /^# iintothewind blog\n/);
    assert.match(text, /posts\/<slug>\.md/);
  });

  it("is pointed at from llms.txt", () => {
    const url = "https://iintothewind.github.io/llms-full.txt";
    assert.match(read("llms.txt"), new RegExp("- \\[llms-full\\.txt\\]\\(" + url.replace(/\./g, "\\.") + "\\)"));
  });
});

describe("404.html", () => {
  it("exists and leaves no literal placeholders", () => {
    const html = read("404.html");
    assert.doesNotMatch(html, /\{\{[A-Z_]+\}\}/);
  });

  it("tells crawlers not to index it", () => {
    assert.match(read("404.html"), /<meta name="robots" content="noindex">/);
  });

  it("hands agents a route back", () => {
    const html = read("404.html");
    // Both as visible links and as a machine-readable comment, since the whole
    // point of this page is readers that never execute JavaScript.
    assert.match(html, /\/posts\.json/);
    assert.match(html, /\/llms\.txt/);
    assert.match(html, /agent-route:/);
  });

  it("ships a static post list, not a JS-only one", () => {
    const html = read("404.html");
    const links = html.match(/<li><a href="\/posts\/[^"]+\.html"/g) || [];
    assert.ok(links.length > 0, "404.html must list posts statically");
  });
});

describe("license", () => {
  it("is declared in llms.txt", () => {
    const llms = read("llms.txt");
    assert.match(llms, /## License/);
    assert.match(llms, new RegExp(config.license));
    assert.match(llms, /creativecommons\.org/);
  });

  it("is declared in every post footer", () => {
    const pages = postPages();
    assert.ok(pages.length > 0, "docs/ not built — run `npm run build` first");
    pages.forEach((file) => {
      const html = fs.readFileSync(path.join(docsDir, "posts", file), "utf-8");
      assert.match(html, /class="post-license"/, "missing license footer in " + file);
      assert.match(html, new RegExp('rel="license" href="' + config.licenseUrl.replace(/[/.]/g, "\\$&") + '"'));
    });
  });

  it("is declared in the .md mirrors agents read", () => {
    const pages = postPages();
    assert.ok(pages.length > 0, "docs/ not built — run `npm run build` first");
    pages.forEach((file) => {
      const mdPath = path.join(docsDir, "posts", file.replace(/\.html$/, ".md"));
      if (!fs.existsSync(mdPath)) return;
      const md = fs.readFileSync(mdPath, "utf-8");
      assert.match(md, /Under what license/, "missing license Q&A in " + file);
      assert.match(md, new RegExp(config.license));
    });
  });
});
