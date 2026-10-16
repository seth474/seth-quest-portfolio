/* Plain-language magazine copy for the funnel score. */
var JOB = 1500;

var ONLINE = [
  ['gbp', 'Google search / Google Business Profile'],
  ['gads', 'Google Ads / LSA'],
  ['web', 'Website'],
  ['ig', 'Instagram (posting)'],
  ['fb', 'Facebook (posting)'],
  ['fads', 'Paid Facebook ads'],
  ['iads', 'Paid Instagram ads'],
  ['nd', 'Nextdoor'],
  ['angi', 'Angi / Thumbtack / Yelp']
];
var OFFLINE = [
  ['ref', 'Referrals / word of mouth'],
  ['repeat', 'Repeat customers'],
  ['yard', 'Yard signs'],
  ['wrap', 'Vehicle / truck wrap'],
  ['door', 'Door hangers'],
  ['mail', 'Physical mailers / postcards'],
  ['print', 'Local print ads'],
  ['events', 'Events / sponsorships']
];

function has(arr, id) { return (arr || []).indexOf(id) >= 0; }
function nameOf(list, id) {
  for (var i = 0; i < list.length; i++) if (list[i][0] === id) return list[i][1];
  return id || '';
}
function names(list, ids) {
  var out = [];
  (ids || []).forEach(function (id) { out.push(nameOf(list, id)); });
  return out;
}
function joinList(a) {
  if (!a.length) return '';
  if (a.length === 1) return a[0];
  if (a.length === 2) return a[0] + ' and ' + a[1];
  return a.slice(0, -1).join(', ') + ', and ' + a[a.length - 1];
}
function money(n) {
  return '$' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
function band(n) { return n < 50 ? 'red' : n < 75 ? 'amber' : 'green'; }
function bandWord(n) { return n < 50 ? 'red' : n < 75 ? 'amber' : 'green'; }
function hiLeads(id) {
  if (id === '0') return 10;
  if (id === '11') return 30;
  if (id === '31') return 75;
  if (id === '75') return 100;
  return 10;
}
function leadPhrase(id) {
  if (id === '0') return '0 to 10 leads a month';
  if (id === '11') return '11 to 30 leads a month';
  if (id === '31') return '31 to 75 leads a month';
  if (id === '75') return '75 or more leads a month';
  return 'a lead count you were not sure of';
}

function postedLine(network, code, selected) {
  if (!selected) return 'You did not mark ' + network + ' as a lead source.';
  if (code === 'week') return 'You posted on ' + network + ' this week.';
  if (code === 'month') return 'You last posted on ' + network + ' this month.';
  if (code === 'mo6') return 'You last posted on ' + network + ' more than six months ago.';
  if (code === 'yr') return 'You last posted on ' + network + ' over a year ago.';
  return 'You marked ' + network + ', and the last post was not set.';
}

function speedLine(v) {
  if (v === 'min15' || v === 'instant') return 'You answer new leads within 15 minutes.';
  if (v === 'hour') return 'You answer new leads within an hour.';
  if (v === 'day') return 'You get back to new leads the same day, not within the hour.';
  if (v === 'next') return 'New leads wait until the next day or later for a reply.';
  return 'You were not sure how fast new leads get an answer.';
}
function formLine(a) {
  if (!has(a.online, 'web')) return 'A website is not one of the online sources you marked.';
  if (a.webForm === 'works') return 'The contact form on your website works.';
  if (a.webForm === 'miss') return 'The contact form on your website is hit or miss.';
  if (a.webForm === 'none') return 'Your website has no contact form.';
  return 'You were not sure whether the website form works.';
}
function askLine(v) {
  if (v === 'yes') return 'You ask for a review after every job.';
  if (v === 'no') return 'You do not ask for a review after every job.';
  return 'You were not sure whether you ask for a review after every job.';
}
function quoteLine(v) {
  if (v === 'same') return 'Quotes go out the same day.';
  if (v === 'next') return 'Quotes go out the next day.';
  if (v === 'few') return 'Quotes take 2 to 3 days.';
  if (v === 'week') return 'Quotes go out a week or more after the conversation.';
  return 'You were not sure how fast quotes go out.';
}
function followLine(v) {
  if (v === 'auto') return 'Quiet quotes get an automatic follow-up.';
  if (v === 'manual' || v === 'yes') return 'You follow up yourself when a quote goes quiet.';
  if (v === 'some') return 'You sometimes follow up when a quote goes quiet.';
  if (v === 'no') return 'You do not follow up when a quote goes quiet.';
  return 'You were not sure how quote follow-up works.';
}
function scriptLine(v) {
  if (v === 'yes') return 'You use a sales script on the call.';
  if (v === 'no') return 'You do not use a sales script.';
  return 'A sales script was not set.';
}
function crmLine(v) {
  if (v === 'jobber') return 'Jobs and quotes live in Jobber.';
  if (v === 'hcp') return 'Jobs and quotes live in Housecall Pro.';
  if (v === 'st') return 'Jobs and quotes live in ServiceTitan.';
  if (v === 'sheet') return 'Jobs and quotes live in a spreadsheet.';
  if (v === 'other') return 'Jobs and quotes live in another tool.';
  if (v === 'none') return 'Quotes are not tracked in one place.';
  return 'A tracking tool was not set.';
}
function reviewCountLine(v) {
  var map = { '0': '0 to 10', '11': '11 to 50', '51': '51 to 100', '100': '100 or more' };
  if (v === 'ns' || !map[v]) return 'You were not sure how many Google reviews you have.';
  return 'You have ' + map[v] + ' Google reviews.';
}
function ltvLine(v) {
  if (v === 'yes') return 'You know what a customer is worth over time.';
  if (v === 'no') return 'You do not know what a customer is worth over time.';
  return 'Customer value is a number you have not pinned down.';
}
function cacLine(v) {
  if (v === 'yes') return 'You know what it costs to get a customer.';
  if (v === 'no') return 'You do not know what it costs to get a customer.';
  return 'The cost to get a customer is a number you have not pinned down.';
}
function bestLine(a) {
  if (!a.best || a.best === 'ns') return 'You are not sure which source brings the most work.';
  if (a.best === 'none') return 'Nothing steady is bringing the work yet.';
  var n = has(a.online, a.best) ? nameOf(ONLINE, a.best) : nameOf(OFFLINE, a.best);
  return 'The source that brings you the most work is ' + n + '.';
}

function floorScore(n) {
  n = Math.round(Number(n) || 0);
  if (n < 18) n = 18;
  if (n > 100) n = 100;
  return n;
}

var LEAK_NAME = 'Sales Funnel Leaks / Lost Opportunities';

function sections(score) {
  return [
    { key: 'leads', name: 'Lead Score', n: score.leads },
    { key: 'leaks', name: LEAK_NAME, n: score.leaks },
    { key: 'closing', name: 'Close Rate', n: score.closing }
  ];
}

function shortOnline(ids) {
  var labels = { gbp: 'Google', gads: 'Google Ads', web: 'the website', ig: 'Instagram', fb: 'Facebook', fads: 'Facebook ads', iads: 'Instagram ads', nd: 'Nextdoor', angi: 'Angi' };
  return (ids || []).map(function (id) { return labels[id]; }).filter(Boolean);
}

function leadSummary(a) {
  var on = shortOnline(a.online);
  var head = on.length
    ? joinList(on).replace(/^./, function (c) { return c.toUpperCase(); }) + (on.length === 1 ? ' is on' : ' are on')
    : 'No online source is marked';
  var bestMap = { ref: 'Referrals', repeat: 'Repeat customers', gbp: 'Google', gads: 'Google Ads', web: 'The website', ig: 'Instagram', fb: 'Facebook', yard: 'Yard signs', wrap: 'The truck wrap' };
  var best;
  if (a.best && a.best !== 'ns' && a.best !== 'none') {
    var label = bestMap[a.best] || nameOf(ONLINE.concat(OFFLINE), a.best);
    best = (a.best === 'ref' || a.best === 'repeat' ? label + ' bring' : label + ' brings') + ' the most work';
  } else if (a.best === 'none') {
    best = 'nothing steady is bringing the work';
  } else {
    best = 'the biggest source is not named';
  }
  var rev = { '0': 'Google reviews are still under 10', '11': 'Google reviews are between 11 and 50', '51': 'Google reviews are between 51 and 100', '100': 'Google reviews are over 100' }[a.reviews] || 'the Google review count is not set';
  return head + '. ' + best + ', and ' + rev + '.';
}

function leakSummary(a) {
  var speed = { min15: 'New leads get an answer within 15 minutes', instant: 'New leads get an answer within 15 minutes', hour: 'New leads get an answer within an hour', day: 'New leads get an answer the same day', next: 'New leads wait until the next day', ns: 'Answer speed is not set' }[a.speed] || 'Answer speed is not set';
  return speed + '.';
}

function closeSummary(a) {
  var q = { same: 'Quotes go out the same day', next: 'Quotes go out the next day', few: 'Quotes take 2 to 3 days', week: 'Quotes go out a week or more after the conversation', ns: 'Quote speed is not set' }[a.quotes] || 'Quote speed is not set';
  var bits = [];
  if (a.followup === 'no') bits.push('no follow-up');
  else if (a.followup === 'some') bits.push('follow-up only sometimes');
  else if (a.followup === 'auto') bits.push('automatic follow-up');
  else if (a.followup === 'manual' || a.followup === 'yes') bits.push('a manual follow-up');
  if (a.script === 'no') bits.push('no script');
  else if (a.script === 'yes') bits.push('a script on the call');
  if (!bits.length) return q + '.';
  if (bits.length === 1) return q + ', with ' + bits[0] + '.';
  return q + ', with ' + bits[0] + ' and ' + bits[1] + '.';
}

function combinedInsight(a, score) {
  var on = (a.online || []).length;
  var lead = on >= 3 && score.leads >= 75 ? 'the lead channels are in place' : on >= 3 && score.leads >= 50 ? 'the lead channels are partly built' : on === 0 ? 'no online lead source is marked' : 'the lead channels are thin';
  var leak = (a.speed === 'next' || a.speed === 'day') ? 'calls still slip before a visit' : (a.speed === 'min15' || a.speed === 'instant') ? 'new leads get a fast answer' : 'call handling is still uneven';
  var close = a.quotes === 'week' ? 'quotes wait a week to go out' : a.quotes === 'few' ? 'quotes take a few days to go out' : a.quotes === 'same' ? 'quotes go out the same day' : a.quotes === 'next' ? 'quotes go out the next day' : 'quote timing is not pinned down';
  return 'At ' + score.total + ' overall, ' + lead + ', ' + leak + ', and ' + close + '.';
}

function jobsFrom(rate, hi) {
  var r = Math.max(0, Math.min(0.6, rate));
  var jobs = Math.round(hi * r);
  if (r > 0 && jobs < 1) jobs = 1;
  return { jobs: jobs, dollars: jobs * JOB, rate: r, hi: hi };
}

function leadExposure(a) {
  var rate = 0.05;
  if (a.reviews === '0') rate += 0.2;
  else if (a.reviews === '11') rate += 0.08;
  if (!has(a.online, 'gbp')) rate += 0.12;
  if (!has(a.online, 'gads')) rate += 0.05;
  if ((a.online || []).length + (a.offline || []).length <= 2) rate += 0.15;
  if (a.igPost === 'yr' || a.igPost === 'mo6') rate += 0.08;
  if (a.fbPost === 'yr' || a.fbPost === 'mo6') rate += 0.08;
  return jobsFrom(rate, hiLeads(a.leads));
}
function leakExposure(a) {
  var rate = 0.05;
  if (a.speed === 'next') rate += 0.4;
  else if (a.speed === 'day') rate += 0.25;
  else if (a.speed === 'hour') rate += 0.12;
  else if (a.speed === 'ns') rate += 0.15;
  if (has(a.online, 'web') && (a.webForm === 'none' || a.webForm === 'miss')) rate += 0.12;
  return jobsFrom(rate, hiLeads(a.leads));
}
function closeExposure(a) {
  var rate = 0.05;
  if (a.quotes === 'week') rate += 0.4;
  else if (a.quotes === 'few') rate += 0.22;
  else if (a.quotes === 'next') rate += 0.12;
  else if (a.quotes === 'ns') rate += 0.12;
  if (a.followup === 'no') rate += 0.18;
  else if (a.followup === 'some') rate += 0.1;
  else if (a.followup === 'ns') rate += 0.08;
  if (a.script === 'no') rate += 0.05;
  if (!a.crm || a.crm === 'none') rate += 0.05;
  return jobsFrom(rate, hiLeads(a.leads));
}

function moneyNote(a) {
  if (a.ltv === 'yes') return 'You said you know what a customer is worth. Swap that number in for the $1,500 used here, which stands in for one finished job.';
  return 'These figures use $1,500 for one finished job so the math is visible. Drop in your real average ticket.';
}

function moneyBlock(key, a, ex) {
  var range = leadPhrase(a.leads);
  var line;
  if (key === 'leads') {
    line = 'If ' + ex.jobs + ' of the ' + range + ' never become a call, that is ' + money(ex.dollars) + ' at $1,500 a job.';
  } else if (key === 'leaks') {
    line = 'About ' + ex.jobs + ' of the ' + range + ' can go cold before a visit. That is ' + money(ex.dollars) + ' at $1,500 a job.';
  } else {
    line = 'About ' + ex.jobs + ' of the ' + range + ' can be lost after the quote. That is ' + money(ex.dollars) + ' at $1,500 a job.';
  }
  return {
    jobs: ex.jobs,
    dollars: money(ex.dollars),
    equation: ex.jobs + ' jobs  x  $1,500',
    line: line,
    note: moneyNote(a)
  };
}

function sameSec(sec, name) {
  var map = {
    'Lead Score': ['Lead Score', 'Leads'],
    'Sales Funnel Leaks / Lost Opportunities': ['Lost Opportunities', 'Leaks', 'Sales Funnel Leaks / Lost Opportunities'],
    'Close Rate': ['Close Rate', 'Closing']
  };
  return (map[name] || [name]).indexOf(sec) >= 0;
}

function fixesFor(insights, sec) {
  return (insights || [])
    .filter(function (x) { return sameSec(x.sec, sec) && x.lost > 0; })
    .slice()
    .sort(function (a, b) { return b.lost - a.lost; })
    .filter(function (x, i, arr) {
      return arr.findIndex(function (y) { return y.t === x.t; }) === i;
    })
    .slice(0, 3)
    .map(function (x) { return { t: x.t, d: x.d, lost: x.lost, sec: x.sec }; });
}

function topFixes(insights) {
  return (insights || [])
    .filter(function (x) { return x.lost > 0; })
    .slice()
    .sort(function (a, b) { return b.lost - a.lost; })
    .filter(function (x, i, arr) {
      return arr.findIndex(function (y) { return y.t === x.t; }) === i;
    })
    .slice(0, 3)
    .map(function (x, i) {
      return { n: '0' + (i + 1), t: x.t, d: x.d, lost: x.lost, sec: x.sec };
    });
}

function foundLeads(a) {
  var on = names(ONLINE, a.online);
  var off = names(OFFLINE, a.offline);
  var lines = [];
  lines.push(on.length ? 'Online, work comes from ' + joinList(on) + '.' : 'You did not mark an online lead source.');
  if (has(a.online, 'ig')) lines.push(postedLine('Instagram', a.igPost, true));
  if (has(a.online, 'fb')) lines.push(postedLine('Facebook', a.fbPost, true));
  if (has(a.online, 'web')) lines.push(formLine(a));
  lines.push(off.length ? 'Offline, work comes from ' + joinList(off) + '.' : 'You did not mark an offline lead source.');
  lines.push(bestLine(a));
  lines.push(reviewCountLine(a.reviews));
  return lines.slice(0, 5);
}
function foundLeaks(a) {
  return [speedLine(a.speed), formLine(a), askLine(a.reviewask)];
}
function foundClosing(a) {
  return [quoteLine(a.quotes), followLine(a.followup), scriptLine(a.script), crmLine(a.crm)];
}

function tile(k, v, d) { return { k: k, v: v, d: d }; }

var SHORT_ON = { gbp: 'Google', gads: 'Google Ads', web: 'Website', ig: 'Instagram', fb: 'Facebook', fads: 'FB ads', iads: 'IG ads', nd: 'Nextdoor', angi: 'Angi' };
var SHORT_OFF = { ref: 'Referrals', repeat: 'Repeat', yard: 'Yard signs', wrap: 'Truck wrap', door: 'Door hangers', mail: 'Mailers', print: 'Print ads', events: 'Events' };
function shorts(map, ids) {
  var out = (ids || []).map(function (id) { return map[id] || id; });
  return out.length ? out.join(', ') : 'None';
}

function leadsTiles(a) {
  var on = names(ONLINE, a.online);
  var off = names(OFFLINE, a.offline);
  var ig = has(a.online, 'ig') ? postedLine('Instagram', a.igPost, true).replace(/\.$/, '') : 'Not a source you marked';
  var fb = has(a.online, 'fb') ? postedLine('Facebook', a.fbPost, true).replace(/\.$/, '') : 'Not a source you marked';
  return [
    tile('Online', shorts(SHORT_ON, a.online), on.length ? joinList(on) : 'No online source was marked.'),
    tile('Offline', shorts(SHORT_OFF, a.offline), off.length ? joinList(off) : 'No offline source was marked.'),
    tile('Biggest source', (a.best && a.best !== 'ns' && a.best !== 'none') ? nameOf(ONLINE.concat(OFFLINE), a.best) : 'Not named', bestLine(a)),
    tile('Instagram', has(a.online, 'ig') ? (a.igPost === 'week' ? 'This week' : a.igPost === 'month' ? 'This month' : a.igPost === 'mo6' ? '6+ months' : a.igPost === 'yr' ? '1+ year' : 'Not set') : 'Not marked', ig + '.'),
    tile('Facebook', has(a.online, 'fb') ? (a.fbPost === 'week' ? 'This week' : a.fbPost === 'month' ? 'This month' : a.fbPost === 'mo6' ? '6+ months' : a.fbPost === 'yr' ? '1+ year' : 'Not set') : 'Not marked', fb + '.'),
    tile('Google reviews', ({ '0': '0 to 10', '11': '11 to 50', '51': '51 to 100', '100': '100+' }[a.reviews] || 'Not sure'), reviewCountLine(a.reviews) + ' ' + ltvLine(a.ltv))
  ];
}
function leakTiles(a) {
  return [
    tile('Answer speed', ({ min15: '15 min', instant: '15 min', hour: 'An hour', day: 'Same day', next: 'Next day', ns: 'Not sure' }[a.speed] || 'Not set'), speedLine(a.speed)),
    tile('Website form', !has(a.online, 'web') ? 'No website' : ({ works: 'Works', miss: 'Hit or miss', none: 'No form', ns: 'Not sure' }[a.webForm] || 'Not set'), formLine(a)),
    tile('Review ask', ({ yes: 'Every job', no: 'Not asked', ns: 'Not sure' }[a.reviewask] || 'Not set'), askLine(a.reviewask))
  ];
}
function closeTiles(a) {
  return [
    tile('Quote speed', ({ same: 'Same day', next: 'Next day', few: '2 to 3 days', week: 'A week+', ns: 'Not sure' }[a.quotes] || 'Not set'), quoteLine(a.quotes)),
    tile('Follow-up', ({ auto: 'Automatic', manual: 'You do it', yes: 'You do it', some: 'Sometimes', no: 'You do not', ns: 'Not sure' }[a.followup] || 'Not set'), followLine(a.followup)),
    tile('Sales script', a.script === 'yes' ? 'Yes' : a.script === 'no' ? 'No' : 'Not set', scriptLine(a.script)),
    tile('Tracking', ({ jobber: 'Jobber', hcp: 'Housecall Pro', st: 'ServiceTitan', sheet: 'Spreadsheet', other: 'Other', none: 'None' }[a.crm] || 'Not set'), crmLine(a.crm))
  ];
}

function plan(fixes, a) {
  var f = fixes.slice();
  while (f.length < 3) {
    f.push({ t: 'Keep the source that already brings work.', d: bestLine(a), lost: 0, sec: 'Leads' });
  }
  var day7t = a.reviewask === 'yes' ? 'Write the customer value on a card by the phone.' : 'Ask the last five customers for a Google review.';
  var day7d = a.reviewask === 'yes'
    ? ltvLine(a.ltv) + ' Put a dollar figure next to the lead count you marked.'
    : 'One text, one link to your Google page, sent the day the job is done.';
  return [
    { day: 'Day 1', t: f[0].t, d: f[0].d },
    { day: 'Day 3', t: f[1].t, d: f[1].d },
    { day: 'Day 5', t: f[2].t, d: f[2].d },
    { day: 'Day 7', t: day7t, d: day7d },
    { day: 'Day 10', t: 'Book a free 15-min call.', d: 'Bring this score. Call or text 934-899-0796. Read sethquest.com/time-is-money before you sit down.' }
  ];
}

function bandNote(n) {
  if (n < 50) return 'Under 50. Red.';
  if (n < 75) return '50 to 74. Amber.';
  return '75 and above. Green.';
}

function snapshotLines(a) {
  var out = [];
  function add(s) {
    if (!s || out.indexOf(s) >= 0) return;
    out.push(s);
  }
  if (a.quotes === 'week' || a.quotes === 'few' || a.quotes === 'next') add(quoteLine(a.quotes));
  if (a.speed === 'next' || a.speed === 'day' || a.speed === 'hour') add(speedLine(a.speed));
  if (a.followup === 'no' || a.followup === 'some') add(followLine(a.followup));
  if (a.reviews === '0' || a.reviews === '11') add(reviewCountLine(a.reviews));
  if (a.script === 'no') add(scriptLine(a.script));
  add(reviewCountLine(a.reviews));
  add(crmLine(a.crm));
  add(bestLine(a));
  add(speedLine(a.speed));
  return out.slice(0, 3);
}

function channelChart(a) {
  var rec = { week: 100, month: 68, mo6: 34, yr: 16 };
  function row(label, on, pct) {
    return { label: label, on: !!on, pct: on ? Math.max(18, pct) : 0 };
  }
  var on = a.online || [];
  var off = a.offline || [];
  return [
    row('Google profile', has(on, 'gbp'), 100),
    row('Google Ads', has(on, 'gads'), 100),
    row('Website', has(on, 'web'), 100),
    row('Instagram', has(on, 'ig'), rec[a.igPost] || 40),
    row('Facebook', has(on, 'fb'), rec[a.fbPost] || 40),
    row('Paid social', has(on, 'fads') || has(on, 'iads'), 100),
    row('Referrals', has(off, 'ref'), 100),
    row('Repeat work', has(off, 'repeat'), 100),
    row('Truck wrap', has(off, 'wrap'), 100),
    row('Yard signs', has(off, 'yard'), 100)
  ];
}

function funnelChart(a) {
  var speed = { min15: 92, instant: 92, hour: 74, day: 52, next: 34, ns: 58 }[a.speed] || 50;
  var form = !has(a.online, 'web') ? 70 : ({ works: 94, miss: 55, none: 30, ns: 50 }[a.webForm] || 50);
  var answered = Math.round(speed);
  var reachable = Math.max(18, Math.round(answered * form / 100));
  return [
    { label: 'Leads in', pct: 100 },
    { label: 'Answered fast', pct: answered },
    { label: 'Still reachable', pct: reachable }
  ];
}

function closeChart(a) {
  var q = { same: 100, next: 78, few: 48, week: 28, ns: 36 }[a.quotes] || 22;
  var f = { auto: 100, manual: 72, yes: 72, some: 48, no: 18, ns: 30 }[a.followup] || 18;
  var s = a.script === 'yes' ? 100 : 18;
  var c = { jobber: 100, hcp: 100, st: 100, sheet: 70, other: 55, none: 18 }[a.crm] || 18;
  return [
    { label: 'Quote speed', pct: q },
    { label: 'Follow-up', pct: f },
    { label: 'Close practice', pct: s },
    { label: 'Tracking', pct: c }
  ];
}

function timeCost(leads, leaks, closing) {
  var gaps = {
    leads: Math.max(0, 100 - leads),
    leaks: Math.max(0, 100 - leaks),
    closing: Math.max(0, 100 - closing)
  };
  var sum = gaps.leads + gaps.leaks + gaps.closing || 1;
  var hours = Math.max(2, Math.min(14, Math.round(sum / 18)));
  var keys = ['leads', 'leaks', 'closing'];
  var parts = keys.map(function (k) {
    var h = Math.round((gaps[k] / sum) * hours * 10) / 10;
    var year = Math.round(h * 50 * 125);
    return { key: k, hours: h, year: year, yearLabel: money(year) };
  });
  return {
    hours: hours,
    year: hours * 50 * 125,
    yearLabel: money(hours * 50 * 125),
    rate: 125,
    note: 'Estimate. About 10 hours a week, scaled to these scores, at $125 an hour.',
    parts: parts
  };
}

function buildModel(input) {
  var a = input.answers || {};
  var raw = input.score || { total: 0, leads: 0, leaks: 0, closing: 0, insights: [] };
  var score = {
    leads: floorScore(raw.leads),
    leaks: floorScore(raw.leaks),
    closing: floorScore(raw.closing),
    insights: raw.insights || []
  };
  score.total = Math.round((score.leads + score.leaks + score.closing) / 3);
  var rows = sections(score);
  var summaries = {
    leads: leadSummary(a),
    leaks: leakSummary(a),
    closing: closeSummary(a)
  };
  rows.forEach(function (row) { row.line = summaries[row.key]; });
  var insight = combinedInsight(a, score);
  var insights = score.insights || [];
  var fixes = topFixes(insights);
  var exposures = { leads: leadExposure(a), leaks: leakExposure(a), closing: closeExposure(a) };
  var time = timeCost(score.leads, score.leaks, score.closing);
  function partTime(key) {
    for (var i = 0; i < time.parts.length; i++) if (time.parts[i].key === key) return time.parts[i];
    return time.parts[0];
  }
  function pack(key, name, num, found, tiles, sub) {
    var mine = fixesFor(insights, name);
    var clock = partTime(key);
    var moneyPack = moneyBlock(key, a, exposures[key]);
    moneyPack.hours = clock.hours;
    moneyPack.hoursLabel = clock.hours + ' hrs / week';
    moneyPack.yearLabel = clock.yearLabel + ' / year';
    moneyPack.timeNote = time.note;
    return {
      key: key,
      name: name,
      sub: sub || '',
      line: summaries[key] || '',
      num: num,
      band: band(num),
      bandNote: bandNote(num),
      found: found,
      tiles: tiles,
      answers: tiles.map(function (t) { return { k: t.k, v: t.v }; }),
      money: moneyPack,
      fixes: mine
    };
  }
  return {
    business: input.business || 'Your business',
    name: input.name || '',
    trade: input.trade || '',
    town: input.town || '',
    place: [input.trade, input.town].filter(Boolean).join('  /  '),
    dateLabel: input.dateLabel || '',
    total: score.total,
    totalBand: band(score.total),
    rows: rows,
    insight: insight,
    summaries: summaries,
    time: time,
    channels: channelChart(a),
    funnel: funnelChart(a),
    closeParts: closeChart(a),
    leads: pack('leads', 'Lead Score', score.leads, foundLeads(a), leadsTiles(a)),
    leaks: pack('leaks', LEAK_NAME, score.leaks, foundLeaks(a), leakTiles(a)),
    closing: pack('closing', 'Close Rate', score.closing, foundClosing(a), closeTiles(a)),
    fixes: fixes,
    snapshot: snapshotLines(a),
    plan: plan(fixes, a),
    addNote: 'Time and job dollars are estimates. Do not add the three job lines together.',
    floorNote: 'Scores start at 18, so work you already do still counts.',
    phone: '934-899-0796',
    url: 'sethquest.com/time-is-money',
    cta: 'Book a free 15-min call'
  };
}

export { buildModel, band, bandWord, money };
