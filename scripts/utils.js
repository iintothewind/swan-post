const fs = require("fs-extra");
const path = require("path");
const matter = require("gray-matter");
const MarkdownIt = require("markdown-it");

const md = new MarkdownIt({ html: true, linkify: true });

// 读取 blog.config.json，返回配置对象
function loadConfig() {
  const configPath = path.join(process.cwd(), "blog.config.json");
  return fs.readJsonSync(configPath);
}

// 解析单个 markdown 文件，返回:
// { title, date, tags, categories, slug, contentHtml, excerpt }
// slug 从文件名去掉 .md 后缀得到
function parseMarkdownFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  const slug = path.basename(filePath, ".md");
  const contentHtml = md.render(content);
  const plainText = content.replace(/[#*`>\-\[\]!]/g, "").replace(/\n+/g, " ").trim();
  const excerpt = plainText.slice(0, 100);
  
  // 处理 date: 保留完整格式 YYYY-MM-DD HH:mm:ss
  let date = data.date || "";
  if (data.date instanceof Date) {
    date = data.date.toISOString();
  } else if (typeof date === "string") {
    // 保留完整字符串格式，不做截取
  }

  return {
    title: data.title || slug,
    date,
    tags: data.tags || [],
    categories: data.categories || [],
    slug,
    contentHtml,
    excerpt
  };
}

// 简单占位符替换:template 是模板字符串，vars 是 { KEY: value } 对象
// 把模板中所有 {{KEY}} 替换为 value
function renderTemplate(template, vars) {
  let result = template;
  for (const key in vars) {
    const re = new RegExp("{{" + key + "}}", "g");
    result = result.replace(re, vars[key]);
  }
  return result;
}

// 返回 source/_posts 目录下所有 .md 文件的绝对路径数组
function listPostFiles() {
  const dir = path.join(process.cwd(), "source", "_posts");
  fs.ensureDirSync(dir);
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => path.join(dir, f));
}

// 把 tags 数组渲染成 HTML: <span class="tag-pill">xxx</span> 拼接
function renderTagsHtml(tags) {
  return (tags || []).map((t) => `<span class="tag-pill">${t}</span>`).join("");
}

// 读取/写入 docs/posts.json(数组)，自动按 date 倒序排序后写回
function loadPostsIndex() {
  const p = path.join(process.cwd(), "docs", "posts.json");
  if (!fs.existsSync(p)) return [];
  return fs.readJsonSync(p);
}

function savePostsIndex(posts) {
  posts.sort((a, b) => (a.date > b.date ? 1 : -1));
  const p = path.join(process.cwd(), "docs", "posts.json");
  fs.writeJsonSync(p, posts, { spaces: 2 });
}

module.exports = {
  loadConfig,
  parseMarkdownFile,
  renderTemplate,
  listPostFiles,
  renderTagsHtml,
  loadPostsIndex,
  savePostsIndex
};
