const fs = require("fs-extra");
const path = require("path");

// Return an array of absolute paths for all .md files under source/_posts
function listPostFiles() {
const dir = path.join(process.cwd(), "source", "_posts");
fs.ensureDirSync(dir);
return fs.readdirSync(dir)
.filter((f) => f.endsWith(".md"))
.map((f) => path.join(dir, f));
}

// Sort a posts array by the date field in descending order (newest first). Returns a new array;
// does not mutate the original. Posts without a date field are pushed to the end
// ("unknown when written" treated as oldest), to avoid empty strings sorting first.
function sortPostsByDateDesc(posts) {
return posts.slice().sort((a, b) => {
const da = a.date || "";
const db = b.date || "";
if (!da && !db) return (b.title || "").localeCompare(a.title || "");
if (!da) return 1;
if (!db) return -1;
const dateCmp = db.localeCompare(da);
if (dateCmp !== 0) return dateCmp;
return (b.title || "").localeCompare(a.title || "");
});
}

// Read/write docs/posts.json (array), auto-sort by date descending before writing back
function loadPostsIndex() {
const p = path.join(process.cwd(), "docs", "posts.json");
if (!fs.existsSync(p)) return [];
return fs.readJsonSync(p);
}

// Sort and write to docs/posts.json, then return the sorted array for the caller to reuse directly.
// (The caller typically needs this sorted array right after to generate the homepage recent-posts list,
// avoiding a second sort.)
function savePostsIndex(posts) {
const sorted = sortPostsByDateDesc(posts);
const p = path.join(process.cwd(), "docs", "posts.json");
fs.writeJsonSync(p, sorted, { spaces: 2 });
return sorted;
}

module.exports = {
listPostFiles,
sortPostsByDateDesc,
loadPostsIndex,
savePostsIndex,
};
