const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('path');

const root = path.join(__dirname, '..', 'demos/broward-motorsports');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const js = fs.readFileSync(path.join(root, 'site.js'), 'utf8');
const data = fs.readFileSync(path.join(root, 'data.js'), 'utf8');
const vercel = fs.readFileSync(path.join(__dirname, '..', 'vercel.json'), 'utf8');

test('broward demo is a noindex concept with the approved headline', () => {
  assert.match(html, /noindex/);
  assert.match(html, /ATVs, motorcycles and side-by-sides in Hollywood, FL\./);
  assert.match(html, /386 new and 37 pre-owned on the lot\./);
  assert.equal(html.includes('Ride after dark'), false);
  assert.equal(data.includes('CFMoto'), false);
  assert.match(js, /model-wrap/);
  assert.match(js, /\/brands\//);
  assert.match(js, /Inventory/);
  assert.match(vercel, /\/demos\/broward-motorsports\/brands\/:brand/);
  assert.equal(fs.existsSync(path.join(root, 'img/credits.json')), true);
  assert.equal(data.includes('strikethrough'), false);
  assert.match(js, /sethquest\.com/);
});
