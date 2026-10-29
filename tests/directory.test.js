const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const model = require('../dashboard/model.js');
const daily = require('../dashboard/daily-model.js');
const directory = require('../api/_lib/directory');
const geocode = require('../api/_lib/geocode');
const load = require('../api/_lib/load');

const HEADER = ['Company ID', 'Company name', 'Primary trade', 'Base town', 'Business phone', 'Business email', 'Contact / role', 'Website', 'Outreach status', 'Priority', 'Next follow-up', 'Next action', 'Opportunity / reason to call', 'Target location(s)', 'Business address', 'Verified Address', 'Contact restriction', 'Address Type', 'Lat', 'Lng'];

function row(values) {
  const line = HEADER.map(function () { return ''; });
  values.forEach(function (pair) {
    line[HEADER.indexOf(pair[0])] = pair[1];
  });
  return line;
}

describe('full directory', { concurrency: false }, () => {
  test('category counts match companies and every geocoded eligible record is a clustered pin', () => {
    const grid = [
      ['HAMPTONS'],
      [],
      [],
      HEADER,
      row([
        ['Company ID', 'HAM-1'],
        ['Company name', 'Alpha Painting'],
        ['Primary trade', 'Painting'],
        ['Base town', 'East Hampton'],
        ['Business address', '10 New Street, East Hampton, NY 11937'],
        ['Priority', 'Unassigned'],
        ['Lat', '40.97'],
        ['Lng', '-72.18']
      ]),
      row([
        ['Company ID', 'HAM-2'],
        ['Company name', 'Beta Electric'],
        ['Primary trade', 'Electrical'],
        ['Priority', 'Hot'],
        ['Business address', '20 Beach Road, Southampton, NY 11968'],
        ['Lat', '40.88'],
        ['Lng', '-72.39']
      ]),
      row([
        ['Company ID', 'HAM-3'],
        ['Company name', 'Gamma Pools'],
        ['Primary trade', 'Pools'],
        ['Priority', 'Cold']
      ]),
      row([
        ['Company ID', 'HAM-4'],
        ['Company name', 'Delta Mail'],
        ['Primary trade', 'Landscaping'],
        ['Business address', 'P.O. Box 9, Amagansett, NY 11930'],
        ['Lat', '40.9'],
        ['Lng', '-72.1']
      ]),
      row([['Company ID', 'HAM-5']])
    ];
    const parsed = directory.companiesFromGrid(grid);
    assert.equal(parsed.companies.length, 4);
    assert.equal(parsed.companies[0].priority, 'Low');
    assert.equal(parsed.companies[1].priority, 'High');
    assert.equal(parsed.companies[2].address, '');
    const source = directory.mergeDirectory(directory.fallbackSnapshot(), parsed.companies);
    const board = model.present(source);
    assert.equal(board.directoryComplete, true);
    assert.equal(board.dataSource, undefined);
    const extras = ['Alpha Painting', 'Beta Electric', 'Gamma Pools', 'Delta Mail'];
    extras.forEach(function (name) {
      assert.equal(board.companies.some(function (company) { return company.name === name; }), true);
    });
    const sum = board.categories.reduce(function (total, category) { return total + category.available; }, 0);
    assert.equal(sum, board.companies.length);
    board.categories.forEach(function (category) {
      const count = board.companies.filter(function (company) {
        return (company.trade || 'Uncategorized') === category.trade;
      }).length;
      assert.equal(category.available, count, category.trade);
    });
    const pinned = board.companies.filter(function (company) {
      return daily.eligible(company) && daily.validPin(company);
    });
    assert.equal(board.places.length, pinned.length);
    assert.equal(board.places.some(function (place) { return place.name === 'Alpha Painting'; }), true);
    assert.equal(board.places.some(function (place) { return place.name === 'Beta Electric'; }), true);
    assert.equal(board.places.some(function (place) { return place.name === 'Gamma Pools'; }), false);
    assert.equal(board.places.some(function (place) { return place.name === 'Delta Mail'; }), false);
    const seen = {};
    model.clusterPlaces(board.places, 1).forEach(function (group) {
      group.forEach(function (place) { seen[place.id] = 1; });
    });
    assert.equal(Object.keys(seen).length, board.places.length);
    assert.equal(board.companies.length > 15, true);
  });

  test('geocoder skips blank addresses, keeps existing pins, and fills the rest when a key is set', async () => {
    const calls = [];
    const records = [
      { name: 'Pinned', address: '1 Main St, East Hampton, NY', lat: 40.5, lng: -72.5 },
      { name: 'Needs', address: '2 Main St, East Hampton, NY' },
      { name: 'No address', address: '' },
      { name: 'Same', address: '2 Main St, East Hampton, NY' }
    ];
    const noKey = await geocode.fillCoordinates(records.map(function (item) { return Object.assign({}, item); }), {
      key: '',
      fetch: function () { throw new Error('should not fetch'); },
      cache: {}
    });
    assert.equal(noKey.fetched, 0);
    const fetched = await geocode.fillCoordinates(records, {
      key: 'geo-key',
      cache: {},
      fetch: function (url) {
        calls.push(url);
        return Promise.resolve({
          ok: true,
          json: function () {
            return Promise.resolve({ status: 'OK', results: [{ geometry: { location: { lat: 41.2, lng: -72.4 } } }] });
          }
        });
      }
    });
    assert.equal(calls.length, 1);
    assert.match(calls[0], /2%20Main%20St/);
    assert.equal(calls.some(function (url) { return url.indexOf('1%20Main') !== -1; }), false);
    assert.equal(records[0].lat, 40.5);
    assert.equal(records[1].lat, 41.2);
    assert.equal(records[2].lat, undefined);
    assert.equal(records[3].lng, -72.4);
    assert.equal(fetched.fetched, 1);
    assert.equal(fetched.pending, 0);
  });

  test('sheet load geocodes missing rows and serves every company through the board model', async () => {
    load.clearCache();
    const { privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
    const pem = privateKey.export({ type: 'pkcs8', format: 'pem' });
    const grid = [
      ['title'],
      [],
      [],
      HEADER,
      row([
        ['Company ID', 'HAM-9'],
        ['Company name', 'Zeta Roofing'],
        ['Primary trade', 'Roofing'],
        ['Priority', 'Unassigned'],
        ['Business address', '9 Rail Road, East Hampton, NY 11937']
      ]),
      row([
        ['Company ID', 'HAM-10'],
        ['Company name', 'No Address Co'],
        ['Primary trade', 'Roofing'],
        ['Priority', 'Unassigned']
      ])
    ];
    const geocodeUrls = [];
    const writes = [];
    const env = {
      GOOGLE_SERVICE_ACCOUNT_JSON: JSON.stringify({ client_email: 'crm@test.iam.gserviceaccount.com', private_key: pem }),
      CRM_SHEET_ID: 'sheet-id',
      GEOCODING_API_KEY: 'geo-key',
      DASHBOARD_PASSPHRASE: ''
    };
    const source = await load.loadDataset(env, {
      fetch: function (url, options) {
        const href = String(url);
        if (href.indexOf('oauth2.googleapis.com') !== -1) {
          return Promise.resolve({ ok: true, json: function () { return Promise.resolve({ access_token: 'tok' }); } });
        }
        if (href.indexOf('/values/') !== -1 && (!options || options.method !== 'POST')) {
          return Promise.resolve({ ok: true, json: function () { return Promise.resolve({ values: grid }); } });
        }
        if (href.indexOf('geocode') !== -1) {
          geocodeUrls.push(href);
          if (href.indexOf('No%20Address') !== -1) throw new Error('blank address was geocoded');
          return Promise.resolve({
            ok: true,
            json: function () { return Promise.resolve({ status: 'OK', results: [{ geometry: { location: { lat: 40.96, lng: -72.19 } } }] }); }
          });
        }
        if (href.indexOf('batchUpdate') !== -1) {
          writes.push(JSON.parse(options.body));
          return Promise.resolve({ ok: true, json: function () { return Promise.resolve({ totalUpdatedCells: 1 }); } });
        }
        throw new Error('unexpected url ' + href);
      }
    });
    assert.equal(source.dataSource, 'sheet');
    assert.equal(source.directoryComplete, true);
    assert.equal(geocodeUrls.length >= 1, true);
    assert.equal(geocodeUrls.some(function (url) { return url.indexOf('9%20Rail') !== -1; }), true);
    assert.equal(writes.length, 1);
    const board = model.present(source);
    assert.equal(board.companies.some(function (company) { return company.name === 'Zeta Roofing'; }), true);
    assert.equal(board.companies.some(function (company) { return company.name === 'No Address Co'; }), true);
    assert.equal(board.places.some(function (place) { return place.name === 'Zeta Roofing' && place.lat === 40.96; }), true);
    assert.equal(board.places.some(function (place) { return place.name === 'No Address Co'; }), false);
    const sum = board.categories.reduce(function (total, category) { return total + category.available; }, 0);
    assert.equal(sum, board.companies.length);
    const roofing = board.categories.find(function (category) { return category.trade === 'Roofing'; });
    assert.equal(roofing.available, board.companies.filter(function (company) { return company.trade === 'Roofing'; }).length);
    load.clearCache();
  });
});
