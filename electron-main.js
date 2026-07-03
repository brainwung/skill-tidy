const { app, BrowserWindow, shell } = require("electron");
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
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 970, y: 33 },
    backgroundColor: "#eef2f4",
    title: "Skill Tidy",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  await mainWindow.loadURL(baseUrl);
}

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
