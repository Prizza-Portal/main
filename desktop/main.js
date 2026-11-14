// Prizza Desktop: a small, locked-down window around https://prizza-portal.github.io/main/
// - lives in the system tray so notifications keep arriving after you close the window
// - shows desktop notifications for important posts (the website calls window.prizzaDesktop.notify)
// - shows a friendly screen when you are offline, and checks for a newer app version
const { app, BrowserWindow, Tray, Menu, Notification, ipcMain, shell, session, nativeImage, net } = require("electron");
const path = require("path"), fs = require("fs");

// GitHub Pages serves this repo (named "main") under /main/, not at the domain root.
const SITE = process.env.PRIZZA_URL || "https://prizza-portal.github.io/main/";
const ORIGIN = new URL(SITE).origin;
const UPDATE_URL = new URL("desktop/version.json", SITE).href;
const TEST_LOG = process.env.PRIZZA_TEST_LOG || "";
const log = (e, d) => { if (TEST_LOG) try { fs.appendFileSync(TEST_LOG, JSON.stringify({ e, d }) + "\n"); } catch (x) {} };
const ASSETS = path.join(__dirname, "app", "assets"), OFFLINE = path.join(__dirname, "app", "offline.html");
const ICON = nativeImage.createFromPath(path.join(ASSETS, "icon.png"));
const TRAY_ICON = nativeImage.createFromPath(path.join(ASSETS, "tray.png"));
const BADGE = nativeImage.createFromPath(path.join(ASSETS, "badge.png"));
const VIEWS = ["dashboard", "assignments", "resources", "news", "blog", "calendar", "files", "sessions", "quizzes", "voice", "users", "setup"];

app.setAppUserModelId("com.prizza.desktop"); // needed on Windows for notifications and taskbar grouping
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();

let win = null, tray = null, quitting = false, offline = false, unread = 0, update = null, retryTimer = null, saveTimer = null;
const settingsFile = () => path.join(app.getPath("userData"), "prizza-desktop.json");
let settings = { tray: true, bounds: null, max: false, zoom: 0, told: false, notifiedVersion: "" };
function loadSettings() { try { Object.assign(settings, JSON.parse(fs.readFileSync(settingsFile(), "utf8"))); } catch (e) {} }
function saveSettings() { try { fs.mkdirSync(path.dirname(settingsFile()), { recursive: true }); fs.writeFileSync(settingsFile(), JSON.stringify(settings)); } catch (e) {} }
const clean = (v, n) => (typeof v === "string" ? v.slice(0, n) : "");
const trusted = u => { try { return new URL(u).origin === ORIGIN; } catch (e) { return false; } };
const fromApp = e => { const u = (e.senderFrame && e.senderFrame.url) || ""; return trusted(u) || (u.startsWith("file:") && u.endsWith("offline.html")); };

function openExternal(u) {
  try { const x = new URL(u); if (!["https:", "http:", "mailto:"].includes(x.protocol)) return; log("external", x.href); if (!TEST_LOG) shell.openExternal(x.href); } catch (e) {}
}
function toast(title, body, onClick) {
  try { if (!Notification.isSupported()) return; const n = new Notification({ title, body, icon: ICON }); live.add(n); n.on("close", () => live.delete(n)); if (onClick) n.on("click", onClick); n.show(); } catch (e) {}
}
const live = new Set();

