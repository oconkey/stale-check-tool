const { app, BrowserWindow, ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");
const { openOutlookDraft } = require("./outlook.cjs");

const STOP_PAY_OUTLOOK_SUBJECT = "Multiple Complete Closing Documents";
const STOP_PAY_SAVE_DIR_NAME = path.join(
  "Stale Check Organizer",
  "Stop Pay Requests"
);

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "preload.cjs")
    }
  });

  win.loadFile(path.join(__dirname, "../dist/index.html"));
}

function getStopPaySaveDirectory() {
  return path.join(app.getPath("documents"), STOP_PAY_SAVE_DIR_NAME);
}

function saveStopPayPdf(pdfBase64, filename) {
  const safeFilename = path.basename(filename);
  if (!safeFilename.toLowerCase().endsWith(".pdf")) {
    throw new Error("Stop pay exports must be saved as PDF files.");
  }

  const saveDirectory = getStopPaySaveDirectory();
  fs.mkdirSync(saveDirectory, { recursive: true });

  const savedPath = path.join(saveDirectory, safeFilename);
  fs.writeFileSync(savedPath, Buffer.from(pdfBase64, "base64"));

  return savedPath;
}

ipcMain.handle("stop-pay:accept", async (_event, payload) => {
  const { pdfBase64, filename } = payload ?? {};

  if (!pdfBase64 || !filename) {
    throw new Error("Missing PDF data required to finalize the stop pay request.");
  }

  const savedPath = saveStopPayPdf(pdfBase64, filename);
  await openOutlookDraft(savedPath, STOP_PAY_OUTLOOK_SUBJECT);

  return { savedPath };
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
