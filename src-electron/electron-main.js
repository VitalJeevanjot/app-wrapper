import {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  nativeImage,
  shell,
} from "electron";
const { spawn } = require("node:child_process");
const fs = require("node:fs");
import path from "node:path";
const {
  wrapperPaths,
  copyWrapperFiles,
  editAppFromSettings,
} = require("./main-process.cjs");
const { createSigningKey, signApk } = require("./signing.cjs");

let mainWindow;

function getWrapperPaths() {
  return wrapperPaths(app.getPath("documents"));
}

function createWindow() {
  /**
   * Initial window options
   */
  // console.log(process.env.QUASAR_NODE_INTEGRATION);
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
      // mainWindow.webContents.closeDevTools();
      mainWindow.webContents.openDevTools();
    });
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

var terminal_logs = null;
var bat = null;
app.whenReady().then(() => {
  // setupTerminalInstanceAndPathsBatchFile();
  // ipcMain.handle("get-public-path", getPublicPath);
  ipcMain.handle("run-script", runScript);
  // ipcMain.handle("build-app-from-URL", buildAppFromURL);
  ipcMain.handle("select-and-show-IMG", selectAndShowIMG);
  ipcMain.handle("setup-icons-for-build", setupIconsForBuild);
  // ipcMain.handle("get-build-commands", getBuildCommands);
  ipcMain.handle("run-wrapping-script", runWrappingScript);
  ipcMain.handle("get-output-from-terminal", getOutputForTerminal);
  ipcMain.handle("send-input-to-terminal", sendInputToTerminal);
  ipcMain.handle("open-android-manifest", openAndroidManifest);
  ipcMain.handle("open-config-folder", openConfigFolder);
  ipcMain.handle("kill-terminal-process", killTerminalProcess);
  ipcMain.handle("get-output-path", getPathOfOutput);
  ipcMain.handle("open-file-folder-selector", openFileFolderSelector);
  ipcMain.handle(
    "run-key-creation-script-for-sign",
    runKeyCreationScriptForSign
  );
  ipcMain.handle("run-script-to-sign", runScriptToSign);
  ipcMain.handle("copy-files-for-all-processes", copyFilesForAllProcesses);
  createWindow();

  // const filePath = path.join(app.getPath("documents"));
  // console.log("filePath");
  // console.log(filePath);
});

app.on("window-all-closed", async () => {
  // console.log("ENDING TERMINAL PROCESS>>>");
  // await bat.stdin.end();
  // await bat.stdout.end();
  // await bat.kill();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

function killTerminalProcess() {
  if (bat) {
    bat.kill();
  }
}

function getPathOfOutput() {
  return getWrapperPaths().apkOutput;
}

async function copyFilesForAllProcesses() {
  const publicDirectory = path.resolve(__dirname, process.env.QUASAR_PUBLIC_FOLDER);
  const toolchainDirectory = path.join(
    app.isPackaged ? process.resourcesPath : publicDirectory, "toolchain"
  );
  await copyWrapperFiles(publicDirectory, toolchainDirectory, getWrapperPaths());
}

async function runScriptToSign(event, unsignedApk, keystore, output, password, keyPassword) {
  const release = await signApk(getWrapperPaths(), unsignedApk, keystore, output, password, keyPassword);
  shell.showItemInFolder(release);
  return release;
}

async function openFileFolderSelector(event, filters) {
  const paths = getWrapperPaths();
  const options = Array.isArray(filters) && filters.length
    ? {
      title: "Select file",
      properties: ["openFile"],
      defaultPath: filters[0] === "apk" ? path.join(paths.apkOutput, "debug") : paths.signingKeys,
      filters: [{ name: "Files", extensions: filters }],
    }
    : { title: "Select folder", properties: ["openDirectory"] };
  const { canceled, filePaths } = await dialog.showOpenDialog(options);
  if (!canceled) return filePaths[0];
}

async function selectAndShowIMG(event) {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: "Select directories with jpg/png",
    properties: ["openFile"],
    filters: [{ name: "Images", extensions: ["jpg", "png"] }],
  });

  if (!canceled) {
    // Todo: create a local copy with changed name
    let result = await nativeImage.createThumbnailFromPath(filePaths[0], {
      width: 300,
      height: 300,
    });
    return [result.toDataURL(), filePaths[0]];
  } else {
    return false;
  }
}

function setupIconsForBuild(event, _paths) {
  const _current_path = path.join(getWrapperPaths().project, "resources");
  try {
    fs.rmSync(_current_path, { recursive: true, force: true });
  } catch (e) {
    console.log(e);
  }
  if (!fs.existsSync(_current_path)) {
    fs.mkdirSync(_current_path);
  }
  let img_paths = JSON.parse(_paths);
  var asssets_names = [
    "icon-only",
    "icon-foreground",
    "icon-background",
    "splash",
    "splash-dark",
  ];
  for (let i = 0; i < 5; i++) {
    if (img_paths[i].path) {
      fs.copyFileSync(
        img_paths[i].path,
        path.resolve(
          _current_path,
          asssets_names[i] + "." + img_paths[i].path.split(".").pop()
        )
      );
    }
  }
}