// ---------- window ----------
function showWindow() { if (!win) return; if (win.isMinimized()) win.restore(); win.show(); win.focus(); }
function updateBadge() {
  try { if (win && process.platform === "win32") win.setOverlayIcon(unread ? BADGE : null, unread ? unread + " new" : ""); app.setBadgeCount(unread); if (tray) tray.setToolTip(unread ? "Prizza - " + unread + " new" : "Prizza"); } catch (e) {}
}
function loadSite() { offline = false; clearInterval(retryTimer); win.loadURL(SITE); }
async function reachable() { try { const r = await net.fetch(SITE, { method: "HEAD", cache: "no-store", signal: AbortSignal.timeout(6000) }); return r.status < 500; } catch (e) { return false; } }
async function reconnect() { if (await reachable()) { loadSite(); return true; } return false; }
function showOffline() {
  if (offline) return; offline = true; log("offline"); win.loadFile(OFFLINE);
  clearInterval(retryTimer); retryTimer = setInterval(reconnect, +process.env.PRIZZA_TEST_RETRY || 15000);
}
function createWindow() {
  const b = settings.bounds || {};
  win = new BrowserWindow({
    width: b.width || 1280, height: b.height || 820, x: b.x, y: b.y, minWidth: 900, minHeight: 600, show: false, backgroundColor: "#1E293B",
    title: "Prizza", icon: ICON, autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false, spellcheck: false }
  });
  Menu.setApplicationMenu(null);
  if (settings.max) win.maximize();
  const wc = win.webContents;
  wc.setUserAgent(wc.getUserAgent().replace(/ Electron\/\S+/, "") + " PrizzaDesktop/" + app.getVersion());
  wc.setZoomLevel(settings.zoom || 0);

  win.once("ready-to-show", () => { if (!process.argv.includes("--hidden")) win.show(); });
  wc.on("did-finish-load", () => log("loaded", wc.getURL()));
  wc.on("did-fail-load", (e, code, desc, url, isMain) => { if (isMain && code !== -3) { log("fail", code); showOffline(); } });
  wc.on("will-navigate", (e, url) => { if (url.startsWith("file:")) return e.preventDefault(); if (!trusted(url)) { e.preventDefault(); openExternal(url); } });
  wc.setWindowOpenHandler(({ url }) => { if (trusted(url)) wc.loadURL(url); else openExternal(url); return { action: "deny" }; });
  wc.on("before-input-event", (e, i) => {
    if (i.type !== "keyDown") return; const c = i.control || i.meta, k = i.key;
    const zoom = d => { wc.setZoomLevel(Math.max(-3, Math.min(5, wc.getZoomLevel() + d))); settings.zoom = wc.getZoomLevel(); saveSettings(); };
    if (k === "F5" || (c && (k === "r" || k === "R"))) { e.preventDefault(); if (offline) reconnect(); else i.shift ? wc.reloadIgnoringCache() : wc.reload(); }
    else if (c && (k === "=" || k === "+")) { e.preventDefault(); zoom(0.5); }
    else if (c && k === "-") { e.preventDefault(); zoom(-0.5); }
    else if (c && k === "0") { e.preventDefault(); wc.setZoomLevel(0); settings.zoom = 0; saveSettings(); }
    else if (k === "F11") { e.preventDefault(); win.setFullScreen(!win.isFullScreen()); }
    else if (i.alt && k === "ArrowLeft" && wc.navigationHistory.canGoBack()) { e.preventDefault(); wc.navigationHistory.goBack(); }
  });
  const remember = () => { clearTimeout(saveTimer); saveTimer = setTimeout(() => { if (win && !win.isDestroyed() && !win.isMinimized() && !win.isFullScreen()) { settings.max = win.isMaximized(); if (!settings.max) settings.bounds = win.getNormalBounds(); saveSettings(); } }, 600); };
  win.on("resize", remember); win.on("move", remember);
  win.on("focus", () => { unread = 0; updateBadge(); try { win.flashFrame(false); } catch (e) {} wc.send("app-focus"); });
  win.on("close", e => {
    if (quitting || !settings.tray || !tray) return;
    e.preventDefault(); win.hide();
    if (!settings.told) { settings.told = true; saveSettings(); toast("Prizza is still running", "It stays in the tray so you get notifications. Right-click the tray icon to quit."); }
  });
  win.on("closed", () => { win = null; });
  loadSite();
}

