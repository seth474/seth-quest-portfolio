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
function textLine(v) {
  if (v === 'yes') return 'Every missed call gets an automatic text back.';
  if (v === 'some') return 'Missed calls sometimes get a text back.';
  if (v === 'no') return 'Missed calls do not get an automatic text back.';
  return 'You were not sure whether missed calls get a text back.';
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

function sections(score) {
  return [
    { key: 'leads', name: 'Leads', n: score.leads },
    { key: 'leaks', name: 'Leaks', n: score.leaks },
    { key: 'closing', name: 'Closing', n: score.closing }
  ];
}

function weakCall(score) {
  var rows = sections(score);
  var min = Math.min(score.leads, score.leaks, score.closing);
  var lows = rows.filter(function (r) { return r.n === min; });
  var others = rows.filter(function (r) { return r.n !== min; });
  var tied = lows.length > 1;
  var greenLow = min >= 75;
  var headline, detail, label;
  if (lows.length === 3) {
    label = 'Even across the funnel';
    headline = 'The three scores are even.';
    detail = 'Leads, Leaks, and Closing all sit at ' + min + ' out of 100. There is no single weak spot. The work is spread across the funnel.';
  } else if (tied) {
    label = 'Tied at the bottom';
    headline = lows.map(function (r) { return r.name; }).join(' and ') + ' are tied at the bottom.';
    detail = 'Both sit at ' + min + ' out of 100. ' + others.map(function (r) { return r.name + ' is at ' + r.n; }).join('. ') + '.';
  } else if (greenLow) {
    label = 'Lowest score';
    headline = lows[0].name + ' is the lowest score, and it is still in the green.';
    detail = lows[0].name + ' is ' + min + ' out of 100. ' + others.map(function (r) { return r.name + ' is ' + r.n; }).join('. ') + '.';
  } else {
    label = 'The weak spot';
    headline = lows[0].name + ' is the weak spot.';
    detail = 'It scored ' + min + ' out of 100. ' + others.map(function (r) { return r.name + ' is ' + r.n; }).join('. ') + '.';
  }
  return { min: min, lows: lows, others: others, tied: tied, greenLow: greenLow, label: label, headline: headline, detail: detail, rows: rows };
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
  if (a.textback === 'no') rate += 0.2;
  else if (a.textback === 'some') rate += 0.1;
  else if (a.textback === 'ns') rate += 0.08;
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
    line = 'You marked ' + range + '. ' + bestLine(a) + ' If ' + ex.jobs + ' of those leads never become a call because the proof or the channel is thin, that is ' + money(ex.dollars) + ' at $1,500 a job.';
  } else if (key === 'leaks') {
    line = speedLine(a.speed).replace(/\.$/, '') + ', and ' + textLine(a.textback).charAt(0).toLowerCase() + textLine(a.textback).slice(1) + ' Across ' + range + ', about ' + ex.jobs + ' can go cold before anyone visits. At $1,500 a job, that is ' + money(ex.dollars) + '.';
  } else {
    line = quoteLine(a.quotes) + ' ' + followLine(a.followup) + ' About ' + ex.jobs + ' of the ' + range + ' can be lost to a slow or quiet quote. At $1,500 a job, that is ' + money(ex.dollars) + '.';
  }
  return {
    jobs: ex.jobs,
    dollars: money(ex.dollars),
    equation: ex.jobs + ' jobs  x  $1,500',
    line: line,
    note: moneyNote(a)
  };
}

function fixesFor(insights, sec) {
  return (insights || [])
    .filter(function (x) { return x.sec === sec && x.lost > 0; })
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
  return [speedLine(a.speed), textLine(a.textback), formLine(a), askLine(a.reviewask)];
}
function foundClosing(a) {
  return [quoteLine(a.quotes), followLine(a.followup), scriptLine(a.script), crmLine(a.crm)];
}

function tile(k, v, d) { return { k: k, v: v, d: d }; }

