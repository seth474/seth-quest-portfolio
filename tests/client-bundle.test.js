const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.join(__dirname, '..');
const snapshot = require('../api/_lib/snapshot.js');

function walk(dir, out) {
  fs.readdirSync(dir).forEach(function (name) {
    if (name === '.git' || name === 'node_modules' || name === 'build') return;
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, out);
    else out.push(full);
  });
}

function stringsOf(value, out) {
  if (!value || typeof value !== 'object') return;
  if (typeof value.email === 'string' && value.email.indexOf('@') !== -1) out.push(value.email);
  if (typeof value.phone === 'string' && value.phone.replace(/\D/g, '').length >= 10) out.push(value.phone);
  if (typeof value.address === 'string' && /\d/.test(value.address) && value.address.indexOf(' ') !== -1) out.push(value.address);
  Object.keys(value).forEach(function (key) { stringsOf(value[key], out); });
}

test('client bundle contains no passphrase literal or CRM records', () => {
  assert.equal(fs.existsSync(path.join(root, 'dashboard', 'data.json')), false);
  const bundlePath = path.join(os.tmpdir(), 'dashboard-client-bundle.txt');
  const clientParts = [];
  walk(path.join(root, 'dashboard'), clientParts);
  const bundle = clientParts.filter(function (file) {
    return /\.(js|html|css|json)$/.test(file);
  }).map(function (file) { return fs.readFileSync(file, 'utf8'); }).join('\n');
  fs.writeFileSync(bundlePath, bundle);
  const secrets = ["'QUEST'", '"QUEST"', 'k=QUEST', 'PASSPHRASE', '|| \'QUEST\''];
  secrets.forEach(function (secret) {
    let result = '';
    try {
      result = execFileSync('grep', ['-F', '-n', '--', secret, bundlePath], { encoding: 'utf8' });
    } catch (err) {
      if (err.status !== 1) throw err;
    }
    assert.equal(result.trim(), '', secret);
  });
  const needles = [];
  stringsOf(snapshot, needles);
  assert.equal(needles.length > 10, true);
  const scanned = [];
  walk(path.join(root, 'dashboard'), scanned);
  walk(path.join(root, 'api'), scanned);
  const leaked = [];
  scanned.forEach(function (file) {
    if (file.indexOf(path.join('api', '_lib', 'snapshot.js')) !== -1) return;
    if (!/\.(js|html|css|json)$/.test(file)) return;
    const text = fs.readFileSync(file, 'utf8');
    needles.forEach(function (needle) {
      if (text.indexOf(needle) !== -1) leaked.push(path.relative(root, file) + ' :: ' + needle);
    });
  });
  assert.deepEqual(leaked, []);
  const bundleHits = [];
  needles.forEach(function (needle) {
    let result = '';
    try {
      result = execFileSync('grep', ['-F', '-n', '--', needle, bundlePath], { encoding: 'utf8' });
    } catch (err) {
      if (err.status !== 1) throw err;
    }
    if (result.trim()) bundleHits.push(needle);
  });
  assert.deepEqual(bundleHits, []);
  const app = fs.readFileSync(path.join(root, 'dashboard', 'app.js'), 'utf8');
  const daily = fs.readFileSync(path.join(root, 'dashboard', 'daily.js'), 'utf8');
  assert.match(app, /state\.data\.places/);
  assert.match(daily, /board\.categories/);
  assert.match(daily, /board\.companies/);
});
