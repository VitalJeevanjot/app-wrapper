/**
 * This file is used specifically for security reasons.
 * Here you can access Nodejs stuff and inject functionality into
 * the renderer thread (accessible there through the "window" object)
 *
 * WARNING!
 * If you import anything from node_modules, then make sure that the package is specified
 * in package.json > dependencies and NOT in devDependencies
 *
 * Example (injects window.myAPI.doAThing() into renderer thread):
 *
 *   import { contextBridge } from 'electron'
 *
 *   contextBridge.exposeInMainWorld('myAPI', {
 *     doAThing: () => {}
 *   })
 *
 * WARNING!
 * If accessing Node functionality (like importing @electron/remote) then in your
 * electron-main.js you will need to set the following when you instantiate BrowserWindow:
 *
 * mainWindow = new BrowserWindow({
 *   // ...
 *   webPreferences: {
 *     // ...
 *     sandbox: false // <-- to be able to import @electron/remote in preload script
 *   }
 * }
 */

import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("AppWrapperAPI", {
  runScriptFile: async (command) => {
    return await ipcRenderer.invoke("run-script", command);
  },
  getPublicFolderPath: () => {
    return ipcRenderer.invoke("get-public-path");
  },
  setupIcons: (paths_objects) => {
    return ipcRenderer.invoke("setup-icons-for-build", paths_objects);
  },
  // buildAppFromURL: (url) => {
  //   return ipcRenderer.invoke("build-app-from-URL", url);
  // },
  selectAndShowImage: () => {
    return ipcRenderer.invoke("select-and-show-IMG");
  },
  getBuildCommands: () => {
    return ipcRenderer.invoke("get-build-commands");
  },
  setupPathsBatchFile: () => {
    return ipcRenderer.invoke("setup-paths-batch-file");
  },
  runWrappingScript: (
    website_URL,
    app_ID,
    target_sdk_ver,
    overwrite_settings,
    use_website,
    fortest
  ) => {
    return ipcRenderer.invoke(
      "run-wrapping-script",
      website_URL,
      app_ID,
      target_sdk_ver,
      overwrite_settings,
      use_website,
      fortest
    );
  },
  getOutputForTerminal: () => {
    return ipcRenderer.invoke("get-output-from-terminal");
  },
  sendKeyToTerminal: (escapeCode) => {
    ipcRenderer.invoke("send-input-to-terminal", escapeCode);
  },
  openAndroidManifest: () => {
    ipcRenderer.invoke("open-android-manifest");
  },
  openConfigFolder: () => {
    ipcRenderer.invoke("open-config-folder");
  },
  killTerminalProcess: () => {
    ipcRenderer.invoke("kill-terminal-process");
  },
  getPathOfOutput: async () => {
    return await ipcRenderer.invoke("get-output-path");
  },
  runKeyCreationScriptForSign: async (key_name, key_validity, key_alias) => {
    return await ipcRenderer.invoke(
      "run-key-creation-script-for-sign",
      key_name,
      key_validity,
      key_alias
    );
  },
  openFileFolderSelector: async (filters) => {
    return await ipcRenderer.invoke("open-file-folder-selector", filters);
  },
  runSigningScript: async (unsigned_apk_path, key_path, output_path) => {
    await ipcRenderer.invoke(
      "run-script-to-sign",
      unsigned_apk_path,
      key_path,
      output_path
    );
  },
});
