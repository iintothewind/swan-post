const { build } = require("./build");

function runInherit(cmd) {
  const { execSync } = require("child_process");
  execSync(cmd, { stdio: "inherit" });
}

function runCapture(cmd) {
  const { execSync } = require("child_process");
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

    console.log("\n== 第 2 步：检查 git 状态 ==");
    if (!hasUncommittedChanges()) {
      console.log("没有检测到任何文件变化，无需部署。");
      return;
    }

    const commitMsg = message || ("deploy: " + new Date().toISOString());

    console.log("\n== 第 3 步：git add -A ==");
    runInherit("git add -A");

    console.log(`\n== 第 4 步：git commit -m "${commitMsg}" ==`);
    runInherit(`git commit -m "${commitMsg}"`);

    console.log("\n== 第 5 步：git push ==");
    const branch = runCapture("git rev-parse --abbrev-ref HEAD");
    runInherit(`git push origin ${branch}`);

    console.log("\n✓ 部署完成！博客已更新到 GitHub Pages。");
  } catch (err) {
    console.error("\n✗ 部署失败:", err.message);
    
    if (err.stdout?.includes("nothing to commit")) {
      console.log("提示：docs/ 目录没有更改，无需部署。");
    } else if (err.stdout?.includes("not your changes")) {
      console.log("提示：working tree clean，docs/ 目录已经是最新版本。");
    } else {
      console.log("请检查 git 配置和远程仓库连接是否正常。");
    }
    
    process.exit(1);
  }
}

module.exports = { deploy };
