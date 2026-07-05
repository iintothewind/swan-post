(function () {
var BASE_URL = window.BASE_URL || "";
var body = document.body;
var toggleBtn = document.getElementById("sidebar-toggle");
var overlayMask = document.getElementById("overlay-mask");

toggleBtn.addEventListener("click", function () {
body.classList.toggle("sidebar-open");
});
overlayMask.addEventListener("click", function () {
body.classList.remove("sidebar-open");
});

// Tab 切换
var tabBtns = document.querySelectorAll(".tab-btn");
tabBtns.forEach(function (btn) {
btn.addEventListener("click", function () {
tabBtns.forEach(function (b) { b.classList.remove("active"); });
btn.classList.add("active");
document.querySelectorAll(".tab-panel").forEach(function (p) {
p.classList.remove("active");
});
document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
});
});

fetch(BASE_URL + "/posts.json")
.then(function (res) { return res.json(); })
.then(function (posts) {
renderTimeline(posts);
renderTagCloud(posts);
})
.catch(function (err) {
console.error("加载 posts.json 失败:", err);
});

function renderTimeline(posts) {
var ul = document.getElementById("post-list-timeline");
ul.innerHTML = "";
posts.forEach(function (post) {
ul.appendChild(buildPostItem(post));
});
}

function buildPostItem(post) {
var li = document.createElement("li");
var a = document.createElement("a");
a.href = BASE_URL + "/" + post.url;
a.innerHTML = post.title + '<span class="post-item-date">' + post.formattedDate + "</span>";
li.appendChild(a);
return li;
}

function renderTagCloud(posts) {
var tagMap = {};
posts.forEach(function (post) {
(post.tags || []).forEach(function (tag) {
tagMap[tag] = tagMap[tag] || [];
tagMap[tag].push(post);
});
});

var cloud = document.getElementById("tag-cloud");
var listEl = document.getElementById("post-list-by-tag");
cloud.innerHTML = "";
listEl.innerHTML = "";

var tagNames = Object.keys(tagMap).sort();
tagNames.forEach(function (tag) {
var chip = document.createElement("span");
chip.className = "tag-chip";
chip.textContent = tag + " (" + tagMap[tag].length + ")";
chip.addEventListener("click", function () {
document.querySelectorAll(".tag-chip").forEach(function (c) {
c.classList.remove("active");
});
chip.classList.add("active");
listEl.innerHTML = "";
tagMap[tag].forEach(function (post) {
listEl.appendChild(buildPostItem(post));
});
});
cloud.appendChild(chip);
});
}
})();
