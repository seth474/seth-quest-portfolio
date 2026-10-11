/* Fills the shared landing and thank-you templates from the trade config for this URL. */
(function () {
  function text(id, value) {
    var el = document.getElementById(id);
    if (el && value != null) el.textContent = value;
  }
  function setMeta(attr, key, value) {
    if (!value) return;
    var el = document.querySelector('meta[' + attr + '="' + key + '"]');
    if (el) el.setAttribute('content', value);
  }
  window.WORKSHOP_APPLY = function () {
    var info = window.WORKSHOP_PAGE();
    var t = info.trade;
    var W = window.WORKSHOP;
    W.TITLE = t.calendarTitle;
    W.DETAILS = t.details;
    W.pageUrl = 'https://sethquest.com' + t.path;
    W.trade = t;
    document.title = info.registered
      ? 'You\u2019re registered \u2014 ' + t.tag + ' workshop'
      : t.pageTitle;
    document.body.setAttribute('data-trade', t.tag);
    setMeta('name', 'description', t.description);
    setMeta('property', 'og:title', t.ogTitle);
    setMeta('property', 'og:description', t.ogDescription);
    text('eyebrow', t.eyebrow);
    text('jobsLine', t.sectionTitle);
    text('hostCopy', t.host);
    text('auditLine', t.audit);
    var ul = document.getElementById('learn');
    if (ul) {
      ul.textContent = '';
      t.bullets.forEach(function (pair) {
        var li = document.createElement('li');
        var b = document.createElement('b');
        b.textContent = pair[0];
        li.appendChild(b);
        li.appendChild(document.createTextNode(' ' + pair[1]));
        ul.appendChild(li);
      });
    }
    var vid = document.getElementById('wsVid');
    if (vid && t.video) {
      vid.setAttribute('poster', t.poster);
      var source = vid.querySelector('source');
      if (source) source.setAttribute('src', t.video);
      vid.load();
    }
    var sms = document.getElementById('smsSeth');
    if (sms) {
      sms.setAttribute('href', 'sms:+19348990796?&body=' + encodeURIComponent(
        'Hey Seth, I\u2019m signed up for the ' + t.smsName + ' workshop and I\u2019d like a free sales funnel audit. My business is: '
      ));
    }
    return info;
  };
})();
