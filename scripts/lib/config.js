const fs = require("fs-extra");
const path = require("path");

// Read blog.config.json, return the config object
function loadConfig() {
const configPath = path.join(process.cwd(), "blog.config.json");
return fs.readJsonSync(configPath);
}

function getSiteUrl(config) {
if (config.siteUrl) return String(config.siteUrl).replace(/\/$/, "");
if (config.githubUser) return "https://" + config.githubUser + ".github.io";
return "";
}

function getBasePath(config) {
return String(config.baseUrl || "").replace(/\/$/, "");
}

function buildAbsoluteUrl(config, relPath) {
const site = getSiteUrl(config);
const base = getBasePath(config);
const normalized = relPath.startsWith("/") ? relPath : "/" + relPath;
return site + base + normalized;
}

function getPostCanonicalUrl(config, slug) {
return buildAbsoluteUrl(config, "/posts/" + slug + ".html");
}

function getPostMarkdownUrl(config, slug) {
return buildAbsoluteUrl(config, "/posts/" + slug + ".md");
}

module.exports = {
loadConfig,
getSiteUrl,
getBasePath,
buildAbsoluteUrl,
getPostCanonicalUrl,
getPostMarkdownUrl,
};
