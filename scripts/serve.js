const http = require("http");
const fs = require("fs");
const path = require("path");

const MIME = {
".html": "text/html; charset=utf-8",
".css": "text/css",
".js": "application/javascript",
".json": "application/json",
".png": "image/png",
".jpg": "image/jpeg",
".svg": "image/svg+xml"
};

function serve(port) {
const root = path.resolve(process.cwd(), "docs");
const server = http.createServer((req, res) => {
let urlPath;
try {
urlPath = decodeURIComponent(req.url.split("?")[0]);
} catch {
res.writeHead(400);
res.end("Bad Request");
return;
}
if (urlPath === "/") urlPath = "/index.html";
const filePath = path.resolve(root, urlPath.slice(1));
if (!filePath.startsWith(root + path.sep) && filePath !== root) {
res.writeHead(403);
res.end("Forbidden");
return;
}
fs.readFile(filePath, (err, data) => {
if (err) {
res.writeHead(404);
res.end("Not Found: " + urlPath);
return;
}
const ext = path.extname(filePath);
res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
res.end(data);
});
});
server.listen(port, () => {
console.log(`本地预览：http://localhost:${port}`);
});
}

module.exports = { serve };