function leadsTiles(a) {
  var on = names(ONLINE, a.online);
  var off = names(OFFLINE, a.offline);
  var ig = has(a.online, 'ig') ? postedLine('Instagram', a.igPost, true).replace(/\.$/, '') : 'Not a source you marked';
  var fb = has(a.online, 'fb') ? postedLine('Facebook', a.fbPost, true).replace(/\.$/, '') : 'Not a source you marked';
  return [
    tile('Online sources', on.length ? String(on.length) : 'None', on.length ? joinList(on) : 'No online source was marked.'),
    tile('Offline sources', off.length ? String(off.length) : 'None', off.length ? joinList(off) : 'No offline source was marked.'),
    tile('Biggest source', (a.best && a.best !== 'ns' && a.best !== 'none') ? nameOf(ONLINE.concat(OFFLINE), a.best) : 'Not named', bestLine(a)),
    tile('Instagram', has(a.online, 'ig') ? (a.igPost === 'week' ? 'This week' : a.igPost === 'month' ? 'This month' : a.igPost === 'mo6' ? '6+ months' : a.igPost === 'yr' ? '1+ year' : 'Not set') : 'Not marked', ig + '.'),
    tile('Facebook', has(a.online, 'fb') ? (a.fbPost === 'week' ? 'This week' : a.fbPost === 'month' ? 'This month' : a.fbPost === 'mo6' ? '6+ months' : a.fbPost === 'yr' ? '1+ year' : 'Not set') : 'Not marked', fb + '.'),
    tile('Google reviews', ({ '0': '0 to 10', '11': '11 to 50', '51': '51 to 100', '100': '100+' }[a.reviews] || 'Not sure'), reviewCountLine(a.reviews) + ' ' + ltvLine(a.ltv))
  ];
}
function leakTiles(a) {
  return [
    tile('Answer speed', ({ min15: '15 min', instant: '15 min', hour: 'An hour', day: 'Same day', next: 'Next day', ns: 'Not sure' }[a.speed] || 'Not set'), speedLine(a.speed)),
    tile('Missed calls', ({ yes: 'Text back', some: 'Sometimes', no: 'No text', ns: 'Not sure' }[a.textback] || 'Not set'), textLine(a.textback)),
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

function buildModel(input) {
  var a = input.answers || {};
  var score = input.score || { total: 0, leads: 0, leaks: 0, closing: 0, insights: [] };
  var weak = weakCall(score);
  var insights = score.insights || [];
  var fixes = topFixes(insights);
  var exposures = { leads: leadExposure(a), leaks: leakExposure(a), closing: closeExposure(a) };
  function pack(key, name, num, found, tiles) {
    var mine = fixesFor(insights, name);
    var isLow = weak.lows.some(function (r) { return r.key === key; }) && weak.lows.length === 1 && score[key] < 75;
    return {
      key: key,
      name: name,
      num: num,
      band: band(num),
      bandNote: bandNote(num),
      found: found,
      tiles: tiles,
      money: moneyBlock(key, a, exposures[key]),
      fixes: mine,
      isWeak: isLow,
      ribbon: isLow ? name + ' is the weak spot.' : (weak.lows.length === 1 ? weak.lows[0].name + ' is the weak spot. ' + name + ' is not.' : weak.headline)
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
    weak: weak,
    leads: pack('leads', 'Leads', score.leads, foundLeads(a), leadsTiles(a)),
    leaks: pack('leaks', 'Leaks', score.leaks, foundLeaks(a), leakTiles(a)),
    closing: pack('closing', 'Closing', score.closing, foundClosing(a), closeTiles(a)),
    fixes: fixes,
    plan: plan(fixes, a),
    addNote: 'The dollar lines are three views of the same leads. Do not add them together.',
    phone: '934-899-0796',
    url: 'sethquest.com/time-is-money',
    cta: 'Book a free 15-min call'
  };
}

export { buildModel, band, bandWord, money };
