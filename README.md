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

本工具采用**双仓库模式**：
- **源码仓库** (`swan-post`)：存放工具代码和 Markdown 文章
- **Pages 仓库** (`<user>.github.io`)：存放构建产物（静态 HTML/CSS/JS）

先在 `blog.config.json` 中配置 Pages 仓库地址：

```json
{
  "deployTarget": "git@github.com:username/username.github.io.git"
}
```

然后一条命令部署：

```bash
swp-cli deploy
```

也可以自定义 commit message：

```bash
swp-cli deploy -m "写了一篇新文章"
```

命令执行流程：
1. 构建站点到 `docs/`
2. 浅克隆 Pages 仓库到本地 `.deploy/`
3. 用 `docs/` 内容替换 `.deploy/`
4. force push 到 Pages 仓库

> 首次部署前需确保 Pages 仓库已在 GitHub 创建，且你有推送权限。

### 同步 Gist 为文章

把 GitHub 账号的 public gist 同步成博客文章，合并到现有文章里：

```bash
swp-cli gist-sync
# 或临时指定用户名（默认读 blog.config.json 的 githubUser）：
swp-cli gist-sync --user iintothewind
```

行为说明：
- 只同步**含 Markdown 文件**的 public gist（多文件时取第一个 `.md`），代码片段类 gist 自动跳过。
- 文章写到 `source/_posts/<日期>-<gist_id>.md`，front-matter 自动生成：`title` 取 gist 描述（去掉 `_by_agent_zero` 署名后缀）、`date` 取 gist 创建时间、`tags` 固定为 `["gist", "summary"]`、`gist_id` 记录来源。
- gist 在 GitHub 上被删除后，再次同步会删除本地对应文章。
- 同步完成后自动全量构建站点。
- 可选：设置 `GITHUB_TOKEN` 环境变量可提高 GitHub API 限额（匿名 60 次/小时）。

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

- `baseUrl`: 本地预览时无需设置。部署到 GitHub Pages 时，如果是项目页面（如 `https://username.github.io/reponame/`），设为 `"/reponame"`。
- `recentPostsCount`: 首页正文区域展示的"最近文章"数量，默认为 `10`。
- `deployTarget`: GitHub Pages 仓库 SSH 地址，如 `"git@github.com:username/username.github.io.git"`。部署命令会将构建产物推送到此仓库。

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
├── .deploy/ # Pages 仓库临时 clone（自动生成，已 gitignore）
├── docs/ # 构建产物（已 gitignore，通过 deploy 推送到 Pages 仓库）
└── README.md
```
