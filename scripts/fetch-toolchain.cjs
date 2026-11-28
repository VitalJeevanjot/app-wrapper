const { execFile } = require("node:child_process");
const { createHash } = require("node:crypto");
const { createWriteStream } = require("node:fs");
const fs = require("node:fs/promises");
const path = require("node:path");
const { Readable, Transform } = require("node:stream");
const { pipeline } = require("node:stream/promises");
const { promisify } = require("node:util");

const run = promisify(execFile);
const projectRoot = path.resolve(__dirname, "..");
const toolchain = path.join(projectRoot, "public", "toolchain");
const androidTools = {
  name: "Android command-line tools",
  // Published at https://developer.android.com/studio#command-tools
  url: "https://dl.google.com/android/repository/commandlinetools-win-15859902_latest.zip",
  sha256: "90ae805d20434428bffcb699c290860f19bb5f66a67e6b330067e3de801fb04a",
  archiveDirectory: "cmdline-tools",
  destination: "android-sdk/cmdline-tools/latest",
  requiredFiles: ["bin/sdkmanager.bat", "lib/sdkmanager-classpath.jar"],
};

async function request(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(600_000) });
  if (!response.ok) {
    throw new Error(`Download failed (${response.status}) for ${url}`);
  }
  return response;
}

async function getNodeLts() {
  const releases = await (await request("https://nodejs.org/dist/index.json")).json();
  const release = releases.find(({ lts, files }) =>
    lts && files.includes("win-x64-zip")
  );
  if (!release || !/^v\d+\.\d+\.\d+$/.test(release.version)) {
    throw new Error("Could not resolve a Windows x64 Node.js LTS release.");
  }

  const archiveDirectory = `node-${release.version}-win-x64`;
  const base = `https://nodejs.org/dist/${release.version}`;
  const checksums = await (await request(`${base}/SHASUMS256.txt`)).text();
  const archiveName = `${archiveDirectory}.zip`;
  const checksum = checksums.split(/\r?\n/).map((line) => line.trim().split(/\s+/))
    .find(([, name]) => name === archiveName);
  return {
    name: `Node.js ${release.version} LTS`,
    url: `${base}/${archiveName}`,
    sha256: checksum?.[0],
    archiveDirectory,
    destination: "node",
    requiredFiles: ["node.exe", "node_modules/npm/bin/npm-cli.js"],
  };
}

async function getJdk17() {
  const url = "https://api.adoptium.net/v3/assets/latest/17/hotspot" +
    "?architecture=x64&image_type=jdk&os=windows&vendor=eclipse";
  const [release] = await (await request(url)).json();
  const archive = release?.binary?.package;
  if (!archive?.link?.startsWith("https://") || !archive.name?.endsWith(".zip")) {
    throw new Error("Could not resolve the Windows x64 Temurin JDK 17 archive.");
  }

  return {
    name: `Temurin ${release.release_name}`,
    url: archive.link,
    sha256: archive.checksum,
    destination: "jdk",
    requiredFiles: ["bin/java.exe", "bin/keytool.exe"],
  };
}

async function checkFiles(directory, files) {
  await Promise.all(files.map((file) => fs.access(path.join(directory, file))));
}

async function isInstalled(directory, sha256, files) {
  try {
    const digest = await fs.readFile(path.join(directory, ".archive-sha256"), "utf8");
    if (digest.trim() !== sha256) return false;
    await checkFiles(directory, files);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function install(spec) {
  if (!/^[\da-f]{64}$/i.test(spec.sha256 ?? "")) {
    throw new Error(`Missing or invalid SHA-256 for ${spec.name}.`);
  }

  const destination = path.join(toolchain, spec.destination);
  const sha256 = spec.sha256.toLowerCase();
  if (await isInstalled(destination, sha256, spec.requiredFiles)) {
    console.log(`${spec.name} is already installed.`);
    return;
  }

  console.log(`Downloading ${spec.name}...`);
  const staging = await fs.mkdtemp(path.join(projectRoot, ".toolchain-"));
  try {
    const archive = path.join(staging, "tool.zip");
    const hash = createHash("sha256");
    const checksumStream = new Transform({
      transform(chunk, encoding, callback) {
        hash.update(chunk);
        callback(null, chunk);
      },
    });
    const response = await request(spec.url);
    await pipeline(Readable.fromWeb(response.body), checksumStream, createWriteStream(archive));
    if (hash.digest("hex") !== sha256) {
      throw new Error(`SHA-256 mismatch for ${spec.name}.`);
    }

    const extracted = path.join(staging, "extracted");
    await fs.mkdir(extracted);
    await run(process.platform === "win32" ? "tar.exe" : "tar", [
      "-xf", archive, "-C", extracted,
    ]);
    // Temurin archives contain a single top-level directory named after the release.
    const archiveDirectory = spec.archiveDirectory ?? (await fs.readdir(extracted))[0];
    const source = path.join(extracted, archiveDirectory);
    await checkFiles(source, spec.requiredFiles);
    await fs.writeFile(path.join(source, ".archive-sha256"), `${sha256}\n`);

    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.rm(destination, { recursive: true, force: true });
    await fs.rename(source, destination);
    console.log(`Verified and installed ${spec.name}.`);
  } finally {
    await fs.rm(staging, { recursive: true, force: true });
  }
}

async function main() {
  const results = await Promise.allSettled([
    getNodeLts().then(install),
    getJdk17().then(install),
    install(androidTools),
  ]);
  for (const result of results) {
    if (result.status === "rejected") {
      console.error(result.reason);
      process.exitCode = 1;
    }
  }
}

main();
