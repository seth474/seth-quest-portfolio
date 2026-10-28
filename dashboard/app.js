(function () {
  'use strict';

  var lock = document.getElementById('lock');
  var lockWait = document.getElementById('lock-wait');
  var lockForm = document.getElementById('lock-form');
  var lockErr = document.getElementById('lock-err');
  var lockGo = document.getElementById('lock-go');
  var passInput = document.getElementById('pass');
  var app = document.getElementById('app');
  var state = { data: null, filter: 'All', q: '', done: {} };

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

  function filterFromHash() {
    var hash = (location.hash || '').replace('#', '').toLowerCase();
    if (hash === 'high') return 'High';
    if (hash === 'medium') return 'Medium';
    if (hash === 'low') return 'Low';
    return 'All';
  }

  function replaceUrl(url) {
    try { history.replaceState(null, '', url.pathname + url.search + url.hash); }
    catch (err) { /* file previews */ }
  }

  function writeHash(filter) {
    var url = new URL(location.href);
    url.hash = filter === 'All' ? '' : filter.toLowerCase();
    replaceUrl(url);
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
        state.filter = filterFromHash();
        lock.hidden = true;
        app.hidden = false;
        render();
      });
    }).catch(function () {
      showLock(false);
      showError('The board did not load. Try again.');
    });
  }

  function pill(priority) {
    return el('span', 'pill ' + priority, priority);
  }

  function renderStats() {
    var counts = state.data.counts;
    var stats = document.getElementById('stats');
    clear(stats);
    document.getElementById('asof').textContent = state.data.asOfLabel || '';

    var face = el('div', 'stat face');
    var row = el('div', 'face-row');
    row.appendChild(el('b', 'num', String(counts.face)));
    row.appendChild(el('span', 'denom', '/ ' + counts.faceTarget));
    face.appendChild(row);
    face.appendChild(el('span', 'lbl', 'Face conversations'));
    var scale = el('div', 'scale');
    scale.appendChild(el('span', '', '0'));
    var track = el('div', 'track');
    track.setAttribute('role', 'progressbar');
    track.setAttribute('aria-valuemin', '0');
    track.setAttribute('aria-valuemax', String(counts.faceTarget));
    track.setAttribute('aria-valuenow', String(counts.face));
    track.setAttribute('aria-label', 'Face conversations, 0 to ' + counts.faceTarget);
    var fill = el('span', 'fill');
    track.appendChild(fill);
    scale.appendChild(track);
    scale.appendChild(el('span', '', String(counts.faceTarget)));
    face.appendChild(scale);
    stats.appendChild(face);

    stats.appendChild(statButton(counts.high, 'High', 'to close', 'high' + (state.filter === 'High' ? ' on' : ''), 'High'));
    stats.appendChild(statBlock(counts.meetings, 'Meetings', ''));
    stats.appendChild(statBlock(counts.closes, 'Closes', counts.closes === 0 ? 'zero' : ''));

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        fill.style.width = Math.max(0, Math.min(100, counts.facePct)) + '%';
      });
    });
  }

  function statBlock(value, label, extra) {
    var node = el('div', 'stat' + (extra ? ' ' + extra : ''));
    node.appendChild(el('b', 'num', String(value)));
    node.appendChild(el('span', 'lbl', label));
    return node;
  }

  function statButton(value, label, sub, extra, filter) {
    var node = el('button', 'stat ' + extra);
    node.type = 'button';
    node.dataset.act = 'filter';
    node.dataset.filter = filter;
    node.appendChild(el('b', 'num', String(value)));
    node.appendChild(el('span', 'lbl', label));
    if (sub) node.appendChild(el('span', 'lbl sublbl', sub));
    node.setAttribute('aria-pressed', state.filter === filter ? 'true' : 'false');
    node.setAttribute('aria-label', 'Show ' + label + ' leads');
    return node;
  }

  function renderQueue() {
    var queue = state.data.queue;
    var root = document.getElementById('queue');
    clear(root);
    var nowId = '';
    queue.forEach(function (item) {
      if (!nowId && !state.done[item.id]) nowId = item.id;
    });
    queue.forEach(function (item, index) {
      var done = !!state.done[item.id];
      var card = el('article', 'q-card' + (item.id === nowId ? ' now' : '') + (done ? ' done' : ''));
      var check = el('button', 'check' + (done ? ' on' : ''));
      check.type = 'button';
      check.dataset.act = 'done';
      check.dataset.id = item.id;
      check.setAttribute('aria-pressed', done ? 'true' : 'false');
      check.setAttribute('aria-label', (done ? 'Uncheck ' : 'Check off ') + item.name);
      card.appendChild(check);

      var body = el('div', '');
      var top = el('div', 'q-top');
      var idx = el('span', 'idx', String(index + 1));
      if (item.id === nowId) idx.appendChild(el('span', 'now-pill', 'Now'));
      top.appendChild(idx);
      top.appendChild(pill(item.priority));
      body.appendChild(top);

      if (item.kind === 'lead') {
        var name = el('button', 'co', item.name);
        name.type = 'button';
        name.dataset.act = 'show';
        name.dataset.id = item.id;
        body.appendChild(name);
      } else {
        body.appendChild(el('h3', 'co', item.name));
      }

      var who = [item.contact, item.trade].filter(Boolean).join(' · ');
      if (who) body.appendChild(el('p', 'who', who));
      if (item.action) body.appendChild(el('p', 'action', item.action));
      var href = telHref(item.phone);
      if (href) {
        var call = el('a', 'call', item.phone);
        call.href = href;
        body.appendChild(call);
      } else if (item.kind === 'lead') {
        body.appendChild(el('p', 'no-num', 'No number yet'));
      }
      card.appendChild(body);
      root.appendChild(card);
    });
    document.getElementById('clear-done').hidden = !Object.keys(state.done).length;
  }

  function matches(lead) {
    if (state.filter !== 'All' && lead.priority !== state.filter) return false;
    var q = state.q.trim().toLowerCase();
    if (!q) return true;
    return [lead.name, lead.trade, lead.contact, lead.stage, lead.action, lead.priority]
      .join(' ')
      .toLowerCase()
      .indexOf(q) !== -1;
  }

  function renderFilters() {
    var counts = state.data.counts;
    var filters = [
      ['All', counts.total],
      ['High', counts.high],
      ['Medium', counts.medium],
      ['Low', counts.low]
    ];
    var root = document.getElementById('filters');
    clear(root);
    filters.forEach(function (pair) {
      var button = el('button', 'chip', pair[0] + ' ' + pair[1]);
      button.type = 'button';
      button.dataset.act = 'filter';
      button.dataset.filter = pair[0];
      button.setAttribute('aria-pressed', state.filter === pair[0] ? 'true' : 'false');
      root.appendChild(button);
    });
  }

  function renderPipe() {
    var leads = state.data.leads.filter(matches);
    var root = document.getElementById('pipe');
    var meta = document.getElementById('pipe-meta');
    clear(root);
    var noun = state.filter === 'All' ? 'leads' : state.filter;
    meta.textContent = leads.length + ' ' + noun + (state.q.trim() ? ' match' : '');

    if (!leads.length) {
      root.appendChild(el('p', 'empty', 'Nothing in this cut.'));
      return;
    }

    var groups = state.filter === 'All' ? ['High', 'Medium', 'Low'] : [state.filter];
    groups.forEach(function (priority) {
      var group = leads.filter(function (lead) { return lead.priority === priority; });
      if (!group.length) return;
      if (state.filter === 'All') {
        root.appendChild(el('h3', 'group-label ' + priority, priority + ' · ' + group.length));
      }
      group.forEach(function (lead) { root.appendChild(leadCard(lead)); });
    });
  }

  function leadCard(lead) {
    var card = el('article', 'lead ' + lead.priority);
    card.id = 'lead-' + lead.id;
    var top = el('div', 'card-top');
    top.appendChild(el('p', 'trade', lead.trade || 'Lead'));
    top.appendChild(pill(lead.priority));
    card.appendChild(top);
    card.appendChild(el('h3', '', lead.name));
    if (lead.contact) card.appendChild(el('p', 'who', lead.contact));
    if (lead.stage) card.appendChild(el('p', 'stage', lead.stage));
    if (lead.action) card.appendChild(el('p', 'action', lead.action));
    var href = telHref(lead.phone);
    if (href) {
      var call = el('a', 'call', lead.phone);
      call.href = href;
      card.appendChild(call);
    } else {
      card.appendChild(el('p', 'no-num', 'No number yet'));
    }
    return card;
  }

  function renderHunt() {
    var hunt = state.data.hunt;
    var root = document.getElementById('hunt');
    clear(root);
    var maxCold = 1;
    hunt.forEach(function (gap) { if (gap.cold > maxCold) maxCold = gap.cold; });
    hunt.forEach(function (gap) {
      var card = el('article', 'hunt');
      var top = el('div', 'hunt-top');
      top.appendChild(el('h3', '', gap.trade));
      top.appendChild(el('b', 'cold', String(gap.cold)));
      card.appendChild(top);
      card.appendChild(el('p', '', gap.cold + ' cold · ' + gap.pct + '% in motion'));
      var bar = el('div', 'hbar');
      bar.setAttribute('aria-hidden', 'true');
      var fill = el('span', '');
      bar.appendChild(fill);
      card.appendChild(bar);
      root.appendChild(card);
      requestAnimationFrame(function () {
        fill.style.width = Math.round((gap.cold / maxCold) * 100) + '%';
      });
    });
    document.getElementById('rules').textContent = state.data.priorityRules || '';
  }

  function render() {
    renderStats();
    renderQueue();
    renderFilters();
    renderPipe();
    renderHunt();
  }

  function markHighStat() {
    var high = document.querySelector('.stat.high');
    if (!high) return;
    var on = state.filter === 'High';
    high.classList.toggle('on', on);
    high.setAttribute('aria-pressed', on ? 'true' : 'false');
  }

  function setFilter(filter) {
    state.filter = filter;
    writeHash(filter);
    markHighStat();
    renderFilters();
    renderPipe();
  }

  function showLead(id) {
    state.filter = 'All';
    state.q = '';
    document.getElementById('search').value = '';
    writeHash('All');
    markHighStat();
    renderFilters();
    renderPipe();
    var card = document.getElementById('lead-' + id);
    if (!card) return;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    card.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    card.classList.remove('flash');
    void card.offsetWidth;
    card.classList.add('flash');
  }

  document.getElementById('app').addEventListener('click', function (event) {
    var target = event.target.closest('[data-act]');
    if (!target || !state.data) return;
    var act = target.dataset.act;
    if (act === 'filter') setFilter(target.dataset.filter);
    if (act === 'done') {
      var id = target.dataset.id;
      if (state.done[id]) delete state.done[id];
      else state.done[id] = 1;
      writeDone();
      renderQueue();
    }
    if (act === 'show') showLead(target.dataset.id);
  });

  document.getElementById('search').addEventListener('input', function (event) {
    state.q = event.target.value || '';
    renderPipe();
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
