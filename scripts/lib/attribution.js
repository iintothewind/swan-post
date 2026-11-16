const { getPostCanonicalUrl, getPostMarkdownUrl } = require("./config");

function getDefaultPostAuthor(config) {
return config.postAuthor || config.author || "";
}

function getPostAuthor(config, post) {
if (post && post.author) return String(post.author);
return getDefaultPostAuthor(config);
}

// A post's source is its own Markdown mirror. With mirrors disabled
// (agentMarkdown: false) no .md is published, so fall back to the HTML permalink.
function getPostSource(config, post) {
if (config.agentMarkdown === false) return getPostCanonicalUrl(config, post.slug);
return getPostMarkdownUrl(config, post.slug);
}

function formatPostAttributionFrontMatter(config) {
const author = getDefaultPostAuthor(config);
return "header: true\n"
+ "footer: true\n"
+ "author: " + JSON.stringify(author) + "\n";
}

module.exports = {
getDefaultPostAuthor,
getPostAuthor,
getPostSource,
formatPostAttributionFrontMatter,
};
