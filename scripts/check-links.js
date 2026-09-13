#!/usr/bin/env node
"use strict";

// Link self-check for the generated site. Offline-friendly by design: it reads the
// freshly built docs/ artifacts and fetches each URL, so it can be pointed at a
// local preview server (CI) or at production (manual run after a deploy).
//
// Usage: node scripts/check-links.js [baseUrl]
//   baseUrl defaults to blog.config.json's siteUrl (i.e. production).
//   CI runs it against http://127.0.0.1:<port> after `serve`, because pushing to
//   the source repo does not publish Pages — deployment is a manual `npm run deploy`.

const fs = require("fs");
const path = require("path");
const { loadConfig, getSiteUrl } = require("./lib/config");

const TIMEOUT_MS = 15000;
const CONCURRENCY = 8;

function collectFromLlmsTxt(text) {
  // Only the "- [title](url)" link targets. The descriptions that follow the "—"
  // embed external URLs (bilibili, v2ex, docs sites, example links) and even
  // truncated fragments, none of which this site is responsible for.
  const urls = [];
  const re = /^- \[[^\]]*\]\((https?:\/\/[^\s)]+)\)/gm;
  let match;
  while ((match = re.exec(text)) !== null) urls.push(match[1]);
  return urls;
}

function collectFromSitemap(text) {
  return Array.from(text.matchAll(/<loc>([\s\S]*?)<\/loc>/g), (m) => m[1].trim());
}

function collectFromPostsJson(text, siteUrl) {
  const entries = JSON.parse(text);
  return entries.map((entry) => new URL(entry.url, siteUrl).href);
}

async function fetchStatus(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { redirect: "follow", signal: controller.signal });
    return { url, status: res.status };
  } catch (err) {
    return { url, status: 0, error: (err && err.message) || String(err) };
  } finally {
    clearTimeout(timer);
  }
}

// Run with bounded concurrency so a 100+ URL site doesn't open 100 sockets at once.
async function mapWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  async function runner() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, runner));
  return results;
}

async function main() {
  const config = loadConfig();
  const siteUrl = getSiteUrl(config);
  const baseUrl = String(process.argv[2] || siteUrl).replace(/\/$/, "");
  const docsDir = path.join(process.cwd(), "docs");
  const sources = {
    "llms.txt": path.join(docsDir, "llms.txt"),
    "sitemap.xml": path.join(docsDir, "sitemap.xml"),
    "posts.json": path.join(docsDir, "posts.json"),
  };

  let contents = {};
  for (const [name, file] of Object.entries(sources)) {
    if (!fs.existsSync(file)) {
      console.error(`Missing ${file} — run \`node scripts/cli.js build\` first.`);
      process.exit(1);
    }
    contents[name] = fs.readFileSync(file, "utf-8");
  }

  const perSource = {};
  const all = new Set();
  const add = (source, urls) => {
    // Same-site only: everything else is out of this site's control.
    const kept = urls.filter((u) => u.startsWith(siteUrl));
    perSource[source] = kept.length;
    kept.forEach((u) => all.add(u));
  };
  add("llms.txt", collectFromLlmsTxt(contents["llms.txt"]));
  add("sitemap.xml", collectFromSitemap(contents["sitemap.xml"]));
  add("posts.json", collectFromPostsJson(contents["posts.json"], siteUrl));

  const urls = Array.from(all).sort();
  console.log(
    `Checking ${urls.length} same-site URLs against ${baseUrl}` +
      ` (llms.txt ${perSource["llms.txt"]}, sitemap.xml ${perSource["sitemap.xml"]}, posts.json ${perSource["posts.json"]})`
  );

  const results = await mapWithConcurrency(urls, CONCURRENCY, async (url) =>
    fetchStatus(url.replace(siteUrl, baseUrl))
  );

  const failed = results.filter((r) => r.status !== 200);
  failed.forEach((r) => {
    const detail = r.error ? r.error : "HTTP " + r.status;
    console.error(`  FAIL ${detail}  ${r.url}`);
  });

  const ok = results.length - failed.length;
  console.log(`ok ${ok} / failed ${failed.length} / total ${results.length}`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((err) => {
  console.error("check-links failed:", err.message);
  process.exit(1);
});
