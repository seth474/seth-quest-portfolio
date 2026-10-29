/**
 * Dashboard gate. The passphrase is never hardcoded.
 * The lock is armed only when DASHBOARD_PASSPHRASE is set, so a deploy
 * with no env vars still opens the board for the owner.
 * Cookies are HMAC-signed. DASHBOARD_SESSION_SECRET is the signing key
 * when it is set; otherwise a key derived from the passphrase is used
 * so a missing secret does not lock the owner out.
 */
var crypto = require('crypto');

var COOKIE = 'sq_dash';
var MAX_AGE = 60 * 60 * 24 * 30;

function passphrase() {
  return String(process.env.DASHBOARD_PASSPHRASE || '').trim();
}

function sessionSecret() {
  return String(process.env.DASHBOARD_SESSION_SECRET || '').trim();
}

function armed() {
  return passphrase().length > 0;
}

function signingKey() {
  var secret = sessionSecret();
  if (secret) return secret;
  var pass = passphrase();
  if (!pass) return '';
  return crypto.createHash('sha256').update('sq-dash-v1|' + pass).digest('hex');
}

function same(a, b) {
  var ha = crypto.createHash('sha256').update(String(a), 'utf8').digest();
  var hb = crypto.createHash('sha256').update(String(b), 'utf8').digest();
  return crypto.timingSafeEqual(ha, hb);
}

function b64urlEncode(buf) {
  return Buffer.from(buf).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function b64urlDecode(str) {
  var s = String(str || '').replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return Buffer.from(s, 'base64');
}

function signToken(key, now) {
  var clock = now == null ? Date.now() : now;
  var exp = Math.floor(clock / 1000) + MAX_AGE;
  var payload = b64urlEncode(JSON.stringify({ exp: exp, v: 1 }));
  var mac = crypto.createHmac('sha256', key).update(payload).digest();
  return payload + '.' + b64urlEncode(mac);
}

function verifyToken(token, key, now) {
  if (!token || !key) return false;
  var parts = String(token).split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return false;
  var expected = crypto.createHmac('sha256', key).update(parts[0]).digest();
  var got = b64urlDecode(parts[1]);
  if (got.length !== expected.length) return false;
  if (!crypto.timingSafeEqual(got, expected)) return false;
  try {
    var body = JSON.parse(b64urlDecode(parts[0]).toString('utf8'));
    var clock = Math.floor((now == null ? Date.now() : now) / 1000);
    if (!body || body.v !== 1 || !body.exp || body.exp < clock) return false;
  } catch (err) {
    return false;
  }
  return true;
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

function isSecureRequest(req) {
  var proto = String((req.headers && (req.headers['x-forwarded-proto'] || req.headers['X-Forwarded-Proto'])) || '');
  proto = proto.split(',')[0].trim().toLowerCase();
  if (proto === 'https') return true;
  var host = String((req.headers && req.headers.host) || '');
  if (/^(localhost|127\.0\.0\.1)(:|$)/.test(host)) return false;
  if (proto === 'http') return false;
  return true;
}

function cookieHeader(req, token, maxAge) {
  return COOKIE + '=' + encodeURIComponent(token) +
    '; Path=/; HttpOnly; SameSite=Lax; Max-Age=' + maxAge +
    (isSecureRequest(req) ? '; Secure' : '');
}

function clearCookie(req) {
  return cookieHeader(req, '', 0);
}

function authorize(req) {
  if (!armed()) return { ok: true, gate: 'open', cookie: '' };
  var provided = qget(queryOf(req), 'k') || qget(queryOf(req), 'key');
  var cookie = readCookie(req.headers && req.headers.cookie, COOKIE);
  var key = signingKey();
  var passOk = provided.length > 0 && same(provided, passphrase());
  var cookieOk = verifyToken(cookie, key);
  if (!passOk && !cookieOk) return { ok: false, gate: 'armed', cookie: '' };
  return {
    ok: true,
    gate: 'armed',
    cookie: passOk ? cookieHeader(req, signToken(key), MAX_AGE) : ''
  };
}

function dashboardLocation(req, denied) {
  var host = (req.headers && req.headers.host) || 'localhost';
  var proto = isSecureRequest(req) ? 'https' : 'http';
  var u;
  try { u = new URL(req.url || '/', proto + '://' + host); }
  catch (err) { u = new URL('/', proto + '://' + host); }
  u.pathname = '/dashboard';
  u.searchParams.delete('k');
  u.searchParams.delete('key');
  if (denied) u.searchParams.set('denied', '1');
  else u.searchParams.delete('denied');
  return u.pathname + u.search;
}

module.exports = {
  COOKIE: COOKIE,
  MAX_AGE: MAX_AGE,
  armed: armed,
  authorize: authorize,
  clearCookie: clearCookie,
  cookieHeader: cookieHeader,
  dashboardLocation: dashboardLocation,
  isSecureRequest: isSecureRequest,
  passphrase: passphrase,
  queryOf: queryOf,
  qget: qget,
  readCookie: readCookie,
  same: same,
  signToken: signToken,
  signingKey: signingKey,
  verifyToken: verifyToken
};
