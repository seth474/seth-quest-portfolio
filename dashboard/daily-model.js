(function (factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.DailyModel = api;
})(function () {
  'use strict';
  function money(v) { return typeof v === 'number' && isFinite(v) && v >= 0 ? v : null; }
  function daysUntil(now, target) {
    var parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(now));
    var d = {}; parts.forEach(function (p) { d[p.type] = p.value; });
    var end = String(target || '2026-11-30').split('-').map(Number);
    return Math.ceil((Date.UTC(end[0], end[1] - 1, end[2]) - Date.UTC(+d.year, +d.month - 1, +d.day)) / 86400000);
  }
  function temperature(p) { return ({ High: 'Hot', Medium: 'Warm', Low: 'Cold', Visit: 'To visit' })[p] || p || 'Cold'; }
  function validPin(item) { return typeof item.lat === 'number' && typeof item.lng === 'number' && isFinite(item.lat) && isFinite(item.lng) && Math.abs(item.lat) <= 90 && Math.abs(item.lng) <= 180; }
  function eligible(item) {
    return item.visitEligible !== false && !/do not contact|do not door|not interested|wrong ICP|not walk.in|residential|mailing box|P\.?O\.?\s*Box/i.test([item.restriction, item.stage, item.addressType, item.address].join(' '));
  }
  function uniq(items) { var seen = {}; return items.filter(function (v) { var key = v && (v.companyId || v.id); if (!key || seen[key]) return false; seen[key] = 1; return true; }); }
  function enhance(board, raw) {
    var sourceLeads = raw.leads || [];
    board.leads.forEach(function (lead) {
      var original = sourceLeads[lead.order] || {};
      ['companyId', 'notes', 'source', 'lastContact', 'nextDate', 'restriction', 'website'].forEach(function (key) { lead[key] = original[key] || ''; });
      if (lead.priority === 'High') lead.nextStep = 'Set next meeting with ' + (lead.contact || 'the decision-maker') + ' — goal: close. ' + lead.nextStep;
      else if (/finish site|collect \$/i.test(lead.nextStep)) lead.nextStep = 'Call ' + (lead.contact || 'the client') + ' to set a completion meeting and finish the work. If no answer, text to arrange it. Payment due on completion.';
      else if (/owner meeting/i.test(lead.nextStep)) lead.nextStep = 'Call ' + (lead.contact || 'your contact') + ' to arrange the owner meeting.';
      lead.action = lead.nextStep;
    });
    var additional = (raw.companies || []).map(function (company) { return Object.assign({ kind: 'lead', priority: 'Low', order: 10000, nextStep: company.action || '', contact: '', trade: 'Uncategorized' }, company); });
    board.companies = uniq(board.leads.concat(board.stops, additional));
    board.directoryComplete = raw.directoryComplete === true;
    board.sourceLabel = raw.sourceLabel || 'Curated snapshot · not a live CRM sync';
    board.visits = (raw.visits || []).filter(function (v) { return v.companyId && v.source; });
    board.meetings = (raw.meetingHistory || []).filter(function (v) { return v.companyId && v.source && v.status === 'completed'; });
    board.conversations = new Set(board.visits.filter(function (v) { return v.substantive === true; }).map(function (v) { return v.companyId; })).size;
    board.preparations = board.leads.filter(function (v) { return v.priority === 'High'; }).map(function (v) { return { id: v.id, name: v.name, contact: v.contact, notes: v.nextStep, status: 'Presentation prepared · next meeting to arrange' }; });
    board.revenue = { target: 10000, agreed: null, collected: null, proposed: null, deals: raw.deals || [] };
    if (!board.revenue.deals.length) sourceLeads.forEach(function (lead) {
      var step = lead.nextStep || lead.next || ''; var match = /\$([\d,]+)/.exec(step); if (!match) return;
      var amount = +match[1].replace(/,/g, '');
      if (/collect/i.test(step)) board.revenue.deals.push({ name: lead.name, amount: amount, status: 'agreed', collected: null, note: 'Due on completion; payment unconfirmed.' });
      else if (/close|nudge/i.test(step)) board.revenue.deals.push({ name: lead.name, amount: amount, status: 'proposed', collected: null, note: 'Proposed amount from the snapshot; not a sale.' });
    });
    ['agreed', 'proposed'].forEach(function (status) { var deals = board.revenue.deals.filter(function (d) { return d.status === status; }); if (deals.length) board.revenue[status] = deals.reduce(function (sum, d) { return sum + (money(d.amount) || 0); }, 0); });
    if (board.revenue.deals.length && board.revenue.deals.every(function (d) { return money(d.collected) !== null; })) board.revenue.collected = board.revenue.deals.reduce(function (sum, d) { return sum + d.collected; }, 0);
    var categories = {};
    board.companies.forEach(function (c) { var key = c.trade || 'Uncategorized'; if (!categories[key]) categories[key] = { trade: key, available: 0, cold: 0 }; categories[key].available++; if (c.priority === 'Low' || c.priority === 'Visit') categories[key].cold++; });
    (board.hunt || []).forEach(function (gap) { if (!categories[gap.trade]) categories[gap.trade] = { trade: gap.trade, available: 0, cold: 0, reported: gap.cold }; });
    board.categories = Object.keys(categories).map(function (key) { return categories[key]; }).sort(function (a, b) { return a.trade.localeCompare(b.trade); });
    board.mapEligible = board.companies.filter(eligible);
    board.places = board.mapEligible.filter(validPin);
    board.mapMissing = board.mapEligible.filter(function (c) { return !validPin(c); });
    board.mapExcluded = board.companies.length - board.mapEligible.length;
    return board;
  }
  return { enhance: enhance, daysUntil: daysUntil, temperature: temperature, validPin: validPin, eligible: eligible };
});
