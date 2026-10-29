/**
 * Resolve the board dataset:
 * 1. Google Sheet when GOOGLE_SERVICE_ACCOUNT_JSON and CRM_SHEET_ID are set
 * 2. Else an explicit DASHBOARD_DATA_JSON / DASHBOARD_CRM_SNAPSHOT_B64 payload
 * 3. Else Vercel Blob or KV when those tokens are set
 * 4. Else the server-only 15-record snapshot
 * A broken sheet never blocks the board; the snapshot is served instead.
 */
var zlib = require('zlib');
var directory = require('./directory');
var geocode = require('./geocode');
var store = require('./store');
var sheets = require('./sheets');

var memory = { key: '', at: 0, source: null, geo: {} };
var TTL = 60 * 1000;

function clearCache() {
  memory.key = '';
  memory.at = 0;
  memory.source = null;
  memory.geo = {};
}

function envKey(env) {
  return [
    env.CRM_SHEET_ID || '',
    env.CRM_SHEET_TAB || '',
    env.GOOGLE_SERVICE_ACCOUNT_JSON ? String(env.GOOGLE_SERVICE_ACCOUNT_JSON).length : '',
    env.DASHBOARD_DATA_JSON || '',
    env.DASHBOARD_CRM_SNAPSHOT_B64 ? String(env.DASHBOARD_CRM_SNAPSHOT_B64).length : '',
    env.BLOB_READ_WRITE_TOKEN ? 'blob' : '',
    env.KV_REST_API_URL || '',
    env.CRM_STORE_KEY || '',
    env.GEOCODING_API_KEY ? 'geo' : ''
  ].join('|');
}

function cloneSnapshot() {
  return directory.fallbackSnapshot();
}

function parseExplicit(env) {
  if (env.DASHBOARD_DATA_JSON) return JSON.parse(env.DASHBOARD_DATA_JSON);
  if (env.DASHBOARD_CRM_SNAPSHOT_B64) {
    var json = zlib.gunzipSync(Buffer.from(env.DASHBOARD_CRM_SNAPSHOT_B64, 'base64'), { maxOutputLength: 2 * 1024 * 1024 }).toString('utf8');
    return JSON.parse(json);
  }
  return null;
}

function sheetConfigured(env) {
  return !!(String(env.GOOGLE_SERVICE_ACCOUNT_JSON || '').trim() && String(env.CRM_SHEET_ID || '').trim());
}

function labelForSheetFailure(err) {
  if (err && err.code === 'denied') {
    return 'Curated snapshot · the service account cannot read the sheet. Share the sheet with the service account email. Full Map and Categories stay on this fallback until then.';
  }
  if (err && /not valid JSON|missing client_email|service account/i.test(String(err.message || ''))) {
    return 'Curated snapshot · GOOGLE_SERVICE_ACCOUNT_JSON could not be read. The board is using the fallback snapshot.';
  }
  return 'Curated snapshot · live sheet did not load. The board is using the fallback snapshot.';
}

function stripInternal(source) {
  ['leads', 'visitToday', 'companies'].forEach(function (key) {
    (source[key] || []).forEach(function (item) {
      if (!item) return;
      delete item.sheetRow;
      delete item.latFromSheet;
      delete item.geocodedNow;
    });
  });
  delete source._sheet;
}

async function fromSheet(env, fetchImpl) {
  var sa = sheets.parseServiceAccount(env.GOOGLE_SERVICE_ACCOUNT_JSON);
  var token = await sheets.accessToken(sa, fetchImpl);
  var tab = String(env.CRM_SHEET_TAB || 'Companies').trim() || 'Companies';
  var grid = await sheets.readGrid(String(env.CRM_SHEET_ID).trim(), tab, token, fetchImpl);
  var parsed = directory.companiesFromGrid(grid);
  if (!parsed.companies.length) {
    var err = new Error('sheet has no companies');
    err.code = 'empty';
    throw err;
  }
  var source = directory.mergeDirectory(cloneSnapshot(), parsed.companies);
  source.dataSource = 'sheet';
  source._sheet = {
    spreadsheetId: String(env.CRM_SHEET_ID).trim(),
    tab: tab,
    token: token,
    headerRow: parsed.columns.headerRow,
    latCol: parsed.columns.latCol,
    lngCol: parsed.columns.lngCol,
    width: parsed.columns.width
  };
  return source;
}

