// scripts/gist-sync.js
// Sync a GitHub user's public gists as blog posts:
// Fetch gists → pick the first Markdown file → generate front-matter → write to source/_posts/<date>-<gist_id>.md
// → delete local posts whose remote gist no longer exists (marked by gist_id) → full rebuild to refresh the site.
// No extra dependencies: Node 18+ built-in fetch. Gist body fetched via raw_url (gist.githubusercontent.com, no API quota cost).
const fs = require("fs-extra");
const path = require("path");
const matter = require("gray-matter");
const { build } = require("./build");
const { loadConfig, formatPostAttributionFrontMatter } = require("./utils");

// front-matter field that marks a post as sourced from a gist (used by deletion sync)
const GIST_ID_FIELD = "gist_id";
// agent signature suffix in the title (user gist description like "..._by_agent_zero")
const AGENT_SUFFIX_RE = /_by_agent_zero\s*$/;

// Fetch all public gists of a GitHub user (paginated), returns the raw array
async function fetchPublicGists(user, token) {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "swan-post-gist-sync"
  };
  if (token) headers.Authorization = "token " + token;
  const all = [];
  for (let page = 1; ; page++) {
    const url = "https://api.github.com/users/" + encodeURIComponent(user) + "/gists?per_page=100&page=" + page;
    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error("GitHub API request failed: HTTP " + res.status + " " + (await res.text()).slice(0, 200));
    }
    const batch = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    // Note: when the authenticated user equals the queried user, GitHub returns secret gists too.
    // Explicitly filter to keep only public gists (secrets should not be blog content).
    all.push(...batch.filter((g) => g.public === true));
    if (batch.length < 100) break;
  }
  return all;
}

// Pick one Markdown file from a gist's files (the first one with a .md extension)
function pickMarkdownFile(gist) {
  const files = Object.values(gist.files || {});
  return files.find((f) => f.filename && f.filename.toLowerCase().endsWith(".md")) || null;
}

// Derive the post title: description minus the agent signature suffix; fall back to filename if empty
function gistTitle(gist, filename) {
  const desc = (gist.description || "").replace(AGENT_SUFFIX_RE, "").trim();
  if (desc) return desc;
  return filename.replace(/\.md$/i, "");
}

// created_at (UTC ISO string) → "YYYY-MM-DD HH:mm:ss" (UTC form, consistent with js-yaml's parsing of dateless dates)
function toLocalDateStr(iso) {
  return (iso || "").slice(0, 19).replace("T", " ");
}

// Build post content with front-matter; title uses JSON-style double-quoted string, safe for any special characters.
// Tags are fixed to ["gist", "summary"]: gist-synced commentary/summary content, uniform English tags.
// Auto-extracting keywords is infeasible (Chinese needs segmentation, and project deps are capped at 4 packages per design.md, no additions), so tags are fixed.
function buildPostContent(gist, filename, content, config) {
  const attributionFields = formatPostAttributionFrontMatter(config || {});
  return "---\n"
    + "title: " + JSON.stringify(gistTitle(gist, filename)) + "\n"
    + "date: " + toLocalDateStr(gist.created_at) + "\n"
    + "tags: [\"gist\", \"summary\"]\n"
    + attributionFields
    + GIST_ID_FIELD + ": " + gist.id + "\n"
    + "---\n\n"
    + content.replace(/^\s+/, "");
}

// Sync core. baseDir is injectable (CLI defaults to cwd; tests pass a temp dir).
// Returns stats { total, added, updated, removed, skipped }
async function syncGistsCore({ user, token, baseDir, config, onProgress }) {
  const postsDir = path.join(baseDir, "source", "_posts");
  fs.ensureDirSync(postsDir);
  const blogConfig = config || loadConfig();

  const gists = await fetchPublicGists(user, token);
  const remoteIds = new Set();
  let added = 0, updated = 0, skipped = 0, unchanged = 0;

  for (const gist of gists) {
    const file = pickMarkdownFile(gist);
    if (!file) { skipped++; continue; }
    remoteIds.add(gist.id);

    const res = await fetch(file.raw_url);
    if (!res.ok) {
      throw new Error("Failed to fetch gist content: HTTP " + res.status + " " + file.raw_url);
    }
    const content = await res.text();

    const datePrefix = toLocalDateStr(gist.created_at).slice(0, 10);
    const target = path.join(postsDir, datePrefix + "-" + gist.id + ".md");
    const newContent = buildPostContent(gist, file.filename, content, blogConfig);
    const existed = fs.existsSync(target);
    if (existed) {
      const oldContent = fs.readFileSync(target, "utf-8");
      if (oldContent === newContent) {
        unchanged++;
        if (onProgress) onProgress("Unchanged: " + file.filename);
        continue;
      }
    }
    fs.writeFileSync(target, newContent, "utf-8");
    if (existed) { updated++; } else { added++; }
    if (onProgress) onProgress((existed ? "Updated" : "Added") + ": " + file.filename);
  }

  // Deletion: local posts with a gist_id marker whose remote gist no longer exists
  // (gist id stays the same after rename; only possible when the entire gist disappears)
  let removed = 0;
  fs.readdirSync(postsDir).filter((f) => f.endsWith(".md")).forEach((f) => {
    const p = path.join(postsDir, f);
    let data = null;
    try { data = matter(fs.readFileSync(p, "utf-8")).data; } catch { return; }
    if (data && data[GIST_ID_FIELD] && !remoteIds.has(String(data[GIST_ID_FIELD]))) {
      fs.removeSync(p);
      removed++;
      if (onProgress) onProgress("Deleted (gist no longer exists): " + f);
    }
  });

  return { total: gists.length, added, updated, removed, skipped, unchanged };
}

// CLI entry: --user takes priority, otherwise reads blog.config.json's githubUser;
// use env var GITHUB_TOKEN to raise API rate limit (anonymous: 60 req/hour)
async function syncGists(userOption) {
  const config = loadConfig();
  const user = userOption || config.githubUser;
  if (!user) {
    console.error("Please specify a GitHub username: CLI --user <name>, or configure githubUser in blog.config.json");
    process.exit(1);
  }
  const token = process.env.GITHUB_TOKEN || "";
  try {
    const stats = await syncGistsCore({
      user,
      token,
      baseDir: process.cwd(),
      config,
      onProgress: (line) => console.log("  " + line)
    });
    console.log("Sync complete: fetched " + stats.total + " gist(s), "
      + "added " + stats.added + ", updated " + stats.updated + ", unchanged " + stats.unchanged + ", removed " + stats.removed + ", "
      + "skipped " + stats.skipped + " (no Markdown file)");
    console.log("== Rebuilding site ==");
    build();
  } catch (err) {
    console.error("Gist sync failed:", err.message);
    process.exit(1);
  }
}

module.exports = {
  syncGists, syncGistsCore,
  fetchPublicGists, pickMarkdownFile, gistTitle, toLocalDateStr, buildPostContent
};
