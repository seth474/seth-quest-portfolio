/* ==== WORKSHOP EVENT: change the date, time or Zoom link here, nowhere else ====
   START is Eastern time with its UTC offset: -04:00 until Nov 1 (EDT), -05:00 after (EST).
   ZOOM: paste the real Zoom link when it exists. While it's '', pages say the link comes by email. */
window.WORKSHOP = {
  START: '2026-10-21T19:00:00-04:00',
  MINUTES: 30,
  ZOOM: '',
  TITLE: 'Free workshop: how Hamptons HVAC companies stop losing jobs',
  DETAILS: 'Free 30-minute workshop with Seth Quest for Hamptons HVAC company owners: missed calls, slow quotes, follow-up, your Google Business Profile, and where new leads come from.'
};
(function (W) {
  var start = new Date(W.START), end = new Date(start.getTime() + W.MINUTES * 60000);
  var tz = { timeZone: 'America/New_York' };
  function f(o) { return start.toLocaleString('en-US', Object.assign({}, tz, o)); }
  W.day = f({ weekday: 'long' });
  W.date = f({ month: 'long', day: 'numeric', year: 'numeric' });
  W.shortDate = f({ weekday: 'short', month: 'short', day: 'numeric' });
  W.time = f({ hour: 'numeric', minute: '2-digit' }) + ' ET';
  W.full = W.day + ', ' + W.date + ', ' + W.time;
  function z(d) { return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); }
  W.zStart = z(start); W.zEnd = z(end);
  W.where = W.ZOOM || 'Zoom (link sent by email)';
  W.past = Date.now() > end.getTime();
  function fillText() {
    [].forEach.call(document.querySelectorAll('[data-w]'), function (el) {
      var k = el.getAttribute('data-w');
      if (W[k] != null) el.textContent = W[k];
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fillText); else fillText();
})(window.WORKSHOP);