async function applyGeo(source, env, fetchImpl) {
  var cache = memory.geo;
  try {
    var stored = await store.readJson(env, 'geo', fetchImpl);
    if (stored && typeof stored === 'object' && !Array.isArray(stored)) {
      Object.keys(stored).forEach(function (key) {
        if (!cache[key] && stored[key] && stored[key].lat != null) cache[key] = stored[key];
      });
    }
  } catch (err) {
    console.error('geocode cache read', err && err.message);
  }
  var records = [];
  ['leads', 'visitToday', 'companies'].forEach(function (key) {
    (source[key] || []).forEach(function (item) { if (item) records.push(item); });
  });
  var result = await geocode.fillCoordinates(records, {
    key: env.GEOCODING_API_KEY || '',
    fetch: fetchImpl,
    cache: cache
  });
  memory.geo = result.cache;
  if (result.fetched) {
    try { await store.writeJson(env, 'geo', result.cache, fetchImpl); }
    catch (err) { console.error('geocode cache write', err && err.message); }
  }
  if (source._sheet) {
    try { await sheets.writeCoordinates(source._sheet, source.companies || [], fetchImpl); }
    catch (err) { console.error('sheet coordinate write', err && err.message); }
  }
  if (source.dataSource === 'sheet') {
    if (!String(env.GEOCODING_API_KEY || '').trim()) {
      source.sourceLabel += ' Existing pins stay; set GEOCODING_API_KEY to geocode the rest.';
    } else if (result.pending) {
      source.sourceLabel += ' ' + result.pending + ' addresses still need coordinates.';
    }
  }
  return source;
}

async function loadDataset(env, deps) {
  env = env || process.env;
  var fetchImpl = (deps && deps.fetch) || global.fetch;
  var key = envKey(env);
  if (memory.source && memory.key === key && (Date.now() - memory.at) < TTL) {
    return JSON.parse(JSON.stringify(memory.source));
  }
  var source = null;
  var sheetFailed = null;
  if (sheetConfigured(env)) {
    try {
      source = await fromSheet(env, fetchImpl);
    } catch (err) {
      sheetFailed = err;
      console.error('crm sheet', err && err.message);
    }
  }
  if (!source) {
    var explicit = null;
    if (env.DASHBOARD_DATA_JSON || env.DASHBOARD_CRM_SNAPSHOT_B64) {
      try {
        explicit = parseExplicit(env);
      } catch (err) {
        if (!sheetFailed) throw err;
      }
    }
    if (explicit) {
      source = explicit;
      if (!source.dataSource) source.dataSource = 'env';
      if (!source.sourceLabel) source.sourceLabel = 'Private server snapshot';
    }
  }
  if (!source && store.names(env)) {
    try {
      var stored = await store.readJson(env, 'crm', fetchImpl);
      source = directory.interpretStore(stored, cloneSnapshot());
    } catch (err) {
      console.error('crm store', err && err.message);
    }
  }
  if (!source) source = cloneSnapshot();
  if (sheetFailed && source.dataSource === 'snapshot') source.sourceLabel = labelForSheetFailure(sheetFailed);
  source = await applyGeo(source, env, fetchImpl);
  stripInternal(source);
  memory.key = key;
  memory.at = Date.now();
  memory.source = JSON.parse(JSON.stringify(source));
  return source;
}

module.exports = {
  clearCache: clearCache,
  loadDataset: loadDataset
};
