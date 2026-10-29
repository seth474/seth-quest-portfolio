(function () {
  'use strict';

  var lock = document.getElementById('lock');
  var lockWait = document.getElementById('lock-wait');
  var lockForm = document.getElementById('lock-form');
  var lockErr = document.getElementById('lock-err');
  var lockGo = document.getElementById('lock-go');
  var passInput = document.getElementById('pass');
  var app = document.getElementById('app');
  var state = { data: null, done: {} };
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

  function doneKey(asOf) { return 'sq-dash-done:' + (asOf || 'board'); }

  function readDone(asOf) {
    try {
      var raw = JSON.parse(localStorage.getItem(doneKey(asOf)) || '{}');
      return raw && typeof raw === 'object' ? raw : {};
    } catch (err) {
      return {};
    }
  }

  function writeDone() {
    try { localStorage.setItem(doneKey(state.data.asOf), JSON.stringify(state.done)); }
    catch (err) { /* private mode */ }
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
    if (key.indexOf('treewise') === 0) return 'Treewise';
    if (key.indexOf('soundsense') === 0) return 'SoundSense';
    if (key.indexOf('humble') === 0) return 'Humble Abode';
    return name;
  }

  function pickContact(lead) {
    var parts = String(lead.contact || '').split(/[\/,&]/).map(function (part) { return part.trim(); }).filter(Boolean);
    var key = keyName(lead.name);
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

  function whoLine(item) {
    var who = pickContact(item);
    return [who, item.action].filter(Boolean).join(' · ');
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
        state.done = readDone(data.asOf);
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

  function dial(spec) {
    var r = 36;
    var c = 2 * Math.PI * r;
    var full = c * 0.75;
    var pct = spec.max ? Math.max(0, Math.min(1, spec.value / spec.max)) : 0;
    var svg = svgEl('svg', { viewBox: '0 0 100 100', class: 'gauge ' + (spec.tone || ''), role: 'img' });
    svg.setAttribute('aria-label', spec.label);
    function ring(cls, dash, offset) {
      var circle = svgEl('circle', {
        cx: '50', cy: '50', r: String(r), class: cls, fill: 'none',
        'stroke-width': spec.face ? '5' : '4', 'stroke-linecap': 'round',
        'stroke-dasharray': dash, transform: 'rotate(135 50 50)'
      });
      if (offset) circle.setAttribute('stroke-dashoffset', offset);
      return circle;
    }
    svg.appendChild(ring('track', full + ' ' + c));
    if (spec.face) {
      var zone = full * 0.18;
      svg.appendChild(ring('zone', zone + ' ' + c, String(-(full - zone))));
      var i;
      for (i = 0; i <= 10; i += 1) {
        var theta = (225 + 270 * (i / 10)) * Math.PI / 180;
        var inner = 31;
        var outer = 34.5;
        svg.appendChild(svgEl('line', {
          x1: String(50 + Math.sin(theta) * inner),
          y1: String(50 - Math.cos(theta) * inner),
          x2: String(50 + Math.sin(theta) * outer),
          y2: String(50 - Math.cos(theta) * outer),
          class: 'tick' + (i >= 8 ? ' hot' : '')
        }));
      }
      var needleAt = (225 + 270 * pct) * Math.PI / 180;
      svg.appendChild(svgEl('line', {
        x1: '50', y1: '50',
        x2: String(50 + Math.sin(needleAt) * 26),
        y2: String(50 - Math.cos(needleAt) * 26),
        class: 'needle'
      }));
    }
    svg.appendChild(svgEl('circle', { cx: '50', cy: '50', r: '24', class: 'glass' }));
    var value = ring('value', '0 ' + c);
    svg.appendChild(value);

    var wrap = el('div', 'dial' + (spec.face ? ' face' : '') + (spec.value === 0 ? ' zero' : ''));
    wrap.appendChild(svg);
    var readout = el('div', 'readout');
    readout.appendChild(el('b', '', spec.read));
    if (spec.sub) readout.appendChild(el('span', '', spec.sub));
    wrap.appendChild(readout);
    wrap.appendChild(el('p', 'dial-lbl', spec.caption));
    requestAnimationFrame(function () {
      var lit = spec.max ? pct : (spec.value > 0 ? 0.42 : 0);
      value.setAttribute('stroke-dasharray', (full * lit) + ' ' + c);
    });
    return wrap;
  }

  function renderDials() {
    var counts = state.data.counts;
    var root = document.getElementById('dials');
    clear(root);
    document.getElementById('asof').textContent = state.data.asOfLabel || '';
    root.appendChild(dial({
      face: true,
      tone: '',
      value: counts.face,
      max: counts.faceTarget,
      read: String(counts.face),
      sub: '/ ' + counts.faceTarget,
      caption: 'Face',
      label: counts.face + ' of ' + counts.faceTarget + ' face conversations'
    }));
    root.appendChild(dial({
      tone: '',
      value: counts.meetings,
      max: 0,
      read: String(counts.meetings),
      caption: 'Meetings',
      label: counts.meetings + ' meetings'
    }));
    root.appendChild(dial({
      tone: 'red',
      value: counts.closes,
      max: 0,
      read: String(counts.closes),
      caption: 'Closes',
      label: counts.closes + ' closes'
    }));
  }

  function renderChips() {
    var root = document.getElementById('chips');
    clear(root);
    ['High', 'Medium'].forEach(function (priority) {
      var row = el('div', 'chip-row');
      row.appendChild(el('span', 'chip-tag ' + (priority === 'High' ? 'high' : 'med'), priority === 'High' ? 'HIGH' : 'MED'));
      state.data.leads.filter(function (lead) { return lead.priority === priority; }).forEach(function (lead) {
        var button = el('button', 'chip' + (priority === 'Medium' ? ' med' : ''), chipLabel(lead));
        button.type = 'button';
        button.dataset.act = 'flash';
        button.dataset.id = lead.id;
        button.title = lead.name + (lead.contact ? ' · ' + lead.contact : '');
        row.appendChild(button);
      });
      root.appendChild(row);
    });
  }

  function renderQueue() {
    var queue = state.data.queue;
    var root = document.getElementById('queue');
    clear(root);
    var nowId = '';
    queue.forEach(function (item) {
      if (!nowId && !state.done[item.id]) nowId = item.id;
    });
    queue.forEach(function (item) {
      var done = !!state.done[item.id];
      var row = el('li', 'row ' + item.priority + (item.id === nowId ? ' now' : '') + (done ? ' done' : ''));
      row.id = 'row-' + item.id;
      var tick = el('button', 'tick' + (done ? ' on' : ''));
      tick.type = 'button';
      tick.dataset.act = 'done';
      tick.dataset.id = item.id;
      tick.setAttribute('aria-pressed', done ? 'true' : 'false');
      tick.setAttribute('aria-label', (done ? 'Uncheck ' : 'Check off ') + item.name);
      row.appendChild(tick);
      var name = el('div', 'row-name');
      if (item.id === nowId) name.appendChild(el('span', 'now-tag', 'NOW'));
      name.appendChild(document.createTextNode(item.name));
      row.appendChild(name);
      row.appendChild(el('div', 'row-meta', whoLine(item)));
      var href = telHref(item.phone);
      if (href) {
        var call = el('a', 'call', 'Call');
        call.href = href;
        row.appendChild(call);
      } else if (item.kind === 'lead') {
        row.appendChild(el('span', 'call none', 'No #'));
      }
      root.appendChild(row);
    });
    document.getElementById('clear-done').hidden = !Object.keys(state.done).length;
  }

  function renderHunt() {
    var hunt = state.data.hunt;
    var root = document.getElementById('hunt');
    clear(root);
    var maxCold = 1;
    hunt.forEach(function (gap) { if (gap.cold > maxCold) maxCold = gap.cold; });
    hunt.forEach(function (gap) {
      var card = el('div', 'gap');
      card.appendChild(el('b', '', String(gap.cold)));
      card.appendChild(el('span', '', gap.trade));
      var bar = el('div', 'hbar');
      var fill = el('i', '');
      bar.appendChild(fill);
      card.appendChild(bar);
      root.appendChild(card);
      requestAnimationFrame(function () {
        fill.style.width = Math.round((gap.cold / maxCold) * 100) + '%';
      });
    });
  }

  function render() {
    renderDials();
    renderChips();
    renderQueue();
    renderHunt();
  }

  function flashRow(id) {
    var row = document.getElementById('row-' + id);
    if (!row) return;
    row.classList.remove('lit');
    void row.offsetWidth;
    row.classList.add('lit');
  }

  app.addEventListener('click', function (event) {
    var target = event.target.closest('[data-act]');
    if (!target || !state.data) return;
    if (target.dataset.act === 'done') {
      var id = target.dataset.id;
      if (state.done[id]) delete state.done[id];
      else state.done[id] = 1;
      writeDone();
      renderQueue();
    }
    if (target.dataset.act === 'flash') flashRow(target.dataset.id);
  });

  document.getElementById('clear-done').addEventListener('click', function () {
    state.done = {};
    writeDone();
    renderQueue();
  });

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
