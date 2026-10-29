(function () {
  'use strict';

  var lock = document.getElementById('lock');
  var lockWait = document.getElementById('lock-wait');
  var lockForm = document.getElementById('lock-form');
  var lockErr = document.getElementById('lock-err');
  var lockGo = document.getElementById('lock-go');
  var passInput = document.getElementById('pass');
  var app = document.getElementById('app');
  var state = { data: null };
  var ui = { pipe: false, map: false, leadId: '', sortKey: 'priority', sortDir: 1, cluster: -1, groups: [] };
  var mapState = { map: null, layer: null, tilesOk: false, tilesFailed: false };
  var NS = 'http://www.w3.org/2000/svg';
  var RANK = { High: 0, Medium: 1, Low: 2, Visit: 3 };

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function telHref(phone) {
    var digits = String(phone || '').replace(/[^\d+]/g, '');
    if (!digits) return '';
    if (digits.charAt(0) !== '+') {
      if (digits.length === 10) digits = '+1' + digits;
      else if (digits.length === 11 && digits.charAt(0) === '1') digits = '+' + digits;
    }
    return 'tel:' + digits;
  }

  function keyName(name) {
    return String(name || '').toLowerCase().replace(/[\u2019\u2018']/g, '');
  }

  function shortBusiness(name) {
    var key = keyName(name);
    if (key.indexOf('east hampton fence') === 0) return 'Fence';
    if (key.indexOf('steves east end') === 0) return 'Fuel';
    if (key.indexOf('sparkling') === 0) return 'Pools';
    if (key.indexOf('hoyt') === 0) return 'Hoyt';
    if (key.indexOf('whites') === 0) return "White's";
    if (key.indexOf('hvac') === 0) return 'HVAC';
    return name;
  }

  function pickContact(lead) {
    var parts = String((lead && lead.contact) || '').split(/[\/,&]/).map(function (part) { return part.trim(); }).filter(Boolean);
    var key = keyName(lead && lead.name);
    var i;
    return parts.length ? parts[0].split(' ')[0] : '';
  }

  function chipLabel(lead) {
    var business = shortBusiness(lead.name);
    if (lead.priority !== 'High') return business;
    var who = pickContact(lead);
    return who ? who + ' \u00b7 ' + business : business;
  }

  function verb(text) {
    var t = String(text || '').toLowerCase();
    if (/^call/.test(t)) return 'Call';
    if (/set next meeting/.test(t)) return 'Set meeting';
    if (/collect|finish site/.test(t)) return 'Complete';
    if (/nudge|reply/.test(t)) return 'Nudge';
    if (/meet/.test(t)) return 'Meet';
    if (/close/.test(t)) return 'Close';
    if (/door|visit/.test(t)) return 'Visit';
    if (/email/.test(t) && !/not email|do not email/.test(t)) return 'Email';
    if (/call|phone/.test(t)) return 'Call';
    return 'Next';
  }

  function huntLabel(trade) {
    var t = String(trade || '');
    if (t.length > 18) return t.replace(' & smart home', '').replace(' management', '');
    return t;
  }

  function findItem(id) {
    var lists = [state.data.companies || state.data.leads || [], state.data.stops || []];
    var i, j;
    for (i = 0; i < lists.length; i += 1) {
      for (j = 0; j < lists[i].length; j += 1) {
        if (lists[i][j].id === id) return lists[i][j];
      }
    }
    return null;
  }

  function greetingName(lead) {
    return pickContact(lead) || 'there';
  }

  function mailParts(lead) {
    var who = greetingName(lead);
    var biz = lead.name;
    var step = lead.nextStep || lead.action || '';
    var trade = lead.trade || 'local';
    if (lead.priority === 'High') {
      return {
        subject: 'Following up \u2014 ' + biz,
        body: 'Hi ' + who + ',\n\nNext step I have: ' + step + '.\n\nI can start the $2,400 Three-Week setup this week. Call or text and we will lock a time.\n\nSeth'
      };
    }
    if (lead.priority === 'Medium') {
      return {
        subject: 'Quick follow-up \u2014 ' + biz,
        body: 'Hi ' + who + ',\n\nChecking back in on ' + biz + '. Next step: ' + step + '.\n\nHappy to do a short call this week. What time works?\n\nSeth'
      };
    }
    return {
      subject: 'Stopped by \u2014 ' + (lead.trade || biz),
      body: 'Hi ' + who + ',\n\nI work with ' + trade + ' businesses on the East End. ' + step + '\n\nIf a short conversation is useful, reply or call me back.\n\nSeth'
    };
  }

  function mailHref(lead) {
    var parts = mailParts(lead);
    return 'mailto:' + (lead.email || '') +
      '?subject=' + encodeURIComponent(parts.subject) +
      '&body=' + encodeURIComponent(parts.body);
  }

  function talkTrack(lead) {
    var who = greetingName(lead);
    var step = lead.nextStep || lead.action || 'a short intro';
    var trade = lead.trade || 'local';
    if (lead.priority === 'High') {
      return who + ", it's Seth. Calling on " + lead.name + '. ' + step + '. I can start the Three-Week setup this week \u2014 are we a yes, or should I walk the one number that decides it?';
    }
    if (lead.priority === 'Medium') {
      return who + ', Seth here. Following up on ' + lead.name + '. Next step: ' + step + '. Got two minutes to lock that?';
    }
    return 'Hi, Seth Quest. I help ' + trade + ' businesses on the East End. ' + step + '. Is the owner around for two minutes?';
  }

  function isMailingBox(address) {
    return /^P\.?O\.?\s*Box/i.test(String(address || ''));
  }

  function mapsHref(item) {
    if (item.address && !isMailingBox(item.address)) {
      return 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(item.address);
    }
    if (item.lat != null && item.lng != null) {
      return 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(item.lat + ',' + item.lng);
    }
    if (item.name || item.address) {
      return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent((item.name || '') + ' ' + (item.address || ''));
    }
    return '';
  }

  function replaceUrl(url) {
    try { history.replaceState(null, '', url.pathname + url.search + url.hash); }
    catch (err) { /* file previews */ }
  }

  function stripKey() {
    var url = new URL(location.href);
    if (!url.searchParams.has('k') && !url.searchParams.has('key')) return;
    url.searchParams.delete('k');
    url.searchParams.delete('key');
    replaceUrl(url);
  }

  function showError(message) {
    lockErr.hidden = !message;
    lockErr.textContent = message || '';
  }

  function showLock(failed) {
    app.hidden = true;
    lock.hidden = false;
    lockWait.hidden = true;
    lockForm.hidden = false;
    lockGo.disabled = false;
    lockGo.textContent = 'Open';
    showError(failed ? 'That passphrase did not open it.' : '');
    passInput.focus();
  }

  function load(key) {
    var url = '/api/crm';
    if (key) url += '?k=' + encodeURIComponent(key);
    return fetch(url, { credentials: 'same-origin', cache: 'no-store', headers: { 'Accept': 'application/json' } });
  }

  function openBoard(key, fromAttempt) {
    lockGo.disabled = true;
    return load(key).then(function (res) {
      if (res.status === 401) {
        showLock(fromAttempt);
        return;
      }
      if (!res.ok) {
        showLock(false);
        showError('The board did not load. Try again.');
        return;
      }
      return res.json().then(function (data) {
        stripKey();
        state.data = data;
        lock.hidden = true;
        app.hidden = false;
        render();
      });
    }).catch(function () {
      showLock(false);
      showError('The board did not load. Try again.');
    });
  }

  function svgEl(name, attrs) {
    var node = document.createElementNS(NS, name);
    Object.keys(attrs).forEach(function (key) { node.setAttribute(key, attrs[key]); });
    return node;
  }

  function pt(cx, cy, deg, r) {
    var rad = deg * Math.PI / 180;
    return [cx + Math.sin(rad) * r, cy - Math.cos(rad) * r];
  }

  function faceDial(counts) {
    var cx = 100;
    var cy = 100;
    var start = 232;
    var sweep = 300;
    var pct = counts.faceTarget ? Math.max(0, Math.min(1, counts.face / counts.faceTarget)) : 0;
    var label = counts.label || 'Cold door knocks';
    var svg = svgEl('svg', { viewBox: '0 0 200 200', role: 'img' });
    svg.setAttribute('aria-label', counts.face + ' of ' + counts.faceTarget + ' ' + label);
    var defs = svgEl('defs', {});
    var face = svgEl('radialGradient', { id: 'faceGrad', cx: '50%', cy: '42%', r: '62%' });
    face.appendChild(svgEl('stop', { offset: '0%', 'stop-color': '#32353c' }));
    face.appendChild(svgEl('stop', { offset: '58%', 'stop-color': '#14161a' }));
    face.appendChild(svgEl('stop', { offset: '100%', 'stop-color': '#090a0c' }));
    var rim = svgEl('linearGradient', { id: 'rimGrad', x1: '0', y1: '0', x2: '1', y2: '1' });
    rim.appendChild(svgEl('stop', { offset: '0%', 'stop-color': '#3fd6ff' }));
    rim.appendChild(svgEl('stop', { offset: '48%', 'stop-color': '#f2efe8' }));
    rim.appendChild(svgEl('stop', { offset: '100%', 'stop-color': '#ff3b30' }));
    defs.appendChild(face);
    defs.appendChild(rim);
    svg.appendChild(defs);
    svg.appendChild(svgEl('circle', { cx: cx, cy: cy, r: '90', fill: 'none', stroke: 'url(#rimGrad)', 'stroke-width': '2' }));
    svg.appendChild(svgEl('circle', { cx: cx, cy: cy, r: '78', fill: 'url(#faceGrad)' }));

    var i;
    for (i = 0; i <= 50; i += 1) {
      var t = i / 50;
      var deg = start + sweep * t;
      var major = i % 5 === 0;
      var a = pt(cx, cy, deg, major ? 80 : 83);
      var b = pt(cx, cy, deg, 90);
      svg.appendChild(svgEl('line', {
        x1: a[0].toFixed(2), y1: a[1].toFixed(2),
        x2: b[0].toFixed(2), y2: b[1].toFixed(2),
        stroke: t < 0.48 ? 'rgba(90,220,255,0.92)' : 'rgba(255,70,58,0.92)',
        'stroke-width': major ? '1.8' : '0.85'
      }));
    }

    var ang = start + sweep * pct;
    var tail = pt(cx, cy, ang, 10);
    var tip = pt(cx, cy, ang, 72);
    svg.appendChild(svgEl('line', {
      x1: tail[0].toFixed(2), y1: tail[1].toFixed(2),
      x2: tip[0].toFixed(2), y2: tip[1].toFixed(2),
      stroke: '#ff3b30', 'stroke-width': '2.6', 'stroke-linecap': 'round'
    }));
    svg.appendChild(svgEl('circle', { cx: cx, cy: cy, r: '30', fill: '#12090b', stroke: '#ff3b30', 'stroke-width': '1.6' }));
    var num = svgEl('text', {
      x: '100', y: '101', 'text-anchor': 'middle', 'dominant-baseline': 'central',
      fill: '#ff3b30', 'font-size': '28', 'font-family': 'Inter Tight, sans-serif', 'font-weight': '600'
    });
    num.textContent = String(counts.face);
    svg.appendChild(num);

    var zero = pt(cx, cy, start, 66);
    var hundred = pt(cx, cy, start + sweep, 66);
    var z = svgEl('text', { x: zero[0].toFixed(2), y: zero[1].toFixed(2), 'text-anchor': 'middle', fill: '#9aa1aa', 'font-size': '9', 'font-family': 'Inter Tight, sans-serif' });
    z.textContent = '0';
    var h = svgEl('text', { x: hundred[0].toFixed(2), y: hundred[1].toFixed(2), 'text-anchor': 'middle', fill: '#9aa1aa', 'font-size': '9', 'font-family': 'Inter Tight, sans-serif' });
    h.textContent = String(counts.faceTarget);
    svg.appendChild(z);
    svg.appendChild(h);

    var col = el('div', 'face-col');
    var wrap = el('div', 'face');
    wrap.appendChild(svg);
    col.appendChild(wrap);
    col.appendChild(el('p', 'face-cap', label));
    return col;
  }

  function sideDial(value, label) {
    var cx = 50;
    var cy = 50;
    var start = 210;
    var sweep = 300;
    var lit = value > 0 ? 0.34 : 0.08;
    var svg = svgEl('svg', { viewBox: '0 0 100 100', role: 'img' });
    svg.setAttribute('aria-label', value + ' ' + label);
    var i;
    for (i = 0; i <= 24; i += 1) {
      var t = i / 24;
      var deg = start + sweep * t;
      var a = pt(cx, cy, deg, i % 4 === 0 ? 34 : 36);
      var b = pt(cx, cy, deg, 42);
      svg.appendChild(svgEl('line', {
        x1: a[0].toFixed(2), y1: a[1].toFixed(2),
        x2: b[0].toFixed(2), y2: b[1].toFixed(2),
        stroke: 'rgba(240,162,2,0.8)',
        'stroke-width': i % 4 === 0 ? '1.5' : '0.75'
      }));
    }
    var ang = start + sweep * lit;
    var hub = pt(cx, cy, ang, 6);
    var tip = pt(cx, cy, ang, 30);
    svg.appendChild(svgEl('line', {
      x1: hub[0].toFixed(2), y1: hub[1].toFixed(2),
      x2: tip[0].toFixed(2), y2: tip[1].toFixed(2),
      stroke: '#f0a202', 'stroke-width': '2', 'stroke-linecap': 'round'
    }));
    svg.appendChild(svgEl('circle', { cx: cx, cy: cy, r: '14', fill: '#14120c', stroke: '#f0a202', 'stroke-width': '1.2' }));
    var num = svgEl('text', {
      x: '50', y: '51', 'text-anchor': 'middle', 'dominant-baseline': 'central',
      fill: '#f0a202', 'font-size': '16', 'font-family': 'Inter Tight, sans-serif', 'font-weight': '600'
    });
    num.textContent = String(value);
    svg.appendChild(num);
    var dial = el('div', 'side-dial');
    dial.appendChild(svg);
    var wrap = el('div', 'side ' + label.toLowerCase());
    wrap.appendChild(el('p', '', label));
    wrap.appendChild(dial);
    return wrap;
  }

  function kicker(tone, text) {
    var row = el('div', 'kicker ' + tone);
    row.appendChild(el('i', 'tri'));
    row.appendChild(el('span', '', text));
    row.appendChild(el('i', 'rule'));
    return row;
  }

  function chip(lead, className) {
    var node = el('button', className);
    node.type = 'button';
    node.setAttribute('data-lead', lead.id);
    var top = el('div', 'card-top');
    top.appendChild(el('b', '', chipLabel(lead)));
    node.appendChild(top);
    var next = el('div', 'card-next');
    next.appendChild(el('i', 'dot'));
    next.appendChild(el('span', '', verb(lead.nextStep || lead.action)));
    node.appendChild(next);
    return node;
  }

  function huntIcon(trade) {
    var svg = svgEl('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.7' });
    var t = trade.toLowerCase();
    if (t.indexOf('tree') === 0) {
      svg.appendChild(svgEl('path', { d: 'M12 21V10M8 14c2-4 8-4 8 0M9 10c2-4 6-4 6 1' }));
    } else if (t.indexOf('paint') === 0) {
      svg.appendChild(svgEl('path', { d: 'M4 16l8-8 4 4-8 8H4zM14 6l3-3 3 3-3 3' }));
    } else if (t.indexOf('security') === 0) {
      svg.appendChild(svgEl('path', { d: 'M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z' }));
    } else if (t.indexOf('remodel') === 0) {
      svg.appendChild(svgEl('path', { d: 'M4 20l8-8M14 6l4 4M9 5l2 2' }));
    } else {
      svg.appendChild(svgEl('path', { d: 'M4 20V10l8-6 8 6v10M10 20v-6h4v6' }));
    }
    return svg;
  }

  function renderDials() {
    var counts = state.data.counts;
    var root = document.getElementById('dials');
    clear(root);
    [[sideDial(counts.meetings, 'Meetings'), 'Meetings: ' + counts.meetings + ' reported. Open history', DailyBoard.meetings],
      [faceDial(counts), 'Door knocks: ' + counts.face + ' reported. Open visit history', DailyBoard.visits],
      [sideDial(counts.closes, 'Closes'), 'Closes: ' + counts.closes + ' reported. Open revenue details', DailyBoard.revenue]].forEach(function (item) {
        var button = el('button', 'dial-button'); button.type = 'button'; button.setAttribute('aria-label', item[1]);
        button.appendChild(item[0]); button.addEventListener('click', item[2]); root.appendChild(button);
      });
  }

  function renderHigh() {
    var root = document.getElementById('high-block');
    clear(root);
    root.appendChild(kicker('red', 'Hot'));
    var row = el('div', 'high-row');
    state.data.leads.filter(function (lead) { return lead.priority === 'High'; }).forEach(function (lead) {
      row.appendChild(chip(lead, 'hcard'));
    });
    root.appendChild(row);
  }

  function renderMedium() {
    var root = document.getElementById('med-block');
    clear(root);
    root.appendChild(kicker('amber', 'Warm'));
    var row = el('div', 'med-row');
    state.data.leads.filter(function (lead) { return lead.priority === 'Medium'; }).forEach(function (lead) {
      row.appendChild(chip(lead, 'mcard'));
    });
    root.appendChild(row);
  }

  function renderHunt() {
    var root = document.getElementById('hunt-block');
    clear(root);
    root.appendChild(kicker('amber', 'Where to hunt'));
    root.appendChild(el('p', 'hunt-note', 'Reported counts · tap for available records'));
    var wrap = el('div', 'pills');
    state.data.hunt.forEach(function (gap) {
      var pill = el('button', 'pill');
      pill.type = 'button';
      pill.addEventListener('click', function () { DailyBoard.directory(gap.trade); });
      pill.title = gap.cold + ' previously reported cold \u00b7 ' + gap.trade + '; open available records';
      pill.appendChild(huntIcon(gap.trade));
      pill.appendChild(el('b', '', String(gap.cold)));
      pill.appendChild(el('span', '', huntLabel(gap.trade)));
      wrap.appendChild(pill);
    });
    root.appendChild(wrap);
  }

  function sortedLeads() {
    var dir = ui.sortDir;
    return state.data.leads.slice().sort(function (a, b) {
      var av;
      var bv;
      if (ui.sortKey === 'priority') {
        av = RANK[a.priority];
        bv = RANK[b.priority];
      } else if (ui.sortKey === 'next') {
        av = String(a.nextStep || a.action || '').toLowerCase();
        bv = String(b.nextStep || b.action || '').toLowerCase();
      } else {
        av = String(a[ui.sortKey] || '').toLowerCase();
        bv = String(b[ui.sortKey] || '').toLowerCase();
      }
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return a.order - b.order;
    });
  }

  function renderSort() {
    var bar = document.getElementById('sortbar');
    clear(bar);
    var cols = [
      ['priority', 'Priority'],
      ['name', 'Name'],
      ['trade', 'Trade'],
      ['stage', 'Stage'],
      ['next', 'Next']
    ];
    cols.forEach(function (col) {
      var on = ui.sortKey === col[0];
      var btn = el('button', on ? 'on' : '');
      btn.type = 'button';
      btn.setAttribute('data-sort', col[0]);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.textContent = col[1] + (on && ui.sortDir === -1 ? ' (reverse)' : '');
      btn.title = 'Sort by ' + col[1].toLowerCase() + (on ? '; tap again to reverse' : '');
      bar.appendChild(btn);
    });
  }

  function renderPipe() {
    renderSort();
    document.getElementById('pipe-count').textContent = String(state.data.leads.length);
    var list = document.getElementById('pipe-list');
    clear(list);
    sortedLeads().forEach(function (lead) {
      var row = el('button', 'prow');
      row.type = 'button';
      row.setAttribute('data-lead', lead.id);
      row.appendChild(el('span', 'tag ' + lead.priority, DailyModel.temperature(lead.priority)));
      row.appendChild(el('span', 'who', lead.name));
      var meta = [lead.trade, lead.stage].filter(Boolean).join(' \u00b7 ');
      if (lead.contact) meta = (meta ? meta + ' \u00b7 ' : '') + lead.contact;
      row.appendChild(el('span', 'meta', meta));
      row.appendChild(el('span', 'step', lead.nextStep || lead.action || ''));
      list.appendChild(row);
    });
  }

  function fact(dl, label, value, href) {
    if (!value) return;
    var wrap = el('div');
    wrap.appendChild(el('dt', '', label));
    var dd = el('dd');
    if (href) {
      var link = el('a', '', value);
      link.href = href;
      if (href.indexOf('http') === 0) {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }
      dd.appendChild(link);
    } else {
      dd.textContent = value;
    }
    wrap.appendChild(dd);
    dl.appendChild(wrap);
  }

  function renderLead() {
    var sheet = document.getElementById('sheet-lead');
    var lead = ui.leadId ? findItem(ui.leadId) : null;
    if (!lead) {
      sheet.hidden = true;
      return;
    }
    sheet.hidden = false;
    document.getElementById('lead-pri').textContent = DailyModel.temperature(lead.priority);
    document.getElementById('lead-pri').className = 'sheet-meta tag ' + lead.priority;
    var body = document.getElementById('lead-body');
    clear(body);
    var card = el('div', 'lead');
    card.appendChild(el('h3', '', lead.name));
    card.id = 'lead-heading';
    var contact = el('p', 'contact', lead.contact || lead.trade || '');
    card.appendChild(contact);
    var dl = el('dl', 'facts');
    fact(dl, 'Stage', lead.stage);
    fact(dl, 'Next step', lead.nextStep || lead.action);
    fact(dl, 'Follow-up date', lead.nextDate || 'Not scheduled');
    fact(dl, 'History', lead.notes || 'Detailed history is not linked in this snapshot.');
    fact(dl, 'Phone', lead.phone, telHref(lead.phone));
    fact(dl, 'Email', lead.email, lead.email ? mailHref(lead) : '');
    if (lead.address) {
      fact(dl, isMailingBox(lead.address) ? 'Mailing' : 'Address', lead.address, mapsHref(lead));
    }
    card.appendChild(dl);

    var actions = el('div', 'lead-actions');
    var callHref = telHref(lead.phone);
    if (callHref) {
      var call = el('a', 'call', 'Call');
      call.href = callHref;
      actions.appendChild(call);
    } else {
      var dead = el('button', 'call', 'Call');
      dead.type = 'button';
      dead.disabled = true;
      dead.title = 'No phone on file';
      actions.appendChild(dead);
    }
    if (lead.email) {
      var mail = el('a', 'mail', 'Email'); mail.href = mailHref(lead); actions.appendChild(mail);
    } else {
      var noMail = el('button', 'mail', 'No email on file'); noMail.type = 'button'; noMail.disabled = true; actions.appendChild(noMail);
    }
    if (callHref && /if no answer/i.test(lead.nextStep || '')) {
      var sms = el('a', 'text-action', 'Text to arrange meeting'); sms.href = callHref.replace('tel:', 'sms:'); actions.appendChild(sms);
    }
    card.appendChild(actions);

    var script = el('div', 'script');
    script.appendChild(el('span', 'label', lead.priority === 'High' ? 'Call script \u00b7 close' : (lead.priority === 'Medium' ? 'Call script \u00b7 follow-up' : 'Call script \u00b7 cold')));
    script.appendChild(el('p', '', talkTrack(lead)));
    card.appendChild(script);
    body.appendChild(card);
  }

  function clusterTitle(group) {
    var springs = 0;
    var towns = {};
    group.forEach(function (place) {
      if (/Springs Fireplace/i.test(place.address || '')) springs += 1;
      var town = place.town || 'Hamptons';
      towns[town] = (towns[town] || 0) + 1;
    });
    if (springs >= Math.ceil(group.length * 0.6)) return 'Springs Fireplace';
    var best = 'Hamptons';
    var bestN = 0;
    Object.keys(towns).forEach(function (town) {
      if (towns[town] > bestN) { best = town; bestN = towns[town]; }
    });
    return best;
  }

  function pinColor(priority) {
    if (priority === 'High') return '#ff3b30';
    if (priority === 'Medium') return '#f0a202';
    if (priority === 'Visit') return '#3fd6ff';
    return '#d5d8de';
  }

  function renderClusters() {
    var row = document.getElementById('cluster-row');
    clear(row);
    ui.groups.forEach(function (group, index) {
      if (group.length < 2) return;
      var btn = el('button', 'cluster-chip' + (ui.cluster === index ? ' on' : ''));
      btn.type = 'button';
      btn.setAttribute('data-cluster', String(index));
      btn.appendChild(document.createTextNode(clusterTitle(group)));
      btn.appendChild(el('b', '', String(group.length)));
      row.appendChild(btn);
    });
    var note = document.getElementById('unpinned');
    var missing = state.data.mapMissing || [];
    if (!missing.length) {
      note.hidden = true;
      note.textContent = '';
      return;
    }
    note.hidden = false;
    note.textContent = 'Not pinned: ' + missing.slice(0, 3).map(function (item) {
      return item.name + (isMailingBox(item.address) ? ' (mailing box only)' : ' (no street pin)');
    }).join(', ') + (missing.length > 3 ? ' and ' + (missing.length - 3) + ' more. Open missing coordinates above.' : '.');
  }

  function showVisit(index) {
    ui.cluster = index;
    renderClusters();
    var panel = document.getElementById('visit-panel');
    var group = ui.groups[index];
    if (!group || group.length < 2) {
      panel.hidden = true;
      clear(panel);
      return;
    }
    panel.hidden = false;
    clear(panel);
    panel.appendChild(el('h3', '', 'Visit these ' + group.length));
    panel.appendChild(el('p', 'sub', clusterTitle(group) + ' \u00b7 tap an address for directions'));
    group.slice().sort(function (a, b) { return a.name.localeCompare(b.name); }).forEach(function (place) {
      var item = findItem(place.id) || place;
      var link = el('a', 'vrow');
      link.href = mapsHref(item);
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.appendChild(el('b', '', item.name));
      link.appendChild(el('span', '', item.address || 'Directions'));
      panel.appendChild(link);
    });
    if (mapState.map && window.L) {
      var bounds = window.L.latLngBounds(group.map(function (place) { return [place.lat, place.lng]; }));
      mapState.map.fitBounds(bounds, { padding: [36, 36], maxZoom: 15 });
    }
  }

  function popupFor(place) {
    var item = findItem(place.id) || place;
    var node = el('div', 'pin-pop');
    node.appendChild(el('b', '', item.name));
    var addr = el('a', 'addr', item.address || 'Directions');
    addr.href = mapsHref(item);
    addr.target = '_blank';
    addr.rel = 'noopener noreferrer';
    node.appendChild(addr);
    var actions = el('div', 'pop-actions');
    var open = el('button', '', 'Open');
    open.type = 'button';
    open.setAttribute('data-lead', item.id);
    actions.appendChild(open);
    var dir = el('a', 'dir', 'Directions');
    dir.href = mapsHref(item);
    dir.target = '_blank';
    dir.rel = 'noopener noreferrer';
    actions.appendChild(dir);
    node.appendChild(actions);
    return node;
  }

  function drawMarkers() {
    var L = window.L;
    if (!mapState.map || !L) return;
    if (!mapState.layer) mapState.layer = L.layerGroup().addTo(mapState.map);
    mapState.layer.clearLayers();
    var places = state.data.places || [];
    ui.groups = window.CRMModel && CRMModel.clusterPlaces ? CRMModel.clusterPlaces(places, 1) : [];
    places.forEach(function (place) {
      var marker = L.circleMarker([place.lat, place.lng], {
        radius: 7,
        color: '#f4f2ec',
        weight: 1.4,
        fillColor: pinColor(place.priority),
        fillOpacity: 0.95
      });
      marker.bindPopup(popupFor(place));
      marker.addTo(mapState.layer);
    });
    ui.groups.forEach(function (group, index) {
      if (group.length < 2) return;
      var lat = 0;
      var lng = 0;
      group.forEach(function (place) { lat += place.lat; lng += place.lng; });
      var icon = L.divIcon({
        className: 'cluster-pin',
        html: '<span>' + group.length + '</span>',
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });
      var badge = L.marker([lat / group.length, lng / group.length], { icon: icon, zIndexOffset: 400 });
      badge.on('click', function () { showVisit(index); });
      badge.addTo(mapState.layer);
    });
    renderClusters();
  }

  function ensureMap() {
    var L = window.L;
    var node = document.getElementById('map');
    if (!L || !node) return false;
    if (mapState.map) return true;
    mapState.map = L.map(node, { zoomControl: true, attributionControl: true, maxZoom: 16 });
    var tiles = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri, HERE, Garmin, &copy; OpenStreetMap',
      maxZoom: 16
    });
    var labels = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 16
    });
    tiles.on('tileload', function () { mapState.tilesOk = true; });
    tiles.on('tileerror', function () {
      if (mapState.tilesOk || mapState.tilesFailed) return;
      mapState.tilesFailed = true;
      document.getElementById('map-fallback').hidden = false;
    });
    tiles.addTo(mapState.map);
    labels.addTo(mapState.map);
    return true;
  }

  function renderMap() {
    var sheet = document.getElementById('sheet-map');
    sheet.hidden = !ui.map;
    if (!ui.map) return;
    if (!window.L) {
      document.getElementById('map').hidden = true;
      document.getElementById('map-fallback').hidden = false;
      ui.groups = window.CRMModel && CRMModel.clusterPlaces ? CRMModel.clusterPlaces(state.data.places || [], 1) : [];
      renderClusters();
      return;
    }
    setTimeout(function () {
      if (!ui.map) return;
      ensureMap();
      drawMarkers();
      mapState.map.invalidateSize();
      var places = state.data.places || [];
      if (places.length) {
        mapState.map.fitBounds(window.L.latLngBounds(places.map(function (place) {
          return [place.lat, place.lng];
        })), { padding: [28, 28], maxZoom: 13 });
      }
      if (ui.cluster >= 0) showVisit(ui.cluster);
    }, 40);
  }

  function syncSheets() {
    document.getElementById('sheet-pipe').hidden = !ui.pipe;
    if (ui.pipe) renderPipe();
    renderMap();
    renderLead();
  }

  function openPipe() {
    ui.pipe = true;
    ui.map = false;
    ui.cluster = -1;
    syncSheets();
    document.querySelector('#sheet-pipe .sheet-x').focus();
  }

  function openMap() {
    ui.map = true;
    ui.pipe = false;
    ui.cluster = -1;
    document.getElementById('visit-panel').hidden = true;
    syncSheets();
    document.querySelector('#sheet-map .sheet-x').focus();
  }

  function openLead(id) {
    ui.leadId = id;
    renderLead();
    document.querySelector('#sheet-lead .sheet-x').focus();
  }

  function closeSheet(which) {
    if (which === 'lead') ui.leadId = '';
    if (which === 'pipe') ui.pipe = false;
    if (which === 'map') {
      ui.map = false;
      ui.cluster = -1;
      document.getElementById('visit-panel').hidden = true;
    }
    syncSheets();
    var parent = document.querySelector('#sheet-daily:not([hidden]) .sheet-x') || document.querySelector('#sheet-pipe:not([hidden]) .sheet-x') || document.querySelector('#sheet-map:not([hidden]) .sheet-x') || document.getElementById('open-pipeline');
    parent.focus();
  }

  function toggleSort(key) {
    if (ui.sortKey === key) ui.sortDir = ui.sortDir === 1 ? -1 : 1;
    else {
      ui.sortKey = key;
      ui.sortDir = 1;
    }
    renderPipe();
  }

  function render() {
    DailyBoard.init(state.data, openLead);
    renderDials();
    renderHigh();
    renderMedium();
    renderHunt();
    syncSheets();
  }

  app.addEventListener('click', function (event) {
    var sort = event.target.closest('[data-sort]');
    if (sort) {
      toggleSort(sort.getAttribute('data-sort'));
      return;
    }
    var cluster = event.target.closest('[data-cluster]');
    if (cluster) {
      showVisit(Number(cluster.getAttribute('data-cluster')));
      return;
    }
    var closer = event.target.closest('[data-close]');
    if (closer) {
      closeSheet(closer.getAttribute('data-close'));
      return;
    }
    if (event.target.closest('#open-pipeline')) { openPipe(); return; }
    if (event.target.closest('#open-map')) { openMap(); return; }
    if (event.target.closest('#open-categories')) { DailyBoard.categories(); return; }
    var leadBtn = event.target.closest('[data-lead]');
    if (leadBtn) openLead(leadBtn.getAttribute('data-lead'));
  });

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape' || app.hidden) return;
    if (ui.leadId) closeSheet('lead');
    else if (ui.pipe) closeSheet('pipe');
    else if (ui.map) closeSheet('map');
  });

  document.getElementById('logout').addEventListener('click', function () {
    fetch('/api/crm?logout=1', { credentials: 'same-origin', cache: 'no-store' }).catch(function () {}).then(function () {
      state.data = null;
      DailyBoard.destroy();
      ui.pipe = false;
      ui.map = false;
      ui.leadId = '';
      ui.cluster = -1;
      passInput.value = '';
      showLock(false);
    });
  });

  document.getElementById('toggle-secret').addEventListener('click', function () {
    var show = passInput.type === 'password';
    passInput.type = show ? 'text' : 'password';
    this.textContent = show ? 'Hide' : 'Show';
  });

  lockForm.addEventListener('submit', function (event) {
    event.preventDefault();
    var key = passInput.value.trim();
    if (!key) {
      showError('Enter the passphrase.');
      return;
    }
    showError('');
    lockGo.textContent = 'Opening\u2026';
    openBoard(key, true);
  });

  var params = new URLSearchParams(location.search);
  var denied = params.get('denied') === '1';
  if (denied) {
    var clean = new URL(location.href);
    clean.searchParams.delete('denied');
    replaceUrl(clean);
  }
  var key = params.get('k') || params.get('key') || '';
  if (!window.CRMModel) {
    showLock(false);
    showError('The board did not load. Try again.');
  } else {
    openBoard(key, denied || !!key);
  }
})();
