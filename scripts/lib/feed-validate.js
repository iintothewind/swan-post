const fs = require("fs");
const path = require("path");
const { DOMParser } = require("@xmldom/xmldom");
const { validateXML } = require("xmllint-wasm");
const { getSiteUrl, getBasePath, buildAbsoluteUrl } = require("./config");

// Spec: the feed carries at most the 50 newest posts.
const FEED_ITEM_LIMIT = 50;

// RFC 822, as mandated by the RSS 2.0 spec. This is the single easiest thing to
// get wrong when converting from the ISO 8601 dates kept in post frontmatter,
// so it gets its own dedicated rule rather than a generic "date parses" check.
const RFC822 = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), \d{2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4} \d{2}:\d{2}:\d{2} (GMT|[+-]\d{4})$/;

// Offline stand-in for the W3C feed validator, which is a Python 2 CGI app with
// no installable distribution (no PyPI package) and an unreliable hosted
// endpoint. Two layers:
//   1. libxml2 compiled to WASM — the "xmllint reports no errors" check
//   2. hand-written RSS 2.0 rule assertions over the parsed DOM — the part the
//      W3C validator actually earns its keep on (required elements, RFC 822
//      dates, guid semantics, self reference, item cap, link reachability).
// Nothing here touches the network.

// Layer 1: XML well-formedness via libxml2. Returns an array of error strings.
async function checkWellFormed(xml) {
  const result = await validateXML({
    xml,
    // Skip --format: we only want the parse/validity verdict, not a reindented copy.
    modifyArguments: (args) => ["--noout", ...args.filter((a) => a !== "--format")],
  });
  return result.errors.map((e) => "malformed XML: " + e.message);
}

// Direct child lookup. getElementsByTagName would also match the HTML markup
// nested inside <content:encoded>, which would silently corrupt every rule below.
function childByName(parent, name) {
  const kids = (parent && parent.childNodes) || [];
  for (let i = 0; i < kids.length; i++) {
    if (kids[i].nodeName === name) return kids[i];
  }
  return null;
}

function textOf(parent, name) {
  const el = childByName(parent, name);
  return el ? String(el.textContent || "").trim() : "";
}

function attrOf(parent, name, attr) {
  const el = childByName(parent, name);
  return el && el.getAttribute ? el.getAttribute(attr) : null;
}

