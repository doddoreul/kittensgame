// Minimal static file server for Kittens Game (no dependencies).
// Usage: node server.js [port]   (default 8635)
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PORT = Number(process.argv[2]) || Number(process.env.PORT) || 8635;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/plain; charset=utf-8"
};

http.createServer((req, res) => {
  let url = decodeURIComponent(req.url.split("?")[0]);
  if (url === "/") url = "/index.html";
  const filePath = path.join(ROOT, url);
  // prevent path traversal outside ROOT
  if (!filePath.startsWith(ROOT + path.sep) && filePath !== ROOT) {
    res.statusCode = 403; res.end("Forbidden"); return;
  }
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) { res.statusCode = 404; res.end("Not found"); return; }
    const ext = path.extname(filePath).toLowerCase();
    res.setHeader("Content-Type", MIME[ext] || "application/octet-stream");
    fs.createReadStream(filePath).pipe(res);
  });
}).listen(PORT, () => console.log("Kittens Game server on http://localhost:" + PORT));
