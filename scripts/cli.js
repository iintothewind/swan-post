#!/usr/bin/env node
const { program } = require("commander");
const { build } = require("./build");
const { renderOne } = require("./render");
const { newPost } = require("./new-post");
const { serve } = require("./serve");
const { deploy } = require("./deploy");

program
  .name("swp-cli")
  .description("个人静态博客生成工具");

program
  .command("build")
  .description("全量构建整个站点到 docs/ 目录")
  .action(() => {
    build();
  });

program
  .command("render <file>")
  .description("渲染单篇 markdown 文件为 html 并更新索引，不重建全站")
  .action((file) => {
    renderOne(file);
  });

program
  .command("new <slug>")
  .description("创建一篇新文章，slug 为纯英文短横线格式，例如 my-first-post")
  .option("-t, --title <title>", "文章标题 (可以是中文)")
  .action((slug, options) => {
    newPost(slug, options.title);
  });

program
  .command("serve")
  .description("本地预览 docs/ 目录")
  .option("-p, --port <port>", "端口号", "8080")
  .action((options) => {
    serve(parseInt(options.port, 10));
  })
  .command("deploy")
  .description("部署到 GitHub Pages")
  .option("-m, --message <msg>", "提交信息", "")
  .action((options) => {
    deploy(options.message);
  });

program.parse(process.argv);
