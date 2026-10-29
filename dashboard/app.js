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
  var NS = 'http://www.w3.org/2000/svg';

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
    for (i = 0; i < parts.length; i += 1) {
      if (key.indexOf(keyName(parts[i])) !== -1) return parts[i].split(' ')[0];
    }
    return parts.length ? parts[0].split(' ')[0] : '';
  }

  function chipLabel(lead) {
    var business = shortBusiness(lead.name);
    if (lead.priority !== 'High') return business;
    var who = pickContact(lead);
    return who ? who + ' · ' + business : business;
  }

  function verb(text, phone) {
    var t = String(text || '').toLowerCase();
    if (/collect|finish site/.test(t)) return 'Collect';
    if (/nudge|reply/.test(t)) return 'Nudge';
    if (/meet/.test(t)) return 'Meet';
    if (/visit|door|in-person|close/.test(t)) return phone ? 'Call' : 'Visit';
    if (/email/.test(t) && !/not email/.test(t)) return 'Email';
    if (/call|phone/.test(t)) return 'Call';
    if (phone) return 'Call';
    return 'Next';
  }

  function huntLabel(trade) {
    var t = String(trade || '');
    if (t.length > 18) return t.replace(' & smart home', '').replace(' management', '');
    return t;
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
    var svg = svgEl('svg', { viewBox: '0 0 200 200', role: 'img' });
    svg.setAttribute('aria-label', counts.face + ' of ' + counts.faceTarget + ' face conversations');
    var defs = svgEl('defs', {});
    var face = svgEl('radialGradient', { id: 'faceGrad', cx: '50%', cy: '42%', r: '62%' });
    face.appendChild(svgEl('stop', { offset: '0%', 'stop-color': '#3a3d44' }));
    face.appendChild(svgEl('stop', { offset: '55%', 'stop-color': '#16181c' }));
    face.appendChild(svgEl('stop', { offset: '100%', 'stop-color': '#0a0b0d' }));
    var rim = svgEl('linearGradient', { id: 'rimGrad', x1: '0', y1: '0', x2: '1', y2: '0' });
    rim.appendChild(svgEl('stop', { offset: '0%', 'stop-color': '#3fd6ff' }));
    rim.appendChild(svgEl('stop', { offset: '48%', 'stop-color': '#f2efe8' }));
    rim.appendChild(svgEl('stop', { offset: '100%', 'stop-color': '#ff3b30' }));
    defs.appendChild(face);
    defs.appendChild(rim);
    svg.appendChild(defs);
    svg.appendChild(svgEl('circle', { cx: cx, cy: cy, r: '78', fill: 'url(#faceGrad)' }));
    svg.appendChild(svgEl('circle', { cx: cx, cy: cy, r: '70', fill: 'none', stroke: 'rgba(255,255,255,0.05)', 'stroke-width': '1' }));
    svg.appendChild(svgEl('circle', { cx: cx, cy: cy, r: '92', fill: 'none', stroke: 'url(#rimGrad)', 'stroke-width': '1.6' }));

    var i;
    for (i = 0; i <= 62; i += 1) {
      var t = i / 62;
      var deg = start + sweep * t;
      var major = i % 6 === 0;
      var a = pt(cx, cy, deg, major ? 80 : 83);
      var b = pt(cx, cy, deg, 90);
      svg.appendChild(svgEl('line', {
        x1: a[0].toFixed(2), y1: a[1].toFixed(2),
        x2: b[0].toFixed(2), y2: b[1].toFixed(2),
        stroke: t < 0.48 ? 'rgba(90,220,255,0.9)' : 'rgba(255,70,58,0.92)',
        'stroke-width': major ? '1.7' : '0.8'
      }));
    }
    var ang = start + sweep * pct;
    var tail = pt(cx, cy, ang, 16);
    var tip = pt(cx, cy, ang, 58);
    svg.appendChild(svgEl('line', {
      x1: tail[0].toFixed(2), y1: tail[1].toFixed(2), x2: tip[0].toFixed(2), y2: tip[1].toFixed(2),
      stroke: '#ff3b30', 'stroke-width': '2.4', 'stroke-linecap': 'round'
    }));
    svg.appendChild(svgEl('circle', { cx: cx, cy: cy, r: '5', fill: '#1a1c20', stroke: '#ff3b30', 'stroke-width': '1.6' }));
    var zero = pt(cx, cy, start, 68);
    var hundred = pt(cx, cy, start + sweep, 68);
    var z = svgEl('text', { x: zero[0].toFixed(2), y: zero[1].toFixed(2), 'text-anchor': 'middle', fill: '#9aa1aa', 'font-size': '9', 'font-family': 'Inter Tight, sans-serif' });
    z.textContent = '0';
    var h = svgEl('text', { x: hundred[0].toFixed(2), y: hundred[1].toFixed(2), 'text-anchor': 'middle', fill: '#9aa1aa', 'font-size': '9', 'font-family': 'Inter Tight, sans-serif' });
    h.textContent = '100';
    svg.appendChild(z);
    svg.appendChild(h);

    var wrap = el('div', 'face');
    wrap.appendChild(svg);
    var copy = el('div', 'face-copy');
    copy.appendChild(el('b', '', String(counts.face)));
    copy.appendChild(el('div', 'of', 'of ' + counts.faceTarget));
    copy.appendChild(el('div', 'cap', 'Face conversations'));
    wrap.appendChild(copy);
    return wrap;
  }

  function sideDial(value, label) {
    var cx = 50;
    var cy = 50;
    var start = 210;
    var sweep = 300;
    var lit = value > 0 ? 0.34 : 0.02;
    var svg = svgEl('svg', { viewBox: '0 0 100 100', role: 'img' });
    svg.setAttribute('aria-label', value + ' ' + label);
    var i;
    for (i = 0; i <= 28; i += 1) {
      var t = i / 28;
      var deg = start + sweep * t;
      var a = pt(cx, cy, deg, i % 4 === 0 ? 36 : 38);
      var b = pt(cx, cy, deg, 44);
      svg.appendChild(svgEl('line', {
        x1: a[0].toFixed(2), y1: a[1].toFixed(2),
        x2: b[0].toFixed(2), y2: b[1].toFixed(2),
        stroke: 'rgba(240,162,2,0.75)',
        'stroke-width': i % 4 === 0 ? '1.4' : '0.7'
      }));
    }
    var hub = pt(cx, cy, start + sweep * lit, 22);
    var tip = pt(cx, cy, start + sweep * lit, 36);
    svg.appendChild(svgEl('line', {
      x1: hub[0].toFixed(2), y1: hub[1].toFixed(2),
      x2: tip[0].toFixed(2), y2: tip[1].toFixed(2),
      stroke: '#f0a202', 'stroke-width': '2', 'stroke-linecap': 'round'
    }));
    var num = svgEl('text', {
      x: '50', y: '56', 'text-anchor': 'middle', fill: '#f0a202',
      'font-size': '32', 'font-family': 'Inter Tight, sans-serif', 'font-weight': '600'
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

  function chev() {
    return el('span', 'chev', '\u203a');
  }

  function card(className, title, nextText, href) {
    var node = href ? el('a', className) : el('div', className);
    if (href) node.href = href;
    var top = el('div', 'card-top');
    top.appendChild(el('b', '', title));
    top.appendChild(chev());
    node.appendChild(top);
    var next = el('div', 'card-next');
    next.appendChild(el('i', 'dot'));
    next.appendChild(el('span', '', 'Next: ' + nextText));
    node.appendChild(next);
    return node;
  }

  function icon(kind) {
    var wrap = el('span', 'nicon');
    var svg = svgEl('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.7' });
    if (kind === 'phone') {
      svg.appendChild(svgEl('path', { d: 'M8 4h3l1 4-2 1a12 12 0 0 0 5 5l1-2 4 1v3a2 2 0 0 1-2 2A14 14 0 0 1 6 6a2 2 0 0 1 2-2z' }));
    } else if (kind === 'mail') {
      svg.appendChild(svgEl('rect', { x: '3', y: '5', width: '18', height: '14', rx: '2' }));
      svg.appendChild(svgEl('path', { d: 'M3 7l9 7 9-7' }));
    } else {
      svg.appendChild(svgEl('path', { d: 'M6 16.5A7 7 0 1 1 12 20H7z' }));
    }
    wrap.appendChild(svg);
    return wrap;
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
    root.appendChild(sideDial(counts.meetings, 'Meetings'));
    root.appendChild(faceDial(counts));
    root.appendChild(sideDial(counts.closes, 'Closes'));
  }

  function renderHigh() {
    var root = document.getElementById('high-block');
    clear(root);
    root.appendChild(kicker('red', 'High'));
    var row = el('div', 'high-row');
    state.data.leads.filter(function (lead) { return lead.priority === 'High'; }).forEach(function (lead) {
      var href = telHref(lead.phone);
      row.appendChild(card('hcard', chipLabel(lead), verb(lead.action, href), href));
    });
    root.appendChild(row);
  }

  function renderMedium() {
    var root = document.getElementById('med-block');
    clear(root);
    var leads = state.data.leads.filter(function (lead) { return lead.priority === 'Medium'; });
    root.appendChild(kicker('amber', 'Medium'));
    var row = el('div', 'med-row');
    var pair = leads.filter(function (lead) { return keyName(lead.name).indexOf('hvac') !== 0; });
    var hvac = leads.filter(function (lead) { return keyName(lead.name).indexOf('hvac') === 0; });
    if (pair.length) {
      var title = pair.map(function (lead) { return shortBusiness(lead.name); }).join(', ');
      var href = telHref(pair[0].phone);
      row.appendChild(card('mcard', title, verb(pair[0].action, href), href));
    }
    hvac.forEach(function (lead) {
      var href = telHref(lead.phone);
      var node = card('mcard slim', shortBusiness(lead.name), verb(lead.action, href), href);
      row.appendChild(node);
    });
    root.appendChild(row);
  }

  function renderNext() {
    var root = document.getElementById('next-block');
    clear(root);
    root.appendChild(kicker('ink', 'Do next'));
    var highs = state.data.leads.filter(function (lead) { return lead.priority === 'High'; });
    var mediums = state.data.leads.filter(function (lead) { return lead.priority === 'Medium' && keyName(lead.name).indexOf('hvac') !== 0; });
    var items = highs.slice(0, 2).map(function (lead) {
      return { lead: lead, label: verb(lead.action, telHref(lead.phone)) + ' ' + chipLabel(lead) };
    });
    if (mediums.length) {
      items.push({
        lead: mediums[0],
        label: verb(mediums[0].action, telHref(mediums[0].phone)) + ' ' + mediums.map(function (lead) { return shortBusiness(lead.name); }).join(', ')
      });
    }
    var list = el('div', 'next-list');
    items.forEach(function (item) {
      var href = telHref(item.lead.phone);
      var kind = /nudge|email/i.test(item.label) ? 'mail' : (href ? 'phone' : 'chat');
      var row = href ? el('a', 'nrow') : el('div', 'nrow');
      if (href) row.href = href;
      row.appendChild(icon(kind));
      row.appendChild(el('span', 'nlabel', item.label));
      row.appendChild(chev());
      list.appendChild(row);
    });
    root.appendChild(list);
  }

  function renderHunt() {
    var root = document.getElementById('hunt-block');
    clear(root);
    root.appendChild(kicker('amber', 'Where to hunt'));
    var wrap = el('div', 'pills');
    state.data.hunt.forEach(function (gap) {
      var pill = el('div', 'pill');
      pill.title = gap.cold + ' cold · ' + gap.trade;
      pill.appendChild(huntIcon(gap.trade));
      pill.appendChild(el('b', '', String(gap.cold)));
      pill.appendChild(el('span', '', huntLabel(gap.trade)));
      wrap.appendChild(pill);
    });
    root.appendChild(wrap);
  }

  function render() {
    renderDials();
    renderHigh();
    renderMedium();
    renderNext();
    renderHunt();
  }

  document.getElementById('logout').addEventListener('click', function () {
    fetch('/api/crm?logout=1', { credentials: 'same-origin', cache: 'no-store' }).catch(function () {}).then(function () {
      state.data = null;
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
    lockGo.textContent = 'Opening…';
    openBoard(key, true);
  });

  var params = new URLSearchParams(location.search);
  var key = params.get('k') || params.get('key') || '';
  if (!window.CRMModel) {
    showLock(false);
    showError('The board did not load. Try again.');
  } else {
    openBoard(key, !!key);
  }
})();
