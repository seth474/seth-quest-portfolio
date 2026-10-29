/**
 * Read the owner's Google Sheet with a service account JWT.
 * Geocoded coordinates are written back into Lat / Lng columns when the
 * account can edit the sheet. A read-only share still loads the directory.
 */
var crypto = require('crypto');

function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function parseServiceAccount(raw) {
  var text = String(raw || '').trim();
  if (!text) return null;
  if (text.charAt(0) !== '{') {
    text = Buffer.from(text, 'base64').toString('utf8');
  }
  var sa = JSON.parse(text);
  if (!sa || !sa.client_email || !sa.private_key) {
    throw new Error('service account is missing client_email or private_key');
  }
  sa.private_key = String(sa.private_key).replace(/\\n/g, '\n');
  return sa;
}

function sheetError(message, code) {
  var err = new Error(message);
  err.code = code || 'unavailable';
  return err;
}

async function accessToken(sa, fetchImpl) {
  var now = Math.floor(Date.now() / 1000);
  var header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  var claim = b64url(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  }));
  var input = header + '.' + claim;
  var signer = crypto.createSign('RSA-SHA256');
  signer.update(input);
  signer.end();
  var jwt = input + '.' + b64url(signer.sign(sa.private_key));
  var res = await fetchImpl('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=' + encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer') +
      '&assertion=' + encodeURIComponent(jwt)
  });
  if (!res.ok) throw sheetError('google auth failed (' + res.status + ')', res.status === 403 ? 'denied' : 'unavailable');
  var body = await res.json();
  if (!body || !body.access_token) throw sheetError('google auth failed', 'unavailable');
  return body.access_token;
}

function tabRange(tab) {
  var name = String(tab || 'Companies').replace(/'/g, "''");
  return "'" + name + "'!A1:BZ2000";
}

async function readGrid(sheetId, tab, token, fetchImpl) {
  var url = 'https://sheets.googleapis.com/v4/spreadsheets/' + encodeURIComponent(sheetId) +
    '/values/' + encodeURIComponent(tabRange(tab)) + '?valueRenderOption=FORMATTED_VALUE';
  var res = await fetchImpl(url, { headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' } });
  if (!res.ok) throw sheetError('sheet read failed (' + res.status + ')', res.status === 403 || res.status === 404 ? 'denied' : 'unavailable');
  var body = await res.json();
  return (body && body.values) || [];
}

function colLetter(n) {
  var s = '';
  var num = n;
  while (num > 0) {
    var m = (num - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    num = Math.floor((num - 1) / 26);
  }
  return s;
}

function a1(tab, col, row) {
  var name = String(tab || 'Companies').replace(/'/g, "''");
  return "'" + name + "'!" + colLetter(col) + row;
}

async function writeCoordinates(meta, companies, fetchImpl) {
  if (!meta || !meta.token || !companies || !companies.length) return 0;
  var data = [];
  var latCol = meta.latCol;
  var lngCol = meta.lngCol;
  if (!latCol || !lngCol) {
    var width = meta.width || 0;
    latCol = latCol || (width + 1);
    lngCol = lngCol || (latCol === width + 1 ? width + 2 : width + 1);
    if (latCol === lngCol) lngCol = latCol + 1;
    data.push({ range: a1(meta.tab, latCol, meta.headerRow), values: [['Lat']] });
    data.push({ range: a1(meta.tab, lngCol, meta.headerRow), values: [['Lng']] });
  }
  companies.forEach(function (company) {
    if (!company || !company.sheetRow || company.latFromSheet) return;
    if (typeof company.lat !== 'number' || typeof company.lng !== 'number') return;
    data.push({ range: a1(meta.tab, latCol, company.sheetRow), values: [[company.lat]] });
    data.push({ range: a1(meta.tab, lngCol, company.sheetRow), values: [[company.lng]] });
  });
  if (!data.length) return 0;
  var res = await fetchImpl('https://sheets.googleapis.com/v4/spreadsheets/' + encodeURIComponent(meta.spreadsheetId) + '/values:batchUpdate', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + meta.token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ valueInputOption: 'RAW', data: data })
  });
  if (!res.ok) throw new Error('sheet write failed (' + res.status + ')');
  return data.length;
}

module.exports = {
  accessToken: accessToken,
  parseServiceAccount: parseServiceAccount,
  readGrid: readGrid,
  writeCoordinates: writeCoordinates
};
