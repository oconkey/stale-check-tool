import { STOP_PAY_OUTLOOK_SUBJECT } from "../config/stopPayRequest.js";

function uint8ArrayToBase64(bytes) {
  let binary = "";
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

export function isElectronEnvironment() {
  return Boolean(window.staleCheckOrganizer?.isElectron);
}

function downloadPdfFile(pdfBytes, filename) {
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = objectUrl;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 1000);
}

function buildComposeBody(filename) {
  return [
    "Please attach the stop pay request PDF that was just downloaded:",
    filename,
    "",
    "Thank you."
  ].join("\n");
}

function openMailtoCompose(filename) {
  const subject = encodeURIComponent(STOP_PAY_OUTLOOK_SUBJECT);
  const body = encodeURIComponent(buildComposeBody(filename));
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
}

function openOutlookWebCompose(filename) {
  const params = new URLSearchParams({
    subject: STOP_PAY_OUTLOOK_SUBJECT,
    body: buildComposeBody(filename)
  });

  const outlookWebUrl = `https://outlook.office.com/mail/deeplink/compose?${params.toString()}`;
  const opened = window.open(outlookWebUrl, "_blank", "noopener,noreferrer");

  if (!opened) {
    openMailtoCompose(filename);
  }
}

async function acceptStopPayRequestInBrowser({ pdfBytes, filename }) {
  downloadPdfFile(pdfBytes, filename);
  openOutlookWebCompose(filename);

  return {
    savedPath: filename,
    mode: "browser"
  };
}

export async function acceptStopPayRequest({ pdfBytes, filename }) {
  if (isElectronEnvironment()) {
    return window.staleCheckOrganizer.acceptStopPayRequest({
      pdfBase64: uint8ArrayToBase64(pdfBytes),
      filename
    });
  }

  return acceptStopPayRequestInBrowser({ pdfBytes, filename });
}
