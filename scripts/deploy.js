const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs-extra");
const { build } = require("./build");
const { loadConfig } = require("./utils");

function deploy(message) {
const config = loadConfig();
const repoUrl = config.deployTarget;
if (!repoUrl) {
console.error("请在 blog.config.json 中设置 deployTarget（你的 GitHub Pages 仓库地址）");
process.exit(1);
}

const docsDir = path.join(process.cwd(), "docs");
const deployDir = path.join(process.cwd(), ".deploy");
const commitMsg = (message || ("deploy: " + new Date().toISOString())).replace(/"/g, "'");

try {
// 第 1 步：构建
console.log("== 第 1 步：重新构建站点 ==");
build();

// 第 2 步：克隆/拉取目标 Pages 仓库
console.log("== 第 2 步：同步 GitHub Pages 仓库 ==");
if (!fs.existsSync(path.join(deployDir, ".git"))) {
fs.ensureDirSync(deployDir);
execSync('git clone --depth 1 "' + repoUrl + '" "' + deployDir + '"', { stdio: "inherit" });
} else {
execSync('git -C "' + deployDir + '" pull --ff-only', { stdio: "inherit" });
}

// 第 3 步：替换 Pages 仓库内容为构建产物
console.log("== 第 3 步：更新静态文件 ==");
fs.readdirSync(deployDir).forEach(function (f) {
if (f !== ".git") fs.removeSync(path.join(deployDir, f));
});
fs.copySync(docsDir, deployDir);

// 第 4 步：提交并强制推送到 Pages 仓库
// 使用 force push 安全，因为 Pages 仓库内容全部由构建生成，无需保留历史
console.log("== 第 4 步：推送到 GitHub Pages ==");
var status = execSync('git -C "' + deployDir + '" status --porcelain', { encoding: "utf-8" }).trim();
if (status) {
execSync('git -C "' + deployDir + '" add -A', { stdio: "inherit" });
execSync('git -C "' + deployDir + '" commit -m "' + commitMsg + '"', { stdio: "inherit" });
execSync('git -C "' + deployDir + '" push --force', { stdio: "inherit" });
console.log("已推送到 GitHub Pages。");
} else {
console.log("没有文件变化，跳过推送。");
}

console.log("部署完成。GitHub Pages 通常需要 1~2 分钟生效。");
} catch (err) {
console.error("部署失败:", err.message);
process.exit(1);
}
}

module.exports = { deploy };
