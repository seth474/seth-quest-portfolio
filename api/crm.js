/**
 * Private gate for the MORE. pipeline at /dashboard.
 *
 * Edit dashboard/data.json, then redeploy, to refresh the board.
 * /dashboard/data.json redirects here so the seed file is not a public URL.
 *
 * Passphrase: set DASHBOARD_PASSPHRASE on the Vercel project, or change
 * the default below. Bookmark /dashboard?k=YOUR_PASSPHRASE — the page
 * drops the query after unlock and keeps an HttpOnly cookie.
 */
var crypto = require('crypto');
var present = require('../dashboard/model.js').present;
var raw = require('../dashboard/data.json');

var PASSPHRASE = String(process.env.DASHBOARD_PASSPHRASE || '').trim() || 'more-daily';
var COOKIE = 'sq_dash';

function same(a, b) {
  var ha = crypto.createHash('sha256').update(String(a), 'utf8').digest();
  var hb = crypto.createHash('sha256').update(String(b), 'utf8').digest();
  return crypto.timingSafeEqual(ha, hb);
}

function queryOf(req) {
  if (req.query && typeof req.query === 'object') return req.query;
  try {
    var host = (req.headers && req.headers.host) || 'localhost';
    var u = new URL(req.url || '/', 'http://' + host);
    var out = {};
    u.searchParams.forEach(function (value, key) {
      if (out[key] == null) out[key] = value;
    });
    return out;
  } catch (err) {
    return {};
  }
}

function qget(query, name) {
  var value = query[name];
  if (Array.isArray(value)) value = value[0];
  return value == null ? '' : String(value);
}

function readCookie(header, name) {
  var parts = String(header || '').split(';');
  for (var i = 0; i < parts.length; i += 1) {
    var part = parts[i];
    var eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) {
      try { return decodeURIComponent(part.slice(eq + 1).trim()); }
      catch (err) { return ''; }
    }
  }
  return '';
}

function cookieHeader(req, value, maxAge) {
  var host = String((req.headers && req.headers.host) || '');
  var proto = String((req.headers && req.headers['x-forwarded-proto']) || '');
  var local = proto === 'http' || /^(localhost|127\.0\.0\.1)(:|$)/.test(host);
  return COOKIE + '=' + encodeURIComponent(value) +
    '; Path=/; HttpOnly; SameSite=Lax; Max-Age=' + maxAge +
    (local ? '' : '; Secure');
}

function send(res, status, body, extra) {
  var headers = {
    'Cache-Control': 'private, no-store',
    'X-Robots-Tag': 'noindex, nofollow, noarchive',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Content-Type': 'application/json; charset=utf-8'
  };
  if (extra) headers['Set-Cookie'] = extra;
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    Object.keys(headers).forEach(function (key) { res.setHeader(key, headers[key]); });
    res.status(status).json(body);
    return;
  }
  res.writeHead(status, headers);
  res.end(status === 204 ? undefined : JSON.stringify(body));
}

module.exports = function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    send(res, 405, { error: 'method_not_allowed' });
    return;
  }

  var query = queryOf(req);
  if (qget(query, 'logout') === '1') {
    send(res, 200, { ok: true }, cookieHeader(req, '', 0));
    return;
  }

  var provided = qget(query, 'k') || qget(query, 'key');
  var cookie = readCookie(req.headers && req.headers.cookie, COOKIE);
  var passOk = provided.length > 0 && same(provided, PASSPHRASE);
  var cookieOk = cookie.length > 0 && same(cookie, PASSPHRASE);
  if (!passOk && !cookieOk) {
    send(res, 401, { error: 'locked' });
    return;
  }

  var board;
  try {
    board = present(raw);
  } catch (err) {
    send(res, 500, { error: 'unavailable' });
    return;
  }

  send(res, 200, board, passOk ? cookieHeader(req, PASSPHRASE, 60 * 60 * 24 * 30) : '');
};
