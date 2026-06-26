const { app, BrowserWindow } = require("electron");
const fs = require("fs/promises");
const http = require("http");
const path = require("path");

const webDir = process.env.MODEL3D_WEB_DIR;
const port = Number(process.env.MODEL3D_WEB_PORT || 4178);
let server;

function contentType(filePath) {
  if (filePath.endsWith(".html")) return "text/html;charset=utf-8";
  if (filePath.endsWith(".js")) return "text/javascript;charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css;charset=utf-8";
  if (filePath.endsWith(".svg")) return "image/svg+xml";
  if (filePath.endsWith(".m3dp")) return "application/json;charset=utf-8";
  return "application/octet-stream";
}

function createServer() {
  return http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url || "/", `http://127.0.0.1:${port}`);
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

async function createWindow() {
  server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolve);
  });

  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    title: "Model 3D Print Web Smoke",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  await win.loadURL(`http://127.0.0.1:${port}/`);
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => {
  server?.close();
  app.quit();
});
