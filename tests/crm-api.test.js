const test = require('node:test');
const assert = require('node:assert/strict');
process.env.DASHBOARD_PASSPHRASE = 'local-test-only';
const handler = require('../api/crm.js');
function call(query, method = 'GET') {
  let result = {headers:{}};
  handler({method,query,headers:{host:'localhost'}},{setHeader(k,v){result.headers[k]=v;},status(n){result.status=n;return this;},json(v){result.body=v;}});
  return result;
}
test('gate still blocks anonymous requests and mutation methods', () => {
  assert.equal(call({}).status,401); assert.equal(call({},'POST').status,405);
});
test('authorized snapshot has daily details and private no-store response', () => {
  const result=call({k:'local-test-only'});
  assert.equal(result.status,200); assert.equal(result.body.companies.length,15);
  assert.equal(result.body.revenue.collected,null); assert.equal(result.headers['Cache-Control'],'private, no-store');
});
test('invalid private dataset fails closed instead of silently using old records', () => {
  process.env.DASHBOARD_DATA_JSON = '{';
  assert.equal(call({k:'local-test-only'}).status,500);
  delete process.env.DASHBOARD_DATA_JSON;
});
test('private compressed dataset is read behind the existing gate', () => {
  const zlib = require('node:zlib');
  process.env.DASHBOARD_CRM_SNAPSHOT_B64 = zlib.gzipSync(JSON.stringify({directoryComplete:true,companies:[{id:'sample',name:'Sample company',trade:'Sample trade'}]})).toString('base64');
  assert.equal(call({}).status,401);
  const result=call({k:'local-test-only'});
  assert.equal(result.body.directoryComplete,true);assert.equal(result.body.companies[0].name,'Sample company');
  delete process.env.DASHBOARD_CRM_SNAPSHOT_B64;
});
