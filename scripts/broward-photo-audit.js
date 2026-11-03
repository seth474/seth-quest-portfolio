#!/usr/bin/env node
/* Fail when two Broward units share a photo, or a listing photo is reused
   outside that unit. A unit card and its own detail hero may share one file. */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..', 'demos/broward-motorsports');
const imgDir = path.join(root, 'img');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'data.js'), 'utf8'), context);
const units = context.window.BROWARD.units;

function hashFile(file) {
  const full = path.join(imgDir, file);
  if (!fs.existsSync(full)) return null;
  const buf = fs.readFileSync(full);
  if (buf.slice(0, 32).toString('utf8').includes('<')) return { bad: true, hash: null, bytes: buf.length };
  return { bad: false, hash: crypto.createHash('sha256').update(buf).digest('hex'), bytes: buf.length };
}

const failures = [];
const byHash = new Map();
const byName = new Map();
const lines = [];

units.forEach(function (unit) {
  const info = hashFile(unit.img);
  if (!info) {
    failures.push(unit.id + ' is missing ' + unit.img);
    return;
  }
  if (info.bad) {
    failures.push(unit.id + ' file is not an image: ' + unit.img);
    return;
  }
  if (byName.has(unit.img)) {
    failures.push(unit.id + ' and ' + byName.get(unit.img) + ' both use ' + unit.img);
  } else {
    byName.set(unit.img, unit.id);
  }
  if (byHash.has(info.hash)) {
    const other = byHash.get(info.hash);
    failures.push(unit.id + ' (' + unit.img + ') is the same photo as ' + other.id + ' (' + other.file + ')');
  } else {
    byHash.set(info.hash, { id: unit.id, file: unit.img });
  }
  lines.push(unit.stock + '\t' + unit.condition + '\t' + unit.year + ' ' + unit.brand + ' ' + unit.model + '\t' + unit.img + '\t' + info.hash.slice(0, 12));
});

const sources = [];
function walk(dir) {
  fs.readdirSync(dir).forEach(function (name) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      if (name === 'img') return;
      walk(full);
      return;
    }
    if (/\.(html|js|css)$/.test(name) && name !== 'data.js') sources.push(full);
  });
}
walk(root);
const outside = sources.map(function (file) { return fs.readFileSync(file, 'utf8'); }).join('\n');
const mentioned = new Set(outside.match(/[\w.-]+\.(?:jpg|jpeg|png|webp)/gi) || []);

mentioned.forEach(function (file) {
  const info = hashFile(file);
  if (!info || info.bad) return;
  const owner = byHash.get(info.hash);
  if (owner) {
    failures.push(file + ' reuses the listing photo for ' + owner.id + ' (' + owner.file + ')');
  }
});

const decorative = new Map();
mentioned.forEach(function (file) {
  const info = hashFile(file);
  if (!info || info.bad || byName.has(file)) return;
  if (decorative.has(info.hash)) {
    failures.push(file + ' is the same photo as ' + decorative.get(info.hash));
  } else {
    decorative.set(info.hash, file);
  }
});

console.log('Broward photo audit');
console.log('units ' + units.length + ', unique files ' + byName.size + ', unique hashes ' + byHash.size);
lines.sort().forEach(function (line) { console.log(line); });
if (failures.length) {
  console.error('\nFAIL');
  failures.forEach(function (item) { console.error('- ' + item); });
  process.exit(1);
}
console.log('\nOK: every unit has its own photo, and listing photos are not reused elsewhere.');