// Map an absolute feed URL back to a file under docsDir, so "every link returns
// 200" can be checked locally without deploying.
function localPathForUrl(url, config, docsDir) {
  const site = getSiteUrl(config);
  if (!site || !url.startsWith(site)) return null;
  let rel = url.slice(site.length);
  const base = getBasePath(config);
  if (base && rel.startsWith(base)) rel = rel.slice(base.length);
  rel = rel.split("?")[0].split("#")[0].replace(/^\//, "");
  return path.join(docsDir, ...rel.split("/"));
}

// Layer 2: RSS 2.0 spec rules plus the acceptance criteria from the blog
// agent-friendliness spec. Returns { errors, warnings, facts }.
function checkRules(xml, options) {
  const config = (options && options.config) || {};
  const docsDir = (options && options.docsDir) || path.join(process.cwd(), "docs");
  const errors = [];
  const warnings = [];

  let doc;
  try {
    doc = new DOMParser({
      onError: (level, message) => {
        if (level !== "warning") errors.push("XML parse error: " + String(message).split("\n")[0]);
      },
    }).parseFromString(xml, "text/xml");
  } catch (err) {
    return { errors: ["XML parse failed: " + err.message], warnings, facts: { itemCount: 0, items: [] } };
  }

  const root = doc.documentElement;
  if (!root || root.nodeName !== "rss") {
    return { errors: ["root element must be <rss>, got <" + (root ? root.nodeName : "none") + ">"], warnings, facts: { itemCount: 0, items: [] } };
  }
  if (root.getAttribute("version") !== "2.0") {
    errors.push('<rss version> must be "2.0", got "' + root.getAttribute("version") + '"');
  }

  const channel = doc.getElementsByTagName("channel")[0];
  if (!channel) {
    return { errors: ["<channel> is missing"], warnings, facts: { itemCount: 0, items: [] } };
  }

  // Required channel elements per the RSS 2.0 spec.
  ["title", "link", "description"].forEach((tag) => {
    if (!textOf(channel, tag)) errors.push("channel.<" + tag + "> is required and must not be empty");
  });

  // Self reference: must exist and point at the feed's own absolute URL.
  const selfHref = attrOf(channel, "atom:link", "href");
  const selfRel = attrOf(channel, "atom:link", "rel");
  const expectedSelf = buildAbsoluteUrl(config, "/feed.xml");
  if (selfRel !== "self") {
    errors.push('channel must contain <atom:link rel="self">, got rel="' + selfRel + '"');
  } else if (selfHref !== expectedSelf) {
    errors.push('atom:link rel="self" href must be ' + expectedSelf + ", got " + selfHref);
  }

  ["pubDate", "lastBuildDate"].forEach((tag) => {
    const value = textOf(channel, tag);
    if (value && !RFC822.test(value)) errors.push("channel.<" + tag + "> is not RFC 822: " + value);
  });

  const itemNodes = doc.getElementsByTagName("item");
  const facts = { itemCount: itemNodes.length, items: [] };

  for (let i = 0; i < itemNodes.length; i++) {
    const item = itemNodes[i];
    const where = "item[" + i + "]";
    const title = textOf(item, "title");
    const link = textOf(item, "link");
    const pubDate = textOf(item, "pubDate");
    const description = textOf(item, "description");
    const guidEl = childByName(item, "guid");
    const guid = guidEl ? String(guidEl.textContent || "").trim() : "";

    if (!title) errors.push(where + ".<title> is required");
    if (!link) errors.push(where + ".<link> is required");
    if (!description) errors.push(where + ".<description> is required");

    // The spec pins guid to the permalink so it stays stable forever.
    if (!guidEl) {
      errors.push(where + ".<guid> is required");
    } else {
      if (guidEl.getAttribute("isPermaLink") !== "true") {
        errors.push(where + '.<guid> must have isPermaLink="true"');
      }
      if (guid && link && guid !== link) {
        errors.push(where + ".<guid> must equal <link>: " + guid + " != " + link);
      }
    }

    if (!pubDate) {
      errors.push(where + ".<pubDate> is required");
    } else if (!RFC822.test(pubDate)) {
      errors.push(where + ".<pubDate> is not RFC 822: " + pubDate);
    } else if (Number.isNaN(Date.parse(pubDate))) {
      errors.push(where + ".<pubDate> is not a real date: " + pubDate);
    }

    if (!textOf(item, "content:encoded")) {
      errors.push(where + ".<content:encoded> is required (full-text mirror for agents)");
    }
    if (!textOf(item, "dc:creator")) {
      warnings.push(where + " has no <dc:creator>");
    }

    // Local equivalent of "every link in the feed returns 200".
    if (link) {
      const localPath = localPathForUrl(link, config, docsDir);
      if (!localPath) {
        errors.push(where + ".<link> is not on this site: " + link);
      } else if (!fs.existsSync(localPath)) {
        errors.push(where + ".<link> has no generated file: " + link);
      }
    }

    facts.items.push({ title, link, pubDate });
  }

  if (facts.itemCount > FEED_ITEM_LIMIT) {
    errors.push("feed has " + facts.itemCount + " items, over the " + FEED_ITEM_LIMIT + " cap");
  }

  // Newest first — readers and agents both assume descending order.
  for (let i = 1; i < facts.items.length; i++) {
    const prev = Date.parse(facts.items[i - 1].pubDate);
    const curr = Date.parse(facts.items[i].pubDate);
    if (!Number.isNaN(prev) && !Number.isNaN(curr) && prev < curr) {
      errors.push(
        "items are not sorted newest first: " +
          facts.items[i - 1].pubDate + " < " + facts.items[i].pubDate
      );
      break;
    }
  }

  // Truncation is expected once the blog exceeds the cap; surface it as a warning.
  const indexPath = path.join(docsDir, "posts.json");
  if (fs.existsSync(indexPath)) {
    try {
      const total = JSON.parse(fs.readFileSync(indexPath, "utf-8")).length;
      if (total > facts.itemCount) {
        warnings.push("feed truncated to " + facts.itemCount + " of " + total + " posts (cap " + FEED_ITEM_LIMIT + ")");
      }
    } catch (err) {
      warnings.push("could not read posts.json to check item cap: " + err.message);
    }
  }

  return { errors, warnings, facts };
}

// Full offline validation: well-formedness first, then spec rules. Returns
// { ok, errors, warnings, facts }. Errors from both layers are merged.
async function validateFeedXml(xml, options) {
  const malformed = await checkWellFormed(xml);
  const rules = checkRules(xml, options);
  const errors = malformed.concat(rules.errors);
  return {
    ok: errors.length === 0,
    errors,
    warnings: rules.warnings,
    facts: rules.facts,
  };
}

module.exports = {
  validateFeedXml,
  checkWellFormed,
  checkRules,
  RFC822,
  FEED_ITEM_LIMIT,
};
