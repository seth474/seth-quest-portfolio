/**
 * GET /api/bs-score/config
 * Public landing-page switches. No secrets.
 */

var http = require("../../lib/bs-score/http.js");
var config = require("../../lib/bs-score/public-config.js");

module.exports = function handler(req, res) {
  var cors = http.applyCors(req, res);
  if (req.method === "OPTIONS") {
    http.send(res, 204, null, cors);
    return;
  }
  if (req.method !== "GET" && req.method !== "HEAD") {
    http.send(res, 405, { error: "method_not_allowed" }, cors);
    return;
  }
  var pub = config.publicConfig(process.env);
  http.send(
    res,
    200,
    {
      ok: true,
      chromeStoreUrl: pub.chromeStoreUrl || null,
      tipUrl: pub.tipUrl || null
    },
    cors
  );
};
