const fs = require("fs-extra");
const path = require("path");
const {
  loadConfig, parseMarkdownFile, renderTemplate,
  listPostFiles, renderTagsHtml, savePostsIndex
} = require("./utils");

function build() {
  const config = loadConfig();
  const docsDir = path.join(process.cwd(), "docs");

  // 1. 清空并重建 docs 目录结构
  fs.emptyDirSync(docsDir);
  fs.ensureDirSync(path.join(docsDir, "posts"));
  fs.ensureDirSync(path.join(docsDir, "css"));
  fs.ensureDirSync(path.join(docsDir, "js"));

  // 2. 拷贝静态资源
  fs.copySync(path.join(process.cwd(), "assets", "css"), path.join(docsDir, "css"));
  fs.copySync(path.join(process.cwd(), "assets", "js"), path.join(docsDir, "js"));

  // 3. 读取所有模板文件为字符串
  const layoutTpl = fs.readFileSync(path.join(process.cwd(), "templates", "layout.html"), "utf-8");
  const postTpl = fs.readFileSync(path.join(process.cwd(), "templates", "post.html"), "utf-8");
  const indexTpl = fs.readFileSync(path.join(process.cwd(), "templates", "index.html"), "utf-8");

  // 4. 解析所有 markdown 文章
  const files = listPostFiles();
  const posts = files.map(parseMarkdownFile);

  // 5. 为每篇文章生成 html 页面
  posts.forEach((post) => {
    const postHtml = renderTemplate(postTpl, {
      POST_TITLE: post.title,
      POST_DATE: post.date,
      POST_TAGS_HTML: renderTagsHtml(post.tags),
      POST_CONTENT_HTML: post.contentHtml
    });
    const fullHtml = renderTemplate(layoutTpl, {
      PAGE_TITLE: post.title,
      SITE_TITLE: config.title,
      BASE_URL: config.baseUrl,
      CONTENT: postHtml
    });
    fs.writeFileSync(path.join(docsDir, "posts", post.slug + ".html"), fullHtml, "utf-8");
  });

  // 6. 生成首页
  const homeContent = renderTemplate(indexTpl, {
    SITE_TITLE: config.title,
    SITE_DESCRIPTION: config.description
  });
  const homeHtml = renderTemplate(layoutTpl, {
    PAGE_TITLE: "首页",
    SITE_TITLE: config.title,
    BASE_URL: config.baseUrl,
    CONTENT: homeContent
  });
  fs.writeFileSync(path.join(docsDir, "index.html"), homeHtml, "utf-8");

  // 7. 生成 posts.json 索引 (注意 url 字段格式:posts/<slug>.html)
  const postsIndex = posts.map((post) => ({
    title: post.title,
    date: post.date,
    tags: post.tags,
    categories: post.categories,
    slug: post.slug,
    url: "posts/" + post.slug + ".html",
    excerpt: post.excerpt
  }));
  savePostsIndex(postsIndex);

  console.log(`构建完成，共 ${posts.length} 篇文章，输出到 docs/`);
}

module.exports = { build };
