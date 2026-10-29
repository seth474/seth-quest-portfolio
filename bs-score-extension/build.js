#!/usr/bin/env node
/**
 * Build a Chrome Web Store zip. manifest.json is at the archive root.
 * Usage: node bs-score-extension/build.js
 */
var fs = require("fs");
var path = require("path");
var cp = require("child_process");

var root = __dirname;
var staging = path.join(root, ".store-staging");
var zipPath = path.join(root, "bs-score-chrome.zip");
var files = [
  "manifest.json",
  "background.js",
  "content.js",
  "config.js",
  "popup.html",
  "sidepanel.html",
  "sidepanel.js"
];

fs.rmSync(staging, { recursive: true, force: true });
fs.mkdirSync(staging, { recursive: true });
files.forEach(function (file) {
  fs.copyFileSync(path.join(root, file), path.join(staging, file));
});
fs.cpSync(path.join(root, "lib"), path.join(staging, "lib"), { recursive: true });
fs.cpSync(path.join(root, "icons"), path.join(staging, "icons"), { recursive: true });

fs.rmSync(zipPath, { force: true });
cp.execFileSync("zip", ["-r", "-X", zipPath, "."], { cwd: staging, stdio: "inherit" });
fs.rmSync(staging, { recursive: true, force: true });

var listing = cp.execFileSync("zipinfo", ["-1", zipPath], { encoding: "utf8" });
if (!/^manifest\.json$/m.test(listing)) {
  throw new Error("Store zip is missing a root manifest.json");
}
if (/fixtures\//.test(listing) || /README/.test(listing)) {
  throw new Error("Store zip includes files that should stay out of the package");
}
process.stdout.write("Wrote " + zipPath + "\n");
