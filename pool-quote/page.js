(function () {
  var ISSUES = [
    { id: 'green', label: 'Green water', name: 'Green water treatment', detail: 'Shock, brush, and algaecide.', low: 220, high: 340 },
    { id: 'cloudy', label: 'Cloudy water', name: 'Cloudy water clear-up', detail: 'Filter service and clarifier.', low: 140, high: 210 },
    { id: 'algae', label: 'Algae on the walls', name: 'Algae scrub', detail: 'Walls, waterline, and a follow-up check.', low: 160, high: 260 },
    { id: 'debris', label: 'Leaves and debris', name: 'Debris removal', detail: 'Skim, vacuum, and empty the baskets.', low: 90, high: 150 },
    { id: 'equipment', label: 'Equipment problem', name: 'Equipment check', detail: 'Pump, filter, and timer.', low: 110, high: 190 },
    { id: 'opening', label: 'Opening', name: 'Pool opening', detail: 'Cover off, equipment on, first chemistry.', low: 280, high: 420 },
    { id: 'closing', label: 'Closing', name: 'Pool closing', detail: 'Lower the water, blow the lines, cover on.', low: 260, high: 400 },
    { id: 'leak', label: 'Possible leak', name: 'Leak look', detail: 'A first pass for where the water is going.', low: 180, high: 320 }
  ];
  var VISIT = { name: 'Same-day visit', detail: 'A tech comes today.', low: 89, high: 129 };
  var picked = {};
  var photoUrl = '';
  var hasVoice = false;
  var recorder = null;
  var recStream = null;
  var chunks = [];

  var chips = document.getElementById('chips');
  ISSUES.forEach(function (item) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip';
    btn.textContent = item.label;
    btn.setAttribute('aria-pressed', 'false');
    btn.addEventListener('click', function () {
      picked[item.id] = !picked[item.id];
      btn.setAttribute('aria-pressed', picked[item.id] ? 'true' : 'false');
    });
    chips.appendChild(btn);
  });

  function show(id) {
    ['stepPhoto', 'stepIssues', 'stepNote', 'stepDraft', 'stepQuote', 'stepReview'].forEach(function (key) {
      document.getElementById(key).hidden = key !== id;
    });
    var names = { stepPhoto: 'Photo', stepIssues: 'Issues', stepNote: 'Note', stepDraft: 'Quote', stepQuote: 'Quote', stepReview: 'Review' };
    document.getElementById('steps').textContent = 'Photo · Issues · Note · Quote · Review · Now: ' + names[id];
    window.scrollTo(0, 0);
  }
  function money(n) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
  }
  function chosen() {
    return ISSUES.filter(function (item) { return picked[item.id]; });
  }
  function lines() {
    return [VISIT].concat(chosen());
  }
  function rangeText(list) {
    var low = 0;
    var high = 0;
    list.forEach(function (item) { low += item.low; high += item.high; });
    return money(low) + '–' + money(high);
  }
  function renderLines(list, ul) {
    ul.innerHTML = list.map(function (item) {
      return '<li><b>' + item.name + '</b><span>' + item.detail + '</span><em>' + money(item.low) + '–' + money(item.high) + '</em></li>';
    }).join('');
  }

  document.getElementById('photo').addEventListener('change', function () {
    var file = this.files && this.files[0];
    document.getElementById('photoErr').textContent = '';
    if (!file) return;
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    photoUrl = URL.createObjectURL(file);
    var img = document.getElementById('preview');
    img.src = photoUrl;
    img.hidden = false;
  });

  document.getElementById('toIssues').addEventListener('click', function () {
    if (!photoUrl) {
      document.getElementById('photoErr').textContent = 'Add a photo of the pool first.';
      return;
    }
    show('stepIssues');
  });
  document.getElementById('backPhoto').addEventListener('click', function () { show('stepPhoto'); });
  document.getElementById('toNote').addEventListener('click', function () {
    if (!chosen().length) {
      document.getElementById('issueErr').textContent = 'Pick at least one issue.';
      return;
    }
    document.getElementById('issueErr').textContent = '';
    show('stepNote');
  });
  function stopRecording() {
    if (recorder && recorder.state === 'recording') recorder.stop();
  }
  document.getElementById('backIssues').addEventListener('click', function () {
    stopRecording();
    show('stepIssues');
  });

  var recBtn = document.getElementById('recBtn');
  recBtn.addEventListener('click', function () {
    document.getElementById('recErr').textContent = '';
    if (recorder && recorder.state === 'recording') {
      recorder.stop();
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof MediaRecorder === 'undefined') {
      document.getElementById('recErr').textContent = 'This browser has no microphone recording. Type the note instead.';
      return;
    }
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      recStream = stream;
      chunks = [];
      recorder = new MediaRecorder(stream);
      recorder.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
      recorder.onstop = function () {
        recStream.getTracks().forEach(function (track) { track.stop(); });
        var blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        var player = document.getElementById('player');
        player.src = URL.createObjectURL(blob);
        player.hidden = false;
        hasVoice = true;
        recBtn.textContent = 'Record again';
        recBtn.setAttribute('aria-pressed', 'false');
        document.getElementById('recHint').textContent = 'Voice note ready. It stays on this phone.';
      };
      recorder.start();
      recBtn.textContent = 'Stop recording';
      recBtn.setAttribute('aria-pressed', 'true');
      document.getElementById('recHint').textContent = 'Recording… tap stop when you are done.';
    }).catch(function () {
      document.getElementById('recErr').textContent = 'Microphone is blocked. Type the note instead.';
    });
  });

  document.getElementById('toQuote').addEventListener('click', function () {
    stopRecording();
    show('stepDraft');
    var lead = document.getElementById('draftLead');
    var title = document.getElementById('draftTitle');
    title.textContent = 'Drafting the quote.';
    lead.textContent = 'Reading the photo and the issues you picked.';
    window.setTimeout(function () { lead.textContent = 'Pricing the same-day visit.'; }, 700);
    window.setTimeout(function () {
      var list = lines();
      var names = chosen().map(function (item) { return item.label.toLowerCase(); });
      var note = document.getElementById('note').value.trim();
      var sentence = 'Draft for ' + names.join(', ') + '.';
      if (note) sentence += ' Note: “' + note + '”.';
      if (hasVoice) sentence += ' A voice note is attached for the reviewer.';
      document.getElementById('quoteLead').textContent = sentence;
      renderLines(list, document.getElementById('lines'));
      document.getElementById('range').innerHTML = '<b>Price range</b><strong>' + rangeText(list) + '</strong>';
      show('stepQuote');
    }, 1500);
  });

  document.getElementById('backNote').addEventListener('click', function () { show('stepNote'); });
  document.getElementById('toReview').addEventListener('click', function () {
    var list = lines();
    var photo = document.getElementById('reviewPhoto');
    photo.src = photoUrl;
    photo.hidden = false;
    document.getElementById('reviewIssues').textContent = 'Issues: ' + chosen().map(function (item) { return item.label; }).join(', ') + '.';
    var note = document.getElementById('note').value.trim();
    var bits = [];
    if (note) bits.push('Note: ' + note);
    if (hasVoice) bits.push('Voice note attached.');
    if (!bits.length) bits.push('No written note or voice note.');
    document.getElementById('reviewNote').textContent = bits.join(' ');
    renderLines(list, document.getElementById('reviewLines'));
    document.getElementById('reviewRange').innerHTML = '<b>Price range</b><strong>' + rangeText(list) + '</strong>';
    document.getElementById('approveBox').hidden = false;
    document.getElementById('done').hidden = true;
    show('stepReview');
  });
  document.getElementById('backQuote').addEventListener('click', function () { show('stepQuote'); });
  document.getElementById('approve').addEventListener('click', function () {
    document.getElementById('approveBox').hidden = true;
    document.getElementById('done').hidden = false;
  });
})();
