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

export async function acceptStopPayRequest({ pdfBytes, filename }) {
  if (!isElectronEnvironment()) {
    throw new Error(
      "Outlook export is available in the Stale Check Organizer desktop app only."
    );
  }

  return window.staleCheckOrganizer.acceptStopPayRequest({
    pdfBase64: uint8ArrayToBase64(pdfBytes),
    filename
  });
}
