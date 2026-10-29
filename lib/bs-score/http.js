/**
 * Shared request helpers for /api/bs-score/*.
 * CORS allows the Chrome extension and YouTube. Other sites are not echoed.
 */

var MAX_ANALYZE_BYTES = 2 * 1024 * 1024;
var MAX_INTEREST_BYTES = 8 * 1024;

function header(req, name) {
  if (!req || !req.headers) return "";
  var value = req.headers[name] || req.headers[name.toLowerCase()];
  if (Array.isArray(value)) value = value[0];
  return value == null ? "" : String(value);
}

function originAllowed(origin) {
  if (!origin || typeof origin !== "string") return false;
  if (/^chrome-extension:\/\/[a-p]{32}$/.test(origin)) return true;
  var url;
  try {
    url = new URL(origin);
  } catch (err) {
    return false;
  }
  var host = url.hostname;
  if (url.protocol === "https:") {
    return (
      host === "youtube.com" ||
      host === "www.youtube.com" ||
      host === "m.youtube.com" ||
      host === "sethquest.com" ||
      host === "www.sethquest.com"
    );
  }
  if (url.protocol === "http:" && (host === "localhost" || host === "127.0.0.1")) return true;
  return false;
}

function applyCors(req, res) {
  var origin = header(req, "origin");
  var headers = {
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "no-store",
    Vary: "Origin"
  };
  if (originAllowed(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type";
    headers["Access-Control-Expose-Headers"] = "X-BS-Score-Source";
    headers["Access-Control-Max-Age"] = "86400";
  }
  return headers;
}

function send(res, status, body, extra) {
  var headers = extra || {};
  if (!headers["Content-Type"] && status !== 204) {
    headers["Content-Type"] = "application/json; charset=utf-8";
  }
  if (typeof res.status === "function" && typeof res.json === "function" && status !== 204) {
    Object.keys(headers).forEach(function (key) {
      res.setHeader(key, headers[key]);
    });
    res.status(status).json(body);
    return;
  }
  if (typeof res.status === "function" && status === 204) {
    Object.keys(headers).forEach(function (key) {
      res.setHeader(key, headers[key]);
    });
    res.status(204).end();
    return;
  }
  res.writeHead(status, headers);
  if (status === 204) res.end();
  else res.end(JSON.stringify(body));
}

function clientIp(req) {
  var forwarded = header(req, "x-forwarded-for").split(",")[0].trim();
  if (forwarded) return forwarded.slice(0, 80);
  var real = header(req, "x-real-ip").trim();
  if (real) return real.slice(0, 80);
  return "unknown";
}

function readRaw(req, limit) {
  if (req.body != null && typeof req.body !== "string" && !Buffer.isBuffer(req.body)) {
    return Promise.resolve({ parsed: req.body, raw: null, tooBig: false });
  }
  if (typeof req.body === "string" || Buffer.isBuffer(req.body)) {
    var text = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : req.body;
    if (text.length > limit) return Promise.resolve({ parsed: undefined, raw: "", tooBig: true });
    return Promise.resolve({ parsed: undefined, raw: text, tooBig: false });
  }
  var declared = Number(header(req, "content-length"));
  if (Number.isFinite(declared) && declared > limit) {
    return Promise.resolve({ parsed: undefined, raw: "", tooBig: true });
  }
  if (typeof req.on !== "function") {
    return Promise.resolve({ parsed: undefined, raw: "", tooBig: false });
  }
  return new Promise(function (resolve) {
    var chunks = [];
    var size = 0;
    var tooBig = false;
    req.on("data", function (chunk) {
      size += chunk.length;
      if (size > limit) {
        tooBig = true;
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", function () {
      resolve({
        parsed: undefined,
        raw: tooBig ? "" : Buffer.concat(chunks).toString("utf8"),
        tooBig: tooBig
      });
    });
    req.on("error", function () {
      resolve({ parsed: undefined, raw: null, tooBig: false, error: true });
    });
  });
}

function parsePayload(rawResult, contentType) {
  if (rawResult.tooBig) return { error: "too_big" };
  if (rawResult.error) return { error: "read_failed" };
  if (rawResult.parsed !== undefined) return { value: rawResult.parsed };
  var raw = rawResult.raw || "";
  if (!raw) return { value: {} };
  var type = String(contentType || "");
  if (type.indexOf("application/x-www-form-urlencoded") !== -1) {
    var params = new URLSearchParams(raw);
    var form = {};
    params.forEach(function (value, key) {
      if (form[key] == null) form[key] = value;
    });
    return { value: form };
  }
  try {
    return { value: JSON.parse(raw) };
  } catch (err) {
    return { error: "invalid_json" };
  }
}

function readPayload(req, limit) {
  return readRaw(req, limit).then(function (rawResult) {
    return parsePayload(rawResult, header(req, "content-type"));
  });
}

module.exports = {
  MAX_ANALYZE_BYTES: MAX_ANALYZE_BYTES,
  MAX_INTEREST_BYTES: MAX_INTEREST_BYTES,
  originAllowed: originAllowed,
  applyCors: applyCors,
  send: send,
  clientIp: clientIp,
  readPayload: readPayload,
  header: header
};
