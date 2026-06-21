const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const fs = require("fs/promises");
const path = require("path");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1180,
    minHeight: 760,
    title: "Model 3D Print",
    backgroundColor: "#f4f6f3",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("project:open", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "開啟 Model 3D Print 專案",
    filters: [{ name: "Model 3D Print", extensions: ["m3dp"] }],
    properties: ["openFile"]
  });
  if (result.canceled || result.filePaths.length === 0) return { canceled: true };
  const filePath = result.filePaths[0];
  const content = await fs.readFile(filePath, "utf8");
  return { canceled: false, filePath, content };
});

ipcMain.handle("project:save", async (_event, { suggestedName, content, filePath }) => {
  let targetPath = filePath;
  if (!targetPath) {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: "儲存 Model 3D Print 專案",
      defaultPath: suggestedName || "model.m3dp",
      filters: [{ name: "Model 3D Print", extensions: ["m3dp"] }]
    });
    if (result.canceled || !result.filePath) return { canceled: true };
    targetPath = result.filePath;
  }
  await fs.writeFile(targetPath, content, "utf8");
  return { canceled: false, filePath: targetPath };
});

ipcMain.handle("stl:export", async (_event, { suggestedName, content }) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: "輸出 STL",
    defaultPath: suggestedName || "model.stl",
    filters: [{ name: "STL", extensions: ["stl"] }]
  });
  if (result.canceled || !result.filePath) return { canceled: true };
  await fs.writeFile(result.filePath, content, "utf8");
  return { canceled: false, filePath: result.filePath };
});

