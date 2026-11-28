const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const { tmpdir } = require("node:os");
const path = require("node:path");
const { test } = require("node:test");
const {
  wrapperPaths, copyWrapperFiles, editAppFromSettings, validatePath,
} = require("../src-electron/main-process.cjs");
const {
  validateKeySettings, getSigningTools, createSigningKey,
} = require("../src-electron/signing.cjs");

const settings = {
  source: 'https://example.com/?name="A&B"&page=2',
  appId: "com.example.wrapper",
  appName: 'Example "A & B"',
  targetSdk: "34",
  overwriteSettings: true,
  useWebsite: true,
};

async function workspace(t) {
  const dir = await fs.mkdtemp(path.join(tmpdir(), "wrapper & test "));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const paths = wrapperPaths(dir);
  await fs.mkdir(paths.project, { recursive: true });
  return { dir, paths };
}

test("builds working and tool paths under Documents", () => {
  const documents = path.join(tmpdir(), "Documents & Files");
  const paths = wrapperPaths(documents);
  assert.equal(paths.root, path.join(documents, "Android App Wrapper"));
  assert.equal(paths.apkOutput, path.join(paths.project, "android", "app", "build", "outputs", "apk"));
  assert.equal(paths.keytool, path.join(paths.root, "toolchain", "jdk", "bin", "keytool.exe"));
  assert.equal(paths.buildTools, path.join(paths.root, "toolchain", "android-sdk", "build-tools"));
});

test("copies tools, preserves existing project settings and rejects copy errors", async (t) => {
  const { dir, paths } = await workspace(t);
  const publicDir = path.resolve(__dirname, "../public");
  const toolchain = path.join(dir, "fake-toolchain");
  await fs.mkdir(toolchain);
  await fs.writeFile(path.join(toolchain, "sample"), "bundled tool");
  await copyWrapperFiles(publicDir, toolchain, paths);
  assert.equal(await fs.readFile(path.join(paths.root, "toolchain", "sample"), "utf8"), "bundled tool");
  const manifest = path.join(paths.project, "package.json");
  await fs.writeFile(manifest, '{"name":"existing-project"}');
  await copyWrapperFiles(publicDir, toolchain, paths);
  assert.equal(JSON.parse(await fs.readFile(manifest, "utf8")).name, "existing-project");
  await assert.rejects(copyWrapperFiles(publicDir, path.join(dir, "missing"), paths), { code: "ENOENT" });
});

test("writes JSON, escapes the iframe URL and stages SDK settings for a clean build", async (t) => {
  const { paths } = await workspace(t);
  await editAppFromSettings(paths, settings);
  const config = JSON.parse(await fs.readFile(path.join(paths.project, "capacitor.config.json"), "utf8"));
  assert.deepEqual(config, {
    appId: settings.appId, appName: settings.appName, webDir: "www",
    server: { androidScheme: "https" },
  });
  const html = await fs.readFile(path.join(paths.project, "www", "index.html"), "utf8");
  assert.match(html, /src="https:\/\/example\.com\/\?name=%22A&amp;B%22&amp;page=2"/);
  const variables = await fs.readFile(path.join(paths.project, "wrapper-variables.gradle"), "utf8");
  assert.match(variables, /compileSdkVersion = 34\s+targetSdkVersion = 34/);
});

test("selects a local site with spaces and leaves existing Gradle settings in place", async (t) => {
  const { dir, paths } = await workspace(t);
  const site = path.join(dir, "My site & files");
  await fs.mkdir(site);
  await fs.mkdir(paths.android);
  const variables = path.join(paths.android, "variables.gradle");
  await fs.writeFile(variables, "existing Gradle settings");
  await editAppFromSettings(paths, settings);
  await editAppFromSettings(paths, {
    ...settings, source: site, useWebsite: false, overwriteSettings: false,
  });
  const config = JSON.parse(await fs.readFile(path.join(paths.project, "capacitor.config.json"), "utf8"));
  assert.equal(config.webDir, site.replace(/\\/g, "/"));
  assert.equal(await fs.readFile(variables, "utf8"), "existing Gradle settings");
  await assert.rejects(fs.access(path.join(paths.project, "wrapper-variables.gradle")), { code: "ENOENT" });
});

