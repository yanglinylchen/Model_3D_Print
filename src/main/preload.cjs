const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("model3d", {
  openProject: () => ipcRenderer.invoke("project:open"),
  saveProject: (payload) => ipcRenderer.invoke("project:save", payload),
  exportStl: (payload) => ipcRenderer.invoke("stl:export", payload)
});

