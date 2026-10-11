(function () {
  window.WORKSHOP_APPLY();
  var W = window.WORKSHOP;
  /* personal greeting from ?n=FirstName (set by the signup form) */
  var n = (new URLSearchParams(location.search).get('n') || '').trim().slice(0, 30);
  if (n) {
    var h = document.getElementById('hi');
    h.textContent = 'You\u2019re registered, ' + n;
    var g = document.createElement('span');
    g.className = 'g';
    g.textContent = '.';
    h.appendChild(g);
  }
  if (W.ZOOM) {
    var z = document.getElementById('zoomLine');
    z.textContent = 'Zoom link: ';
    var a = document.createElement('a');
    a.href = W.ZOOM;
    a.textContent = W.ZOOM;
    a.target = '_blank';
    a.rel = 'noopener';
    z.appendChild(a);
  }
  var desc = W.DETAILS + '\n\nJoin: ' + (W.ZOOM || 'Zoom link coming by email.') + '\n\nQuestions? Text Seth: 934-899-0796';
  function esc(s) { return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n'); }
  var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Seth Quest//Workshop//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
    'UID:workshop-' + W.trade.id + '-' + W.zStart + '@sethquest.com', 'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''),
    'DTSTART:' + W.zStart, 'DTEND:' + W.zEnd, 'SUMMARY:' + esc(W.TITLE), 'DESCRIPTION:' + esc(desc), 'LOCATION:' + esc(W.where),
    'URL:' + W.pageUrl, 'BEGIN:VALARM', 'TRIGGER:-PT1H', 'ACTION:DISPLAY', 'DESCRIPTION:' + esc(W.TITLE), 'END:VALARM',
    'BEGIN:VALARM', 'TRIGGER:-PT10M', 'ACTION:DISPLAY', 'DESCRIPTION:' + esc(W.TITLE), 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  document.getElementById('icsBtn').href = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics);
  document.getElementById('gcalBtn').href = 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
    '&text=' + encodeURIComponent(W.TITLE) + '&dates=' + W.zStart + '/' + W.zEnd + '&details=' + encodeURIComponent(desc) + '&location=' + encodeURIComponent(W.where);
})();
