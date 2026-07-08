const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("staleCheckOrganizer", {
  isElectron: true,
  acceptStopPayRequest: (payload) =>
    ipcRenderer.invoke("stop-pay:accept", payload)
});
