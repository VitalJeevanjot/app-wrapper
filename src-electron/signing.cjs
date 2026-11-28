const { spawn } = require("node:child_process");
const { constants } = require("node:fs");
const fs = require("node:fs/promises");
const path = require("node:path");
const { validateInteger, validatePath, validateText } = require("./main-process.cjs");

function validateKeySettings(name, validity, alias, owner, password) {
  validateText(name, "Key name");
  if (/[<>:"/\\|?*]/.test(name) || /[ .]$/.test(name) || name.length > 240 ||
    /^(con|prn|aux|nul|com[1-9¹²³]|lpt[1-9¹²³])(?:\.|$)/i.test(name)) {
    throw new Error("Enter a key name that is a valid Windows filename.");
  }
  validateText(alias, "Key alias");
  if (alias.startsWith("-")) throw new Error("Key alias cannot begin with a dash.");
  validateText(owner, "Certificate owner");
  if (!/^[a-z][\w.]*\s*=/i.test(owner)) {
    throw new Error("Enter a certificate owner such as CN=Your Name.");
  }
  if (validateText(password, "Keystore password").length < 6) {
    throw new Error("Keystore password must have at least six characters.");
  }
  return {
    filename: `${name}.jks`,
    validity: String(validateInteger(validity, "Key validity in days", 1)),
    alias,
    owner,
  };
}

async function getSigningTools(buildTools) {
  const versions = await fs.readdir(buildTools).catch((error) => {
    if (error.code === "ENOENT") return [];
    throw error;
  });
  for (const version of versions.filter((entry) => /^\d+\.\d+\.\d+$/.test(entry))
    .sort((a, b) => b.localeCompare(a, "en", { numeric: true }))) {
    const zipalign = path.join(buildTools, version, "zipalign.exe");
    const apksigner = path.join(buildTools, version, "lib", "apksigner.jar");
    if ((await fs.stat(zipalign).catch(missingFile))?.isFile() &&
        (await fs.stat(apksigner).catch(missingFile))?.isFile()) {
      return { zipalign, apksigner };
    }
  }
  throw new Error("Install Android SDK Build Tools in the app's Android SDK to sign APKs.");
}

function missingFile(error) {
  if (error.code !== "ENOENT" && error.code !== "ENOTDIR") throw error;
}

function runTool(name, executable, args, credentials = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, {
      env: { ...process.env, ...credentials },
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    let output = "";
    const collect = (chunk) => { output = (output + chunk).slice(-4096); };
    child.stdout.on("data", collect);
    child.stderr.on("data", collect);
    child.once("error", (error) => reject(new Error(`Could not run ${name}: ${error.message}`)));
    child.once("close", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${name} failed (${signal ?? code}). ${output.trim()}`));
    });
  });
}

async function createSigningKey(paths, name, validity, alias, owner, password) {
  const settings = validateKeySettings(name, validity, alias, owner, password);
  await fs.mkdir(paths.signingKeys, { recursive: true });
  const keyPath = path.join(paths.signingKeys, settings.filename);
  const staging = await fs.mkdtemp(path.join(paths.signingKeys, ".key-"));
  try {
    const stagedKey = path.join(staging, settings.filename);
    await runTool("keytool", paths.keytool, [
      "-genkeypair", "-keystore", stagedKey,
      "-keyalg", "RSA", "-keysize", "2048",
      "-validity", settings.validity, "-alias", settings.alias, "-dname", settings.owner,
      "-storepass:env", "APP_WRAPPER_STORE_PASSWORD",
      "-keypass:env", "APP_WRAPPER_STORE_PASSWORD",
    ], { APP_WRAPPER_STORE_PASSWORD: password });
    try {
      await fs.copyFile(stagedKey, keyPath, constants.COPYFILE_EXCL);
    } catch (error) {
      if (error.code === "EEXIST") throw new Error("A signing key with that name already exists.");
      throw error;
    }
    return keyPath;
  } finally {
    await fs.rm(staging, { recursive: true, force: true });
  }
}

async function signApk(paths, unsignedApk, keystore, outputDirectory, password, keyPassword) {
  validateText(password, "Keystore password");
  if (keyPassword !== "") validateText(keyPassword, "Key password");

  const [apk, key, output, tools] = await Promise.all([
    validatePath(unsignedApk, "Unsigned APK", ".apk"),
    validatePath(keystore, "Keystore", ".jks"),
    validatePath(outputDirectory, "Output folder"),
    getSigningTools(paths.buildTools),
  ]);
  const release = path.join(await fs.realpath(output), "my-app-release.apk");
  const existingRelease = await fs.realpath(release).catch(missingFile);
  if (existingRelease && (await fs.realpath(apk)).toLowerCase() === existingRelease.toLowerCase()) {
    throw new Error("Choose a different output folder to avoid replacing the input APK.");
  }

  const staging = await fs.mkdtemp(path.join(output, ".sign-"));
  try {
    const aligned = path.join(staging, "aligned.apk");
    const signed = path.join(staging, "my-app-release.apk");
    await runTool("zipalign", tools.zipalign, ["-v", "-p", "4", apk, aligned]);
    await runTool("apksigner sign", paths.java, [
      "-jar", tools.apksigner, "sign", "--ks", key,
      "--ks-pass", "env:APP_WRAPPER_STORE_PASSWORD",
      "--key-pass", "env:APP_WRAPPER_KEY_PASSWORD",
      "--v4-signing-enabled", "false", "--out", signed, aligned,
    ], {
      APP_WRAPPER_STORE_PASSWORD: password,
      APP_WRAPPER_KEY_PASSWORD: keyPassword || password,
    });
    await runTool("apksigner verify", paths.java, ["-jar", tools.apksigner, "verify", signed]);
    await fs.rename(signed, release);
    await fs.rm(`${release}.idsig`, { force: true });
    return release;
  } finally {
    await fs.rm(staging, { recursive: true, force: true });
  }
}

module.exports = { validateKeySettings, getSigningTools, createSigningKey, signApk };
