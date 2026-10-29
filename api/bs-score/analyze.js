/**
 * POST /api/bs-score/analyze
 * GET  /api/bs-score/analyze  — reports heuristic or grok. Does not score.
 *
 * XAI_API_KEY is optional. Unset uses the deterministic heuristic.
 * A failed Grok call returns 502 and does not fall back to the heuristic,
 * matching the original scoring server.
 */

var engine = require("../../lib/bs-score/engine.js");
var http = require("../../lib/bs-score/http.js");

function redact(detail) {
  var key = engine.xaiApiKey();
  var text = String(detail || "");
  if (!key) return text;
  return text.split(key).join("[redacted]");
}

module.exports = async function handler(req, res) {
  var cors = http.applyCors(req, res);
  if (req.method === "OPTIONS") {
    http.send(res, 204, null, cors);
    return;
  }
  if (req.method === "GET" || req.method === "HEAD") {
    var key = engine.xaiApiKey();
    http.send(
      res,
      200,
      {
        ok: true,
        service: "bs-score",
        mode: key ? "grok" : "heuristic",
        model: key ? engine.xaiModel() : null,
        endpoint: "POST /api/bs-score/analyze"
      },
      cors
    );
    return;
  }
  if (req.method !== "POST") {
    http.send(res, 405, { error: "method_not_allowed" }, cors);
    return;
  }

  var payload = await http.readPayload(req, http.MAX_ANALYZE_BYTES);
  if (payload.error === "too_big") {
    http.send(res, 413, { error: "Request body is too large." }, cors);
    return;
  }
  if (payload.error) {
    http.send(res, 400, { error: "Request body must be JSON." }, cors);
    return;
  }

  try {
    var result = await engine.analyze(payload.value);
    cors["X-BS-Score-Source"] = result.source;
    http.send(res, 200, result.body, cors);
  } catch (error) {
    if (error instanceof engine.ValidationError) {
      http.send(res, 400, { error: error.message }, cors);
      return;
    }
    var message = error instanceof Error ? error.message : "Unknown scoring error";
    if (!engine.xaiApiKey()) {
      http.send(res, 500, { error: "Scoring failed", detail: message.slice(0, 400) }, cors);
      return;
    }
    http.send(
      res,
      502,
      { error: "Grok scoring failed", detail: redact(message).slice(0, 400) },
      cors
    );
  }
};