// ---------- tray ----------
function trayMenu() {
  const items = [
    { label: "Open Prizza", click: showWindow }, { type: "separator" },
    { label: "Keep running in the tray when closed", type: "checkbox", checked: settings.tray, click: m => { settings.tray = m.checked; saveSettings(); } },
    { label: "Check for updates", click: () => checkUpdate(true) }, { type: "separator" },
    { label: "Quit Prizza", click: () => { quitting = true; app.quit(); } }
  ];
  if (process.platform !== "linux") items.splice(2, 0, { label: "Start with Windows", type: "checkbox", checked: app.getLoginItemSettings({ args: ["--hidden"] }).openAtLogin, click: m => app.setLoginItemSettings({ openAtLogin: m.checked, args: ["--hidden"] }) });
  if (update) items.splice(1, 0, { label: "Update available (" + update.version + ") - download", click: () => openExternal(update.url) });
  return Menu.buildFromTemplate(items);
}
function makeTray() {
  try { tray = new Tray(TRAY_ICON); tray.setToolTip("Prizza"); tray.setContextMenu(trayMenu()); tray.on("click", () => (win && win.isVisible() && win.isFocused() ? win.hide() : showWindow())); } catch (e) { tray = null; }
}

// ---------- notifications from the website ----------
ipcMain.handle("notify", (e, o) => {
  if (!fromApp(e) || !o) return false;
  const title = clean(o.title, 120) || "Prizza", body = clean(o.body, 240), view = VIEWS.includes(o.view) ? o.view : "dashboard";
  log("notify", { title, body, view });
  if (win && win.isVisible() && win.isFocused()) return true;   // you are already looking at it
  toast(title, body, () => { showWindow(); if (win) win.webContents.send("open-view", view); });
  unread++; updateBadge(); try { if (win && win.isVisible()) win.flashFrame(true); } catch (x) {}
  return true;
});
ipcMain.handle("retry", async e => (fromApp(e) ? reconnect() : false));
ipcMain.handle("info", e => (fromApp(e) ? { version: app.getVersion(), platform: process.platform } : null));

// ---------- update check (the app itself; the website always updates by itself) ----------
const newer = (a, b) => { const x = a.split(".").map(Number), y = b.split(".").map(Number); for (let i = 0; i < 4; i++) { const d = (x[i] || 0) - (y[i] || 0); if (d) return d > 0; } return false; };
async function checkUpdate(manual) {
  try {
    const r = await net.fetch(UPDATE_URL, { cache: "no-store", signal: AbortSignal.timeout(10000) }); if (!r.ok) throw new Error("HTTP " + r.status);
    const j = await r.json(), url = clean(j.url, 400);
    if (!/^\d+(\.\d+){0,3}$/.test(j.version || "")) throw new Error("bad version");
    if (/^https:\/\/(github\.com|prizza-portal\.github\.io)\//.test(url) && newer(j.version, app.getVersion())) {
      update = { version: j.version, url }; log("update", j.version); if (tray) tray.setContextMenu(trayMenu());
      if (manual || settings.notifiedVersion !== j.version) { settings.notifiedVersion = j.version; saveSettings(); toast("Prizza " + j.version + " is available", "Click to download it.", () => openExternal(url)); }
    } else if (manual) toast("Prizza", "You have the latest version.");
  } catch (e) { if (manual) toast("Prizza", "Could not check for updates right now."); }
}

// ---------- start ----------
app.on("second-instance", () => showWindow());
app.on("before-quit", () => { quitting = true; });
app.on("window-all-closed", () => app.quit());
app.on("activate", () => showWindow());
if (gotLock) app.whenReady().then(() => {
  loadSettings();
  const ses = session.defaultSession;
  // only the Prizza site may use the microphone (voice rooms, audio only), notifications and the clipboard
  ses.setPermissionRequestHandler((wc, perm, cb, d) => {
    if (perm === "fullscreen") return cb(true);
    if (perm === "media") return cb(trusted(d.requestingUrl) && !(d.mediaTypes || []).includes("video"));
    cb(trusted(d.requestingUrl) && ["notifications", "clipboard-sanitized-write"].includes(perm));
  });
  ses.setPermissionCheckHandler((wc, perm, origin) => perm === "fullscreen" || (trusted(origin) && ["media", "notifications", "clipboard-sanitized-write"].includes(perm)));
  makeTray(); createWindow();
  setTimeout(() => checkUpdate(false), 10000); setInterval(() => checkUpdate(false), 6 * 3600 * 1000);
});
