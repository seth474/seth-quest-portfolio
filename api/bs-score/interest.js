/**
 * POST /api/bs-score/interest
 * Early-list signup for the landing page and the extension.
 * Stores the address only when a storage backend is configured.
 */

var http = require("../../lib/bs-score/http.js");
var store = require("../../lib/bs-score/interest-store.js");
var rate = require("../../lib/bs-score/rate-limit.js");

var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
var WINDOW_MS = 10 * 60 * 1000;
var LIMIT = 5;

function cleanEmail(value) {
  var email = String(value || "").trim().toLowerCase();
  if (!email || email.length > 254 || !EMAIL.test(email)) return "";
  return email;
}

function cleanShort(value, max) {
  if (typeof value !== "string") return "";
  return value.replace(/[\r\n]+/g, " ").trim().slice(0, max);
}

module.exports = async function handler(req, res) {
  var cors = http.applyCors(req, res);
  if (req.method === "OPTIONS") {
    http.send(res, 204, null, cors);
    return;
  }
  if (req.method !== "POST") {
    http.send(res, 405, { error: "method_not_allowed" }, cors);
    return;
  }

  var payload = await http.readPayload(req, http.MAX_INTEREST_BYTES);
  if (payload.error === "too_big") {
    http.send(res, 413, { ok: false, error: "too_large", message: "That signup was too large and was not saved." }, cors);
    return;
  }
  if (payload.error || !payload.value || typeof payload.value !== "object" || Array.isArray(payload.value)) {
    http.send(res, 400, { ok: false, error: "invalid_json", message: "Enter a valid email." }, cors);
    return;
  }

  var body = payload.value;
  var honeypot = cleanShort(body.company_website || body.company || "", 200);
  if (honeypot) {
    console.error("bs-score interest: honeypot filled, signup not stored.");
    http.send(
      res,
      400,
      { ok: false, stored: null, persistent: false, message: "That signup didn't go through. Nothing was saved." },
      cors
    );
    return;
  }

  var email = cleanEmail(body.email);
  if (!email) {
    http.send(res, 400, { ok: false, error: "invalid_email", message: "Enter a valid email." }, cors);
    return;
  }

  var ip = http.clientIp(req);
  if (!rate.allow("ip:" + ip, LIMIT, WINDOW_MS) || !rate.allow("email:" + email, LIMIT, WINDOW_MS)) {
    console.error("bs-score interest: rate limit, signup not stored.");
    http.send(
      res,
      429,
      {
        ok: false,
        stored: null,
        persistent: false,
        message: "Too many tries from this network. Wait a few minutes and try again. This email was not saved."
      },
      cors
    );
    return;
  }

  var score = body.overallScore;
  var record = {
    createdAt: new Date().toISOString(),
    email: email,
    source: cleanShort(body.source, 40) || "extension",
    videoId: cleanShort(body.videoId, 80),
    page: cleanShort(body.page, 120) || "/bs-score",
    overallScore: typeof score === "number" && Number.isFinite(score) ? score : null
  };

  var saved = await store.saveInterest(record);
  http.send(res, saved.status, saved.body, cors);
};
