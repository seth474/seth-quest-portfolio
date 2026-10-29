/**
 * Bookmark entry for /dashboard?k=PASSPHRASE.
 * Validates the passphrase, sets the signed cookie, then redirects to
 * /dashboard so the secret is not left in the address bar.
 */
var auth = require('./_lib/auth');

module.exports = function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    if (typeof res.status === 'function') {
      res.status(405).json({ error: 'method_not_allowed' });
      return;
    }
    res.writeHead(405, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'method_not_allowed' }));
    return;
  }
  var decision = auth.authorize(req);
  var denied = auth.armed() && !decision.ok;
  var location = auth.dashboardLocation(req, denied);
  var headers = {
    Location: location,
    'Cache-Control': 'private, no-store',
    'X-Robots-Tag': 'noindex, nofollow, noarchive',
    'Referrer-Policy': 'no-referrer'
  };
  if (decision.ok && decision.cookie) headers['Set-Cookie'] = decision.cookie;
  if (typeof res.redirect === 'function') {
    Object.keys(headers).forEach(function (key) {
      if (key !== 'Location') res.setHeader(key, headers[key]);
    });
    res.redirect(302, location);
    return;
  }
  res.writeHead(302, headers);
  res.end();
};
