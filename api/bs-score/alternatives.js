/**
 * POST /api/bs-score/alternatives
 * Ranks up to three public YouTube videos when YOUTUBE_API_KEY is set.
 * Without that key the result is status "unavailable" and items stay empty.
 */

var engine = require("../../lib/bs-score/engine.js");
var http = require("../../lib/bs-score/http.js");

module.exports = async function handler(req, res) {
  var cors = http.applyCors(req, res);
  if (req.method === "OPTIONS") {
    http.send(res, 204, null, cors);
    return;
  }
  if (req.method === "GET" || req.method === "HEAD") {
    http.send(
      res,
      200,
      {
        ok: true,
        service: "bs-score",
        alternatives: engine.youtubeApiKey() ? "youtube" : "unavailable",
        endpoint: "POST /api/bs-score/alternatives"
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
    var body = payload.value && typeof payload.value === "object" ? payload.value : {};
    var videoInput = body.video && typeof body.video === "object" ? body.video : body;
    var video = engine.normalizeVideo(videoInput);
    var realTitle = typeof body.realTitle === "string" ? body.realTitle.trim() : "";
    if (!realTitle) realTitle = engine.scoreHeuristic(video).realTitle;
    var alternatives = await engine.findAlternatives({
      video: video,
      realTitle: realTitle,
      apiKey: engine.youtubeApiKey()
    });
    http.send(res, 200, alternatives, cors);
  } catch (error) {
    if (error instanceof engine.ValidationError) {
      http.send(res, 400, { error: error.message }, cors);
      return;
    }
    http.send(
      res,
      200,
      {
        status: "unavailable",
        label: "YouTube search failed before alternatives could be ranked.",
        items: []
      },
      cors
    );
  }
};
