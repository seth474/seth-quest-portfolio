/**
 * Early-list storage.
 *
 * Uses the first backend whose environment is fully set:
 * 1. Vercel Blob (BLOB_READ_WRITE_TOKEN, or BLOB_STORE_ID + VERCEL_OIDC_TOKEN)
 * 2. Vercel KV / Upstash Redis (KV_REST_API_URL + KV_REST_API_TOKEN,
 *    or UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN)
 * 3. Google Sheet (BS_SCORE_GOOGLE_SHEET_ID + BS_SCORE_GOOGLE_SERVICE_ACCOUNT_JSON)
 *
 * A half-set backend is a configuration error. It does not fall through,
 * and the address is not stored.
 */

var crypto = require("crypto");

var BLOB_API = "https://vercel.com/api/blob";
var BLOB_API_VERSION = "13";

function trim(value) {
  var text = value == null ? "" : String(value).trim();
  return text || "";
}

function emailHash(email) {
  return crypto.createHash("sha256").update(String(email).toLowerCase(), "utf8").digest("hex");
}

function redact(text) {
  return String(text || "")
    .replace(/Bearer\s+[A-Za-z0-9._\-]+/gi, "Bearer [redacted]")
    .replace(/ya29\.[A-Za-z0-9._\-]+/g, "[redacted]")
    .slice(0, 300);
}

function blobAuth(env) {
  var token = trim(env.BLOB_READ_WRITE_TOKEN);
  if (token) {
    var parts = token.split("_");
    return { token: token, storeId: parts.length > 3 ? parts[3] : "" };
  }
  var storeId = trim(env.BLOB_STORE_ID);
  var oidc = trim(env.VERCEL_OIDC_TOKEN);
  if (storeId && oidc) return { token: oidc, storeId: storeId.replace(/^store_/, "") };
  return null;
}

function kvAuth(env) {
  var url = trim(env.KV_REST_API_URL) || trim(env.UPSTASH_REDIS_REST_URL);
  var token = trim(env.KV_REST_API_TOKEN) || trim(env.UPSTASH_REDIS_REST_TOKEN);
  if (url && token) return { url: url.replace(/\/$/, ""), token: token };
  return null;
}

function sheetAuth(env) {
  var id = trim(env.BS_SCORE_GOOGLE_SHEET_ID);
  var raw = trim(env.BS_SCORE_GOOGLE_SERVICE_ACCOUNT_JSON);
  if (!id || !raw) return null;
  var parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error("BS_SCORE_GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON.");
  }
  var email = trim(parsed.client_email);
  var key = typeof parsed.private_key === "string" ? parsed.private_key.replace(/\\n/g, "\n") : "";
  if (!email || !key) {
    throw new Error("BS_SCORE_GOOGLE_SERVICE_ACCOUNT_JSON needs client_email and private_key.");
  }
  return {
    id: id,
    email: email,
    key: key,
    range: trim(env.BS_SCORE_GOOGLE_SHEET_RANGE) || "Sheet1!A:E"
  };
}

function partialMessage(env) {
  var notes = [];
  if (!trim(env.BLOB_READ_WRITE_TOKEN) && trim(env.BLOB_STORE_ID) && !trim(env.VERCEL_OIDC_TOKEN)) {
    notes.push("BLOB_STORE_ID is set but VERCEL_OIDC_TOKEN is missing.");
  }
  var kvUrl = trim(env.KV_REST_API_URL) || trim(env.UPSTASH_REDIS_REST_URL);
  var kvToken = trim(env.KV_REST_API_TOKEN) || trim(env.UPSTASH_REDIS_REST_TOKEN);
  if ((kvUrl && !kvToken) || (!kvUrl && kvToken)) {
    notes.push(
      "Redis storage needs both the REST URL and token (KV_REST_API_URL + KV_REST_API_TOKEN, or UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN)."
    );
  }
  var sheetId = trim(env.BS_SCORE_GOOGLE_SHEET_ID);
  var sheetJson = trim(env.BS_SCORE_GOOGLE_SERVICE_ACCOUNT_JSON);
  if ((sheetId && !sheetJson) || (!sheetId && sheetJson)) {
    notes.push("Google Sheet storage needs both BS_SCORE_GOOGLE_SHEET_ID and BS_SCORE_GOOGLE_SERVICE_ACCOUNT_JSON.");
  }
  if (!notes.length) return "";
  return notes.join(" ") + " The signup was not saved.";
}

function selectBackend(env) {
  if (blobAuth(env)) return "blob";
  if (kvAuth(env)) return "kv";
  if (trim(env.BS_SCORE_GOOGLE_SHEET_ID) && trim(env.BS_SCORE_GOOGLE_SERVICE_ACCOUNT_JSON)) return "sheet";
  return "";
}

async function putBlob(record, env, fetchImpl) {
  var auth = blobAuth(env);
  var pathname = "bs-score/interest/" + emailHash(record.email) + ".json";
  var headers = {
    authorization: "Bearer " + auth.token,
    "x-api-version": BLOB_API_VERSION,
    "x-vercel-blob-access": "private",
    "x-content-type": "application/json",
    "x-add-random-suffix": "0",
    "x-allow-overwrite": "1",
    "x-cache-control-max-age": "60"
  };
  if (auth.storeId) headers["x-vercel-blob-store-id"] = auth.storeId;
  var response = await fetchImpl(BLOB_API + "/?pathname=" + encodeURIComponent(pathname), {
    method: "PUT",
    headers: headers,
    body: JSON.stringify(record)
  });
  if (!response.ok) {
    var detail = "";
    try {
      detail = await response.text();
    } catch (err) {
      detail = "";
    }
    throw new Error("Vercel Blob rejected the signup (" + response.status + "). " + redact(detail));
  }
  return "blob";
}

