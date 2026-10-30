/**
 * Gate and file server for /credit-climb.
 * The static export lives in credit-climb/static so Vercel does not publish
 * it at the URL (a root index.html would win over rewrites). Requests are
 * rewritten here. The same DASHBOARD_PASSPHRASE as /dashboard is required.
 * When that env var is unset, the bookmark passphrase still locks this page.
 */
var fs = require('fs');
var path = require('path');
var auth = require('./_lib/auth');

var ROOT = path.resolve(__dirname, '..', 'credit-climb', 'static');
var FALLBACK = 'QUEST';

var TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.map': 'application/json; charset=utf-8'
};

function decide(req) {
  if (auth.armed()) return auth.authorize(req);
  return auth.authorizePass(req, FALLBACK);
}

function climbLocation(req, denied) {
  var host = (req.headers && req.headers.host) || 'localhost';
  var proto = auth.isSecureRequest(req) ? 'https' : 'http';
  var u;
  try { u = new URL(req.url || '/', proto + '://' + host); }
  catch (err) { u = new URL('/', proto + '://' + host); }
  u.pathname = '/credit-climb';
  u.searchParams.delete('k');
  u.searchParams.delete('key');
  u.searchParams.delete('file');
  if (denied) u.searchParams.set('denied', '1');
  else u.searchParams.delete('denied');
  return u.pathname + u.search;
}

function hasPassQuery(req) {
  var query = auth.queryOf(req);
  return auth.qget(query, 'k').length > 0 || auth.qget(query, 'key').length > 0;
}

function lockPage(denied) {
  var err = denied
    ? '<p class="err" role="alert">That passphrase did not open it.</p>'
    : '';
  return '<!doctype html>\n' +
    '<html lang="en"><head>\n' +
    '<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    '<meta name="robots" content="noindex, nofollow, noarchive">\n' +
    '<meta name="referrer" content="no-referrer">\n' +
    '<title>Credit Climb</title>\n' +
    '<style>\n' +
    ':root{color-scheme:dark}*{box-sizing:border-box}\n' +
    'body{margin:0;min-height:100vh;display:grid;place-items:center;background:#070708;color:#f4f2ec;font:500 15px/1.4 Inter,system-ui,sans-serif}\n' +
    'form{width:min(100% - 32px,380px);background:#101114;border:1px solid #1c1d21;border-radius:20px;padding:28px}\n' +
    'p{margin:0}h1{font-size:28px;margin:8px 0 18px}\n' +
    'label{display:block;font-size:13px;color:#9aa1aa;margin-bottom:8px}\n' +
    'input{width:100%;background:#070708;color:#f4f2ec;border:1px solid #2a2d33;border-radius:12px;padding:12px 14px;font:inherit}\n' +
    'button{margin-top:16px;width:100%;background:#f4f2ec;color:#111;border:0;border-radius:12px;padding:12px;font:600 15px inherit;cursor:pointer}\n' +
    '.err{color:#ffb4ab;margin-top:12px}\n' +
    '</style></head><body>\n' +
    '<form method="get" action="/credit-climb">\n' +
    '<p>Credit Climb</p><h1>Private</h1>\n' +
    '<label for="pass">Passphrase</label>\n' +
    '<input id="pass" name="k" type="password" autocomplete="current-password" autocapitalize="characters" spellcheck="false" required>\n' +
    err +
    '<button type="submit">Open</button>\n' +
    '</form></body></html>\n';
}

function baseHeaders(extra) {
  var headers = {
    'Cache-Control': 'private, no-store',
    'X-Robots-Tag': 'noindex, nofollow, noarchive',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer'
  };
  if (extra) Object.keys(extra).forEach(function (key) { headers[key] = extra[key]; });
  return headers;
}

function send(res, status, body, headers) {
  var h = baseHeaders(headers);
  if (typeof res.status === 'function' && typeof res.send === 'function') {
    Object.keys(h).forEach(function (key) { res.setHeader(key, h[key]); });
    res.status(status).send(body);
    return;
  }
  if (typeof res.writeHead === 'function') {
    res.writeHead(status, h);
    res.end(body);
    return;
  }
  res.statusCode = status;
  res.end(body);
}

function redirect(res, location, setCookie) {
  var extra = { Location: location };
  if (setCookie) extra['Set-Cookie'] = setCookie;
  if (typeof res.redirect === 'function') {
    var h = baseHeaders(extra);
    Object.keys(h).forEach(function (key) {
      if (key !== 'Location') res.setHeader(key, h[key]);
    });
    res.redirect(302, location);
    return;
  }
  send(res, 302, '', extra);
}

function resolveFile(rel) {
  var name = String(rel || 'index.html').replace(/^\/+/, '');
  if (!name || name.indexOf('\0') !== -1) return null;
  var abs = path.resolve(ROOT, name);
  if (abs !== ROOT && abs.indexOf(ROOT + path.sep) !== 0) return null;
  var realRoot;
  var real;
  try {
    realRoot = fs.realpathSync(ROOT);
    if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) return null;
    real = fs.realpathSync(abs);
  } catch (err) {
    return null;
  }
  if (real !== realRoot && real.indexOf(realRoot + path.sep) !== 0) return null;
  return real;
}

function sendFile(req, res, filePath, setCookie) {
  var ext = path.extname(filePath).toLowerCase();
  var type = TYPES[ext] || 'application/octet-stream';
  var extra = { 'Content-Type': type };
  if (setCookie) extra['Set-Cookie'] = setCookie;
  var body = req.method === 'HEAD' ? '' : fs.readFileSync(filePath);
  send(res, 200, body, extra);
}

module.exports = function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    send(res, 405, 'method_not_allowed', { 'Content-Type': 'text/plain; charset=utf-8' });
    return;
  }
  var decision = decide(req);
  if (hasPassQuery(req)) {
    redirect(res, climbLocation(req, !decision.ok), decision.ok ? decision.cookie : '');
    return;
  }
  var query = auth.queryOf(req);
  var rel = auth.qget(query, 'file');
  var isDocument = !rel || rel === 'index.html';
  if (!decision.ok) {
    if (isDocument) {
      var denied = auth.qget(query, 'denied') === '1';
      send(res, 200, lockPage(denied), { 'Content-Type': 'text/html; charset=utf-8' });
      return;
    }
    send(res, 401, 'locked', { 'Content-Type': 'text/plain; charset=utf-8' });
    return;
  }
  var filePath = resolveFile(rel);
  if (!filePath) {
    send(res, 404, 'not_found', { 'Content-Type': 'text/plain; charset=utf-8' });
    return;
  }
  sendFile(req, res, filePath, decision.cookie || '');
};

module.exports.FALLBACK = FALLBACK;
module.exports.ROOT = ROOT;
module.exports.climbLocation = climbLocation;
module.exports.decide = decide;
module.exports.lockPage = lockPage;
module.exports.resolveFile = resolveFile;
