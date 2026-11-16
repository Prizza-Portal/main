// Copies the website into mobile/www for the Android app (same source of truth as the desktop bundle).
// Run: node scripts/sync-mobile.js   (from repo root or mobile/)
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..", "..");
const dest = path.join(__dirname, "..", "www");
const items = ["index.html", "login.html", "manifest.webmanifest", "css", "js", "icons", "vendor"];
fs.rmSync(dest, { recursive: true, force: true });
fs.mkdirSync(dest, { recursive: true });
for (const it of items) fs.cpSync(path.join(root, it), path.join(dest, it), { recursive: true });
console.log("site synced ->", dest);
