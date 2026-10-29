const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const interest = require("../api/bs-score/interest.js");
const config = require("../api/bs-score/config.js");
const store = require("../lib/bs-score/interest-store.js");
const rate = require("../lib/bs-score/rate-limit.js");
const publicConfig = require("../lib/bs-score/public-config.js");

const STORAGE_KEYS = [
  "BLOB_READ_WRITE_TOKEN",
  "BLOB_STORE_ID",
  "VERCEL_OIDC_TOKEN",
  "KV_REST_API_URL",
  "KV_REST_API_TOKEN",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "BS_SCORE_GOOGLE_SHEET_ID",
  "BS_SCORE_GOOGLE_SERVICE_ACCOUNT_JSON",
  "BS_SCORE_GOOGLE_SHEET_RANGE",
  "BS_SCORE_CHROME_STORE_URL",
  "BS_SCORE_TIP_URL"
];

function snapshotEnv() {
  const saved = {};
  STORAGE_KEYS.forEach(function (key) {
    saved[key] = process.env[key];
    delete process.env[key];
  });
  return saved;
}

function restoreEnv(saved) {
  STORAGE_KEYS.forEach(function (key) {
    if (saved[key] == null) delete process.env[key];
    else process.env[key] = saved[key];
  });
}

function call(handler, req) {
  return new Promise(function (resolve, reject) {
    const result = { headers: {} };
    const res = {
      setHeader(key, value) { result.headers[key] = value; },
      status(code) { result.status = code; return this; },
      json(body) { result.body = body; resolve(result); },
      end() { resolve(result); }
    };
    Promise.resolve(handler(req, res)).catch(reject);
  });
}

test("missing storage fails in the log and tells the person the email was not saved", async () => {
  const saved = snapshotEnv();
  rate.reset();
  const logs = [];
  const original = console.error;
  console.error = function (line) { logs.push(String(line)); };
  try {
    const result = await call(interest, {
      method: "POST",
      headers: { "x-forwarded-for": "203.0.113.10" },
      body: { email: "ada@example.com", source: "landing", company_website: "" }
    });
    assert.equal(result.status, 503);
    assert.equal(result.body.persistent, false);
    assert.match(result.body.message, /not saved/i);
    assert.match(logs.join("\n"), /no storage configured|BLOB_READ_WRITE_TOKEN/);
    assert.equal(logs.join("\n").includes("ada@example.com"), false);
  } finally {
    console.error = original;
    restoreEnv(saved);
  }
});

test("invalid email, honeypot, and rate limit do not pretend the address was stored", async () => {
  const saved = snapshotEnv();
  process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_store123_secret";
  rate.reset();
  let writes = 0;
  const originalFetch = global.fetch;
  global.fetch = async function () {
    writes += 1;
    return { ok: true, text: async function () { return ""; }, json: async function () { return {}; } };
  };
  try {
    const bad = await call(interest, {
      method: "POST",
      headers: { "x-forwarded-for": "203.0.113.11" },
      body: { email: "not-an-email" }
    });
    assert.equal(bad.status, 400);
    assert.match(bad.body.message, /valid email/i);

    const logs = [];
    const original = console.error;
    console.error = function (line) { logs.push(String(line)); };
    const trap = await call(interest, {
      method: "POST",
      headers: { "x-forwarded-for": "203.0.113.11" },
      body: { email: "ada@example.com", company_website: "https://spam.example" }
    });
    console.error = original;
    assert.equal(trap.status, 400);
    assert.equal(trap.body.persistent, false);
    assert.match(logs.join("\n"), /honeypot/);
    assert.equal(writes, 0);

    for (let i = 0; i < 5; i += 1) {
      const ok = await call(interest, {
        method: "POST",
        headers: { "x-forwarded-for": "203.0.113.12" },
        body: { email: "person" + i + "@example.com", source: "landing" }
      });
      assert.equal(ok.status, 200, JSON.stringify(ok.body));
      assert.equal(ok.body.persistent, true);
      assert.equal(ok.body.stored, "blob");
    }
    const limited = await call(interest, {
      method: "POST",
      headers: { "x-forwarded-for": "203.0.113.12" },
      body: { email: "sixth@example.com", source: "landing" }
    });
    assert.equal(limited.status, 429);
    assert.match(limited.body.message, /not saved/i);
  } finally {
    global.fetch = originalFetch;
    restoreEnv(saved);
    rate.reset();
  }
});

test("blob writes a private object and does not put the token in the stored JSON", async () => {
  const seen = {};
  const result = await store.saveInterest(
    {
      createdAt: "2026-10-29T00:00:00.000Z",
      email: "ada@example.com",
      source: "landing",
      videoId: "",
      page: "/bs-score",
      overallScore: null
    },
    {
      env: { BLOB_READ_WRITE_TOKEN: "vercel_blob_rw_store123_secret" },
      log: { error() {} },
      fetchImpl: async function (url, init) {
        seen.url = String(url);
        seen.init = init;
        return { ok: true, text: async function () { return ""; } };
      }
    }
  );
  assert.equal(result.status, 200);
  assert.equal(result.body.stored, "blob");
  assert.match(seen.url, /pathname=bs-score%2Finterest%2F/);
  assert.equal(seen.init.headers["x-vercel-blob-access"], "private");
  assert.equal(seen.init.headers.authorization, "Bearer vercel_blob_rw_store123_secret");
  const stored = JSON.parse(seen.init.body);
  assert.equal(stored.email, "ada@example.com");
  assert.equal(JSON.stringify(stored).includes("store123"), false);
});

