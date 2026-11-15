// Visual check of a single view: loads the bundled site with ?view=<name>, screenshots, quits.
const { app, BrowserWindow } = require("electron");
const path = require("path"), fs = require("fs");
const view = process.argv[2] || "getapp";

app.whenReady().then(() => {
  const win = new BrowserWindow({
    show: false, width: 1280, height: 860, backgroundColor: "#FAF8F5",
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  const url = "file:///" + path.join(__dirname, "..", "app", "site", "index.html").replace(/\\/g, "/") + "?view=" + view;
  const out = [];
  win.webContents.on("console-message", (...a) => {
    const ev = a[0]; const msg = ev && typeof ev === "object" && "message" in ev ? ev.message : a[2];
    if (msg && /error|fail|uncaught/i.test(String(msg))) out.push("[console] " + String(msg).slice(0, 200));
  });
  win.loadURL(url).catch(e => out.push("[LOAD-ERROR] " + e.message));
  setTimeout(async () => {
    try { const img = await win.capturePage(); fs.writeFileSync("C:\\prizza-build\\" + view + ".png", img.toPNG()); out.push("[screenshot] saved"); }
    catch (e) { out.push("[screenshot-error] " + e.message); }
    console.log(out.length ? out.join("\n") : "(no errors)");
    app.quit();
  }, 9000);
});
