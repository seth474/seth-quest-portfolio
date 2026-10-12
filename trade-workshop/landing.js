(function () {
  var info = window.WORKSHOP_APPLY();
  var t = info.trade;
  var vid = document.getElementById('wsVid'), playBtn = document.getElementById('wsPlay');
  if (vid && playBtn) {
    playBtn.addEventListener('click', function () {
      vid.muted = false;
      vid.controls = true;
      playBtn.hidden = true;
      var pending = vid.play();
      if (pending && pending.catch) pending.catch(function () { playBtn.hidden = false; vid.controls = false; });
    });
  }
  var W = window.WORKSHOP;
  var md = new Date(W.START).toLocaleString('en-US', { timeZone: 'America/New_York', month: 'long', day: 'numeric' });
  [].forEach.call(document.querySelectorAll('[data-when="md"]'), function (el) { el.textContent = md; });

  var FORM = 'https://formspree.io/f/meaonlel'; /* same Formspree form as /make-more-money */
  function bindForm(ids, position) {
    var f = document.getElementById(ids.form), er = document.getElementById(ids.err), b = document.getElementById(ids.btn);
    function val(id) { return document.getElementById(id).value.trim(); }
    function bad(id, msg) { document.getElementById(id).classList.add('bad'); document.getElementById(id).focus(); er.textContent = msg; }
    f.addEventListener('submit', function (e) {
      e.preventDefault(); er.textContent = '';
      [].forEach.call(f.querySelectorAll('.fld'), function (x) { x.classList.remove('bad'); });
      var n = val(ids.n), bz = val(ids.b), p = val(ids.p), em = val(ids.e), dg = p.replace(/[^0-9]/g, ''), sms = document.getElementById(ids.sms).checked;
      if (!n) return bad(ids.n, 'Add your first name.');
      if (!bz) return bad(ids.b, 'Add your business name.');
      if (!(dg.length === 10 || (dg.length === 11 && dg[0] === '1'))) return bad(ids.p, 'Add a 10-digit cell number.');
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(em)) return bad(ids.e, 'Add a real email so I can send the Zoom link.');
      b.disabled = true; b.textContent = 'Saving your seat\u2026';
      var payload = {
        _subject: 'WORKSHOP SIGNUP (' + t.tag + '): ' + n + ' (' + bz + ')',
        type: 'Workshop signup',
        trade: t.tag,
        form_position: position,
        source: location.origin + t.path,
        workshop: W.TITLE + ' | ' + W.full,
        name: n, business: bz, phone: p, email: em,
        sms_consent: sms ? 'yes' : 'no',
        sms_consent_text: sms ? document.getElementById(ids.smsTxt).textContent : '',
        signed_up_at: new Date().toISOString()
      };
      fetch(FORM, { method: 'POST', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        .then(function (r) { if (!r.ok) throw 0; location.href = t.path + '/registered?n=' + encodeURIComponent(n); })
        .catch(function () { b.disabled = false; b.textContent = 'Save my seat. It\u2019s free.'; er.textContent = 'That didn\u2019t go through. Text or call 934-899-0796 and I\u2019ll save your seat.'; });
    });
  }
  bindForm({ form: 'wsF1', err: 'wsErr1', btn: 'wsBtn1', n: 'wsN1', b: 'wsB1', p: 'wsP1', e: 'wsE1', sms: 'wsS1', smsTxt: 'smsTxt1' }, 'top');
  bindForm({ form: 'wsF2', err: 'wsErr2', btn: 'wsBtn2', n: 'wsN2', b: 'wsB2', p: 'wsP2', e: 'wsE2', sms: 'wsS2', smsTxt: 'smsTxt2' }, 'bottom');
})();
