const fs = require("node:fs/promises");
const { constants } = require("node:fs");
const path = require("node:path");

function wrapperPaths(documents) {
  const root = path.resolve(documents, "Android App Wrapper");
  const project = path.join(root, "capacitor_config");
  const android = path.join(project, "android");
  const toolchain = path.join(root, "toolchain");
  const javaBin = path.join(toolchain, "jdk", "bin");
  return {
    root,
    project,
    android,
    apkOutput: path.join(android, "app", "build", "outputs", "apk"),
    signingKeys: path.join(root, "signing-keys"),
    keytool: path.join(javaBin, "keytool.exe"),
    java: path.join(javaBin, "java.exe"),
    buildTools: path.join(toolchain, "android-sdk", "build-tools"),
  };
}

const wrapperFiles = [
  "app_clean_wrap_apk.bat", "app_test_apk.bat", "app_wrap_apk.bat",
  "app_wrapper_apk.bat", "path_setup.bat", "capacitor-package.json",
];

async function copyWrapperFiles(publicDirectory, toolchainDirectory, paths) {
  await fs.mkdir(paths.root, { recursive: true });
  await Promise.all(wrapperFiles.map((file) =>
    fs.copyFile(path.join(publicDirectory, file), path.join(paths.root, file))
  ));
  await fs.cp(toolchainDirectory, path.join(paths.root, "toolchain"), {
    recursive: true,
    force: true,
  });
  await fs.mkdir(paths.project, { recursive: true });
  try {
    await fs.copyFile(
      path.join(paths.root, "capacitor-package.json"),
      path.join(paths.project, "package.json"),
      constants.COPYFILE_EXCL
    );
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
  }
}

function validateText(value, label) {
  if (typeof value !== "string" || !value.trim() || /[\x00-\x1f\x7f]/.test(value)) {
    throw new Error(`${label} must be non-empty and contain no control characters.`);
  }
  return value;
}

function validateInteger(value, label, minimum) {
  const number =
    typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value;
  if (!Number.isInteger(number) || number < minimum || number > 2147483647) {
    throw new Error(`${label} must be a whole number between ${minimum} and 2147483647.`);
  }
  return number;
}

async function validatePath(value, label, extension) {
  const input = validateText(value, label);
  if (!path.isAbsolute(input) ||
      (process.platform === "win32" && /[<>:"|?*]/.test(input.slice(path.parse(input).root.length)))) {
    throw new Error(`${label} must be an absolute path.`);
  }
  if (extension && path.extname(input).toLowerCase() !== extension) {
    throw new Error(`${label} must be a ${extension} file.`);
  }
  const resolved = path.resolve(input);
  const entry = await fs.stat(resolved).catch((error) => {
    if (error.code === "ENOENT" || error.code === "ENOTDIR") return undefined;
    throw error;
  });
  if (!(extension ? entry?.isFile() : entry?.isDirectory())) {
    throw new Error(`${label} does not exist or is not a ${extension ? "file" : "folder"}.`);
  }
  return resolved;
}

function getHTMLwithURL(url) {
  const src = url.replace(/&/g, "&amp;").replace(/"/g, "&quot;")
    .replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>App Website Wrapper</title>
    <style>
      body { margin: 0; }
      iframe { display: block; width: 100vw; height: 100vh; height: 100dvh; border: 0; }
    </style>
  </head>
  <body>
    <iframe title="Wrapped website" src="${src}"></iframe>
  </body>
</html>
`;
}

function getVariablesWithTargetSDKver(sdk) {
  return `ext {
    minSdkVersion = 22
    compileSdkVersion = ${sdk}
    targetSdkVersion = ${sdk}
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

async function editAppFromSettings(paths, settings) {
  const { source, appId, appName, targetSdk, overwriteSettings, useWebsite } = settings;
  if (typeof overwriteSettings !== "boolean" || typeof useWebsite !== "boolean") {
    throw new Error("Select valid build settings.");
  }
  if (typeof appId !== "string" || !/^[a-zA-Z][\w]*(\.[a-zA-Z][\w]*)+$/.test(appId)) {
    throw new Error("Enter an Android app ID such as com.example.app.");
  }
  validateText(appName, "App name");
  const sdk = overwriteSettings ? validateInteger(targetSdk ?? 33, "Target SDK", 22) : null;

  let webDir;
  let website;
  if (useWebsite) {
    const input = validateText(source, "Website URL");
    try {
      website = new URL(input);
    } catch {
      throw new Error("Enter a valid HTTP or HTTPS website URL.");
    }
    if (website.protocol !== "http:" && website.protocol !== "https:") {
      throw new Error("Enter a valid HTTP or HTTPS website URL.");
    }
    webDir = "www";
  } else {
    webDir = (await validatePath(source, "Web project folder")).replace(/\\/g, "/");
  }

  if (website) {
    const www = path.join(paths.project, webDir);
    await fs.mkdir(www, { recursive: true });
    await fs.writeFile(path.join(www, "index.html"), getHTMLwithURL(website.href));
  }
  const config = { appId, appName, webDir, server: { androidScheme: "https" } };
  await fs.writeFile(path.join(paths.project, "capacitor.config.json"),
    `${JSON.stringify(config, null, 2)}\n`
  );

  // The clean-build script applies this after generating the Android project.
  const variables = path.join(paths.project, "wrapper-variables.gradle");
  if (overwriteSettings) {
    await fs.writeFile(variables, getVariablesWithTargetSDKver(sdk));
  } else {
    await fs.rm(variables, { force: true });
  }
}

module.exports = {
  wrapperPaths,
  copyWrapperFiles,
  editAppFromSettings,
  validateText,
  validateInteger,
  validatePath,
};
