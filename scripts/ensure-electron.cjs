const fs = require("fs");
const path = require("path");

// Skip on Vercel / CI web deploys — Electron is only needed for the desktop app.
if (
  process.env.VERCEL ||
  process.env.ELECTRON_SKIP_BINARY_DOWNLOAD === "1" ||
  process.env.SKIP_ELECTRON_DOWNLOAD === "1"
) {
  console.log("Skipping Electron binary download (web/CI install).");
  process.exit(0);
}

const { downloadArtifact } = require("@electron/get");
const { spawnSync } = require("child_process");

const electronDir = path.join(__dirname, "..", "node_modules", "electron");
const distDir = path.join(electronDir, "dist");
const pathFile = path.join(electronDir, "path.txt");
const electronExe = path.join(distDir, "electron.exe");
const { version } = require(path.join(electronDir, "package.json"));

function electronIsInstalled() {
  if (!fs.existsSync(electronExe) || !fs.existsSync(pathFile)) {
    return false;
  }

  try {
    const installedVersion = fs
      .readFileSync(path.join(distDir, "version"), "utf8")
      .trim();
    const configuredPath = fs.readFileSync(pathFile, "utf8").trim();

    return installedVersion === version && configuredPath === "electron.exe";
  } catch {
    return false;
  }
}

async function installElectronBinary() {
  if (electronIsInstalled()) {
    return;
  }

  const zipPath = await downloadArtifact({
    version,
    artifactName: "electron",
    platform: process.platform,
    arch: process.arch,
    force: true,
    checksums: require(path.join(electronDir, "checksums.json"))
  });

  fs.rmSync(distDir, { recursive: true, force: true });
  fs.mkdirSync(distDir, { recursive: true });

  if (process.platform === "win32") {
    const result = spawnSync(
      "powershell.exe",
      [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        `Expand-Archive -LiteralPath '${zipPath.replace(/'/g, "''")}' -DestinationPath '${distDir.replace(/'/g, "''")}' -Force`
      ],
      { stdio: "inherit" }
    );

    if (result.status !== 0) {
      throw new Error("Failed to extract the Electron binary on Windows.");
    }
  } else {
    const extract = require("extract-zip");
    await extract(zipPath, { dir: distDir });
  }

  fs.writeFileSync(pathFile, "electron.exe");
}

installElectronBinary().catch((error) => {
  console.error(error);
  process.exit(1);
});
