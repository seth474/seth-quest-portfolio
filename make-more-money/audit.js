/* Sales funnel audit. Leak loss rates are half of sim.py. Missed calls stay 1 in 12, capped at 10% of leads. Close benchmark 30%. Soft cap is flat through 25%, then bends toward 40%. */
(function (root) {
  var LEADS = { 'under 10': 6, '10 to 30': 20, '30+': 35 };
  var MISSED_DAY = { '0': 0, '1 to 2': 1.5, '3+': 3.5 };
  var CLOSE = { 'under 3': 0.20, '3 to 5': 0.40, '6+': 0.65 };
  var JOB = { 'under $1K': 600, '$1K to $5K': 2500, '$5K to $10K': 7000, '$10K to $20K': 14000, '$20K+': 25000 };
  var R = {
    missedPerCall: 1 / 12,
    missedCap: 0.10,
    workdays: 22,
    resp: { 'within an hour': 0, 'same day': 0.025, 'next day or later': 0.06 },
    webTop: 0.50, webUsed: 0.30, webNone: 0.10,
    noSite: 0.04,
    phone: { yes: 0, 'not sure': 0.015 },
    step: { yes: 0, 'kind of': 0.015, no: 0.035 },
    webCap: 0.065,
    gTop: 0.50, gUsed: 0.25, gNone: 0.10,
    gbp: { yes: 0, partly: 0.015, 'not sure': 0.025 },
    reviews: { 'under 10': 0.05, '10 to 50': 0.02, '50+': 0 },
    rating: { 'under 4 stars': 0.065, '4 to 4.5 stars': 0.015, '4.6 stars or more': 0 },
    gCap: 0.115,
    quote: { 'same day': 0, '1 to 3 days': 0.025, 'a week or more': 0.06 },
    fu: { always: 0, sometimes: 0.035, no: 0.065 },
    closeTarget: 0.30,
    pastMonths: 8,
    past: { regularly: 0, rarely: 0.00125, never: 0.0025 },
    pastJob: 0.5,
    capFloor: 0.25,
    capCeil: 0.40,
    minShow: 250,
    tBase: 0.75,
    aiSaves: 0.5,
    tireShare: 0.15,
    tireHours: 1
  };
  var SCORE = {
    leads: { 'under 10': 30, '10 to 30': 65, '30+': 95 },
    web_phone: { yes: 95, 'not sure': 40, 'no website': 10 },
    web_step: { yes: 95, 'kind of': 50, no: 15 },
    web_price: { yes: 90, no: 35, "I'd rather not": 45 },
    gbp: { yes: 95, partly: 50, 'not sure': 25 },
    reviews: { 'under 10': 15, '10 to 50': 60, '50+': 95 },
    rating: { 'under 4 stars': 15, '4 to 4.5 stars': 65, '4.6 stars or more': 95 },
    speed: { 'within an hour': 95, 'same day': 55, 'next day or later': 15 },
    missed: { '0': 95, '1 to 2': 45, '3+': 10 },
    qspeed: { 'same day': 95, '1 to 3 days': 50, 'a week or more': 10 },
    fu: { always: 95, sometimes: 50, no: 10 },
    past: { regularly: 95, rarely: 45, never: 10 },
    won: { 'under 3': 15, '3 to 5': 60, '6+': 95 },
    ltv: { 'No idea': 45, 'I have a good idea': 75, 'Very clear on it': 95 },
    cac: { 'No idea': 45, 'I have a good idea': 75, 'Very clear on it': 95 }
  };
  var TOPSCORE = { Google: 80, Website: 85, Referrals: 70, 'Repeat customers': 75, 'Social media': 60, 'Trucks and signs': 55, 'Angi/Thumbtack': 30 };
  var SELF = { 45: '#FF9F1A', 75: '#8EE6A8', 95: '#2BE36B' };
  var STARTERS = {
    'Missed calls': "Who picks up when you're in the middle of a job?",
    'Slow response': 'What happens to a lead that comes in at 2 PM on a job day?',
    Website: 'If a customer finds you on their phone at night, what do they do next?',
    'Google profile and reviews': 'When someone Googles you next to two competitors, who looks safer?',
    'Slow quotes': 'What slows a quote down: the measuring, the pricing or the typing?',
    'No follow-up': 'How many quotes from last month never got a second message?',
    'Low close rate': 'When you lose a job, do you know why?',
    'Past customers': 'When did your past customers last hear from you?'
  };
  var FIX = {
    'Missed calls': '$750 Fix or Three-Week Setup',
    'Slow response': 'Three-Week Setup or Team Workshop',
    Website: '$750 Fix',
    'Google profile and reviews': '$750 Fix',
    'Slow quotes': 'Three-Week Setup',
    'No follow-up': 'Three-Week Setup',
    'Low close rate': 'Team Workshop',
    'Past customers': 'Three-Week Setup'
  };
  var GOAL = {
    'more leads': ['Missed calls', 'Google profile and reviews', 'Website', 'Slow response'],
    'faster quotes and follow-up': ['Slow quotes', 'No follow-up'],
    'less busy work': ['Slow quotes', 'No follow-up', 'Past customers']
  };
  var Q = [
    { id: 'trade', q: "What's your trade?", type: 'select', opts: ['Landscaping', 'Pool & spa', 'HVAC', 'Plumbing', 'Electrical', 'Roofing', 'Painting', 'Cleaning', 'Builder / contractor', 'Handyman', 'Tree service', 'Pest control', 'Auto / detailing', 'Tours & rentals', 'Other'] },
    { id: 'sources', q: 'Where do your leads come from?', h: 'Tap all that apply.', type: 'multi', opts: [['Google', 'Google'], ['Website', 'Website'], ['Social media', 'Social media'], ['Angi/Thumbtack', 'Angi/Thumbtack'], ['Referrals', 'Referrals'], ['Repeat customers', 'Repeat customers'], ['Trucks and signs', 'Trucks and signs']] },
    { id: 'top', q: 'Which one brings the most work?', type: 'one', from: 'sources' },
    { id: 'leads', q: 'About how many leads in a typical busy-season month (all sources)?', type: 'one', opts: [['under 10', 'Under 10'], ['10 to 30', '10 to 30'], ['30+', '30+']] },
    { id: 'web_phone', q: 'Does your website work well on a phone?', type: 'one', opts: [['yes', 'Yes'], ['not sure', 'Not sure'], ['no website', 'No website']] },
    { id: 'web_step', q: 'Does your website make one next step clear (call, text or a form)?', type: 'one', skip: 'web', opts: [['yes', 'Yes'], ['kind of', 'Kind of'], ['no', 'No']] },
    { id: 'web_price', q: 'Does your website show ballpark pricing to filter out tire kickers?', type: 'one', skip: 'web', opts: [['yes', 'Yes'], ['no', 'No'], ["I'd rather not", "I'd rather not"]] },
    { id: 'gbp', q: 'Is your Google profile set up with hours, photos, services and the right address?', type: 'one', opts: [['yes', 'Yes'], ['partly', 'Partly'], ['not sure', 'Not sure']] },
    { id: 'reviews', q: 'How many Google reviews do you have?', type: 'one', opts: [['under 10', 'Under 10'], ['10 to 50', '10 to 50'], ['50+', '50+']] },
    { id: 'rating', q: "What's your Google star rating?", type: 'one', opts: [['under 4 stars', 'Under 4 stars'], ['4 to 4.5 stars', '4 to 4.5 stars'], ['4.6 stars or more', '4.6 stars or more']] },
    { id: 'speed', q: 'How fast do you get back to new leads?', type: 'one', opts: [['within an hour', 'Within an hour'], ['same day', 'Same day'], ['next day or later', 'Next day or later']] },
    { id: 'missed', q: 'About how many calls do you miss a day?', type: 'one', opts: [['0', '0'], ['1 to 2', '1 to 2'], ['3+', '3+']] },
    { id: 'qspeed', q: 'How fast do your quotes go out?', type: 'one', opts: [['same day', 'Same day'], ['1 to 3 days', '1 to 3 days'], ['a week or more', 'A week or more']] },
    { id: 'fu', q: 'Do you follow up on quotes that go quiet?', type: 'one', opts: [['always', 'Always'], ['sometimes', 'Sometimes'], ['no', 'No']] },
    { id: 'past', q: 'Do you email or text past customers?', type: 'one', opts: [['regularly', 'Regularly'], ['rarely', 'Rarely'], ['never', 'Never']] },
    { id: 'won', q: 'Out of 10 quotes, how many do you win?', type: 'one', opts: [['under 3', 'Under 3'], ['3 to 5', '3 to 5'], ['6+', '6+']] },
    { id: 'job', q: "What's your average job or yearly contract worth?", type: 'one', opts: [['under $1K', 'Under $1K'], ['$1K to $5K', '$1K to $5K'], ['$5K to $10K', '$5K to $10K'], ['$10K to $20K', '$10K to $20K'], ['$20K+', '$20K+']] },
    { id: 'ltv', q: 'Do you know what a customer is worth to you over time?', type: 'one', opts: [['No idea', 'No idea'], ['I have a good idea', 'I have a good idea'], ['Very clear on it', 'Very clear on it']] },
    { id: 'cac', q: 'Do you know what it costs you to get a customer?', type: 'one', opts: [['No idea', 'No idea'], ['I have a good idea', 'I have a good idea'], ['Very clear on it', 'Very clear on it']] },
    { id: 'goal', q: 'If you could fix one thing this month, what would it be?', type: 'one', opts: [['more leads', 'More leads'], ['faster quotes and follow-up', 'Faster quotes and follow-up'], ['less busy work', 'Less busy work']] }
  ];

  function r50(x) { return Math.round(x / 50) * 50; }
  function money(n) { return '$' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function num(n) { var x = Math.round(n * 10) / 10; return (x % 1) ? String(x) : String(x); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function cap(s) { s = String(s || ''); return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
  function labelOf(q, v) {
    var opts = q.opts || [];
    for (var i = 0; i < opts.length; i++) if (opts[i][0] === v) return opts[i][1];
    return cap(v);
  }
  function active(A) {
    return Q.filter(function (q) {
      if (q.skip === 'web' && A.web_phone === 'no website') return false;
      return true;
    });
  }
  function shownShare(raw) {
    if (!(raw > 0)) return 0;
    if (raw <= R.capFloor) return raw;
    var bend = R.capCeil - R.capFloor;
    return R.capFloor + bend * (1 - Math.exp(-(raw - R.capFloor) / bend));
  }
  function compute(a) {
    var leads = LEADS[a.leads], close = CLOSE[a.won], job = JOB[a.job];
    var revenue = leads * close * job;
    var nosite = a.web_phone === 'no website';
    var srcs = a.sources || [];
    var L = {};
    var md = MISSED_DAY[a.missed];
    var rawM = md * R.workdays * R.missedPerCall;
    var m = Math.min(rawM, leads * R.missedCap);
    L['Missed calls'] = { jobs: m * close, why: function (k) { return '~' + num(md) + ' missed a day; about ' + num(m * k) + " new-job callers a month who don't call back"; } };
    var p = R.resp[a.speed];
    var lostR = leads * p;
    var rem = leads - lostR;
    L['Slow response'] = { jobs: lostR * close, why: function (k) { return a.speed + ' reply; about ' + num(lostR * k) + ' of ' + leads + ' leads a month go to whoever answers first'; } };
    var wshare = (a.top === 'Website' || a.top === 'Google') ? R.webTop : ((srcs.indexOf('Website') >= 0 || srcs.indexOf('Google') >= 0) ? R.webUsed : R.webNone);
    var wp, wtxt;
    if (nosite) { wp = R.noSite; wtxt = 'no website'; }
    else {
      wp = Math.min(R.webCap, (R.phone[a.web_phone] || 0) + (R.step[a.web_step] || 0));
      wtxt = 'works on a phone: ' + a.web_phone + ', clear next step: ' + a.web_step;
    }
    var lostW = rem * wshare * wp;
    rem -= lostW;
    L.Website = { jobs: lostW * close, why: function (k) { return wtxt + '; about ' + Math.round(wshare * 100) + '% of leads look at your site first'; } };
    var gshare = a.top === 'Google' ? R.gTop : (srcs.indexOf('Google') >= 0 ? R.gUsed : R.gNone);
    var gp = Math.min(R.gCap, (R.gbp[a.gbp] || 0) + (R.reviews[a.reviews] || 0) + (R.rating[a.rating] || 0));
    var lostG = rem * gshare * gp;
    rem -= lostG;
    L['Google profile and reviews'] = { jobs: lostG * close, why: function () { return 'profile ' + a.gbp + ', ' + a.reviews + ' reviews, ' + a.rating + '; about ' + Math.round(gshare * 100) + '% of leads check Google first'; } };
    var wins = rem * close;
    var qp = R.quote[a.qspeed];
    var qj = qp >= 1 ? 0 : wins * qp / (1 - qp);
    L['Slow quotes'] = { jobs: qj, why: function (k) { return 'quotes go out ' + a.qspeed + '; about ' + num(qj * k) + ' jobs a month go to a faster quote'; } };
    var fj = wins * (R.fu[a.fu] || 0);
    L['No follow-up'] = { jobs: fj, why: function (k) { return 'follow-up: ' + a.fu + '; about ' + num(fj * k) + ' quiet quotes a month a second touch would win'; } };
    var gap = Math.max(0, Math.max(0, R.closeTarget - close) * rem - qj - fj);
    L['Low close rate'] = { jobs: gap, why: function () { return 'winning about ' + Math.round(close * 100) + '% vs a ' + Math.round(R.closeTarget * 100) + '% benchmark, beyond what speed and follow-up explain'; } };
    var plist = leads * close * R.pastMonths;
    var pj = plist * (R.past[a.past] || 0);
    L['Past customers'] = { jobs: pj * R.pastJob, why: function (k) { return a.past + ' in touch with ~' + Math.round(plist) + ' past customers; about ' + num(pj * k) + ' repeat jobs a month left unbooked'; } };
    var names = Object.keys(L);
    var rawTotal = 0;
    names.forEach(function (k) { L[k].dollars = L[k].jobs * job; rawTotal += L[k].dollars; });
    var rawShare = revenue ? rawTotal / revenue : 0;
    var shown = shownShare(rawShare);
    var scale = rawShare ? shown / rawShare : 1;
    names.forEach(function (k) {
      L[k].why = L[k].why(scale);
      L[k].dollars = r50(L[k].dollars * scale);
    });
    var total = 0;
    names.forEach(function (k) { total += L[k].dollars; });
    var hours = leads * R.tBase * R.aiSaves;
    if (a.web_price !== 'yes') hours += leads * R.tireShare * R.tireHours;
    var ranked = names.filter(function (k) { return L[k].dollars >= R.minShow; }).sort(function (a, b) { return L[b].dollars - L[a].dollars; });
    var top = ranked.slice(0, 3);
    var goalList = GOAL[a.goal] || [];
    var goal = goalList.filter(function (g) { return ranked.indexOf(g) >= 0 && top.indexOf(g) < 0; });
    if (top.length === 3 && goal.length && !top.some(function (t) { return goalList.indexOf(t) >= 0; }) && L[goal[0]].dollars >= 0.5 * L[top[2]].dollars) top[2] = goal[0];
    return {
      leads: leads, close: close, job: job, revenue: revenue, leaks: L, total: total,
      top: top, share: revenue ? Math.round(total / revenue * 100) : 0,
      perLead: r50(close * job), hours: Math.round(hours), nosite: nosite, tight: total < 500
    };
  }
  function scoreOf(q, A) {
    if (q.id === 'trade' || q.id === 'job' || q.id === 'goal') return null;
    if ((q.id === 'web_step' || q.id === 'web_price') && A.web_phone === 'no website') return null;
    if (q.id === 'sources') return Math.min(95, 20 + 12 * ((A.sources || []).length));
    if (q.id === 'top') return TOPSCORE[A.top] || 50;
    var v = A[q.id];
    var map = SCORE[q.id];
    return map ? map[v] : null;
  }
  function barColor(s, id) {
    if (id === 'ltv' || id === 'cac') return SELF[s] || '#FF9F1A';
    if (s > 70) return '#2BE36B';
    if (s >= 30) return '#FF9F1A';
    return '#FF2D2D';
  }
  function answerText(q, A) {
    if ((q.id === 'web_step' || q.id === 'web_price') && A.web_phone === 'no website') return 'Skipped (no website)';
    var v = A[q.id];
    if (q.type === 'multi') return (v && v.length) ? v.join(', ') : 'None';
    if (q.type === 'select') return v || '';
    return labelOf(q, v);
  }
  function rowsHTML(A) {
    return Q.map(function (q, i) {
      var ans = answerText(q, A);
      var s = scoreOf(q, A);
      var bar = s == null
        ? '<div class="nobar">Context</div>'
        : '<div class="meter"><i style="width:' + s + '%;background:' + barColor(s, q.id) + '"></i></div><div class="pct">' + s + '%</div>';
      return '<div class="qrow"><div class="qn">' + (i + 1) + '</div><div class="qb"><div class="qq">' + esc(q.q) + '</div><div class="qa">' + esc(ans) + '</div>' + bar + '</div></div>';
    }).join('');
  }
  function boxesHTML(r) {
    var html = r.top.map(function (k) {
      var v = r.leaks[k];
      return '<div class="gbox"><div class="gk">' + esc(k) + '</div><div class="gd">' + money(v.dollars) + '<span>/busy month</span></div><div class="gw">' + esc(v.why) + '</div><div class="gs">' + esc(STARTERS[k]) + '</div><div class="gf">Option that fits: ' + esc(FIX[k]) + '</div></div>';
    }).join('');
    if (!r.top.length) {
      html += '<div class="gbox"><div class="gk">Every new lead</div><div class="gd">' + money(r.perLead) + '<span>each</span></div><div class="gw">You win ' + Math.round(r.close * 100) + '% of quotes at about ' + money(r.job) + ' a job, so each extra lead is worth about ' + money(r.perLead) + '.</div><div class="gs">Your funnel holds water. What would 10 more leads a month be worth?</div><div class="gf">Option that fits: $750 Fix</div></div>';
      html += '<div class="gbox"><div class="gk">Time back</div><div class="gd">~' + r.hours + ' hrs<span>/busy month</span></div><div class="gw">About ' + r.leads + ' leads a month of emails, quotes and follow-ups. One AI agent can draft about half of that.</div><div class="gs">What would you do with an extra ' + r.hours + ' hours a month?</div><div class="gf">Option that fits: Team Workshop</div></div>';
    }
    return html;
  }
  function headHTML(r) {
    if (r.tight) return '<div class="big" style="color:#1fbf5a">Tight funnel</div><p class="sub">Your funnel is tight. Almost nothing is leaking. The opportunity is growth and time.</p>';
    return '<div class="big">' + money(r.total) + '<span>a busy month</span></div><div class="share">about ' + r.share + '% of a busy month</div><p class="sub">Estimated work slipping through the funnel in a busy-season month, based on your answers.</p>';
  }
  function tableHTML(r) {
    return Object.keys(r.leaks).sort(function (a, b) { return r.leaks[b].dollars - r.leaks[a].dollars; }).map(function (k) {
      return '<tr class="' + (r.top.indexOf(k) >= 0 ? 't' : '') + '"><td>' + esc(k) + '</td><td>' + money(r.leaks[k].dollars) + '</td><td>' + esc(r.leaks[k].why) + '</td></tr>';
    }).join('');
  }
  function offersHTML() {
    return '<div class="cta"><h3>Three ways to work together</h3><p>Options to talk through on a free call.</p><div class="opts">' +
      '<div class="opt"><div class="op">$750</div><div class="on">One fix. One on one. 48 hours.</div><div class="od">One fix: your website, your Google profile, or your Google Ads. One on one with Seth, done in 48 hours. 100% money-back guarantee if you don\u2019t feel you got $750 of value.</div></div>' +
      '<div class="opt"><div class="on">Three-Week Setup \u00b7 $2,400 \u00b7 one on one with the founder</div><div class="od">One change a week, for three weeks. We pick the biggest leak, fix it, see it work, then take on the next one.</div><div class="od">Week 1: $800 to start. Week 2: $800. Week 3: $800 at handoff.</div><a class="ol" href="/time-is-money">Learn more</a></div>' +
      '<div class="opt"><div class="on">Team Workshop \u00b7 $4,800 per company</div><div class="od">One change a week, for three weeks, with the team. 2 to 5 people. Founder optional. A 2-hour team session each week, with setup work between sessions. Week 1: audit and the first change. Week 2: the second change. Week 3: the third change, training, and handoff.</div><div class="od">Week 1: $1,600 to start. Week 2: $1,600. Week 3: $1,600 at handoff.</div><a class="ol" href="/team-workshop">Learn more</a></div>' +
      '</div><button class="btn p" type="button" id="qrBook">Book a free call</button></div>';
  }
  function fine(r) {
    return 'Uses the middle of each range you picked: about ' + r.leads + ' leads in a busy month, ' + Math.round(r.close * 100) + '% of quotes won, ' + money(r.job) + ' average job or contract (about ' + money(r50(r.revenue)) + ' in new work a busy month). Missed calls count 22 working days, and 1 in 12 missed calls as a lost new lead, capped at 10% of leads. Leaks are counted in funnel order so the same lead is not counted twice. Totals up to 25% of a busy month stay as calculated. Above that they bend toward 40%.';
  }
  function resultsInner(A, who) {
    var r = compute(A);
    return '<div class="audit">' +
      (who ? '<p class="qr-for">' + esc(who) + '</p>' : '') +
      headHTML(r) +
      '<h2 class="d ah">Biggest opportunities<span class="g">.</span></h2>' + boxesHTML(r) +
      '<p class="fine">Time on emails, quotes and follow-ups: about ' + r.hours + ' hours a month you could get back.</p>' +
      '<h2 class="d ah">Your answers<span class="g">.</span></h2>' + rowsHTML(A) +
      '<h2 class="d ah">Where the money goes<span class="g">.</span></h2><table class="lt">' + tableHTML(r) + '</table>' +
      '<p class="note">Estimates based on your answers, not a guarantee.</p>' +
      '<p class="fine">' + fine(r) + '</p>' +
      '<p class="together">Let\u2019s pick what to work on together.</p>' +
      offersHTML() +
      '<div class="qr-ctas"><button class="btn o" type="button" id="qrEmail">Download my report</button><button class="qr-print" type="button" id="qrPrint">Printer-friendly version</button><p class="qr-note" id="qrNote">Seth gets a copy too. The file downloads to this device.</p></div>' +
      '<p class="qr-sent" id="qrSent"></p><div class="qz-err" id="qrErr"></div></div>';
  }
  function reportText(lead, A) {
    var r = compute(A);
    var lines = [];
    lines.push('SALES FUNNEL AUDIT');
    lines.push(r.tight ? 'Tight funnel' : (money(r.total) + ' a busy month (' + r.share + '% of a busy month)'));
    lines.push('About ' + r.leads + ' leads, ' + Math.round(r.close * 100) + '% close, ' + money(r.job) + ' job');
    lines.push('Every new lead is worth about ' + money(r.perLead));
    lines.push('Time back: about ' + r.hours + ' hours a busy month');
    lines.push('');
    lines.push('CONTACT');
    lines.push('Name: ' + (lead.name || ''));
    lines.push('Business: ' + (lead.business || ''));
    lines.push('Cell: ' + (lead.phone || ''));
    lines.push('Email: ' + (lead.email || ''));
    lines.push('Trade: ' + (A.trade || ''));
    lines.push('');
    lines.push('ANSWERS');
    Q.forEach(function (q) { lines.push('- ' + q.q + '  ' + answerText(q, A)); });
    lines.push('');
    lines.push('LEAKS');
    Object.keys(r.leaks).sort(function (a, b) { return r.leaks[b].dollars - r.leaks[a].dollars; }).forEach(function (k) {
      lines.push(money(r.leaks[k].dollars) + '  ' + k + '  ' + r.leaks[k].why + (r.top.indexOf(k) >= 0 ? '  [highlighted]' : ''));
    });
    lines.push('');
    lines.push('HIGHLIGHTED');
    r.top.forEach(function (k) { lines.push('- ' + k + '  ' + money(r.leaks[k].dollars) + '  ' + STARTERS[k] + '  Option that fits: ' + FIX[k]); });
    if (!r.top.length) lines.push('Tight funnel. Every new lead is worth about ' + money(r.perLead) + '. Time back about ' + r.hours + ' hours.');
    lines.push('');
    lines.push('Estimates based on your answers, not a guarantee.');
    return lines.join('\n');
  }
  var css = '.audit{color:#0a0a0a}.audit .big{font-family:"Bebas Neue",sans-serif;font-size:clamp(64px,16vw,96px);line-height:.85;color:#FF2D2D;margin:8px 0 2px}.audit .big span{font:800 16px Inter,sans-serif;color:#0a0a0a;margin-left:6px}.audit .share{font-weight:800;font-size:18px;color:#FF2D2D;margin:0 0 8px}.audit .sub{color:#333;margin:0 0 8px}.audit .ah{font-size:clamp(32px,8vw,40px);margin:26px 0 12px}.audit .gbox{background:#e9fbef;border:2px solid #2BE36B;border-radius:16px;padding:14px 16px;margin:0 0 10px}.audit .gk{font-family:"Bebas Neue",sans-serif;font-size:28px;line-height:1;text-transform:uppercase}.audit .gd{font-family:"Bebas Neue",sans-serif;font-size:40px;line-height:1;color:#1fbf5a;margin-top:4px}.audit .gd span{font:800 14px Inter,sans-serif;color:#0a0a0a;margin-left:4px}.audit .gw{color:#333;font-size:14px;margin-top:4px}.audit .gs{font-weight:700;margin-top:8px}.audit .gf{font-weight:600;font-size:13px;color:#178a3e;margin-top:8px;border-top:1px solid #c8f2d6;padding-top:7px}.audit .qrow{display:flex;gap:10px;background:#fff;border:1px solid #e3e1db;border-radius:14px;padding:12px;margin:0 0 8px}.audit .qn{flex:none;width:26px;height:26px;border-radius:50%;background:#0a0a0a;color:#fff;font:800 12px/26px Inter,sans-serif;text-align:center}.audit .qb{flex:1;min-width:0}.audit .qq{font-weight:700;font-size:15px;line-height:1.3}.audit .qa{color:#333;font-size:15px}.audit .meter{height:9px;border-radius:5px;background:#e3e1db;margin-top:8px;overflow:hidden}.audit .meter i{display:block;height:100%;border-radius:5px}.audit .pct{font:800 12px Inter,sans-serif;color:#6b6b6b;margin-top:3px}.audit .nobar{font:600 11px Inter,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#6b6b6b;margin-top:4px}.audit table.lt{width:100%;border-collapse:collapse;background:#fff;border-radius:14px;overflow:hidden;font-size:14px}.audit table.lt td{padding:9px 10px;border-bottom:1px solid #e3e1db;vertical-align:top}.audit table.lt td:nth-child(2){font-weight:800;white-space:nowrap}.audit tr.t td{background:#e9fbef}.audit .fine{font-size:13px;color:#6b6b6b;margin-top:10px}.audit .note{font-weight:700;margin-top:14px}.audit .cta{background:#0a0a0a;color:#fff;border-radius:22px;padding:22px 16px;margin-top:22px}.audit .cta h3{font-family:"Bebas Neue",sans-serif;font-weight:400;font-size:36px;line-height:.95;text-transform:uppercase;text-align:center}.audit .cta p{color:#ccc;text-align:center;margin:8px 0 14px}.audit .opts{display:grid;gap:10px}.audit .opt{border:1.5px solid #333;border-radius:16px;padding:12px 14px}.audit .op{font-family:"Bebas Neue",sans-serif;font-size:36px;line-height:1;color:#2BE36B}.audit .on{font-family:"Bebas Neue",sans-serif;font-size:24px;line-height:1;text-transform:uppercase}.audit .od{color:#ccc;font-size:14px;margin-top:4px}.audit #qrBook{width:100%;margin-top:12px;background:#2BE36B;color:#0a0a0a}.audit .together{font-weight:700;font-size:18px;line-height:1.35;margin:22px 0 0}.audit .ol{color:#2BE36B;font-weight:700;display:inline-block;margin-top:8px}';
  function reportDocument(lead, A) {
    var r = compute(A);
    var title = esc((lead && lead.business) || 'Sales funnel audit');
    return '<!doctype html><html><head><meta charset="utf-8"><title>' + title + '</title><link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet"><style>body{margin:0;background:#f6f5f1;font:400 16px/1.5 Inter,sans-serif}' + css + '.w{max-width:680px;margin:0 auto;padding:28px 18px 48px}</style></head><body><div class="w"><div style="font-family:Bebas Neue,sans-serif;font-size:28px;letter-spacing:.06em">MORE.</div><div class="audit"><p style="font-weight:700">' + esc((lead && lead.name) || '') + (lead && lead.business ? ' · ' + esc(lead.business) : '') + '</p>' + headHTML(r) + '<h2 class="ah">Biggest opportunities</h2>' + boxesHTML(r).replace('id="qrBook"', '') + '<p class="fine">Time on emails, quotes and follow-ups: about ' + r.hours + ' hours a month you could get back.</p><h2 class="ah">Your answers</h2>' + rowsHTML(A) + '<h2 class="ah">Where the money goes</h2><table class="lt">' + tableHTML(r) + '</table><p class="note">Estimates based on your answers, not a guarantee.</p><p class="fine">' + fine(r) + '</p>' + offersHTML().replace('id="qrBook"', 'onclick="location.href=\'tel:+19348990796\'"') + '</div></div></body></html>';
  }
  root.MOREAudit = { Q: Q, active: active, compute: compute, resultsInner: resultsInner, reportText: reportText, reportDocument: reportDocument, labelOf: labelOf, css: css };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.MOREAudit;
})(typeof window !== 'undefined' ? window : globalThis);
