// Smoke test: loads the bundled site exactly like the packaged app does,
// captures console messages / load failures, saves a screenshot, then quits.
const { app, BrowserWindow } = require("electron");
const path = require("path"), fs = require("fs");

app.whenReady().then(() => {
  const win = new BrowserWindow({
    show: false, width: 1280, height: 820, backgroundColor: "#1E293B",
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  const url = "file:///" + path.join(__dirname, "..", "app", "site", "index.html").replace(/\\/g, "/");
  const out = [];
  const wc = win.webContents;
  wc.on("console-message", (...a) => {
    const ev = a[0];
    const msg = ev && typeof ev === "object" && "message" in ev ? ev.message : a[2];
    const lvl = ev && typeof ev === "object" && "level" in ev ? ev.level : a[1];
    if (msg) out.push("[console:" + lvl + "] " + String(msg).slice(0, 300));
  });
  wc.on("did-fail-load", (e, code, desc, u, isMain) => { if (isMain) out.push("[MAIN-LOAD-FAIL " + code + "] " + desc + " " + u); });
  wc.on("did-finish-load", () => out.push("[loaded] " + wc.getURL()));
  wc.on("did-navigate", (e, u) => out.push("[navigated] " + u));
  win.loadURL(url).catch(e => out.push("[LOAD-ERROR] " + e.message));
  setTimeout(async () => {
    try { const img = await win.capturePage(); fs.writeFileSync("C:\\prizza-build\\smoke.png", img.toPNG()); out.push("[screenshot] saved"); }
    catch (e) { out.push("[screenshot-error] " + e.message); }
    console.log(out.length ? out.join("\n") : "(no events)");
    app.quit();
  }, 12000);
});
