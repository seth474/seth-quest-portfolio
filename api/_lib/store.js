/**
 * Optional private CRM / geocode cache.
 * Vercel Blob is used when BLOB_READ_WRITE_TOKEN is set, otherwise Vercel KV
 * (KV_REST_API_URL + KV_REST_API_TOKEN). Neither is required.
 */
function names(env) {
  env = env || process.env;
  var custom = String(env.CRM_STORE_KEY || '').trim();
  if (String(env.BLOB_READ_WRITE_TOKEN || '').trim()) {
    var crm = custom || 'dashboard/crm.json';
    var geo = custom ? custom.replace(/\.json$/i, '') + '.geocode.json' : 'dashboard/geocode.json';
    return { kind: 'blob', crm: crm, geo: geo };
  }
  if (String(env.KV_REST_API_URL || '').trim() && String(env.KV_REST_API_TOKEN || '').trim()) {
    var key = custom || 'dashboard:crm';
    return { kind: 'kv', crm: key, geo: key + ':geocode' };
  }
  return null;
}

async function blobGet(token, pathname, fetchImpl) {
  var listed = await fetchImpl('https://vercel.com/api/blob?prefix=' + encodeURIComponent(pathname), {
    headers: { Authorization: 'Bearer ' + token, 'x-api-version': '7' }
  });
  if (!listed.ok) throw new Error('blob list failed (' + listed.status + ')');
  var body = await listed.json();
  var blobs = (body && body.blobs) || [];
  var hit = null;
  for (var i = 0; i < blobs.length; i += 1) {
    if (blobs[i].pathname === pathname) hit = blobs[i];
  }
  if (!hit) return null;
  var file = await fetchImpl(hit.url, { headers: { Authorization: 'Bearer ' + token } });
  if (!file.ok) throw new Error('blob read failed (' + file.status + ')');
  return file.json();
}

async function blobPut(token, pathname, value, fetchImpl) {
  var res = await fetchImpl('https://vercel.com/api/blob?pathname=' + encodeURIComponent(pathname), {
    method: 'PUT',
    headers: {
      Authorization: 'Bearer ' + token,
      'x-api-version': '7',
      'x-content-type': 'application/json',
      'x-add-random-suffix': '0'
    },
    body: JSON.stringify(value)
  });
  if (!res.ok) throw new Error('blob write failed (' + res.status + ')');
}

async function kvCommand(env, command, fetchImpl) {
  var base = String(env.KV_REST_API_URL).replace(/\/$/, '');
  var res = await fetchImpl(base, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + env.KV_REST_API_TOKEN,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(command)
  });
  if (!res.ok) throw new Error('kv failed (' + res.status + ')');
  return res.json();
}

async function readJson(env, which, fetchImpl) {
  var spec = names(env);
  if (!spec) return null;
  fetchImpl = fetchImpl || global.fetch;
  if (spec.kind === 'blob') {
    return blobGet(String(env.BLOB_READ_WRITE_TOKEN).trim(), spec[which], fetchImpl);
  }
  var body = await kvCommand(env, ['GET', spec[which]], fetchImpl);
  if (!body || body.result == null || body.result === '') return null;
  return typeof body.result === 'string' ? JSON.parse(body.result) : body.result;
}

async function writeJson(env, which, value, fetchImpl) {
  var spec = names(env);
  if (!spec) return false;
  fetchImpl = fetchImpl || global.fetch;
  if (spec.kind === 'blob') {
    await blobPut(String(env.BLOB_READ_WRITE_TOKEN).trim(), spec[which], value, fetchImpl);
    return true;
  }
  await kvCommand(env, ['SET', spec[which], JSON.stringify(value)], fetchImpl);
  return true;
}

module.exports = {
  names: names,
  readJson: readJson,
  writeJson: writeJson
};
