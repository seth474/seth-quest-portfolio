const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const zlib = require('node:zlib');
const auth = require('../api/_lib/auth');
const load = require('../api/_lib/load');
const handler = require('../api/crm.js');
const unlock = require('../api/unlock.js');

function restoreEnv() {
  process.env.DASHBOARD_PASSPHRASE = 'local-test-only';
  delete process.env.DASHBOARD_SESSION_SECRET;
  delete process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  delete process.env.CRM_SHEET_ID;
  delete process.env.CRM_SHEET_TAB;
  delete process.env.GEOCODING_API_KEY;
  delete process.env.DASHBOARD_DATA_JSON;
  delete process.env.DASHBOARD_CRM_SNAPSHOT_B64;
  delete process.env.BLOB_READ_WRITE_TOKEN;
  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;
  delete process.env.CRM_STORE_KEY;
  load.clearCache();
}

function call(query, method, headers) {
  restoreEnv();
  let result = { headers: {} };
  const req = {
    method: method || 'GET',
    query: query || {},
    url: '/api/crm',
    headers: Object.assign({ host: 'localhost' }, headers || {})
  };
  const res = {
    setHeader(k, v) { result.headers[k] = v; },
    status(n) { result.status = n; return this; },
    json(v) { result.body = v; }
  };
  return handler(req, res).then(function () { return result; });
}

function callUnlock(query, headers) {
  let result = { headers: {} };
  const params = new URLSearchParams();
  Object.keys(query || {}).forEach(function (key) { params.set(key, query[key]); });
  const req = {
    method: 'GET',
    query: query || {},
    url: '/api/unlock?' + params.toString(),
    headers: Object.assign({ host: 'sethquest.com', 'x-forwarded-proto': 'https' }, headers || {})
  };
  const res = {
    setHeader(k, v) { result.headers[k] = v; },
    redirect(code, location) { result.status = code; result.location = location; }
  };
  unlock(req, res);
  return result;
}

