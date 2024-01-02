import { app, BrowserWindow, ipcMain } from "electron";
const { exec, spawn } = require("node:child_process");
const fs = require("node:fs");
import path from "path";
import os from "os";

// needed in case process is undefined under Linux
const platform = process.platform || os.platform();

let mainWindow;

var height, width, src_url, iframe_style;

function getContent() {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
  </head>
  <body style="margin: 0px; padding: 0px; overflow: hidden">
    <iframe
      title="Testing"
      height=""
      allowtransparency="true"
      width=""
      frameborder="0"
      id="iframe"
      src="https://nodejs.org/en/learn/manipulating-files/writing-files-with-nodejs"
      style="pointer-events: auto"
    ></iframe>
  </body>

  <script>
    window.addEventListener("deviceorientation", (e) => {handleFrameSize()}, true);
    handleFrameSize();
    function handleFrameSize() {
      document
        .getElementById("iframe")
        .setAttribute("height", window.innerHeight);
      document.getElementById("iframe").setAttribute("width", window.innerWidth);
    }
  </script>
</html>
  `;
}

function createWindow() {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    icon: path.resolve(__dirname, "icons/icon.png"), // tray icon
    autoHideMenuBar: true,
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
  ipcMain.handle("build-app-from-URL", buildAppFromURL);
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
async function buildAppFromURL(e, url) {
  src_url = url;
  fs.writeFile(
    path.resolve(
      __dirname,
      process.env.QUASAR_PUBLIC_FOLDER,
      "capacitor_config",
      "www",
      "index.html"
    ),
    getContent(),
    (err) => {
      if (err) {
        console.log(err);
      }
    }
  );
  runScript();
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
  // userInput = "\x1B[B"; // Down Arrow
  userInput = "\x0D"; // Carriage return
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
