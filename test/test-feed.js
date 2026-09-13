"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadConfig } = require("../scripts/utils");
const {
  validateFeedXml,
  checkWellFormed,
  checkRules,
  FEED_ITEM_LIMIT,
} = require("../scripts/lib/feed-validate");

const docsDir = path.join(__dirname, "..", "docs");
const feedPath = path.join(docsDir, "feed.xml");
const config = loadConfig();

// Minimal but complete RSS 2.0 document used to prove the rules actually fire.
// __PUBDATE__ is substituted per test.
const MINIMAL_FEED = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>T</title>
    <link>https://example.com/</link>
    <description>D</description>
    <atom:link rel="self" href="https://example.com/feed.xml"/>
    <item>
      <title>P</title>
      <link>https://example.com/posts/p.html</link>
      <guid isPermaLink="true">https://example.com/posts/p.html</guid>
      <pubDate>__PUBDATE__</pubDate>
      <description>d</description>
      <dc:creator>a</dc:creator>
      <content:encoded><![CDATA[<p>c</p>]]></content:encoded>
    </item>
  </channel>
</rss>`;

const minimalConfig = { siteUrl: "https://example.com" };

describe("feed.xml well-formedness", () => {
  it("parses with no libxml2 errors", async () => {
    assert.ok(fs.existsSync(feedPath), "docs/feed.xml not found — run `npm run build` first");
    const errors = await checkWellFormed(fs.readFileSync(feedPath, "utf-8"));
    assert.deepEqual(errors, []);
  });

  it("catches a truncated feed", async () => {
    const broken = fs.readFileSync(feedPath, "utf-8").replace("</rss>", "");
    const errors = await checkWellFormed(broken);
    assert.ok(errors.length > 0, "truncating the feed must be reported");
  });
});

describe("feed.xml RSS 2.0 rules", () => {
  it("passes every spec rule", () => {
    assert.ok(fs.existsSync(feedPath), "docs/feed.xml not found — run `npm run build` first");
    const { errors } = checkRules(fs.readFileSync(feedPath, "utf-8"), { config, docsDir });
    assert.deepEqual(errors, [], "feed.xml rule violations:\n" + errors.join("\n"));
  });

  it("declares itself with atom:link rel=self", () => {
    const xml = fs.readFileSync(feedPath, "utf-8");
    assert.match(xml, /<atom:link rel="self" href="https:\/\/iintothewind\.github\.io\/feed\.xml"\/>/);
  });

  it("stays within the item cap and is newest first", () => {
    const { facts } = checkRules(fs.readFileSync(feedPath, "utf-8"), { config, docsDir });
    assert.ok(facts.itemCount > 0);
    assert.ok(facts.itemCount <= FEED_ITEM_LIMIT, "got " + facts.itemCount + " items");
    for (let i = 1; i < facts.items.length; i++) {
      assert.ok(
        Date.parse(facts.items[i - 1].pubDate) >= Date.parse(facts.items[i].pubDate),
        "item " + i + " is newer than the one before it"
      );
    }
  });

  it("only links to generated files", () => {
    const { facts } = checkRules(fs.readFileSync(feedPath, "utf-8"), { config, docsDir });
    facts.items.forEach((item) => {
      const rel = item.link.replace("https://iintothewind.github.io/", "");
      assert.ok(fs.existsSync(path.join(docsDir, rel)), "no file for " + item.link);
    });
  });
});

describe("rule checks reject bad feeds", () => {
  it("rejects an ISO 8601 pubDate", () => {
    // The spec flags date conversion as the most likely thing to break.
    const { errors } = checkRules(MINIMAL_FEED.replace("__PUBDATE__", "2026-09-13T00:00:00Z"), {
      config: minimalConfig,
      docsDir,
    });
    assert.ok(errors.some((e) => /is not RFC 822/.test(e)), "ISO 8601 dates must be rejected");
  });

  it("accepts an RFC 822 pubDate", () => {
    const { errors } = checkRules(MINIMAL_FEED.replace("__PUBDATE__", "Sun, 13 Sep 2026 04:54:46 GMT"), {
      config: minimalConfig,
      docsDir,
    });
    assert.ok(!errors.some((e) => /pubDate|RFC 822/.test(e)), "unexpected date errors: " + errors.join("; "));
  });

  it("rejects a guid that is not the permalink", () => {
    const { errors } = checkRules(
      MINIMAL_FEED.replace("__PUBDATE__", "Sun, 13 Sep 2026 04:54:46 GMT").replace(
        '<guid isPermaLink="true">https://example.com/posts/p.html</guid>',
        '<guid isPermaLink="false">p-123</guid>'
      ),
      { config: minimalConfig, docsDir }
    );
    assert.ok(errors.some((e) => /guid/.test(e)), "a non-permalink guid must be rejected");
  });

  it("rejects a missing self reference", () => {
    const { errors } = checkRules(
      MINIMAL_FEED.replace("__PUBDATE__", "Sun, 13 Sep 2026 04:54:46 GMT").replace(
        /<atom:link[^>]*\/>/,
        ""
      ),
      { config: minimalConfig, docsDir }
    );
    assert.ok(errors.some((e) => /atom:link/.test(e)), "a feed without rel=self must be rejected");
  });
});

describe("validateFeedXml", () => {
  it("reports ok for the built feed", async () => {
    const result = await validateFeedXml(fs.readFileSync(feedPath, "utf-8"), { config, docsDir });
    assert.equal(result.ok, true, "feed.xml failed:\n" + result.errors.join("\n"));
    assert.ok(result.facts.itemCount > 0);
  });
});