// function getBuildCommands() {
//   var wrapper_file_path = `${path.resolve(
//     __dirname,
// process.env.QUASAR_PUBLIC_FOLDER,
//     "app_wrap_apk.bat"
//   )}`;
//   var file_content_splitted = fs
//     .readFileSync(wrapper_file_path, { encoding: "utf-8" })
//     .split("\n");
//   return file_content_splitted;
// }

async function openAndroidManifest() {
  const manifest = path.join(
    getWrapperPaths().android, "app", "src", "main", "AndroidManifest.xml"
  );
  await shell.openPath(manifest);
}

async function openConfigFolder() {
  await shell.openPath(getWrapperPaths().root);
}

async function getOutputForTerminal() {
  let output = terminal_logs;
  terminal_logs = "\r\n";
  return output;
}

async function runKeyCreationScriptForSign(event, name, validity, alias, owner, password) {
  const key = await createSigningKey(getWrapperPaths(), name, validity, alias, owner, password);
  shell.showItemInFolder(key);
  return key;
}

async function runWrappingScript(
  event,
  source,
  appId,
  appName,
  targetSdk,
  overwriteSettings,
  useWebsite,
  fortest,
  clean
) {
  if (bat) throw new Error("An Android build is already running.");

  const paths = getWrapperPaths();
  await editAppFromSettings(paths, {
    source, appId, appName, targetSdk, overwriteSettings, useWebsite,
  });
  const script = clean ? "app_clean_wrap_apk.bat"
    : fortest === "fortest" ? "app_test_apk.bat" : "app_wrap_apk.bat";
  setupTerminalProcess(script, paths.root);
}

function setupTerminalProcess(script, cwd) {
  const cmd = path.join(process.env.SystemRoot, "System32", "cmd.exe");
  bat = spawn(cmd, ["/d", "/c", script], { cwd, windowsHide: true });
  terminal_logs = "";

  const log = (data) => { terminal_logs += data.toString().replace(/\r?\n/g, "\r\n"); };
  bat.stdout.on("data", log);
  bat.stderr.on("data", log);
  bat.on("error", (error) => log(`\r\nCould not launch build script. ${error.message}`));
  bat.stdin.on("error", (error) => log(`\r\n${error.message}`));
  bat.on("close", (code, signal) => {
    bat = null;
    log(`\r\nprocess exited with code ${code ?? signal ?? "unknown"}`);
    if (code === 0) shell.openPath(getPathOfOutput());
  });
}

function sendInputToTerminal(event, escapeCode) {
  if (bat?.stdin.writable) bat.stdin.write(escapeCode);
}

async function runScript(e, _command) {
  // console.log(file_path);
  // exec(file_path, (err, stdout, stderr) => {
  //   if (err) {
  //     console.error(err);
  //     return;
  //   }
  //   console.log(stdout);
  // });
  // console.log(file_path);
  console.log(_command);
  // console.log("printing output....");
  // const paths_out = spawnSync(`${_command}`);
  // console.log(paths);
  // const paths_out = execSync(`${_command}`);
  // console.log("get value of bat //////////////");
  // console.log(bat.stdin.write("ls\n"));
  // bat.stdin.write("dir\x0D");
  // const { stdout, stderr } = await bat.stdin.write(`${_command}`);
  // console.log("STD_OUTPUT--------------------");
  // console.log(stdout);

  // console.log("STD_ERROR--------------------");
  // console.log(stderr);
  // const ls_err = execSync(`${_command.stderr}`);
  // console.log(paths_out.stdout.toString());
  // console.log(paths_out.stderr.toString());
  // console.log(ls_err);
  // ls.stdin.on("data", (data) => {
  //   console.log(`stdin: ${data}`);
  // });
  // userInput = "\x1B[A"; // UP Arrow
  // userInput = "\x1B[B"; // Down Arrow
  // userInput = "\x0D"; // Carriage return

  // ls.stdin.write(userInput);

  // ls.stdout.on("data", (data) => {
  //   let _data = "$ " + data;
  //   console.log(_data);
  //   mainWindow.webContents.send("terminal_output", _data);
  //   // if (data.includes("Please choose a target device")) {
  //   //   console.log("ASKING NOW");
  //   //   userInput = "\x1B[A";
  //   //   ls.stdin.write(userInput);
  //   // }
  // });
  // ls.stderr.on("data", (data) => {
  //   console.error(`stderr: ${data}`);
  // });
  // ls.on("close", (code) => {
  //   console.log(`child process exited with code ${code}`);
  // });
}
