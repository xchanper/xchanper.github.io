/**
 * Dev server with live reload.
 * Usage: node scripts/dev.mjs [port]
 *
 * - Serves dist/ over HTTP
 * - Watches content/, public/, scripts/, site.config.mjs for changes
 * - Rebuilds on change, then pushes a reload signal via SSE
 * - Injects a tiny <script> into every HTML response that reconnects and reloads
 */

import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const distDir = path.join(root, "dist");
const PORT = Number(process.argv[2]) || 4173;

// SSE clients waiting for reload signals
const clients = new Set();

// ─── Initial build ───────────────────────────────────────────────────────────

await runBuild();

// ─── HTTP server ─────────────────────────────────────────────────────────────

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
};

const RELOAD_SCRIPT = `
<script>
(function () {
  var es = new EventSource('/__reload');
  es.onmessage = function () { location.reload(); };
  es.onerror = function () {
    es.close();
    // reconnect after 1s in case the server restarted
    setTimeout(function () { location.reload(); }, 1000);
  };
})();
</script>`;

const server = http.createServer((req, res) => {
  // SSE endpoint for live reload
  if (req.url === "/__reload") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    });
    res.write(": connected\n\n");
    clients.add(res);
    req.on("close", () => clients.delete(res));
    return;
  }

  // Resolve file path
  let urlPath = req.url.split("?")[0];
  try { urlPath = decodeURIComponent(urlPath); } catch {}
  if (urlPath.endsWith("/")) urlPath += "index.html";

  let filePath = path.join(distDir, urlPath);

  // Directory → index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }

  // Fallback to 404.html
  if (!fs.existsSync(filePath)) {
    filePath = path.join(distDir, "404.html");
  }

  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME[ext] || "application/octet-stream";

  let content = fs.readFileSync(filePath);

  // Inject live-reload script into HTML pages
  if (ext === ".html") {
    content = Buffer.from(
      content.toString("utf8").replace("</body>", `${RELOAD_SCRIPT}\n</body>`),
    );
  }

  res.writeHead(200, { "Content-Type": mime });
  res.end(content);
});

server.listen(PORT, () => {
  console.log(`Dev server: http://localhost:${PORT}`);
  console.log("Watching for changes...");
});

// ─── File watcher ─────────────────────────────────────────────────────────────

const WATCH_PATHS = [
  path.join(root, "content"),
  path.join(root, "public"),
  path.join(root, "scripts", "build
    
    .mjs"),
  path.join(root, "site.config.mjs"),
];

let rebuildTimer = null;
let rebuilding = false;
let pendingRebuild = false;

function scheduleRebuild(filename) {
  clearTimeout(rebuildTimer);
  rebuildTimer = setTimeout(async () => {
    if (rebuilding) {
      pendingRebuild = true;
      return;
    }
    rebuilding = true;
    console.log(`\nChange detected${filename ? `: ${filename}` : ""} — rebuilding...`);
    try {
      await runBuild();
      notifyClients();
    } catch (err) {
      console.error("Build failed:", err.message);
    } finally {
      rebuilding = false;
      if (pendingRebuild) {
        pendingRebuild = false;
        scheduleRebuild(null);
      }
    }
  }, 120);
}

for (const watchPath of WATCH_PATHS) {
  if (!fs.existsSync(watchPath)) continue;
  fs.watch(watchPath, { recursive: true }, (_event, filename) => {
    scheduleRebuild(filename);
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function runBuild() {
  return new Promise((resolve, reject) => {
    execFile(
      process.execPath,
      [path.join(root, "scripts", "build.mjs")],
      { cwd: root },
      (err, stdout, stderr) => {
        if (stdout) process.stdout.write(stdout);
        if (stderr) process.stderr.write(stderr);
        if (err) reject(err);
        else resolve();
      },
    );
  });
}

function notifyClients() {
  for (const res of clients) {
    res.write("data: reload\n\n");
  }
}
