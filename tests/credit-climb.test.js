const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const handler = require('../api/credit-climb.js');

const root = path.join(__dirname, '..');

function restoreEnv() {
  delete process.env.DASHBOARD_PASSPHRASE;
  delete process.env.DASHBOARD_SESSION_SECRET;
}

function call(query, headers, method) {
  const params = new URLSearchParams();
  Object.keys(query || {}).forEach(function (key) { params.set(key, query[key]); });
  let result = { headers: {}, body: '' };
  const req = {
    method: method || 'GET',
    query: query || {},
    url: '/credit-climb' + (params.toString() ? '?' + params.toString() : ''),
    headers: Object.assign({ host: 'sethquest.com', 'x-forwarded-proto': 'https' }, headers || {})
  };
  const res = {
    setHeader(k, v) { result.headers[k] = v; },
    redirect(code, location) { result.status = code; result.location = location; },
    writeHead(code, h) { result.status = code; Object.assign(result.headers, h || {}); },
    end(body) { result.body = body == null ? '' : body; }
  };
  handler(req, res);
  if (Buffer.isBuffer(result.body)) result.text = result.body.toString('utf8');
  else result.text = String(result.body || '');
  return result;
}

describe('credit climb gate', { concurrency: false }, () => {
  test('bookmark passphrase opens the app and strips the secret', () => {
    restoreEnv();
    const opened = call({ k: 'QUEST' });
    assert.equal(opened.status, 302);
    assert.equal(opened.location, '/credit-climb');
    assert.match(opened.headers['Set-Cookie'], /HttpOnly/);
    assert.match(opened.headers['Set-Cookie'], /Secure/);
    assert.equal(opened.headers['Set-Cookie'].includes('QUEST'), false);
    assert.equal(opened.text.includes('Jefferson'), false);
    const pair = opened.headers['Set-Cookie'].split(';')[0];
    const page = call({}, { cookie: pair });
    assert.equal(page.status, 200);
    assert.match(page.headers['Content-Type'], /text\/html/);
    assert.match(page.text, /Educational information only/);
    assert.match(page.text, /not legal, financial, or credit advice/);
    assert.match(page.text, /noindex, nofollow, noarchive/);
    assert.match(page.text, /\/credit-climb\/_next\//);
    assert.equal(page.text.includes('src="/_next/'), false);
    assert.match(page.text, /Jefferson/);
    restoreEnv();
  });

  test('a wrong passphrase does not reveal the report', () => {
    restoreEnv();
    const bad = call({ k: 'nope' });
    assert.equal(bad.status, 302);
    assert.equal(bad.location, '/credit-climb?denied=1');
    assert.equal(bad.headers['Set-Cookie'], undefined);
    const locked = call({ denied: '1' });
    assert.equal(locked.status, 200);
    assert.match(locked.text, /That passphrase did not open it/);
    assert.equal(locked.text.includes('Jefferson'), false);
    assert.equal(locked.text.includes('Portfolio Recovery'), false);
    assert.equal(locked.text.includes('QUEST'), false);
    const asset = call({ file: '_next/static/chunks/2se9qrz7rtbf0.js' });
    assert.equal(asset.status, 401);
    assert.equal(asset.text.includes('Jefferson'), false);
    restoreEnv();
  });

  test('the dashboard passphrase replaces the fallback when it is set', () => {
    restoreEnv();
    process.env.DASHBOARD_PASSPHRASE = 'local-test-only';
    const quest = call({ k: 'QUEST' });
    assert.equal(quest.location, '/credit-climb?denied=1');
    const ok = call({ k: 'local-test-only' });
    assert.equal(ok.status, 302);
    assert.equal(ok.location, '/credit-climb');
    assert.match(ok.headers['Set-Cookie'], /HttpOnly/);
    assert.equal(ok.headers['Set-Cookie'].includes('local-test-only'), false);
    restoreEnv();
  });

  test('asset paths stay under /credit-climb and traversal is refused', () => {
    restoreEnv();
    const opened = call({ k: 'QUEST' });
    const pair = opened.headers['Set-Cookie'].split(';')[0];
    const js = call({ file: '_next/static/chunks/turbopack-2c3mg3r-05n1w.js' }, { cookie: pair });
    assert.equal(js.status, 200);
    assert.match(js.headers['Content-Type'], /javascript/);
    assert.match(js.text, /\/credit-climb\/_next\//);
    const flight = call({ file: 'index.txt' }, { cookie: pair });
    assert.equal(flight.status, 200);
    assert.match(flight.text, /\/credit-climb\/_next\//);
    const escaped = call({ file: '../api/credit-climb.js' }, { cookie: pair });
    assert.equal(escaped.status, 404);
    const missing = call({ file: '_next/nope.js' }, { cookie: pair });
    assert.equal(missing.status, 404);
    restoreEnv();
  });

  test('static files keep the banner and are not the public route', () => {
    const html = fs.readFileSync(path.join(root, 'credit-climb', 'static', 'index.html'), 'utf8');
    assert.match(html, /Educational information only/);
    assert.match(html, /not legal, financial, or credit advice/);
    assert.match(html, /noindex, nofollow, noarchive/);
    assert.equal(html.includes('src="/_next/'), false);
    assert.equal(html.includes('href="/_next/'), false);
    assert.equal(fs.existsSync(path.join(root, 'credit-climb', 'index.html')), false);
    assert.equal(fs.existsSync(path.join(root, 'dashboard', 'index.html')), true);
    assert.equal(fs.existsSync(path.join(root, 'bs-score', 'index.html')), true);
    const vercel = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
    const headers = JSON.stringify(vercel.headers);
    assert.match(headers, /\/credit-climb/);
    assert.match(headers, /noindex, nofollow, noarchive/);
    const rewrites = vercel.rewrites.map(function (rule) { return rule.source + ' -> ' + rule.destination; });
    assert.equal(rewrites.includes('/credit-climb -> /api/credit-climb'), true);
    assert.equal(rewrites.includes('/dashboard -> /api/unlock') || vercel.rewrites.some(function (rule) {
      return rule.source === '/dashboard' && rule.destination === '/api/unlock';
    }), true);
    assert.equal(vercel.redirects.some(function (rule) {
      return rule.source === '/credit-climb/static/:path*' && rule.destination === '/credit-climb';
    }), true);
  });
});
