const { contextBridge, ipcRenderer } = require("electron");

const allowedWindowActions = new Set(["close", "minimize", "zoom"]);

contextBridge.exposeInMainWorld("skillTidyWindow", {
  control(action) {
    if (!allowedWindowActions.has(action)) return Promise.resolve();
    return ipcRenderer.invoke("skill-tidy:window-control", action);
  }
});
