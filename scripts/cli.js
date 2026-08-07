#!/usr/bin/env node
const { program } = require("commander");
const { build } = require("./build");
const { renderOne } = require("./render");
const { newPost } = require("./new-post");
const { serve } = require("./serve");
const { deploy } = require("./deploy");
const { syncGists } = require("./gist-sync");

program
.name("swp-cli")
.description("Personal static blog generator");

program
.command("build")
.description("Full build of the entire site to docs/ directory")
.action(() => {
build();
});

program
.command("render <file>")
.description("Render a single markdown file to HTML and update the index, without rebuilding the entire site")
.action((file) => {
renderOne(file);
});

program
.command("new <slug>")
.description("Create a new post, slug in lowercase-hyphen format, e.g. my-first-post")
.option("-t, --title <title>", "Post title (can be Chinese)")
.action((slug, options) => {
newPost(slug, options.title);
});

program
.command("serve")
.description("Preview docs/ directory locally")
.option("-p, --port <port>", "Port number", "8080")
.action((options) => {
serve(parseInt(options.port, 10));
});

program
.command("deploy")
.description("Rebuild the site and auto git add/commit/push to trigger GitHub Pages update")
.option("-m, --message <message>", "Custom commit message")
.option("-f, --force", "Force push from .deploy even when build output is unchanged")
.action((options) => {
deploy(options.message, options.force);
});

program
.command("gist-sync")
.description("Sync a GitHub user's public gists as posts and merge into the site (delete gist posts that no longer exist)")
.option("-u, --user <user>", "GitHub username (defaults to githubUser in blog.config.json)")
.action((options) => {
syncGists(options.user);
});

program.parse(process.argv);
