// Aggregation re-export layer.
// Implementation lives in scripts/lib/* (focused modules); this barrel keeps
// every existing `require("./utils")` call site unchanged during the P3 split.

module.exports = {
...require("./lib/config"),
...require("./lib/posts-index"),
...require("./lib/static-assets"),
...require("./lib/markdown"),
...require("./lib/attribution"),
...require("./lib/templates"),
...require("./lib/agent-mirrors"),
...require("./lib/discovery-artifacts"),
...require("./lib/post-entry"),
};
