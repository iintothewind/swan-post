# swan-post (swp) —— 个人静态博客生成器

> 基于 Node.js 的个人静态博客生成工具，输出结果可部署到 GitHub Pages。

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置站点

编辑 `blog.config.json` 修改站点信息:

```json
{
  "title": "我的博客",
  "author": "Ivar",
  "description": "个人博客",
  "baseUrl": ""
}
```

- `baseUrl`: 如果博客部署在 `https://username.github.io/`(根域名),留空字符串 `""`。如果部署在 `https://username.github.io/reponame/`(项目页面),设为 `"/reponame"`。

### 3. 创建新文章

```bash
swp-cli new my-first-post --title "我的第一篇文章"
```

这将在 `source/_posts/` 下生成一个新的 Markdown 文件。

### 4. 渲染文章

**增量渲染** (推荐):只渲染单篇文章，无需全量构建

```bash
swp-cli render source/_posts/2026-07-04-hello-world.md
```

**全量构建**:重新构建整个站点 (如修改了模板/CSS)

```bash
swp-cli build
```

### 5. 本地预览

```bash
swp-cli serve
```

然后在浏览器访问 `http://localhost:8080`

### 6. 部署到 GitHub Pages

1. 将 `docs/` 目录添加到 git:
   ```bash
   git add docs/
   git commit -m "初始部署"
   git push
   ```

2. 在 GitHub 仓库 Settings → Pages 中设置:
   - Source: `main` 分支 `/docs` 目录

## 文章格式

文章使用 Hexo 风格的 Markdown，放在 `source/_posts/` 目录下:

```markdown
---
title: 文章标题
date: 2026-07-04 10:00:00
tags: [标签 1，标签2]
categories: [分类 1]
---

正文内容，标准 Markdown 语法。
```

- `title`: 必填，文章标题 (可以是中文)
- `date`: 必填，格式 `YYYY-MM-DD HH:mm:ss`
- `tags`: 选填，标签数组
- `categories`: 选填，分类数组

## 命令行说明

| 命令 | 说明 |
|------|------|
| `swp-cli build` | 全量构建整个站点到 `docs/` 目录 |
| `swp-cli render <file>` | 渲染单篇 markdown 文件为 html 并更新索引，不重建全站 |
| `swp-cli new <slug> -t <title>` | 创建一篇新文章，slug 为纯英文短横线格式 |
| `swp-cli serve [-p <port>]` | 本地预览 `docs/` 目录 |

## 功能特性

- ✅ 固定布局:左侧 sidebar(文章列表 + 导航),默认隐藏，点击按钮弹出
- ✅ 支持"按发布时间倒序"和"按 tag 分组"两种查看方式
- ✅ Hexo 风格的 Markdown(YAML front-matter + 正文)
- ✅ 单篇增量渲染，无需全量重新构建
- ✅ 本地静态预览服务器

## 目录结构

```
swan-post/
├── package.json
├── blog.config.json              # 站点配置
├── source/
│   └── _posts/                   # 存放所有 Markdown 文章
├── templates/                    # HTML 模板
│   ├── layout.html
│   ├── post.html
│   └── index.html
├── assets/
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── main.js
├── scripts/
│   ├── cli.js                    # CLI 入口
│   ├── utils.js                  # 公共函数
│   ├── build.js                  # 全量构建
│   ├── render.js                 # 单篇增量渲染
│   ├── new-post.js               # 新建文章
│   └── serve.js                  # 本地静态预览服务器
├── docs/                         # 输出目录 (GitHub Pages 从这里发布)
└── README.md
```

## 限制说明

- 不做分页 (个人博客文章量不大，sidebar 直接展示全部列表)
- 不做评论系统、不做 RSS、不做搜索
- 不做 live-reload(热更新)
- 不做中文转拼音生成 slug，文件名 slug 由用户在命令行手动指定

## License

MIT
