// Copies the website into the Electron bundle so the exe is fully self-contained.
// Runs automatically before "npm start" and "npm run dist" (prestart/predist hooks).
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..", "..");            // repo root (the website)
const dest = path.join(__dirname, "..", "app", "site");   // desktop/app/site
const items = ["index.html", "login.html", "manifest.webmanifest", "sw.js", "css", "js", "icons", "vendor"];
fs.rmSync(dest, { recursive: true, force: true });
fs.mkdirSync(dest, { recursive: true });
for (const it of items) fs.cpSync(path.join(root, it), path.join(dest, it), { recursive: true });
console.log("site synced ->", dest);
