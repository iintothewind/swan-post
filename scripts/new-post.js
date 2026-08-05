const fs = require("fs-extra");
const path = require("path");

function newPost(slug, titleOption) {
if (!slug || !/^[a-z0-9\-]+$/.test(slug)) {
console.error("slug must consist of lowercase letters, digits, and hyphens, e.g.: my-first-post");
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
console.error("File already exists: " + filePath);
process.exit(1);
}

const title = titleOption || slug;
const content = `---
title: ${title}
date: ${dateStr}
tags: []
categories: []
---

Write your content here.
`;
fs.writeFileSync(filePath, content, "utf-8");
console.log("Created: " + filePath);
}

module.exports = { newPost };
