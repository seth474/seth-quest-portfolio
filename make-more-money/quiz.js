/* 20-question sales funnel quiz. Scoring lives in audit.js. */
(function () {
  var FORM = 'https://formspree.io/f/meaonlel';
  var M = window.MOREAudit;
  if (!M) return;
  var A = {};
  var qi = 0;
  var phase = 'q';
  var lead = null;
  var sent = false;
  var qz = document.getElementById('qz');
  var body = document.getElementById('qzBody');
  var bar = document.getElementById('qzBar');
  var nav = document.getElementById('qzNav');
  var back = document.getElementById('qzBack');
  var next = document.getElementById('qzNext');
  if (!document.getElementById('moreAuditCss')) {
    var st = document.createElement('style');
    st.id = 'moreAuditCss';
    st.textContent = M.css;
    document.head.appendChild(st);
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function questions() { return M.active(A); }
  function optsFor(q) {
    if (q.from === 'sources') {
      var src = null;
      M.Q.forEach(function (x) { if (x.id === 'sources') src = x; });
      var sel = A.sources || [];
      var opts = (src && src.opts || []).filter(function (o) { return sel.indexOf(o[0]) >= 0; });
      if (A.top && opts.every(function (o) { return o[0] !== A.top; })) delete A.top;
      return opts;
    }
    return q.opts || [];
  }
  function openQ() {
    qz.hidden = false;
    qz.classList.toggle('wide', phase === 'results');
    document.documentElement.style.overflow = 'hidden';
    render();
    setTimeout(function () { var x = document.getElementById('qzX'); if (x) x.focus(); }, 30);
  }
  function closeQ() { qz.hidden = true; qz.classList.remove('wide'); document.documentElement.style.overflow = ''; }
  document.querySelectorAll('[data-quiz]').forEach(function (b) { b.addEventListener('click', function (e) { e.preventDefault(); openQ(); }); });
  document.getElementById('qzX').addEventListener('click', closeQ);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !qz.hidden) closeQ(); });
  function progress() {
    var n = Math.max(questions().length, 1);
    var p = phase === 'q' ? qi / n : 1;
    bar.style.width = (p * 100) + '%';
  }
  function render() {
    progress();
    nav.hidden = phase === 'results';
    back.disabled = phase === 'q' && qi === 0;
    qz.classList.toggle('wide', phase === 'results');
    if (phase === 'q') renderQ();
    else if (phase === 'gate') renderGate();
    else renderResults();
  }
  function renderQ() {
    var qs = questions();
    if (qi >= qs.length) { phase = 'gate'; render(); return; }
    var q = qs[qi];
    var opts = optsFor(q);
    var h = '<h2 class="qz-q" id="qzT">' + esc(q.q) + '</h2>' + (q.h ? '<p class="qz-h">' + esc(q.h) + '</p>' : '<p class="qz-h"></p>');
    if (q.type === 'select') {
      h += '<select class="qz-sel" id="qzSel" aria-label="' + esc(q.q) + '"><option value="">Choose one</option>' +
        q.opts.map(function (o) { return '<option value="' + esc(o) + '"' + (A[q.id] === o ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select>';
    } else if (!opts.length) {
      h += '<p class="qz-h">Go back and pick at least one source.</p>';
    } else {
      var multi = q.type === 'multi';
      var cur = A[q.id] || (multi ? [] : '');
      h += '<div class="qz-opts" role="' + (multi ? 'group' : 'radiogroup') + '">' + opts.map(function (o) {
        var on = multi ? cur.indexOf(o[0]) >= 0 : cur === o[0];
        return '<button type="button" class="qz-o' + (multi ? ' multi' : '') + '" data-v="' + esc(o[0]) + '" role="' + (multi ? 'checkbox' : 'radio') + '" aria-checked="' + (on ? 'true' : 'false') + '"><span class="bx"></span>' + esc(o[1]) + '</button>';
      }).join('') + '</div>';
    }
    h += '<div class="qz-err" id="qzErr"></div>';
    body.innerHTML = h;
    next.textContent = qi === questions().length - 1 ? 'See my results' : 'Next';
    if (q.type === 'select') {
      document.getElementById('qzSel').addEventListener('change', function () { A[q.id] = this.value; });
    } else {
      body.querySelectorAll('.qz-o').forEach(function (b) {
        b.addEventListener('click', function () {
          var v = b.getAttribute('data-v');
          if (q.type === 'multi') {
            var a = A[q.id] || [];
            var k = a.indexOf(v);
            if (k < 0) a.push(v); else a.splice(k, 1);
            A[q.id] = a;
            b.setAttribute('aria-checked', k < 0 ? 'true' : 'false');
          } else {
            A[q.id] = v;
            body.querySelectorAll('.qz-o').forEach(function (x) { x.setAttribute('aria-checked', x === b ? 'true' : 'false'); });
            setTimeout(function () {
              var now = questions()[qi];
              if (phase === 'q' && now && now.id === q.id) go(1);
            }, 220);
          }
        });
      });
    }
  }
  function renderGate() {
    body.innerHTML = '<h2 class="qz-q" id="qzT">See your results.</h2><p class="qz-h">Your numbers show up right after this. Seth gets a copy too, so you can go through it on a call.</p>' +
      '<form class="qz-gate" id="qzGate" novalidate>' +
      '<input class="fld" id="gN" autocomplete="given-name" placeholder="First name" aria-label="First name" value="' + esc(lead && lead.name || '') + '">' +
      '<input class="fld" id="gB" autocomplete="organization" placeholder="Business name" aria-label="Business name" value="' + esc(lead && lead.business || '') + '">' +
      '<input class="fld" id="gP" type="tel" inputmode="tel" autocomplete="tel" placeholder="Cell phone" aria-label="Cell phone" value="' + esc(lead && lead.phone || '') + '">' +
      '<input class="fld" id="gE" type="email" inputmode="email" autocomplete="email" placeholder="Email" aria-label="Email" value="' + esc(lead && lead.email || '') + '">' +
      '<div class="qz-err" id="qzErr"></div><p class="qz-fine">No spam. No pitch you did not ask for.</p></form>';
    next.textContent = 'Show my results';
    document.getElementById('qzGate').addEventListener('submit', function (e) { e.preventDefault(); go(1); });
  }
  function fileName() {
    var s = String((lead && lead.business) || 'funnel').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 40) || 'funnel';
    return 'MORE-funnel-audit-' + s + '.html';
  }
  function downloadReport() {
    var blob = new Blob([M.reportDocument(lead, A)], { type: 'text/html' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileName();
    document.body.appendChild(a);
    a.click();
    a.remove();
    var n = document.getElementById('qrNote');
    if (n) n.textContent = 'Report downloaded. Seth has your answers too.';
  }
  function printReport() {
    var w = window.open('', 'moreprint');
    if (!w) { downloadReport(); return; }
    w.document.open();
    w.document.write(M.reportDocument(lead, A));
    w.document.close();
    setTimeout(function () { try { w.focus(); w.print(); } catch (e) { downloadReport(); } }, 300);
  }
  function renderResults() {
    body.innerHTML = M.resultsInner(A, lead && lead.business);
    var book = document.getElementById('qrBook');
    if (book) book.addEventListener('click', function () {
      closeQ();
      var h = document.querySelector('.hcta');
      if (h) h.click();
      var n = document.getElementById('bkN');
      var c = document.getElementById('bkC');
      if (n && !n.value) n.value = lead.name || '';
      if (c && !c.value) c.value = lead.phone || '';
    });
    var em = document.getElementById('qrEmail');
    if (em) em.addEventListener('click', downloadReport);
    var pr = document.getElementById('qrPrint');
    if (pr) pr.addEventListener('click', printReport);
    body.scrollTop = 0;
  }
  function err(t) { var e = document.getElementById('qzErr'); if (e) e.textContent = t; }
  function answered(q) {
    if (q.type === 'multi') return (A[q.id] || []).length > 0;
    if (q.type === 'select') return !!A[q.id];
    if (q.from === 'sources' && !optsFor(q).length) return false;
    return !!A[q.id];
  }
  function go(d) {
    if (d > 0 && phase === 'q') {
      var q = questions()[qi];
      if (!q) { phase = 'gate'; render(); return; }
      if (!answered(q)) { err(q.type === 'multi' ? 'Pick at least one to keep going.' : 'Pick an answer to keep going.'); return; }
      if (qi >= questions().length - 1) { phase = 'gate'; render(); body.scrollTop = 0; return; }
      qi += 1;
      render();
      body.scrollTop = 0;
      return;
    }
    if (d > 0 && phase === 'gate') {
      var n = document.getElementById('gN').value.trim();
      var b = document.getElementById('gB').value.trim();
      var p = document.getElementById('gP').value.trim();
      var pd = p.replace(/[^0-9]/g, '');
      var em = document.getElementById('gE').value.trim();
      lead = { name: n, business: b, phone: p, email: em };
      if (!n || !b) { err('Add your first name and business.'); return; }
      if (!/^[0-9+().\-\s]+$/.test(p) || !(pd.length === 10 || (pd.length === 11 && pd[0] === '1'))) { err('Add a cell number (10 digits).'); return; }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { err('Add your email.'); return; }
      phase = 'results';
      render();
      send();
      return;
    }
    if (d < 0) {
      if (phase === 'results') { phase = 'gate'; sent = false; render(); body.scrollTop = 0; return; }
      if (phase === 'gate') { phase = 'q'; qi = Math.max(0, questions().length - 1); render(); body.scrollTop = 0; return; }
      qi = Math.max(0, qi - 1);
      render();
      body.scrollTop = 0;
    }
  }
  back.addEventListener('click', function () { go(-1); });
  next.addEventListener('click', function () { go(1); });
  function reportLink() {
    var data = { v: 3, t: Date.now(), c: { n: lead.name, b: lead.business, p: lead.phone, e: lead.email }, a: A };
    var b64 = btoa(unescape(encodeURIComponent(JSON.stringify(data)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    var base = /(^|\.)sethquest\.com$/.test(location.hostname) ? 'https://sethquest.com/make-more-money/report' : (location.origin + '/make-more-money/report.html');
    return base + '#' + b64;
  }
  function send() {
    if (sent || !lead) return;
    sent = true;
    var r = M.compute(A);
    var payload = {
      _subject: 'Funnel audit: ' + lead.business + ' (' + lead.name + ')',
      name: lead.name,
      business: lead.business,
      phone: lead.phone,
      email: lead.email,
      trade: A.trade || '',
      busy_month: r.tight ? 'Tight funnel' : ('$' + r.total),
      share: r.share + '%',
      per_lead: r.perLead,
      hours: r.hours,
      highlighted: r.top.join(' | '),
      Report: M.reportText(lead, A),
      'View full report': reportLink(),
      source: 'sethquest.com/make-more-money quiz'
    };
    var el = function () { return document.getElementById('qrSent'); };
    fetch(FORM, { method: 'POST', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      .then(function (x) { if (!x.ok) throw 0; if (el()) el().textContent = 'Seth got a copy of your results.'; })
      .catch(function () { if (el()) el().textContent = 'Could not send your copy to Seth. Text or call 934-899-0796 and he will go through it with you.'; });
  }
})();
