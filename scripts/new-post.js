const fs = require("fs-extra");
const path = require("path");

function newPost(slug, titleOption) {
if (!slug || !/^[a-z0-9\-]+$/.test(slug)) {
console.error("slug 必须是小写字母、数字、短横线组成，例如：my-first-post");
process.exit(1);
}
const dir = path.join(process.cwd(), "source", "_posts");
fs.ensureDirSync(dir);
const today = new Date();
const pad = (n) => String(n).padStart(2, "0");
const dateStr = today.getFullYear() + "-" + pad(today.getMonth() + 1) + "-" + pad(today.getDate()) + " " + pad(today.getHours()) + ":" + pad(today.getMinutes()) + ":" + pad(today.getSeconds());
const filename = today.getFullYear() + "-" + pad(today.getMonth() + 1) + "-" + pad(today.getDate()) + "-" + slug + ".md";
const filePath = path.join(dir, filename);

if (fs.existsSync(filePath)) {
console.error("文件已存在：" + filePath);
process.exit(1);
}

const title = titleOption || slug;
const content = `---
title: ${title}
date: ${dateStr}
tags: []
categories: []
---

正文写在这里。
`;
fs.writeFileSync(filePath, content, "utf-8");
console.log("已创建：" + filePath);
}

module.exports = { newPost };
