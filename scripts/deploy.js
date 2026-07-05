const { execSync } = require("child_process");
const { build } = require("./build");

function runInherit(cmd) {
execSync(cmd, { stdio: "inherit" });
}

function runCapture(cmd) {
return execSync(cmd, { stdio: ["pipe", "pipe", "pipe"] }).toString().trim();
}

function hasUncommittedChanges() {
const status = runCapture("git status --porcelain");
return status.length > 0;
}

function deploy(message) {
try {
console.log("== 第 1 步：重新构建站点 ==");
build();

console.log("== 第 2 步：检查 git 状态 ==");
if (!hasUncommittedChanges()) {
console.log("没有检测到任何文件变化，无需部署。");
return;
}

const commitMsg = (message || ("deploy: " + new Date().toISOString())).replace(/"/g, "'");

console.log("== 第 3 步：git add -A ==");
runInherit("git add -A");

console.log(`== 第 4 步：git commit -m "${commitMsg}" ==`);
runInherit(`git commit -m "${commitMsg}"`);

console.log("== 第 5 步：git push ==");
const branch = runCapture("git rev-parse --abbrev-ref HEAD");
runInherit(`git push origin ${branch}`);

console.log("部署完成。GitHub Pages 通常需要 1~2 分钟生效，过一会刷新网站查看。");
} catch (err) {
console.error("部署失败:", err.message);
console.error("请检查：1) 是否已执行 git init 并 git remote add origin <仓库地址>;2) 是否有推送权限;3) 是否有未解决的 git 冲突。");
process.exit(1);
}
}

module.exports = { deploy };
