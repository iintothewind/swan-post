# swan-post (swp) —— 个人静态博客生成器

> 用 Node.js 写的一个替代 Hexo 的个人静态博客生成工具，输出结果部署到 GitHub Pages。

## 功能范围

1. 固定布局：左侧 sidebar(文章列表 + 导航)，默认隐藏，点击按钮弹出；右侧显示正文。
2. 文章使用 Hexo 风格的 Markdown(YAML front-matter + 正文)。
3. 命令行工具：可以把单篇 `.md` 直接渲染成 `.html` 并"上线"，不需要全量重新构建整个站点。

## 明确不做的事

- 不做分页
- 不做评论系统、不做 RSS、不做搜索
- 不做 live-reload(热更新)
- 不做中文转拼音生成 slug

## 安装

```bash
npm install
```

## 使用

### 创建新文章

```bash
swp-cli new my-first-post --title "我的第一篇文章"
```

### 渲染单篇文章并加入站点

```bash
swp-cli render source/_posts/2026-07-04-my-first-post.md
```

### 全量重新构建整个站点

```bash
swp-cli build
```

### 本地预览

```bash
swp-cli serve
```

打开浏览器访问 http://localhost:8080

### 部署到 GitHub Pages

```bash
swp-cli deploy
```

也可以自定义 commit message：

```bash
swp-cli deploy -m "写了一篇新文章"
```

首次使用前提：仓库已 `git init`，并且已经 `git remote add origin <你的仓库地址>`

部署后：在仓库 Settings → Pages 设置 Source 为 main 分支 `/docs` 目录

## 文章格式

每篇文章放在 `source/_posts/` 目录下，文件格式：

```markdown
---
title: 文章标题
date: 2026-07-04 10:00:00
tags: [标签 1, 标签 2]
categories: [分类 1]
---

正文内容，标准 Markdown 语法。
```

文件名格式：`<slug>.md`，slug 由用户在命令行指定 (纯小写字母、数字、短横线)。

## 配置

站点配置文件 `blog.config.json`：

```json
{
  "title": "我的博客",
  "author": "Ivar",
  "description": "个人博客",
  "baseUrl": "",
  "recentPostsCount": 10
}
```

- `baseUrl`: 如果博客部署在 `https://username.github.io/`(根域名)，留空字符串 `""`。如果部署在 `https://username.github.io/reponame/`(项目页面)，设为 `"/reponame"`。
- `recentPostsCount`: 首页正文区域展示的"最近文章"数量，默认为 `10`。

## 目录结构

```
swan-post/
├── package.json
├── blog.config.json
├── source/
│   └── _posts/
├── templates/
├── assets/
│   ├── css/
│   └── js/
├── scripts/
├── docs/ # GitHub Pages 输出目录
└── README.md
```
