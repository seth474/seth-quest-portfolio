const test = require('node:test');
const assert = require('node:assert/strict');
const model = require('../dashboard/model.js');
const daily = require('../dashboard/daily-model.js');
test('countdown uses New York calendar dates through DST and clamps no dates', () => {
  assert.equal(daily.daysUntil('2026-10-29T02:00:00Z'), 33);
  assert.equal(daily.daysUntil('2026-10-29T04:00:00Z'), 32);
  assert.equal(daily.daysUntil('2026-11-01T05:59:00Z'), 29);
  assert.equal(daily.daysUntil('2026-11-01T06:01:00Z'), 29);
  assert.equal(daily.daysUntil('2026-11-30T05:00:00Z'), 0);
  assert.equal(daily.daysUntil('2026-12-01T05:00:00Z'), -1);
});
test('unknown payments stay unknown; proposals do not become collected money', () => {
  const board = model.present({leads:[{name:'Alpha',priority:'High',nextStep:'Close $2,400'},{name:'Beta',priority:'Medium',nextStep:'Finish site; collect $750'}]});
  assert.equal(board.revenue.proposed,2400); assert.equal(board.revenue.agreed,750); assert.equal(board.revenue.collected,null);
  assert.match(board.leads[1].nextStep,/Call.*If no answer, text/);
});
test('collection is calculated only from explicitly supplied payment values', () => {
  const board=model.present({deals:[{name:'Alpha',status:'agreed',amount:750,collected:750},{name:'Beta',status:'proposed',amount:2400,collected:0}]});
  assert.equal(board.revenue.collected,750);assert.equal(board.revenue.proposed,2400);assert.equal(board.revenue.target,10000);
  assert.equal(4*2400+750,10350);
});
test('repeat conversations deduplicate; skipped visits and prepared decks do not count', () => {
  const board=model.present({leads:[{name:'Alpha',priority:'High'}],visits:[
    {companyId:'a',source:'CRM row 1',substantive:true},
    {companyId:'a',source:'CRM row 1',substantive:true},
    {companyId:'b',source:'CRM row 2',substantive:false},
    {companyId:'c',substantive:true}],meetingHistory:[{companyId:'a',source:'CRM row 1',status:'prepared'},{companyId:'b',source:'CRM row 2',status:'completed'}]});
  assert.equal(board.conversations,1);assert.equal(board.visits.length,3);assert.equal(board.meetings.length,1);assert.equal(board.preparations.length,1);
});
test('full supplied directory drives categories and map, without invented coordinates', () => {
  const board=model.present({directoryComplete:true,companies:[
    {id:'a',name:'Alpha',trade:'Painting',lat:40.9,lng:-72.1},
    {id:'b',name:'Beta',trade:'Painting',lat:null,lng:null},
    {id:'c',name:'Gamma',trade:'Cleaning',lat:200,lng:-72},
    {id:'d',name:'Delta',trade:'Cleaning',lat:41,lng:-72,visitEligible:false}]});
  assert.equal(board.companies.length,4);assert.equal(board.places.length,1);assert.equal(board.mapMissing.length,2);assert.equal(board.mapExcluded,1);
  assert.equal(board.categories.find(c=>c.trade==='Painting').available,2);assert.equal(board.directoryComplete,true);
});
test('snapshot does not fabricate visit or meeting history from aggregate counters', () => {
  const board=model.present({faceConversations:13,meetings:2,leads:[{name:'Alpha',priority:'High'}]});
  assert.equal(board.visits.length,0);assert.equal(board.meetings.length,0);assert.equal(board.counts.face,13);assert.equal(board.counts.meetings,2);assert.equal(board.directoryComplete,false);
});

