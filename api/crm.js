/**
 * Authenticated CRM for /dashboard.
 * Records are loaded in api/_lib/load.js (sheet, private store, or the
 * server-only snapshot). Nothing in this response is shipped as a static file.
 */
var auth = require('./_lib/auth');
var load = require('./_lib/load');
var present = require('../dashboard/model.js').present;

function send(res, status, body, extra) {
  var headers = {
    'Cache-Control': 'private, no-store',
    'X-Robots-Tag': 'noindex, nofollow, noarchive',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Content-Type': 'application/json; charset=utf-8'
  };
  if (extra) headers['Set-Cookie'] = extra;
  if (body && body.gate === 'open') headers['X-Dashboard-Gate'] = 'open';
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    Object.keys(headers).forEach(function (key) { res.setHeader(key, headers[key]); });
    res.status(status).json(body);
    return;
  }
  res.writeHead(status, headers);
  res.end(status === 204 ? undefined : JSON.stringify(body));
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      send(res, 405, { error: 'method_not_allowed' });
      return;
    }
    var query = auth.queryOf(req);
    if (auth.qget(query, 'logout') === '1') {
      send(res, 200, { ok: true }, auth.clearCookie(req));
      return;
    }
    var decision = auth.authorize(req);
    if (!decision.ok) {
      send(res, 401, { error: 'locked' });
      return;
    }
    var source = await load.loadDataset();
    var board = present(source);
    board.dataSource = source.dataSource || 'snapshot';
    if (source.sourceLabel) board.sourceLabel = source.sourceLabel;
    if (!auth.armed()) {
      board.gate = 'open';
      if (board.sourceLabel.indexOf('Lock not armed') === -1) {
        board.sourceLabel += ' Lock not armed — set DASHBOARD_PASSPHRASE and DASHBOARD_SESSION_SECRET in Vercel.';
      }
    }
    send(res, 200, board, decision.cookie || '');
  } catch (err) {
    console.error('crm', err && err.message);
    send(res, 500, { error: 'unavailable' });
  }
};
