(function () {
  var FORM = 'https://formspree.io/f/meaonlel'; /* same Formspree form as the workshop */
  function bindForm(ids, position) {
    var f = document.getElementById(ids.form), er = document.getElementById(ids.err), b = document.getElementById(ids.btn);
    function val(id) { return document.getElementById(id).value.trim(); }
    function bad(id, msg) {
      document.getElementById(id).classList.add('bad');
      document.getElementById(id).focus();
      er.textContent = msg;
    }
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      er.textContent = '';
      [].forEach.call(f.querySelectorAll('.fld'), function (x) { x.classList.remove('bad'); });
      var n = val(ids.n), bz = val(ids.b), tr = val(ids.t), p = val(ids.p), em = val(ids.e), rev = val(ids.r);
      var dg = p.replace(/[^0-9]/g, '');
      if (!n) return bad(ids.n, 'Add your name.');
      if (!bz) return bad(ids.b, 'Add your business name.');
      if (!tr) return bad(ids.t, 'Choose your trade.');
      if (!(dg.length === 10 || (dg.length === 11 && dg[0] === '1'))) return bad(ids.p, 'Add a 10-digit phone number.');
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(em)) return bad(ids.e, 'Add a real email.');
      if (!rev) return bad(ids.r, 'Choose a revenue range.');
      b.disabled = true;
      b.textContent = 'Sending\u2026';
      var payload = {
        _subject: 'ALL IN ON AI (10 DAYS): ' + n + ' (' + bz + ')',
        type: 'AI Install booking',
        form_position: position,
        source: location.origin + '/ai-install',
        name: n,
        business: bz,
        trade: tr,
        phone: p,
        email: em,
        revenue: rev,
        offer: 'All In on AI in 10 Days',
        price: '$5,000 ($2,500 to start, $2,500 on day 10)',
        signed_up_at: new Date().toISOString()
      };
      fetch(FORM, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (r) {
        if (!r.ok) throw 0;
        f.hidden = true;
        document.getElementById(ids.done).hidden = false;
      }).catch(function () {
        b.disabled = false;
        b.textContent = 'Book my install';
        er.textContent = 'That didn\u2019t go through. Call or text 934-899-0796 and Seth will book it.';
      });
    });
  }
  bindForm({ form: 'inF1', err: 'inErr1', btn: 'inBtn1', done: 'inDone1', n: 'inN1', b: 'inB1', t: 'inT1', p: 'inP1', e: 'inE1', r: 'inR1' }, 'top');
  bindForm({ form: 'inF2', err: 'inErr2', btn: 'inBtn2', done: 'inDone2', n: 'inN2', b: 'inB2', t: 'inT2', p: 'inP2', e: 'inE2', r: 'inR2' }, 'bottom');
})();
