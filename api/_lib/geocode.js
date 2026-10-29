/**
 * Fill missing lat/lng from Google Geocoding when GEOCODING_API_KEY is set.
 * Rows with no street address are skipped. Existing pins are left as-is.
 */
var BUDGET_MS = 8000;
var POOL = 6;
var PER_CALL_MS = 3500;

function addressKey(addr) {
  return String(addr || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function hasPin(item) {
  if (!item || item.lat == null || item.lng == null || item.lat === '' || item.lng === '') return false;
  var lat = Number(item.lat);
  var lng = Number(item.lng);
  if (!isFinite(lat) || !isFinite(lng)) return false;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return false;
  if (lat === 0 && lng === 0) return false;
  return true;
}

function stamp(item, hit, fresh) {
  item.lat = hit.lat;
  item.lng = hit.lng;
  if (fresh) item.geocodedNow = true;
}

async function fetchJson(fetchImpl, url, options, ms) {
  var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  var timer = null;
  var opts = options || {};
  if (ctrl) {
    timer = setTimeout(function () { ctrl.abort(); }, ms || PER_CALL_MS);
    opts = Object.assign({}, opts, { signal: ctrl.signal });
  }
  try {
    return await fetchImpl(url, opts);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function lookup(address, key, fetchImpl) {
  var url = 'https://maps.googleapis.com/maps/api/geocode/json?address=' +
    encodeURIComponent(address) + '&key=' + encodeURIComponent(key);
  var res = await fetchJson(fetchImpl, url, { headers: { Accept: 'application/json' } }, PER_CALL_MS);
  if (!res || !res.ok) return { stop: false, hit: null };
  var body = await res.json();
  if (body && (body.status === 'OVER_QUERY_LIMIT' || body.status === 'REQUEST_DENIED')) {
    return { stop: true, hit: null };
  }
  var loc = body && body.results && body.results[0] && body.results[0].geometry && body.results[0].geometry.location;
  if (!loc || !isFinite(Number(loc.lat)) || !isFinite(Number(loc.lng))) return { stop: false, hit: null };
  var lat = Number(loc.lat);
  var lng = Number(loc.lng);
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180 || (lat === 0 && lng === 0)) return { stop: false, hit: null };
  return { stop: false, hit: { lat: lat, lng: lng } };
}

async function fillCoordinates(records, options) {
  options = options || {};
  var cache = options.cache || {};
  var fetchImpl = options.fetch || global.fetch;
  var key = String(options.key || '').trim();
  var budgetMs = options.budgetMs == null ? BUDGET_MS : options.budgetMs;
  var started = Date.now();
  var groups = {};
  (records || []).forEach(function (item) {
    if (!item) return;
    var akey = addressKey(item.address);
    if (!akey) return;
    if (hasPin(item)) {
      item.lat = Number(item.lat);
      item.lng = Number(item.lng);
      if (!cache[akey]) cache[akey] = { lat: item.lat, lng: item.lng };
      return;
    }
    if (!groups[akey]) groups[akey] = { address: String(item.address).trim(), items: [] };
    groups[akey].items.push(item);
  });
  Object.keys(groups).forEach(function (akey) {
    if (!cache[akey]) return;
    groups[akey].items.forEach(function (item) { stamp(item, cache[akey], false); });
    delete groups[akey];
  });
  var pending = Object.keys(groups);
  var fetched = 0;
  var stopped = false;
  if (key && pending.length && fetchImpl) {
    var cursor = 0;
    async function worker() {
      while (!stopped && cursor < pending.length) {
        if (Date.now() - started > budgetMs) return;
        var index = cursor;
        cursor += 1;
        var akey = pending[index];
        var group = groups[akey];
        try {
          var result = await lookup(group.address, key, fetchImpl);
          if (result.stop) { stopped = true; return; }
          if (result.hit) {
            cache[akey] = result.hit;
            group.items.forEach(function (item) { stamp(item, result.hit, true); });
            fetched += 1;
          }
        } catch (err) {
          stopped = true;
          return;
        }
      }
    }
    var workers = [];
    var pool = Math.min(POOL, pending.length);
    for (var w = 0; w < pool; w += 1) workers.push(worker());
    await Promise.all(workers);
  }
  var still = 0;
  Object.keys(groups).forEach(function (akey) {
    var open = groups[akey].items.some(function (item) { return !hasPin(item); });
    if (open) still += 1;
  });
  return { cache: cache, fetched: fetched, pending: still };
}

module.exports = {
  addressKey: addressKey,
  fillCoordinates: fillCoordinates,
  hasPin: hasPin
};
