/**
 * Turn a Companies-tab grid (or a stored JSON directory) into the board
 * source shape. Map and Categories read companies / places produced from this.
 */
var snapshot = require('./snapshot');

function normName(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[\u2019\u2018']/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slug(s) {
  return normName(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'company';
}

function clean(v) {
  return String(v == null ? '' : v).trim();
}

function canonPriority(value) {
  var s = clean(value).toLowerCase();
  if (s === 'high' || s === 'hot') return 'High';
  if (s === 'medium' || s === 'warm') return 'Medium';
  if (s === 'low' || s === 'cold') return 'Low';
  return 'Low';
}

function finiteOrNull(value) {
  if (value == null || value === '') return null;
  var n = Number(value);
  if (!isFinite(n) || Math.abs(n) > 180) return null;
  if (n === 0) return null;
  return n;
}

function usableAddress(value) {
  var t = clean(value);
  if (!t) return '';
  var low = t.toLowerCase();
  if (low === 'no address' || low === 'not checked yet' || low === 'n/a' || low === 'none' || low === '-' || low === 'na') return '';
  if (/^https?:/i.test(t)) return '';
  if (!/\d/.test(t)) return '';
  return t;
}

function addressScore(value) {
  var t = clean(value);
  if (!t) return 0;
  if (/^P\.?O\.?\s*Box/i.test(t)) return 1;
  if (/\d/.test(t)) return 3;
  return 2;
}

function betterAddress(a, b) {
  return addressScore(a) >= addressScore(b) ? (clean(a) || clean(b)) : clean(b);
}

function headerIndex(header, names) {
  var map = {};
  (header || []).forEach(function (cell, i) {
    var key = clean(cell).toLowerCase();
    if (key && map[key] == null) map[key] = i;
  });
  for (var i = 0; i < names.length; i += 1) {
    if (map[names[i]] != null) return map[names[i]];
  }
  return -1;
}

function cell(row, index) {
  if (index < 0 || !row) return '';
  return clean(row[index]);
}

function findHeaderRow(grid) {
  var limit = Math.min(grid.length, 20);
  for (var i = 0; i < limit; i += 1) {
    var row = grid[i] || [];
    var hasName = false;
    var hasId = false;
    for (var c = 0; c < row.length; c += 1) {
      var key = clean(row[c]).toLowerCase();
      if (key === 'company name') hasName = true;
      if (key === 'company id') hasId = true;
    }
    if (hasName && hasId) return i;
  }
  return -1;
}

function companiesFromGrid(grid) {
  grid = grid || [];
  var headerAt = findHeaderRow(grid);
  if (headerAt < 0) return { companies: [], columns: null };
  var header = grid[headerAt] || [];
  var idI = headerIndex(header, ['company id']);
  var nameI = headerIndex(header, ['company name']);
  var tradeI = headerIndex(header, ['primary trade', 'trade', 'category']);
  var townI = headerIndex(header, ['base town', 'town']);
  var phoneI = headerIndex(header, ['business phone', 'phone']);
  var emailI = headerIndex(header, ['business email', 'email']);
  var contactI = headerIndex(header, ['contact / role', 'contact', 'contact name']);
  var webI = headerIndex(header, ['website']);
  var stageI = headerIndex(header, ['outreach status', 'stage', 'status']);
  var priI = headerIndex(header, ['priority']);
  var nextDateI = headerIndex(header, ['next follow-up', 'next date']);
  var nextI = headerIndex(header, ['next action', 'next step', 'next']);
  var notesI = headerIndex(header, ['opportunity / reason to call', 'notes']);
  var addrI = headerIndex(header, ['business address', 'address']);
  var verifiedI = headerIndex(header, ['verified address']);
  var restrictionI = headerIndex(header, ['contact restriction', 'restriction']);
  var typeI = headerIndex(header, ['address type']);
  var latI = headerIndex(header, ['lat', 'latitude']);
  var lngI = headerIndex(header, ['lng', 'longitude', 'lon']);
  var companies = [];
  var seen = {};
  for (var r = headerAt + 1; r < grid.length; r += 1) {
    var row = grid[r] || [];
    var name = cell(row, nameI);
    if (!name) continue;
    var id = cell(row, idI) || slug(name);
    if (seen[id]) id = id + '-' + (r + 1);
    seen[id] = 1;
    var lat = finiteOrNull(cell(row, latI));
    var lng = finiteOrNull(cell(row, lngI));
    if (lat != null && Math.abs(lat) > 90) lat = null;
    companies.push({
      id: id,
      companyId: id,
      name: name,
      trade: cell(row, tradeI) || 'Uncategorized',
      town: cell(row, townI),
      phone: cell(row, phoneI),
      email: cell(row, emailI),
      contact: cell(row, contactI),
      website: cell(row, webI),
      stage: cell(row, stageI),
      priority: canonPriority(cell(row, priI)),
      nextDate: cell(row, nextDateI),
      nextStep: cell(row, nextI),
      notes: cell(row, notesI),
      address: usableAddress(cell(row, addrI)) || usableAddress(cell(row, verifiedI)),
      restriction: cell(row, restrictionI),
      addressType: cell(row, typeI),
      lat: lat,
      lng: lng,
      latFromSheet: lat != null && lng != null,
      sheetRow: r + 1
    });
  }
  return {
    companies: companies,
    columns: {
      headerRow: headerAt + 1,
      latCol: latI >= 0 ? latI + 1 : null,
      lngCol: lngI >= 0 ? lngI + 1 : null,
      width: header.length
    }
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value || {}));
}

function overlayItem(item, byName) {
  var copy = Object.assign({}, item);
  var match = byName[normName(copy.name)];
  if (!match) return copy;
  copy.companyId = match.id;
  var address = betterAddress(match.address, copy.address);
  match.address = address;
  copy.address = address;
  if (copy.lat == null && match.lat != null) copy.lat = match.lat;
  if (copy.lng == null && match.lng != null) copy.lng = match.lng;
  if (match.lat == null && copy.lat != null) match.lat = copy.lat;
  if (match.lng == null && copy.lng != null) match.lng = copy.lng;
  if (copy.priority) match.priority = canonPriority(copy.priority);
  match.nextStep = copy.nextStep || copy.next || match.nextStep || '';
  match.stage = copy.stage || match.stage || '';
  match.contact = copy.contact || match.contact || '';
  match.phone = copy.phone || match.phone || '';
  match.email = copy.email || match.email || '';
  match.town = copy.town || match.town || '';
  match.trade = copy.trade || match.trade || '';
  return copy;
}

function mergeDirectory(base, companies) {
  var data = clone(base);
  var list = (companies || []).map(function (company) { return Object.assign({}, company); });
  var byName = {};
  list.forEach(function (company) {
    var key = normName(company.name);
    if (key && !byName[key]) byName[key] = company;
    if (!company.id) company.id = slug(company.name);
    company.companyId = company.companyId || company.id;
    company.priority = canonPriority(company.priority);
    company.trade = company.trade || 'Uncategorized';
    company.lat = finiteOrNull(company.lat);
    company.lng = finiteOrNull(company.lng);
    if (company.lat != null && Math.abs(company.lat) > 90) company.lat = null;
  });
  data.leads = (data.leads || []).map(function (lead) { return overlayItem(lead, byName); });
  data.visitToday = (data.visitToday || []).map(function (visit) { return overlayItem(visit, byName); });
  var seen = {};
  data.leads.forEach(function (lead) { seen[normName(lead.name)] = 1; });
  list.forEach(function (company) {
    if ((company.priority === 'High' || company.priority === 'Medium') && !seen[normName(company.name)]) {
      data.leads.push({
        name: company.name,
        trade: company.trade,
        contact: company.contact || '',
        priority: company.priority,
        stage: company.stage || '',
        next: company.nextStep || '',
        nextStep: company.nextStep || '',
        phone: company.phone || '',
        email: company.email || '',
        address: company.address || '',
        town: company.town || '',
        lat: company.lat,
        lng: company.lng,
        companyId: company.id
      });
      seen[normName(company.name)] = 1;
    }
  });
  data.companies = list;
  data.directoryComplete = true;
  data.sourceLabel = 'Hamptons Business CRM · full directory';
  data.dataSource = data.dataSource || 'sheet';
  return data;
}

function looseCompany(row) {
  if (!row || typeof row !== 'object') return null;
  var name = clean(row.name || row.companyName || row['Company name']);
  if (!name) return null;
  var id = clean(row.id || row.companyId || row['Company ID']) || slug(name);
  return {
    id: id,
    companyId: id,
    name: name,
    trade: clean(row.trade || row['Primary trade']) || 'Uncategorized',
    town: clean(row.town || row['Base town']),
    phone: clean(row.phone || row['Business phone']),
    email: clean(row.email || row['Business email']),
    contact: clean(row.contact || row['Contact / role']),
    website: clean(row.website),
    stage: clean(row.stage || row['Outreach status']),
    priority: canonPriority(row.priority),
    nextStep: clean(row.nextStep || row.next || row['Next action']),
    notes: clean(row.notes),
    address: usableAddress(row.address || row['Business address'] || row['Verified Address']),
    restriction: clean(row.restriction),
    addressType: clean(row.addressType),
    lat: finiteOrNull(row.lat),
    lng: finiteOrNull(row.lng),
    latFromSheet: finiteOrNull(row.lat) != null && finiteOrNull(row.lng) != null
  };
}

function interpretStore(data, base) {
  if (!data || typeof data !== 'object') return null;
  if (Array.isArray(data)) {
    var rows = data.map(looseCompany).filter(Boolean);
    if (!rows.length) return null;
    var merged = mergeDirectory(base, rows);
    merged.dataSource = 'store';
    merged.sourceLabel = 'Private CRM store · full directory';
    return merged;
  }
  if (Array.isArray(data.companies) && data.companies.length) {
    var seed = clone(base);
    ['asOf', 'centerLabel', 'faceConversations', 'faceTarget', 'meetings', 'closes', 'leads', 'visitToday', 'gaps', 'deals', 'priorityRules'].forEach(function (key) {
      if (data[key] != null) seed[key] = data[key];
    });
    var full = mergeDirectory(seed, data.companies.map(looseCompany).filter(Boolean));
    full.dataSource = 'store';
    full.sourceLabel = 'Private CRM store · full directory';
    return full;
  }
  if (Array.isArray(data.leads)) {
    var copy = clone(data);
    copy.dataSource = 'store';
    if (!copy.sourceLabel) copy.sourceLabel = 'Private CRM store';
    return copy;
  }
  return null;
}

function fallbackSnapshot(reason) {
  var data = clone(snapshot);
  data.dataSource = 'snapshot';
  data.directoryComplete = false;
  data.sourceLabel = reason || 'Curated snapshot · not a live CRM sync. Full Map and Categories need GOOGLE_SERVICE_ACCOUNT_JSON and CRM_SHEET_ID in Vercel.';
  return data;
}

module.exports = {
  betterAddress: betterAddress,
  canonPriority: canonPriority,
  companiesFromGrid: companiesFromGrid,
  fallbackSnapshot: fallbackSnapshot,
  finiteOrNull: finiteOrNull,
  interpretStore: interpretStore,
  mergeDirectory: mergeDirectory,
  normName: normName,
  usableAddress: usableAddress
};
