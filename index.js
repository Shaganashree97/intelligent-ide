require("dotenv").config();
const { app, BrowserWindow } = require("electron");
const path = require("path");
const isDev = process.env.NODE_ENV === "development";

function createWindow() {
  const win = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // Be aware this is less secure
    },
  });

  if (isDev) {
    setTimeout(() => {
      win.loadURL("http://localhost:5173");
    }, 2000);
  } else {
    win.loadFile(path.join(__dirname, "src/dist/index.html"));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
