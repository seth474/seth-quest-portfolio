#!/usr/bin/env node
/* Fail when any Broward image is reused.
   A unit card and that unit's detail hero may share one file.
   Tiles, category cards, brand thumbnails, the hero poster, and
   model-page art must be different files from each other and from listings. */
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
const uses = new Map();

function addUse(file, where) {
  if (!uses.has(file)) uses.set(file, []);
  const list = uses.get(file);
  if (list.indexOf(where) === -1) list.push(where);
}

units.forEach(function (unit) {
  addUse(unit.img, 'listing ' + unit.stock + ' ' + unit.year + ' ' + unit.brand + ' ' + unit.model);
});

const listingNames = new Set(units.map(function (unit) { return unit.img; }));
const dataText = fs.readFileSync(path.join(root, 'data.js'), 'utf8');
(dataText.match(/[\w.-]+\.(?:jpg|jpeg|png|webp)/gi) || []).forEach(function (file) {
  if (!listingNames.has(file)) addUse(file, 'data.js');
});

function walk(dir) {
  fs.readdirSync(dir).forEach(function (name) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      if (name === 'img') return;
      walk(full);
      return;
    }
    if (!/\.(html|js|css)$/.test(name) || name === 'data.js') return;
    const text = fs.readFileSync(full, 'utf8');
    const found = text.match(/[\w.-]+\.(?:jpg|jpeg|png|webp)/gi) || [];
    found.forEach(function (file) { addUse(file, path.relative(root, full)); });
  });
}
walk(root);

const lines = [];
const byHash = new Map();
const listingFiles = new Set(units.map(function (unit) { return unit.img; }));

Array.from(uses.keys()).sort().forEach(function (file) {
  const info = hashFile(file);
  const where = uses.get(file).join(', ');
  if (!info) {
    failures.push(file + ' is missing (' + where + ')');
    return;
  }
  if (info.bad) {
    failures.push(file + ' is not an image (' + where + ')');
    return;
  }
  const kind = listingFiles.has(file) ? 'listing' : 'site';
  if (byHash.has(info.hash)) {
    failures.push(file + ' is the same photo as ' + byHash.get(info.hash));
  } else {
    byHash.set(info.hash, file);
  }
  if (kind === 'listing') {
    const outside = uses.get(file).filter(function (place) { return place.indexOf('listing ') !== 0; });
    if (outside.length) {
      failures.push(file + ' is a listing photo and is also used in ' + outside.join(', '));
    }
  }
  lines.push(kind + '\t' + file + '\t' + info.hash.slice(0, 12) + '\t' + where);
});

const listingCount = units.length;
console.log('Broward photo audit');
console.log('images ' + uses.size + ', unique files ' + uses.size + ', unique hashes ' + byHash.size + ', listings ' + listingCount);
lines.forEach(function (line) { console.log(line); });
if (failures.length) {
  console.error('\nFAIL');
  failures.forEach(function (item) { console.error('- ' + item); });
  process.exit(1);
}
console.log('\nOK: every unit has its own photo, and no image is reused anywhere else on the site.');
