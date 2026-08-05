// scripts/gist-sync.js
// 同步 GitHub 用户的 public gist 为博客文章：
// 拉取 gist → 选第一个 Markdown 文件 → 生成 front-matter → 写入 source/_posts/<日期>-<gist_id>.md
// → 删除远程已不存在的 gist 文章（gist_id 标记）→ 全量 build 刷新站点。
// 不新增依赖：Node 18+ 内置 fetch。gist 正文走 raw_url（gist.githubusercontent.com，不计 API 配额）。
const fs = require("fs-extra");
const path = require("path");
const matter = require("gray-matter");
const { build } = require("./build");
const { loadConfig } = require("./utils");

// front-matter 里标记该文章来源 gist 的字段（删除同步依赖它）
const GIST_ID_FIELD = "gist_id";
// 标题里的 agent 署名后缀（用户 gist 的 description 形如 "..._by_agent_zero"）
const AGENT_SUFFIX_RE = /_by_agent_zero\s*$/;

// 拉取一个 GitHub 用户的全部 public gist（分页），返回原始数组
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
      throw new Error("GitHub API 请求失败: HTTP " + res.status + " " + (await res.text()).slice(0, 200));
    }
    const batch = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    // 注意：认证用户 == 被查询用户时，GitHub 会连 secret gists 一起返回。
    // 显式过滤，只保留 public gists（secret 不应当博客内容）。
    all.push(...batch.filter((g) => g.public === true));
    if (batch.length < 100) break;
  }
  return all;
}

// 从 gist 的多个文件里选一个 Markdown 文件（取第一个 .md 后缀的）
function pickMarkdownFile(gist) {
  const files = Object.values(gist.files || {});
  return files.find((f) => f.filename && f.filename.toLowerCase().endsWith(".md")) || null;
}

// 取文章标题：description 去掉 agent 署名后缀，为空则用文件名
function gistTitle(gist, filename) {
  const desc = (gist.description || "").replace(AGENT_SUFFIX_RE, "").trim();
  if (desc) return desc;
  return filename.replace(/\.md$/i, "");
}

// created_at(UTC ISO 串) → "YYYY-MM-DD HH:mm:ss"（UTC 字形，与 js-yaml 对无时区日期的解析口径一致）
function toLocalDateStr(iso) {
  return (iso || "").slice(0, 19).replace("T", " ");
}

// 生成带 front-matter 的文章内容；title 用 JSON 风格双引号字符串，任何特殊字符都安全。
// tags 固定为 ["gist", "summary"]：gist 同步的评论/总结类内容，统一英文 tags。
// 自动提取关键词不可行（中文需分词，且项目依赖被 design.md 限定为 4 个包、不新增），故固定。
function buildPostContent(gist, filename, content) {
  return "---\n"
    + "title: " + JSON.stringify(gistTitle(gist, filename)) + "\n"
    + "date: " + toLocalDateStr(gist.created_at) + "\n"
    + "tags: [\"gist\", \"summary\"]\n"
    + "categories: []\n"
    + GIST_ID_FIELD + ": " + gist.id + "\n"
    + "---\n\n"
    + content.replace(/^\s+/, "");
}

// 同步核心。baseDir 可注入（默认 CLI 用 cwd，测试传临时目录）。
// 返回统计 { total, added, updated, removed, skipped }
async function syncGistsCore({ user, token, baseDir, onProgress }) {
  const postsDir = path.join(baseDir, "source", "_posts");
  fs.ensureDirSync(postsDir);

  const gists = await fetchPublicGists(user, token);
  const remoteIds = new Set();
  let added = 0, updated = 0, skipped = 0, unchanged = 0;

  for (const gist of gists) {
    const file = pickMarkdownFile(gist);
    if (!file) { skipped++; continue; }
    remoteIds.add(gist.id);

    const res = await fetch(file.raw_url);
    if (!res.ok) {
      throw new Error("拉取 gist 内容失败: HTTP " + res.status + " " + file.raw_url);
    }
    const content = await res.text();

    const datePrefix = toLocalDateStr(gist.created_at).slice(0, 10);
    const target = path.join(postsDir, datePrefix + "-" + gist.id + ".md");
    const newContent = buildPostContent(gist, file.filename, content);
    const existed = fs.existsSync(target);
    if (existed) {
      const oldContent = fs.readFileSync(target, "utf-8");
      if (oldContent === newContent) {
        unchanged++;
        if (onProgress) onProgress("未变: " + file.filename);
        continue;
      }
    }
    fs.writeFileSync(target, newContent, "utf-8");
    if (existed) { updated++; } else { added++; }
    if (onProgress) onProgress((existed ? "更新" : "新增") + ": " + file.filename);
  }

  // 删除：本地带 gist_id 标记、但远程已不存在的文章（gist 被删/改名后 id 不变，只可能整个消失）
  let removed = 0;
  fs.readdirSync(postsDir).filter((f) => f.endsWith(".md")).forEach((f) => {
    const p = path.join(postsDir, f);
    let data = null;
    try { data = matter(fs.readFileSync(p, "utf-8")).data; } catch { return; }
    if (data && data[GIST_ID_FIELD] && !remoteIds.has(String(data[GIST_ID_FIELD]))) {
      fs.removeSync(p);
      removed++;
      if (onProgress) onProgress("删除（gist 已不存在）: " + f);
    }
  });

  return { total: gists.length, added, updated, removed, skipped, unchanged };
}

// CLI 入口：--user 优先，否则读 blog.config.json 的 githubUser；
// 可用环境变量 GITHUB_TOKEN 提高 API 限额（匿名 60 次/小时）
async function syncGists(userOption) {
  const config = loadConfig();
  const user = userOption || config.githubUser;
  if (!user) {
    console.error("请指定 GitHub 用户名：命令行 --user <name>，或在 blog.config.json 中配置 githubUser");
    process.exit(1);
  }
  const token = process.env.GITHUB_TOKEN || "";
  try {
    const stats = await syncGistsCore({
      user,
      token,
      baseDir: process.cwd(),
      onProgress: (line) => console.log("  " + line)
    });
    console.log("同步完成：共拉取 " + stats.total + " 个 gist，"
      + "新增 " + stats.added + " 篇，更新 " + stats.updated + " 篇，未变 " + stats.unchanged + " 篇，删除 " + stats.removed + " 篇，"
      + "跳过 " + stats.skipped + " 个（无 Markdown 文件）");
    console.log("== 重新构建站点 ==");
    build();
  } catch (err) {
    console.error("gist 同步失败:", err.message);
    process.exit(1);
  }
}

module.exports = {
  syncGists, syncGistsCore,
  fetchPublicGists, pickMarkdownFile, gistTitle, toLocalDateStr, buildPostContent
};
