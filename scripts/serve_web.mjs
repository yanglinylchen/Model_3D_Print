import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";

const root = process.cwd();
const webDir = path.join(root, "dist", "web");
const port = Number(process.env.PORT || 4178);
const host = process.env.HOST || "127.0.0.1";

function contentType(filePath) {
  if (filePath.endsWith(".html")) return "text/html;charset=utf-8";
  if (filePath.endsWith(".js")) return "text/javascript;charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css;charset=utf-8";
  if (filePath.endsWith(".svg")) return "image/svg+xml";
  if (filePath.endsWith(".m3dp")) return "application/json;charset=utf-8";
  return "application/octet-stream";
}

function localNetworkUrls() {
  const urls = [];
  const interfaces = os.networkInterfaces();
  for (const addresses of Object.values(interfaces)) {
    for (const address of addresses || []) {
      if (address.family === "IPv4" && !address.internal) {
        urls.push(`http://${address.address}:${port}/`);
      }
    }
  }
  return urls;
}

async function ensureWebBuildExists() {
  try {
    await fs.access(path.join(webDir, "index.html"));
  } catch {
    throw new Error("找不到 dist/web/index.html，請先執行 npm run web:build。");
  }
}

function createServer() {
  return http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url || "/", `http://${host}:${port}`);
      const relativePath = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
      const filePath = path.normalize(path.join(webDir, relativePath));
      if (!filePath.startsWith(webDir)) {
        response.writeHead(403);
        response.end("Forbidden");
        return;
      }
      const data = await fs.readFile(filePath);
      response.writeHead(200, { "content-type": contentType(filePath) });
      response.end(data);
    } catch {
      response.writeHead(404);
      response.end("Not found");
    }
  });
}

await ensureWebBuildExists();
const server = createServer();
server.listen(port, host, () => {
  console.log(`Model 3D Print web preview: http://${host}:${port}/`);
  if (host === "0.0.0.0") {
    console.log("Same-network iPad URLs:");
    for (const url of localNetworkUrls()) console.log(`- ${url}`);
  }
  console.log("Press Ctrl+C to stop.");
});
