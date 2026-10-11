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
  var FORM = 'https://formspree.io/f/meaonlel'; /* same Formspree form as /make-more-money */
  var W = window.WORKSHOP;
  var f = document.getElementById('wsF'), er = document.getElementById('wsErr'), b = document.getElementById('wsBtn');
  function v(id) { return document.getElementById(id).value.trim(); }
  f.addEventListener('submit', function (e) {
    e.preventDefault(); er.textContent = '';
    [].forEach.call(f.querySelectorAll('.fld'), function (x) { x.classList.remove('bad'); });
    var n = v('wsN'), bz = v('wsB'), p = v('wsP'), em = v('wsE'), dg = p.replace(/[^0-9]/g, ''), sms = document.getElementById('wsS').checked;
    function bad(id, msg) { document.getElementById(id).classList.add('bad'); document.getElementById(id).focus(); er.textContent = msg; }
    if (!n) return bad('wsN', 'Add your first name.');
    if (!bz) return bad('wsB', 'Add your business name.');
    if (!(dg.length === 10 || (dg.length === 11 && dg[0] === '1'))) return bad('wsP', 'Add a 10-digit cell number.');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(em)) return bad('wsE', 'Add a real email so I can send the Zoom link.');
    b.disabled = true; b.textContent = 'Saving your seat\u2026';
    var payload = {
      _subject: 'WORKSHOP SIGNUP (' + t.tag + '): ' + n + ' (' + bz + ')',
      type: 'Workshop signup',
      trade: t.tag,
      source: location.origin + t.path,
      workshop: W.TITLE + ' | ' + W.full,
      name: n, business: bz, phone: p, email: em,
      sms_consent: sms ? 'yes' : 'no',
      sms_consent_text: sms ? document.getElementById('smsTxt').textContent : '',
      signed_up_at: new Date().toISOString()
    };
    fetch(FORM, { method: 'POST', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      .then(function (r) { if (!r.ok) throw 0; location.href = t.path + '/registered?n=' + encodeURIComponent(n); })
      .catch(function () { b.disabled = false; b.textContent = 'Save my seat. It\u2019s free.'; er.textContent = 'That didn\u2019t go through. Text or call 934-899-0796 and I\u2019ll save your seat.'; });
  });
})();