test("a half-configured sheet is a loud failure, and a full sheet appends a row", async () => {
  const logs = [];
  const partial = await store.saveInterest(
    { createdAt: "2026-10-29T00:00:00.000Z", email: "ada@example.com", source: "landing", videoId: "", page: "/bs-score", overallScore: null },
    {
      env: { BS_SCORE_GOOGLE_SHEET_ID: "sheet-id" },
      log: { error(line) { logs.push(String(line)); } },
      fetchImpl: async function () { throw new Error("should not call the network"); }
    }
  );
  assert.equal(partial.status, 503);
  assert.match(logs.join("\n"), /BS_SCORE_GOOGLE_SERVICE_ACCOUNT_JSON/);
  assert.match(partial.body.message, /not saved/i);

  const pair = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
  const pem = pair.privateKey.export({ type: "pkcs8", format: "pem" });
  store.resetSheetToken();
  const calls = [];
  const saved = await store.saveInterest(
    { createdAt: "2026-10-29T00:00:00.000Z", email: "ada@example.com", source: "extension", videoId: "abc", page: "youtube", overallScore: 2.9 },
    {
      env: {
        BS_SCORE_GOOGLE_SHEET_ID: "sheet-id",
        BS_SCORE_GOOGLE_SERVICE_ACCOUNT_JSON: JSON.stringify({
          client_email: "bs-score@example.iam.gserviceaccount.com",
          private_key: pem
        })
      },
      log: { error() {} },
      fetchImpl: async function (url, init) {
        calls.push({ url: String(url), init: init });
        if (String(url).includes("oauth2.googleapis.com")) {
          return { ok: true, status: 200, json: async function () { return { access_token: "ya29.test-token", expires_in: 3600 }; } };
        }
        return { ok: true, status: 200, json: async function () { return { updates: { updatedRows: 1 } }; } };
      }
    }
  );
  assert.equal(saved.body.stored, "sheet");
  assert.match(calls[1].url, /spreadsheets\/sheet-id\/values\//);
  assert.equal(calls[1].init.headers.authorization, "Bearer ya29.test-token");
  const row = JSON.parse(calls[1].init.body).values[0];
  assert.equal(row[1], "ada@example.com");
  assert.equal(row[2], "extension");
  assert.equal(JSON.stringify(calls[1].init.body).includes("BEGIN PRIVATE KEY"), false);
});

test("redis stores the signup and a failed write is not reported as saved", async () => {
  const seen = {};
  const ok = await store.saveInterest(
    { createdAt: "2026-10-29T00:00:00.000Z", email: "ada@example.com", source: "landing", videoId: "", page: "/bs-score", overallScore: null },
    {
      env: { KV_REST_API_URL: "https://example.upstash.io", KV_REST_API_TOKEN: "redis-token" },
      log: { error() {} },
      fetchImpl: async function (url, init) {
        seen.url = String(url);
        seen.init = init;
        return { ok: true, status: 200, json: async function () { return { result: "OK" }; } };
      }
    }
  );
  assert.equal(ok.body.stored, "kv");
  assert.equal(seen.init.headers.authorization, "Bearer redis-token");
  const command = JSON.parse(seen.init.body);
  assert.equal(command[0], "SET");
  assert.match(command[1], /^bs-score:interest:/);
  assert.equal(JSON.parse(command[2]).email, "ada@example.com");

  const logs = [];
  const failed = await store.saveInterest(
    { createdAt: "2026-10-29T00:00:00.000Z", email: "ada@example.com", source: "landing", videoId: "", page: "/bs-score", overallScore: null },
    {
      env: { UPSTASH_REDIS_REST_URL: "https://example.upstash.io", UPSTASH_REDIS_REST_TOKEN: "redis-token" },
      log: { error(line) { logs.push(String(line)); } },
      fetchImpl: async function () {
        return { ok: false, status: 401, text: async function () { return "Bearer redis-token denied"; }, json: async function () { return {}; } };
      }
    }
  );
  assert.equal(failed.status, 503);
  assert.equal(failed.body.persistent, false);
  assert.equal(logs.join("\n").includes("redis-token"), false);
});

test("public config only accepts https store and tip URLs", async () => {
  assert.deepEqual(publicConfig.publicConfig({
    BS_SCORE_CHROME_STORE_URL: "http://chrome.google.com/webstore/detail/x",
    BS_SCORE_TIP_URL: "javascript:alert(1)"
  }), { chromeStoreUrl: "", tipUrl: "" });
  assert.equal(
    publicConfig.publicConfig({ BS_SCORE_CHROME_STORE_URL: "https://chromewebstore.google.com/detail/bs/abc" }).chromeStoreUrl.includes("chromewebstore"),
    true
  );

  const saved = snapshotEnv();
  process.env.BS_SCORE_TIP_URL = "https://www.buymeacoffee.com/sethquest";
  try {
    const result = await call(config, { method: "GET", headers: { origin: "https://sethquest.com" } });
    assert.equal(result.status, 200);
    assert.equal(result.body.chromeStoreUrl, null);
    assert.match(result.body.tipUrl, /buymeacoffee/);
    assert.equal(result.headers["Access-Control-Allow-Origin"], "https://sethquest.com");
  } finally {
    restoreEnv(saved);
  }
});
