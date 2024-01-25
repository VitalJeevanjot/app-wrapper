import {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  nativeImage,
  shell,
} from "electron";
const { exec, spawn } = require("node:child_process");
const fs = require("node:fs");
import path from "path";
import os from "os";
import { execSync, spawnSync } from "child_process";

// needed in case process is undefined under Linux
const platform = process.platform || os.platform();

let mainWindow;

function getHTMLwithURL(url) {
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
      src="${url}"
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

function getConfigWithAppId(appid, app_name, use_website, website_URL) {
  return `{
  "appId": "${appid}",
  "appName": "${app_name}",
  "webDir": "${use_website ? "www" : website_URL.replace(/\\/g, "/")}",
  "server": {
    "androidScheme": "https"
  }
}
`;
}
function getVariablesWithTargetSDKver(target_sdk_version) {
  return `ext {
    minSdkVersion = 22
    compileSdkVersion = ${target_sdk_version}
    targetSdkVersion = ${target_sdk_version}
    androidxActivityVersion = '1.7.0'
    androidxAppCompatVersion = '1.6.1'
    androidxCoordinatorLayoutVersion = '1.2.0'
    androidxCoreVersion = '1.10.0'
    androidxFragmentVersion = '1.5.6'
    coreSplashScreenVersion = '1.0.0'
    androidxWebkitVersion = '1.6.1'
    junitVersion = '4.13.2'
    androidxJunitVersion = '1.1.5'
    androidxEspressoCoreVersion = '3.5.1'
    cordovaAndroidVersion = '10.1.1'
}
`;
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
  if (platform !== "darwin") {
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

// function getPublicPath() {
//   return path.resolve(__dirname, process.env.QUASAR_PUBLIC_FOLDER);
// }
function getPathOfOutput() {
  return path.resolve(
    app.getPath("documents"),
    "Android App Wrapper",
    "capacitor_config",
    "android",
    "app",
    "build",
    "outputs",
    "apk"
  );
}

async function copyFilesForAllProcesses(e) {
  if (
    !fs.existsSync(
      path.resolve(app.getPath("documents")),
      "Android App Wrapper"
    )
  ) {
    fs.mkdirSync(
      path.resolve(app.getPath("documents"), "Android App Wrapper"),
      {
        recursive: true,
      }
    );
  }
  await new Promise((resolve, reject) => {
    fs.cp(
      path.resolve(__dirname, process.env.QUASAR_PUBLIC_FOLDER),
      path.resolve(app.getPath("documents"), "Android App Wrapper"),
      { recursive: true, force: true },
      () => {
        resolve();
      }
    );
  });
}

function runScriptToSign(e, unsigned_apk_path, key_path, output_path) {
  console.log(`${output_path}\\my-app-unsigned-aligned.apk`);
  try {
    fs.rmSync(`${output_path}\\my-app-unsigned-aligned.apk`);
    fs.rmSync(`${output_path}\\my-app-release.apk`);
    fs.rmSync(`${output_path}\\my-app-release.apk.idsig`);
    fs.rmSync(
      path.resolve(
        app.getPath("documents"),
        "Android App Wrapper",
        "capacitor_config",
        "android",
        ".gradle"
      ),
      { recursive: true, force: true }
    );
  } catch (e) {
    console.log(e);
  }
  var keysigncreation_process_file_path = `${path.resolve(
    app.getPath("documents"),
    "Android App Wrapper",
    "keysign_signing.bat"
  )}`;
  var content = `call cd "${path.resolve(
    app.getPath("documents"),
    "Android App Wrapper"
  )}\\commandlinetools-win-10406996_latest\\build-tools\\34.0.0"
\r\ncall zipalign -v -p 4 "${unsigned_apk_path}" "${output_path}\\my-app-unsigned-aligned.apk"
\r\ncall apksigner sign --ks "${key_path}" --out "${output_path}\\my-app-release.apk" "${output_path}\\my-app-unsigned-aligned.apk"
\r\ncall apksigner verify "${output_path}\\my-app-release.apk"
 \r\ncall explorer.exe  "${output_path}"
 \r\ncall pause`;
  fs.writeFileSync(keysigncreation_process_file_path, content);

  shell.openPath(keysigncreation_process_file_path);
}

async function editAppFromSettings(
  website_URL,
  app_ID,
  app_name,
  target_sdk_ver,
  overwrite_settings,
  use_website
) {
  if (use_website) {
    fs.writeFileSync(
      path.resolve(
        app.getPath("documents"),
        "Android App Wrapper",
        "capacitor_config",
        "www",
        "index.html"
      ),
      getHTMLwithURL(website_URL)
    );
  }
  fs.writeFileSync(
    path.resolve(
      app.getPath("documents"),
      "Android App Wrapper",
      "capacitor_config",
      "capacitor.config.json"
    ),
    getConfigWithAppId(app_ID, app_name, use_website, website_URL)
  );
  if (overwrite_settings) {
    fs.writeFileSync(
      path.resolve(
        app.getPath("documents"),
        "Android App Wrapper",
        "capacitor_config",
        "android",
        "variables.gradle"
      ),
      getVariablesWithTargetSDKver(target_sdk_ver ? target_sdk_ver : 33)
    );
  }
}
async function openFileFolderSelector(e, filters) {
  var apk_path = path.resolve(
    app.getPath("documents"),
    "Android App Wrapper",
    "capacitor_config",
    "android",
    "app",
    "build",
    "outputs",
    "apk",
    "debug"
  );
  var jks_path = path.resolve(
    app.getPath("documents"),
    "Android App Wrapper",
    "jdk-17_windows-x64_bin",
    "jdk-17.0.9",
    "bin"
  );
  var { canceled, filePaths } = await getPaths(filters);
  async function getPaths(filters) {
    if (filters) {
      return await dialog.showOpenDialog({
        title: "Select directories with jpg/png",
        properties: ["openFile"],
        defaultPath: filters[0] == "apk" ? apk_path : jks_path,
        filters: [{ name: "Files", extensions: filters }],
      });
    } else {
      return await dialog.showOpenDialog({
        title: "Select directories with jpg/png",
        properties: ["openDirectory"],
        filters: [{ name: "Output" }],
      });
    }
  }
  if (!canceled) {
    return filePaths[0];
  }
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
  let _current_path = path.resolve(
    app.getPath("documents"),
    "Android App Wrapper",
    "capacitor_config",
    "resources"
  );
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
  await shell.openPath(
    path.resolve(
      app.getPath("documents"),
      "Android App Wrapper",
      "capacitor_config",
      "android",
      "app",
      "src",
      "main",
      "AndroidManifest.xml"
    )
  );
}
async function openConfigFolder() {
  await shell.openPath(
    path.resolve(app.getPath("documents"), "Android App Wrapper")
  );
}

async function getOutputForTerminal() {
  let output = terminal_logs;
  terminal_logs = "\r\n";
  return output;
}

async function runKeyCreationScriptForSign(
  event,
  key_name,
  key_validity,
  key_alias
) {
  var keysigncreation_process_file_path = `${path.resolve(
    app.getPath("documents"),
    "Android App Wrapper",
    "keysign_creation.bat"
  )}`;
  var content = `call cd "${path.resolve(
    app.getPath("documents"),
    "Android App Wrapper"
  )}\\jdk-17_windows-x64_bin\\jdk-17.0.9\\bin"
\r\ncall keytool -genkey -v -keystore ${key_name}.jks -keyalg RSA -keysize 2048 -validity ${key_validity} -alias ${key_alias}
\r\npause
  `;
  fs.writeFileSync(keysigncreation_process_file_path, content);

  shell.openPath(keysigncreation_process_file_path);
}

async function runWrappingScript(
  event,
  website_URL,
  app_ID,
  app_name,
  target_sdk_ver,
  overwrite_settings,
  use_website,
  fortest,
  clean
) {
  await editAppFromSettings(
    website_URL,
    app_ID,
    app_name,
    target_sdk_ver,
    overwrite_settings,
    use_website,
    fortest
  );
  var wrapping_process_file_path = null;
  if (clean) {
    fs.rmSync(
      path.resolve(
        app.getPath("documents"),
        "Android App Wrapper",
        "capacitor_config",
        "android"
      ),
      { recursive: true, force: true }
    );
    wrapping_process_file_path = `${path.resolve(
      app.getPath("documents"),
      "Android App Wrapper",
      "app_clean_wrap_apk.bat"
    )}`;
  } else {
    wrapping_process_file_path = `${path.resolve(
      app.getPath("documents"),
      "Android App Wrapper",
      fortest == "fortest" ? "app_test_apk.bat" : "app_wrap_apk.bat"
    )}`;
  }
  setupTerminalProcess(wrapping_process_file_path);
}

function setupTerminalProcess(file_path) {
  killTerminalProcess();
  bat = spawn(file_path);
  terminal_logs = null;
  bat.stdout.on("data", (data) => {
    // console.log(`${data.toString()}`);
    // console.log(data.toString().indexOf("png"));
    // console.log(data.toString().split(/\n/g));
    // console.log(
    //   data.toString().charCodeAt(data.toString().indexOf("png") + 14)
    // );
    // console.log("================================");
    terminal_logs += `${data.toString().replace(/\n/g, "\r\n\r\n")}`;
  });
  bat.stderr.on("data", (data) => {
    // console.log(data.toString());
    // console.log(data.toString().charCodeAt(data.length - 1));
    // console.log("--------------------------------------------------------");
    terminal_logs += `${data.toString().replace(/\n/g, "\r\n\r\n")}`;
  });

  bat.on("close", (code) => {
    if (!code) {
      var _exit_message = `\r\nprocess exited with code "x"`;
    } else {
      var _exit_message = `\r\nprocess exited with code ${code}`;
    }
    terminal_logs += `${_exit_message.toString()}`;
    shell.openPath(getPathOfOutput());
    // console.log("________________________________________________");
    // console.log(_exit_message);
  });
}

function sendInputToTerminal(event, escapeCode) {
  console.log("escapeCode: ");
  console.log(escapeCode);
  bat.stdin.write(escapeCode);
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
