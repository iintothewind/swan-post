const fs = require("fs-extra");
const path = require("path");

// Copy render-time static assets into the docs output directory.
// overwrite=true → always copy (used by build(), which empties docs/ first).
// overwrite=false → copy only missing targets (used by render(), preserving any
// resources the user has manually tweaked in docs/). After upgrading katex /
// mermaid (or editing assets/), run a full build so docs/ picks up the new files.
// Covers: css/js/prism from assets/, plus KaTeX css+fonts and mermaid.min.js from node_modules.
function copyStaticAssets(docsDir, overwrite) {
const copyIfNeeded = (src, dest) => {
if (overwrite) {
fs.copySync(src, dest);
} else if (!fs.existsSync(dest)) {
fs.copySync(src, dest);
}
};
copyIfNeeded(path.join(process.cwd(), "assets", "css"), path.join(docsDir, "css"));
copyIfNeeded(path.join(process.cwd(), "assets", "js"), path.join(docsDir, "js"));
copyIfNeeded(path.join(process.cwd(), "assets", "prism"), path.join(docsDir, "prism"));
// KaTeX: katex.min.css references fonts via relative paths, so keep the katex/ dir layout intact
copyIfNeeded(path.join(process.cwd(), "node_modules", "katex", "dist", "katex.min.css"), path.join(docsDir, "katex", "katex.min.css"));
copyIfNeeded(path.join(process.cwd(), "node_modules", "katex", "dist", "fonts"), path.join(docsDir, "katex", "fonts"));
// Mermaid: rendered client-side, shipped as a single JS bundle next to main.js
copyIfNeeded(path.join(process.cwd(), "node_modules", "mermaid", "dist", "mermaid.min.js"), path.join(docsDir, "js", "mermaid.min.js"));
}

module.exports = { copyStaticAssets };
