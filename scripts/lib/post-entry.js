// Normalized post entry shapes shared across posts.json, llms.txt, and sitemap.xml.
// Keeping these in one place prevents field-mapping drift between the three consumers.

// Shape written to docs/posts.json (full index entry).
function toIndexEntry(post) {
return {
title: post.title,
date: post.date,
formattedDate: post.formattedDate,
tags: post.tags,
categories: post.categories,
slug: post.slug,
url: "posts/" + post.slug + ".html",
excerpt: post.excerpt,
};
}

// Shape consumed by llms.txt and sitemap.xml (discovery entries).
function toDiscoveryEntry(post) {
return {
title: post.title,
slug: post.slug,
date: post.date,
excerpt: post.excerpt || "",
};
}

module.exports = { toIndexEntry, toDiscoveryEntry };
