const { spawn } = require("child_process");
const path = require("path");

const OUTLOOK_SCRIPT_PATH = path.join(__dirname, "open-outlook-draft.ps1");

function openOutlookDraft(attachmentPath, subject) {
  if (process.platform !== "win32") {
    return Promise.reject(
      new Error("Outlook integration is only available on Windows.")
    );
  }

  return new Promise((resolve, reject) => {
    const child = spawn(
      "powershell.exe",
      [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        OUTLOOK_SCRIPT_PATH,
        "-AttachmentPath",
        attachmentPath,
        "-Subject",
        subject
      ],
      { windowsHide: true }
    );

    let stderr = "";

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          stderr.trim() ||
            "Unable to open Outlook. Confirm Microsoft Outlook is installed."
        )
      );
    });
  });
}

module.exports = {
  openOutlookDraft
};
