const fs = require("fs-extra");
const path = require("path");
const { getSiteUrl, getPostCanonicalUrl } = require("./config");
const { getPostAuthor, getPostSource } = require("./attribution");
const { renderTagsHtml } = require("./markdown");

// Simple placeholder substitution: template is a template string, vars is a { KEY: value } object.
// Replaces every {{KEY}} in the template with its value.
// Note: before substitution, each value's "{{" is replaced with a sentinel to prevent literal {{KEY}}
// occurrences inside a value (e.g. {{PAGE_TITLE}} written in body text when discussing template engines)
// from being accidentally replaced by a later global placeholder substitution.
// After all substitutions are done, the sentinel is restored to "{{".
const TEMPLATE_BRACE_SENTINEL = "\u0000SWP_OPEN_BRACE\u0000";
function renderTemplate(template, vars) {
let result = template;
const escaped = {};
for (const key in vars) {
escaped[key] = String(vars[key]).split("{{").join(TEMPLATE_BRACE_SENTINEL);
}
for (const key in escaped) {
const re = new RegExp("{{" + key + "}}", "g");
result = result.replace(re, escaped[key]);
}
return result.split(TEMPLATE_BRACE_SENTINEL).join("{{");
}

function resolvePostIncludeFlags(frontMatter) {
return {
showHeader: frontMatter.header !== false,
showFooter: frontMatter.footer !== false
};
}

function loadPostIncludeFile(relativePath) {
const absPath = path.join(process.cwd(), relativePath);
if (!fs.existsSync(absPath)) {
console.warn(`Post include not found: ${relativePath}`);
return "";
}
const content = fs.readFileSync(absPath, "utf-8");
return content || "";
}

function buildPostTemplateVars(config, post) {
return {
SITE_TITLE: config.title || "",
SITE_AUTHOR: config.author || "",
SITE_DESCRIPTION: config.description || "",
BASE_URL: config.baseUrl || "",
SITE_URL: getSiteUrl(config),
POST_AUTHOR: getPostAuthor(config, post),
POST_SOURCE: getPostSource(config, post),
POST_TITLE: post.title,
POST_DATE: post.formattedDate,
POST_SLUG: post.slug,
POST_TAGS_HTML: renderTagsHtml(post.tags),
CANONICAL_URL: getPostCanonicalUrl(config, post.slug),
GITHUB_USER: config.githubUser || "",
GITHUB_URL: config.githubUser ? "https://github.com/" + config.githubUser : ""
};
}

function buildPostIncludes(config, post) {
const headerPath = config.postHeader || "source/_includes/post-header.html";
const footerPath = config.postFooter || "source/_includes/post-footer.html";
const bodyMetaPath = config.postBodyMeta || "source/_includes/post-body-meta.html";
const bodyAttributionPath = config.postBodyAttribution || "source/_includes/post-body-attribution.html";
const templateVars = buildPostTemplateVars(config, post);
const headerHtml = post.showHeader
? renderTemplate(loadPostIncludeFile(headerPath), templateVars)
: "";
const bodyMetaHtml = post.showFooter
? renderTemplate(loadPostIncludeFile(bodyMetaPath), templateVars)
: "";
const footerHtml = post.showFooter
? renderTemplate(loadPostIncludeFile(footerPath), templateVars)
: "";
const bodyAttributionHtml = post.showFooter
? renderTemplate(loadPostIncludeFile(bodyAttributionPath), templateVars)
: "";
return { headerHtml, bodyMetaHtml, footerHtml, bodyAttributionHtml };
}

module.exports = {
renderTemplate,
resolvePostIncludeFlags,
loadPostIncludeFile,
buildPostTemplateVars,
buildPostIncludes,
};
