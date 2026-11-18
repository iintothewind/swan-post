(function () {
var BASE_URL = window.BASE_URL || "";
var body = document.body;
var toggleBtn = document.getElementById("sidebar-toggle");
var overlayMask = document.getElementById("overlay-mask");

toggleBtn.addEventListener("click", function () {
body.classList.remove("toc-open");
body.classList.toggle("sidebar-open");
});
overlayMask.addEventListener("click", function () {
body.classList.remove("sidebar-open", "toc-open");
});

// Table of contents: only posts with enough headings ship the panel.
var tocToggle = document.getElementById("toc-toggle");
var toc = document.getElementById("toc");
if (tocToggle && toc) {
var desktopToc = window.matchMedia("(min-width: 1024px)");
tocToggle.addEventListener("click", function () {
if (desktopToc.matches) {
body.classList.toggle("toc-collapsed");
} else {
body.classList.remove("sidebar-open");
body.classList.toggle("toc-open");
}
});
// On narrow screens the drawer covers the article, so close it once a section is picked.
toc.addEventListener("click", function (e) {
if (e.target.closest("a")) body.classList.remove("toc-open");
});
}

// Tab switching
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
console.error("Failed to load posts.json:", err);
});

function renderTimeline(posts) {
  var count = window.SIDEBAR_POST_COUNT || 200;
  var ul = document.getElementById("post-list-timeline");
  ul.innerHTML = "";
  posts.slice(0, count).forEach(function (post) {
    ul.appendChild(buildPostItem(post));
  });
}

function buildPostItem(post) {
var li = document.createElement("li");
var a = document.createElement("a");
a.href = BASE_URL + "/" + post.url;
var dateText = post.formattedDate || post.date || "";
// Title comes from front-matter and is untrusted text: use textContent instead of innerHTML
// so that even if the title contains HTML like <script>, it will only be displayed as text
// and not executed.
a.textContent = post.title;
var dateSpan = document.createElement("span");
dateSpan.className = "post-item-date";
dateSpan.textContent = dateText;
a.appendChild(dateSpan);
li.appendChild(a);
return li;
}

function renderTagCloud(posts) {
var tagMap = {};
posts.forEach(function (post) {
var tags = Array.isArray(post.tags) ? post.tags : [];
tags.forEach(function (tag) {
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

// ---------- Block tools ----------
// Icon buttons at the top-right of rendered diagrams (fullscreen + copy source) and
// display math (copy TeX). Injected here rather than at build time, so the post HTML
// that feeds, excerpts and the .md mirror are derived from stays content-only.
// Static 16x16 stroke icons; never interpolated with user content.
var TOOL_ICONS = {
copy: '<rect x="5.5" y="5.5" width="8" height="8" rx="1.2"/><path d="M10.5 5.5V3.7a1.2 1.2 0 0 0-1.2-1.2H3.7a1.2 1.2 0 0 0-1.2 1.2v5.6a1.2 1.2 0 0 0 1.2 1.2h1.8"/>',
check: '<path d="M3 8.5l3.2 3.2L13 4.8"/>',
expand: '<path d="M2.5 6V2.5H6M10 2.5h3.5V6M13.5 10v3.5H10M6 13.5H2.5V10"/>',
collapse: '<path d="M6 2.5V6H2.5M10 2.5V6h3.5M10 13.5V10h3.5M6 13.5V10H2.5"/>'
};

function setToolIcon(btn, icon, label) {
btn.innerHTML = '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + TOOL_ICONS[icon] + "</svg>";
btn.setAttribute("aria-label", label);
btn.title = label;
}

function makeToolButton(icon, label, onClick) {
var btn = document.createElement("button");
btn.type = "button";
setToolIcon(btn, icon, label);
btn.addEventListener("click", onClick);
return btn;
}

// null where the async clipboard API is missing (non-secure context), so no dead
// button is shown. On success the icon turns into a check mark for 1.5s.
function makeCopyButton(label, text) {
if (!navigator.clipboard) return null;
var resetTimer = 0;
var btn = makeToolButton("copy", label, function () {
navigator.clipboard.writeText(text).then(function () {
setToolIcon(btn, "check", "Copied");
clearTimeout(resetTimer);
resetTimer = setTimeout(function () { setToolIcon(btn, "copy", label); }, 1500);
}).catch(function (err) {
console.error("Copy failed:", err);
});
});
return btn;
}

// A host with no usable button is left untouched.
function addBlockTools(host, buttons) {
var bar = document.createElement("div");
bar.className = "block-tools";
buttons.forEach(function (btn) {
if (btn) bar.appendChild(btn);
});
if (!bar.firstChild) return;
host.classList.add("block-frame");
host.appendChild(bar);
}

// Diagrams. Each .mermaid gets a wrapper: the loader in layout.html rewrites the
// element's own content on every (re-)render and the element scrolls sideways, so
// the toolbar has to live outside it.
var exitFullscreen = null; // set while a diagram is fullscreen
document.querySelectorAll(".post-body .mermaid").forEach(function (el) {
// The loader caches the source in data-src before swapping the text for an SVG;
// until then the text itself is the source.
var source = (el.getAttribute("data-src") || el.textContent).replace(/\s+$/, "");
var frame = document.createElement("div");
frame.className = "mermaid-frame";
el.parentNode.insertBefore(frame, el);
frame.appendChild(el);
var fullscreenBtn = makeToolButton("expand", "Fullscreen", function () {
setFullscreen(!frame.classList.contains("is-fullscreen"));
});
// Taking the frame out of flow can shorten the page and clamp its scroll offset,
// so the offset is restored on exit.
var scrollYBeforeFullscreen = 0;
function setFullscreen(on) {
if (on) scrollYBeforeFullscreen = window.scrollY;
frame.classList.toggle("is-fullscreen", on);
body.classList.toggle("diagram-fullscreen", on);
if (!on) window.scrollTo({ top: scrollYBeforeFullscreen, behavior: "instant" });
setToolIcon(fullscreenBtn, on ? "collapse" : "expand", on ? "Exit fullscreen" : "Fullscreen");
exitFullscreen = on ? function () { setFullscreen(false); } : null;
}
addBlockTools(frame, [fullscreenBtn, makeCopyButton("Copy Mermaid source", source)]);
});
document.addEventListener("keydown", function (e) {
if (e.key === "Escape" && exitFullscreen) exitFullscreen();
});

// Display math. KaTeX keeps the TeX source in the MathML annotation; a formula
// that failed to parse has none and gets no button.
document.querySelectorAll(".post-body section > eqn").forEach(function (eqn) {
var annotation = eqn.querySelector('annotation[encoding="application/x-tex"]');
if (!annotation) return;
addBlockTools(eqn.parentNode, [makeCopyButton("Copy TeX source", annotation.textContent.trim())]);
});
})();