describe('crm api', { concurrency: false }, () => {
  test('unauthenticated API returns 401 and no CRM data', async () => {
    const result = await call({});
    assert.equal(result.status, 401);
    assert.deepEqual(result.body, { error: 'locked' });
    assert.equal(result.headers['Cache-Control'], 'private, no-store');
    assert.equal(JSON.stringify(result.body).includes('company'), false);
  });

  test('unauthenticated request does not load the sheet', async () => {
    restoreEnv();
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON = '{"client_email":"a@b.c","private_key":"x"}';
    process.env.CRM_SHEET_ID = 'sheet-id';
    const original = global.fetch;
    let called = 0;
    global.fetch = function () { called += 1; throw new Error('should not fetch'); };
    try {
      let result = { headers: {} };
      await handler({ method: 'GET', query: {}, url: '/api/crm', headers: { host: 'localhost' } }, {
        setHeader(k, v) { result.headers[k] = v; },
        status(n) { result.status = n; return this; },
        json(v) { result.body = v; }
      });
      assert.equal(result.status, 401);
      assert.deepEqual(result.body, { error: 'locked' });
      assert.equal(called, 0);
    } finally {
      global.fetch = original;
      restoreEnv();
    }
  });

  test('wrong passphrase is rejected and does not set a session', async () => {
    const result = await call({ k: 'not-the-passphrase' });
    assert.equal(result.status, 401);
    assert.deepEqual(result.body, { error: 'locked' });
    assert.equal(result.headers['Set-Cookie'], undefined);
  });

  test('mutation methods are rejected', async () => {
    const result = await call({}, 'POST');
    assert.equal(result.status, 405);
  });

  test('cookie flow works and the cookie is signed, HttpOnly, and not the passphrase', async () => {
    restoreEnv();
    process.env.DASHBOARD_SESSION_SECRET = 'test-session-secret';
    let first = { headers: {} };
    await handler({
      method: 'GET',
      query: { k: 'local-test-only' },
      url: '/api/crm?k=local-test-only',
      headers: { host: 'sethquest.com', 'x-forwarded-proto': 'https' }
    }, {
      setHeader(k, v) { first.headers[k] = v; },
      status(n) { first.status = n; return this; },
      json(v) { first.body = v; }
    });
    assert.equal(first.status, 200);
    assert.equal(first.body.companies.length, 15);
    assert.equal(first.body.places.length, 14);
    assert.equal(first.body.dataSource, 'snapshot');
    assert.equal(first.body.gate, undefined);
    const setCookie = first.headers['Set-Cookie'];
    assert.match(setCookie, /HttpOnly/);
    assert.match(setCookie, /SameSite=Lax/);
    assert.match(setCookie, /Secure/);
    assert.equal(setCookie.includes('local-test-only'), false);
    assert.equal(setCookie.includes('QUEST'), false);
    const pair = setCookie.split(';')[0];
    let second = { headers: {} };
    await handler({
      method: 'GET',
      query: {},
      url: '/api/crm',
      headers: { host: 'sethquest.com', 'x-forwarded-proto': 'https', cookie: pair }
    }, {
      setHeader(k, v) { second.headers[k] = v; },
      status(n) { second.status = n; return this; },
      json(v) { second.body = v; }
    });
    assert.equal(second.status, 200);
    assert.equal(second.body.companies.length, 15);
    assert.equal(second.headers['Set-Cookie'], undefined);
    const forged = await call({}, 'GET', { cookie: 'sq_dash=aaaa.bbbb' });
    assert.equal(forged.status, 401);
    const expired = auth.signToken(auth.signingKey(), 0);
    const old = await call({}, 'GET', { cookie: 'sq_dash=' + encodeURIComponent(expired) });
    assert.equal(old.status, 401);
    restoreEnv();
  });

  test('bookmark redirect strips the passphrase and sets the cookie', () => {
    restoreEnv();
    process.env.DASHBOARD_SESSION_SECRET = 'test-session-secret';
    const ok = callUnlock({ k: 'local-test-only' });
    assert.equal(ok.status, 302);
    assert.equal(ok.location, '/dashboard');
    assert.match(ok.headers['Set-Cookie'], /HttpOnly/);
    assert.match(ok.headers['Set-Cookie'], /Secure/);
    assert.equal(ok.headers['Set-Cookie'].includes('local-test-only'), false);
    const bad = callUnlock({ k: 'nope' });
    assert.equal(bad.status, 302);
    assert.equal(bad.location, '/dashboard?denied=1');
    assert.equal(bad.headers['Set-Cookie'], undefined);
    restoreEnv();
  });

  test('unset passphrase does not lock the owner out', async () => {
    restoreEnv();
    delete process.env.DASHBOARD_PASSPHRASE;
    let result = { headers: {} };
    await handler({ method: 'GET', query: {}, url: '/api/crm', headers: { host: 'localhost' } }, {
      setHeader(k, v) { result.headers[k] = v; },
      status(n) { result.status = n; return this; },
      json(v) { result.body = v; }
    });
    assert.equal(result.status, 200);
    assert.equal(result.body.gate, 'open');
    assert.equal(result.body.companies.length, 15);
    assert.match(result.body.sourceLabel, /Lock not armed/);
    assert.match(result.body.sourceLabel, /DASHBOARD_PASSPHRASE/);
    assert.match(result.body.sourceLabel, /GOOGLE_SERVICE_ACCOUNT_JSON/);
    const openBookmark = callUnlock({ k: 'anything' });
    assert.equal(openBookmark.location, '/dashboard');
    restoreEnv();
  });

  test('a broken sheet config falls back instead of locking the board', async () => {
    restoreEnv();
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON = '{';
    process.env.CRM_SHEET_ID = 'sheet-id';
    let result = { headers: {} };
    await handler({
      method: 'GET',
      query: { k: 'local-test-only' },
      url: '/api/crm?k=local-test-only',
      headers: { host: 'localhost' }
    }, {
      setHeader(k, v) { result.headers[k] = v; },
      status(n) { result.status = n; return this; },
      json(v) { result.body = v; }
    });
    assert.equal(result.status, 200);
    assert.equal(result.body.dataSource, 'snapshot');
    assert.equal(result.body.companies.length, 15);
    assert.match(result.body.sourceLabel, /fallback snapshot|did not load|could not be read/i);
    restoreEnv();
  });

  test('authorized snapshot keeps the goal, existing pins, and category counts', async () => {
    const result = await call({ k: 'local-test-only' });
    assert.equal(result.status, 200);
    assert.equal(result.body.companies.length, 15);
    assert.equal(result.body.places.length, 14);
    assert.equal(result.body.revenue.collected, null);
    assert.equal(result.body.revenue.target, 10000);
    assert.equal(result.headers['Cache-Control'], 'private, no-store');
    const sum = result.body.categories.reduce(function (total, category) { return total + category.available; }, 0);
    assert.equal(sum, result.body.companies.length);
    result.body.categories.forEach(function (category) {
      const count = result.body.companies.filter(function (company) {
        return (company.trade || 'Uncategorized') === category.trade;
      }).length;
      assert.equal(category.available, count);
    });
  });

  test('invalid private dataset fails closed instead of silently using old records', async () => {
    restoreEnv();
    process.env.DASHBOARD_DATA_JSON = '{';
    let result = { headers: {} };
    await handler({
      method: 'GET',
      query: { k: 'local-test-only' },
      url: '/api/crm',
      headers: { host: 'localhost' }
    }, {
      setHeader(k, v) { result.headers[k] = v; },
      status(n) { result.status = n; return this; },
      json(v) { result.body = v; }
    });
    assert.equal(result.status, 500);
    assert.deepEqual(result.body, { error: 'unavailable' });
    restoreEnv();
  });

  test('private compressed dataset is read behind the existing gate', async () => {
    restoreEnv();
    process.env.DASHBOARD_CRM_SNAPSHOT_B64 = zlib.gzipSync(JSON.stringify({
      directoryComplete: true,
      companies: [{ id: 'sample', name: 'Sample company', trade: 'Sample trade' }]
    })).toString('base64');
    let locked = { headers: {} };
    await handler({ method: 'GET', query: {}, url: '/api/crm', headers: { host: 'localhost' } }, {
      setHeader(k, v) { locked.headers[k] = v; },
      status(n) { locked.status = n; return this; },
      json(v) { locked.body = v; }
    });
    assert.equal(locked.status, 401);
    assert.deepEqual(locked.body, { error: 'locked' });
    let result = { headers: {} };
    await handler({
      method: 'GET',
      query: { k: 'local-test-only' },
      url: '/api/crm',
      headers: { host: 'localhost' }
    }, {
      setHeader(k, v) { result.headers[k] = v; },
      status(n) { result.status = n; return this; },
      json(v) { result.body = v; }
    });
    assert.equal(result.status, 200);
    assert.equal(result.body.directoryComplete, true);
    assert.equal(result.body.companies[0].name, 'Sample company');
    restoreEnv();
  });
});
