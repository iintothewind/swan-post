const fs = require("fs-extra");
const path = require("path");
const { getSiteUrl, getPostMarkdownUrl } = require("./config");
const { getPostAuthor, getPostSource } = require("./attribution");
const { renderTemplate, loadPostIncludeFile, buildPostTemplateVars } = require("./templates");

function buildAgentMarkdown(config, post) {
if (config.agentMarkdown === false) return "";
const templatePath = config.agentAttribution || "source/_includes/agent-attribution.md";
const template = loadPostIncludeFile(templatePath);
const tags = Array.isArray(post.tags) ? post.tags.join(", ") : "";
const templateVars = buildPostTemplateVars(config, post);
templateVars.POST_TAGS = tags;
const header = renderTemplate(template, templateVars);
const bodyMeta = "author: " + getPostAuthor(config, post) + "\nsource: " + getPostSource(config, post) + "\n\n";
const footer = "\n---\n\n> © " + getPostAuthor(config, post) + " · " + getSiteUrl(config) + "\n";
return header + "\n" + bodyMeta + (post.content || "").trim() + footer;
}

function writeAgentMarkdownFile(docsDir, post, markdown) {
if (!markdown) return;
const outPath = path.join(docsDir, "posts", post.slug + ".md");
fs.writeFileSync(outPath, markdown, "utf-8");
}

function renderPostAlternateLink(config, slug) {
if (config.agentMarkdown === false) return "";
const mdUrl = getPostMarkdownUrl(config, slug);
return '<link rel="alternate" type="text/markdown" href="' + mdUrl + '">';
}

module.exports = {
buildAgentMarkdown,
writeAgentMarkdownFile,
renderPostAlternateLink,
};
