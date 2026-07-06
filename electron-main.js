const path = require("path");
const { app, BrowserWindow, shell, ipcMain } = require("electron");
const { createServer } = require("./server");

let mainWindow = null;
let localServer = null;

function startLocalServer() {
  return new Promise((resolve, reject) => {
    localServer = createServer();
    localServer.on("error", reject);
    localServer.listen(0, "127.0.0.1", () => {
      const address = localServer.address();
      resolve(`http://127.0.0.1:${address.port}`);
    });
  });
}

async function createWindow() {
  const baseUrl = await startLocalServer();

  mainWindow = new BrowserWindow({
    width: 1057,
    height: 678,
    minWidth: 1057,
    minHeight: 678,
    useContentSize: true,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    hasShadow: true,
    title: "Skill Tidy",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js")
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  await mainWindow.loadURL(baseUrl);
}

ipcMain.handle("skill-tidy:window-control", (event, action) => {
  const targetWindow = BrowserWindow.fromWebContents(event.sender);
  if (!targetWindow) return;

  if (action === "close") {
    targetWindow.close();
    return;
  }

  if (action === "minimize") {
    targetWindow.minimize();
    return;
  }

  if (action === "zoom") {
    if (targetWindow.isMaximized()) {
      targetWindow.unmaximize();
    } else {
      targetWindow.maximize();
    }
  }
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (localServer) {
    localServer.close();
    localServer = null;
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
