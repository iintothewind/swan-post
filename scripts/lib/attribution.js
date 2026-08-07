const { getSiteUrl } = require("./config");

function getDefaultPostAuthor(config) {
return config.postAuthor || config.author || "";
}

function getDefaultPostSource(config) {
if (config.postSource) return String(config.postSource);
const site = getSiteUrl(config);
return site ? site.replace(/\/$/, "") + "/" : "";
}

function getPostAuthor(config, post) {
if (post && post.author) return String(post.author);
return getDefaultPostAuthor(config);
}

function getPostSource(config, post) {
if (post && post.source) return String(post.source);
return getDefaultPostSource(config);
}

function formatPostAttributionFrontMatter(config) {
const author = getDefaultPostAuthor(config);
const source = getDefaultPostSource(config);
return "header: true\n"
+ "footer: true\n"
+ "author: " + JSON.stringify(author) + "\n"
+ "source: " + JSON.stringify(source) + "\n";
}

module.exports = {
getDefaultPostAuthor,
getDefaultPostSource,
getPostAuthor,
getPostSource,
formatPostAttributionFrontMatter,
};
