const { contextBridge, ipcRenderer } = require("electron");
// The only things the website (and the offline screen) can ask the app to do.
contextBridge.exposeInMainWorld("prizzaDesktop", {
  isDesktop: true,
  info: () => ipcRenderer.invoke("info"),
  notify: o => ipcRenderer.invoke("notify", { title: o && o.title, body: o && o.body, view: o && o.view }),
  retry: () => ipcRenderer.invoke("retry"),
  onOpenView: f => { ipcRenderer.on("open-view", (e, v) => f(v)); },
  onFocus: f => { ipcRenderer.on("app-focus", () => f()); }
});
