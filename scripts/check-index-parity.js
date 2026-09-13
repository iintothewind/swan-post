#!/usr/bin/env node
"use strict";

// Three-index parity: llms.txt, posts.json and sitemap.xml are generated from the
// same post list, so their post counts must match. A mismatch means one of the
// discovery surfaces silently drifted — exactly the kind of thing agents trip over.
//
// Reads local docs/ only: no network, no deploy dependency, runnable anywhere.
//
// Usage: node scripts/check-index-parity.js

const fs = require("fs");
const path = require("path");

// "- [title](https://…/posts/<slug>.md)" entries.
const LLMS_ENTRY = /^- \[.+\]\(https?:\/\/[^\s)]+\.md\)/gm;
// Sitemap <loc> for a post page — excludes the root, /llms.txt and the .md mirrors.
const SITEMAP_POST = /\/posts\/[^/]+\.html/;

function countLlmsPosts(text) {
  return (text.match(LLMS_ENTRY) || []).length;
}

function countSitemapPosts(text) {
  return Array.from(text.matchAll(/<loc>([\s\S]*?)<\/loc>/g), (m) => m[1].trim()).filter((loc) =>
    SITEMAP_POST.test(loc)
  ).length;
}

function countPostsJson(text) {
  return JSON.parse(text).length;
}

function main() {
  const docsDir = path.join(process.cwd(), "docs");
  const sources = {
    "llms.txt": { file: path.join(docsDir, "llms.txt"), count: countLlmsPosts },
    "posts.json": { file: path.join(docsDir, "posts.json"), count: countPostsJson },
    "sitemap.xml": { file: path.join(docsDir, "sitemap.xml"), count: countSitemapPosts },
  };

  const counts = {};
  let broken = false;
  for (const [name, source] of Object.entries(sources)) {
    if (!fs.existsSync(source.file)) {
      console.error(`MISSING ${name} — run \`node scripts/cli.js build\` first.`);
      broken = true;
      continue;
    }
    try {
      counts[name] = source.count(fs.readFileSync(source.file, "utf-8"));
    } catch (err) {
      console.error(`UNREADABLE ${name}: ${err.message}`);
      broken = true;
    }
  }
  if (broken) process.exit(1);

  const values = Object.values(counts);
  const equal = values.every((v) => v === values[0]);
  Object.entries(counts).forEach(([name, value]) => console.log(`  ${name}: ${value}`));

  if (!equal) {
    console.error("PARITY FAILED: " + Object.entries(counts).map(([n, v]) => `${n}=${v}`).join(" / "));
    process.exit(1);
  }
  console.log(`parity ok: ${values[0]} posts in all three indexes`);
  process.exit(0);
}

main();