test("rejects malformed app settings before writing any files", async (t) => {
  const { paths } = await workspace(t);
  for (const [invalid, error] of [
    [{ appId: "com.example/bad" }, /Android app ID/],
    [{ appName: "test\nname" }, /App name/],
    [{ source: "file:///local/index.html" }, /HTTP or HTTPS/],
    [{ source: "relative", useWebsite: false }, /absolute path/],
    [{ targetSdk: "33 + 1" }, /Target SDK/],
    [{ targetSdk: 21 }, /Target SDK/],
    [{ overwriteSettings: "false" }, /valid build settings/],
  ]) {
    await assert.rejects(editAppFromSettings(paths, { ...settings, ...invalid }), error);
  }
  assert.deepEqual(await fs.readdir(paths.project), []);
});

test("requires absolute paths, the appropriate extension and the correct file type", async (t) => {
  const { dir } = await workspace(t);
  const apk = path.join(dir, "my app & files.APK");
  await fs.writeFile(apk, "");
  assert.equal(await validatePath(apk, "Unsigned APK", ".apk"), apk);
  await assert.rejects(validatePath("my app.apk", "Unsigned APK", ".apk"), /absolute/);
  await assert.rejects(validatePath(apk, "Keystore", ".jks"), /\.jks file/);
  await assert.rejects(validatePath(apk, "Output folder"), /not a folder/);
  await assert.rejects(validatePath(path.join(dir, "missing.apk"), "Unsigned APK", ".apk"), /does not exist/);
});

test("validates key filenames and validity while preserving quoted alias values", () => {
  assert.deepEqual(
    validateKeySettings("my app & key", "365", 'release "A&B"', "CN=App & Co", 'pw & "quotes"'),
    { filename: "my app & key.jks", validity: "365", alias: 'release "A&B"', owner: "CN=App & Co" }
  );
  for (const name of ["../outside", "NUL.txt", 'key"name', "name.", "key\nname"]) {
    assert.throws(() => validateKeySettings(name, 365, "release", "CN=App", "password"));
  }
  for (const validity of [0, 1.5, "32 & more", true]) {
    assert.throws(() => validateKeySettings("key", validity, "release", "CN=App", "password"), /validity/);
  }
  assert.throws(() => validateKeySettings("key", 365, "-option", "CN=App", "password"), /alias/);
  assert.throws(() => validateKeySettings("key", 365, "release", "CN=App", "short"), /password/);
});

test("resolves the latest complete Android SDK Build Tools installation", async (t) => {
  const { paths } = await workspace(t);
  await assert.rejects(getSigningTools(paths.buildTools), /Install Android SDK Build Tools/);
  for (const version of ["9.0.0", "10.0.2", "11.0.0"]) {
    const directory = path.join(paths.buildTools, version);
    await fs.mkdir(path.join(directory, "lib"), { recursive: true });
    await fs.writeFile(path.join(directory, "zipalign.exe"), "");
    if (version !== "11.0.0") await fs.writeFile(path.join(directory, "lib", "apksigner.jar"), "");
  }
  assert.deepEqual(await getSigningTools(paths.buildTools), {
    zipalign: path.join(paths.buildTools, "10.0.2", "zipalign.exe"),
    apksigner: path.join(paths.buildTools, "10.0.2", "lib", "apksigner.jar"),
  });
});

test("bundled Windows keytool creates a key without a shell or password prompt", {
  skip: process.platform !== "win32",
}, async (t) => {
  const keytool = path.resolve(__dirname, "../public/toolchain/jdk/bin/keytool.exe");
  if (!(await fs.stat(keytool).catch(() => null))) return t.skip("Run npm run fetch:toolchain first");
  const { paths } = await workspace(t);
  const key = await createSigningKey(
    { ...paths, keytool }, "app & release", 365, 'release "A&B"', "CN=App & Co", 'pw & "quotes"'
  );
  assert.equal(key, path.join(paths.signingKeys, "app & release.jks"));
  assert.ok((await fs.stat(key)).size > 0);
});
