const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('path');

const root = path.join(__dirname, '..', 'demos/petes-cycle');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const js = fs.readFileSync(path.join(root, 'site.js'), 'utf8');
const data = fs.readFileSync(path.join(root, 'data.js'), 'utf8');
const vercel = fs.readFileSync(path.join(__dirname, '..', 'vercel.json'), 'utf8');
const audit = fs.readFileSync(path.join(root, 'AUDIT.md'), 'utf8');

test('petes cycle concept is noindex, light, and uses real stores', () => {
  assert.match(html, /noindex/);
  assert.match(html, /light\.css/);
  assert.match(html, /Since 1938\./);
  assert.match(html, /intro-logo\.mp4/);
  assert.equal(html.includes('intro-skip'), false);
  assert.equal(js.includes('petes-intro'), false);
  assert.equal(js.includes('sessionStorage'), false);
  assert.match(js, /logo\.png/);
  assert.equal(js.includes('data-lang="en"'), false);
  assert.match(data, /7511 Belair Rd, Baltimore, MD 21236/);
  assert.match(data, /800 Ritchie Hwy, Severna Park, MD 21146/);
  assert.match(data, /4106638556/);
  assert.match(data, /4106475880/);
  assert.match(data, /sethquest\.com/);
  assert.match(vercel, /\/demos\/petes-cycle\/brands\/:brand/);
  assert.match(vercel, /\/demos\/petes-cycle/);
  assert.match(audit, /Kenect/);
  assert.match(audit, /AudioEye/);
  assert.equal(html.includes('wa.me'), false);
  assert.equal(js.includes('wa.me'), false);
  assert.match(js, /sms:\+1/);
  assert.match(js, /tel:\+1/);
  assert.match(js, /visualViewport/);
});

test('petes cycle sample lot is about 25 mixed listings', () => {
  const vm = require('node:vm');
  const context = { window: {} };
  vm.runInNewContext(data, context);
  const units = context.window.BROWARD.units;
  const count = (key, value) => units.filter((u) => u[key] === value).length;
  assert.equal(units.length, 25);
  assert.equal(count('condition', 'New'), 18);
  assert.equal(count('condition', 'Pre-owned'), 7);
  assert.ok(count('category', 'Motorcycle') >= 15);
  assert.ok(count('category', 'ATV') >= 1);
  assert.ok(count('category', 'Side-by-Side') >= 1);
  assert.ok(count('category', 'PWC') >= 1);
  assert.ok(count('store', 'Baltimore, MD') >= 8);
  assert.ok(count('store', 'Severna Park, MD') >= 8);
  units.forEach((unit) => {
    assert.ok(unit.blurb && unit.blurb.length > 40, unit.id + ' needs a description');
    assert.equal(unit.img.endsWith('.jpg'), true);
  });
  const used = units.filter((u) => u.condition === 'Pre-owned');
  used.forEach((unit) => assert.ok(unit.miles > 0, unit.id + ' needs mileage'));
  assert.match(data, /not a live feed/);
  const inventory = fs.readFileSync(path.join(root, 'inventory.html'), 'utf8');
  assert.match(inventory, /value="triumph"/);
  assert.match(inventory, />Standard</);
});

test('petes cycle photos are unique files', () => {
  const { execFileSync } = require('node:child_process');
  const out = execFileSync(process.execPath, [path.join(__dirname, '..', 'scripts/petes-photo-audit.js')], { encoding: 'utf8' });
  assert.match(out, /OK: every unit has its own photo/);
});
