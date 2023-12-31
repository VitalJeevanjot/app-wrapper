import { app, BrowserWindow, ipcMain } from "electron";
const { exec, spawn } = require("node:child_process");
import path from "path";
import os from "os";

// needed in case process is undefined under Linux
const platform = process.platform || os.platform();

let mainWindow;

function createWindow() {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    icon: path.resolve(__dirname, "icons/icon.png"), // tray icon
    width: 1000,
    height: 600,
    useContentSize: true,
    webPreferences: {
      contextIsolation: true,
      // More info: https://v2.quasar.dev/quasar-cli-vite/developing-electron-apps/electron-preload-script
      preload: path.resolve(__dirname, process.env.QUASAR_ELECTRON_PRELOAD),
    },
  });

  mainWindow.loadURL(process.env.APP_URL);

  if (process.env.DEBUGGING) {
    // if on DEV or Production with debug enabled
    mainWindow.webContents.openDevTools();
  } else {
    // we're on production; no access to devtools pls
    mainWindow.webContents.on("devtools-opened", () => {
      mainWindow.webContents.closeDevTools();
    });
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  ipcMain.handle("get-public-path", getPublicPath);
  ipcMain.handle("run-script", runScript);
  createWindow();
});

app.on("window-all-closed", () => {
  if (platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

function getPublicPath() {
  return path.resolve(__dirname, process.env.QUASAR_PUBLIC_FOLDER);
}
async function runScript(e) {
  var file_path = `${path.join(
    path.resolve(__dirname, process.env.QUASAR_PUBLIC_FOLDER),
    "app_wrapper_apk.bat"
  )}`;
  // console.log(file_path);
  // exec(file_path, (err, stdout, stderr) => {
  //   if (err) {
  //     console.error(err);
  //     return;
  //   }
  //   console.log(stdout);
  // });
  console.log(file_path);
  const ls = spawn("cmd.exe", ["/c", file_path]);

  // ls.stdin.on("data", (data) => {
  //   console.log(`stdin: ${data}`);
  // });

  // userInput = "\x1B[A"; // UP Arrow
  userInput = "\x1B[B"; // Down Arrow
  // userInput = "\x0D"; // Carriage return
  ls.stdin.write(userInput);

  ls.stdout.on("data", (data) => {
    console.log(`stdout: ${data}`);
    // if (data.includes("Please choose a target device")) {
    //   console.log("ASKING NOW");
    //   userInput = "\x1B[A";
    //   ls.stdin.write(userInput);
    // }
  });

  ls.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
  });

  ls.on("close", (code) => {
    console.log(`child process exited with code ${code}`);
  });
}