async function putKv(record, env, fetchImpl) {
  var auth = kvAuth(env);
  var key = "bs-score:interest:" + emailHash(record.email);
  var response = await fetchImpl(auth.url, {
    method: "POST",
    headers: {
      authorization: "Bearer " + auth.token,
      "content-type": "application/json"
    },
    body: JSON.stringify(["SET", key, JSON.stringify(record)])
  });
  if (!response.ok) {
    var detail = "";
    try {
      detail = await response.text();
    } catch (err) {
      detail = "";
    }
    throw new Error("Redis rejected the signup (" + response.status + "). " + redact(detail));
  }
  var payload = null;
  try {
    payload = await response.json();
  } catch (err) {
    payload = null;
  }
  if (payload && payload.error) {
    throw new Error("Redis rejected the signup. " + redact(payload.error));
  }
  return "kv";
}

var sheetToken = { value: "", exp: 0, email: "" };

async function googleAccessToken(auth, fetchImpl) {
  var now = Math.floor(Date.now() / 1000);
  if (sheetToken.value && sheetToken.email === auth.email && sheetToken.exp > now + 60) {
    return sheetToken.value;
  }
  var header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  var claim = Buffer.from(
    JSON.stringify({
      iss: auth.email,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600
    })
  ).toString("base64url");
  var unsigned = header + "." + claim;
  var signer = crypto.createSign("RSA-SHA256");
  signer.update(unsigned);
  var jwt = unsigned + "." + signer.sign(auth.key).toString("base64url");
  var response = await fetchImpl("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt
    }).toString()
  });
  var payload = null;
  try {
    payload = await response.json();
  } catch (err) {
    payload = null;
  }
  if (!response.ok || !payload || !payload.access_token) {
    throw new Error("Google token exchange failed (" + response.status + ").");
  }
  sheetToken = {
    value: payload.access_token,
    exp: now + Number(payload.expires_in || 3600),
    email: auth.email
  };
  return payload.access_token;
}

async function putSheet(record, env, fetchImpl) {
  var auth = sheetAuth(env);
  var token = await googleAccessToken(auth, fetchImpl);
  var range = auth.range;
  var url =
    "https://sheets.googleapis.com/v4/spreadsheets/" +
    encodeURIComponent(auth.id) +
    "/values/" +
    encodeURIComponent(range) +
    ":append?valueInputOption=RAW&insertDataOption=INSERT_ROWS";
  var response = await fetchImpl(url, {
    method: "POST",
    headers: {
      authorization: "Bearer " + token,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      values: [[record.createdAt, record.email, record.source, record.videoId, record.page]]
    })
  });
  if (!response.ok) {
    var detail = "";
    try {
      detail = await response.text();
    } catch (err) {
      detail = "";
    }
    throw new Error("Google Sheet rejected the signup (" + response.status + "). " + redact(detail));
  }
  return "sheet";
}

async function saveInterest(record, options) {
  var opts = options || {};
  var env = opts.env || process.env;
  var fetchImpl = opts.fetchImpl || fetch;
  var log = opts.log || console;
  var partial = "";
  try {
    partial = partialMessage(env);
  } catch (err) {
    partial = err.message;
  }
  var backend = "";
  try {
    backend = selectBackend(env);
  } catch (err) {
    partial = err.message;
  }
  if (!backend) {
    var message =
      partial ||
      "BS Score early list has no storage configured. Set BLOB_READ_WRITE_TOKEN (Vercel Blob), or KV_REST_API_URL and KV_REST_API_TOKEN (Vercel KV / Upstash), or BS_SCORE_GOOGLE_SHEET_ID and BS_SCORE_GOOGLE_SERVICE_ACCOUNT_JSON. The signup was not saved.";
    log.error("bs-score interest: " + message);
    return {
      ok: false,
      status: 503,
      body: {
        ok: false,
        stored: null,
        persistent: false,
        message: "The early list isn't ready yet, so this email was not saved."
      }
    };
  }
  try {
    var stored =
      backend === "blob"
        ? await putBlob(record, env, fetchImpl)
        : backend === "kv"
          ? await putKv(record, env, fetchImpl)
          : await putSheet(record, env, fetchImpl);
    return {
      ok: true,
      status: 200,
      body: {
        ok: true,
        stored: stored,
        persistent: true,
        message: "You're on the early list."
      }
    };
  } catch (err) {
    log.error("bs-score interest: storage write failed. " + redact(err && err.message));
    return {
      ok: false,
      status: 503,
      body: {
        ok: false,
        stored: backend,
        persistent: false,
        message: "We couldn't save that email. It was not stored. Try again in a minute."
      }
    };
  }
}

function resetSheetToken() {
  sheetToken = { value: "", exp: 0, email: "" };
}

module.exports = {
  emailHash: emailHash,
  selectBackend: selectBackend,
  partialMessage: partialMessage,
  saveInterest: saveInterest,
  resetSheetToken: resetSheetToken
};
