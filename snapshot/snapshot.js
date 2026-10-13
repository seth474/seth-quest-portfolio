(function () {
  var cfg = window.SNAPSHOT;
  if (!cfg) return;
  var state = load();
  var app = document.getElementById('app');

  function load() {
    var blank = { values: {}, touched: {}, scenarioOn: false };
    try {
      var raw = localStorage.getItem(cfg.storageKey);
      if (!raw) return blank;
      var parsed = JSON.parse(raw);
      parsed.values = parsed.values || {};
      parsed.touched = parsed.touched || {};
      return parsed;
    } catch (e) {
      return blank;
    }
  }
  function save() {
    try { localStorage.setItem(cfg.storageKey, JSON.stringify(state)); } catch (e) {}
    var note = document.getElementById('savedNote');
    if (note) note.textContent = 'Saved on this computer.';
  }
  function fieldList() {
    var list = [];
    cfg.sections.forEach(function (section) {
      section.fields.forEach(function (field) {
        if (field.type === 'mix') field.items.forEach(function (item) { list.push(item.id); });
        else if (field.type === 'channels') {
          field.channels.forEach(function (ch) {
            list.push('spend_' + ch.id);
            list.push('new_' + ch.id);
          });
        } else list.push(field.id);
      });
    });
    list.push('scenarioNew');
    return list;
  }
  function gauge() {
    var nodes = [].slice.call(document.querySelectorAll('[data-question]'));
    var total = 0;
    var answered = 0;
    nodes.forEach(function (el) {
      if (el.hidden || (el.closest && el.closest('[hidden]'))) return;
      total += 1;
      var ok = false;
      if (el.type === 'range') ok = !!state.touched[el.dataset.question];
      else ok = String(el.value || '').trim() !== '';
      if (ok) answered += 1;
    });
    var goal = document.getElementById('snapshot');
    var scrollPct = 0;
    if (goal) {
      var docTop = goal.getBoundingClientRect().top + window.scrollY;
      var threshold = Math.max(1, docTop - 90);
      scrollPct = Math.min(1, window.scrollY / threshold);
    }
    var answerPct = total ? answered / total : 0;
    var fill = Math.round((answerPct * 0.75 + scrollPct * 0.25) * 100);
    var oil = document.getElementById('oilFill');
    if (oil) {
      var inner = 32;
      var h = inner * fill / 100;
      oil.setAttribute('y', String(22 + (inner - h)));
      oil.setAttribute('height', String(h));
    }
    var pct = document.getElementById('gaugePct');
    if (pct) pct.firstChild.nodeValue = fill + '%';
    var live = document.getElementById('gaugeLive');
    if (live) live.textContent = 'Snapshot ' + fill + ' percent filled. ' + answered + ' of ' + total + ' questions answered.';
    var note = document.getElementById('gaugeNote');
    if (note) note.textContent = answered + ' of ' + total + ' questions answered. The tank also rises as you move down the page.';
  }
  function readInputs() {
    document.querySelectorAll('[data-question]').forEach(function (el) {
      if (el.type === 'range' && !state.touched[el.dataset.question]) {
        state.values[el.dataset.question] = '';
        return;
      }
      state.values[el.dataset.question] = el.value;
    });
  }
  function paint() {
    readInputs();
    var out = cfg.compute(state.values);
    Object.keys(out.text).forEach(function (key) {
      var node = document.querySelector('[data-out="' + key + '"]');
      if (node) node.textContent = out.text[key];
    });
    var ratio = document.getElementById('ratioCard');
    if (ratio) {
      ratio.classList.remove('is-target', 'is-below');
      if (out.ratioState === 'target') ratio.classList.add('is-target');
      if (out.ratioState === 'below') ratio.classList.add('is-below');
    }
    (out.channels || []).forEach(function (row) {
      var node = document.querySelector('[data-channel-cac="' + row.id + '"]');
      if (node) node.textContent = row.cac;
    });
    (out.bars || []).forEach(function (bar, i) {
      var col = document.querySelector('[data-bar="' + i + '"] i');
      var cap = document.querySelector('[data-bar="' + i + '"] em');
      if (col) col.style.height = (bar.value === null ? 4 : Math.max(4, bar.height / 100 * 88)) + 'px';
      if (cap) cap.textContent = bar.value === null ? '\u2014' : new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(bar.value);
    });
    var autoWrap = document.getElementById('wrap-automaticPct');
    if (autoWrap) autoWrap.hidden = state.values.orderMix !== 'custom';
    var autoLabel = document.getElementById('autoReadout');
    if (autoLabel) {
      if (!state.touched.automaticPct && state.values.orderMix !== 'custom') autoLabel.textContent = 'Choose a mix, or set a custom percent.';
      else if (state.values.orderMix === 'custom' && !state.touched.automaticPct) autoLabel.textContent = 'Drag to set the automatic percent.';
      else {
        var n = Number(state.values.orderMix === 'custom' ? state.values.automaticPct : state.values.orderMix);
        autoLabel.textContent = (Number.isFinite(n) ? n : 0) + '% automatic \u00b7 ' + (100 - (Number.isFinite(n) ? n : 0)) + '% will-call.';
      }
    }
    gauge();
  }
  function numberField(field) {
    return '<label class="field"><span>' + field.label + '</span><input data-question="' + field.id + '" id="q-' + field.id + '" type="number" inputmode="decimal" min="' + (field.min != null ? field.min : 0) + '" step="' + field.step + '" autocomplete="off"></label>';
  }
  function selectField(field) {
    var opts = field.options.map(function (op) {
      return '<option value="' + op.value + '">' + op.label + '</option>';
    }).join('');
    return '<label class="field"><span>' + field.label + '</span><select data-question="' + field.id + '" id="q-' + field.id + '">' + opts + '</select></label>';
  }
  function rangeField(field) {
    return '<div class="field span2" id="wrap-' + field.id + '" hidden><div class="range-row"><span>' + field.label + '</span><b id="autoReadout"></b></div><input data-question="' + field.id + '" id="q-' + field.id + '" type="range" min="' + field.min + '" max="' + field.max + '" step="' + field.step + '" value="50"></div>';
  }
  function mixField(field) {
    var items = field.items.map(function (item) {
      return '<label class="mix-item"><span>' + item.label + '</span><input data-question="' + item.id + '" id="q-' + item.id + '" type="number" inputmode="decimal" min="0" max="100" step="1" placeholder="%" autocomplete="off"></label>';
    }).join('');
    return '<div class="field span2"><span>' + field.label + '</span><div class="mix">' + items + '</div></div>';
  }
  function channelField(field) {
    var rows = field.channels.map(function (ch) {
      return '<div class="chan"><div class="chan-name">' + ch.label + '</div><label class="field"><span>Spend per month</span><input data-question="spend_' + ch.id + '" id="q-spend-' + ch.id + '" type="number" inputmode="decimal" min="0" step="1" autocomplete="off"></label><label class="field"><span>New customers per month</span><input data-question="new_' + ch.id + '" id="q-new-' + ch.id + '" type="number" inputmode="decimal" min="0" step="1" autocomplete="off"></label><div class="out"><b>CAC</b><p data-channel-cac="' + ch.id + '">\u2014</p></div></div>';
    }).join('');
    return '<div class="channels span2">' + rows + '</div>';
  }
  function fieldHtml(field) {
    if (field.type === 'select') return selectField(field);
    if (field.type === 'range') return rangeField(field);
    if (field.type === 'mix') return mixField(field);
    if (field.type === 'channels') return channelField(field);
    return numberField(field);
  }
  function sectionHtml(section) {
    var outputs = {
      customers: ['growthLine', 'threeLine', 'netLine'],
      deliveries: ['splitLine', 'tankLine', 'seasonLine'],
      money: ['marginLine', 'grossLine'],
      trip: ['tripLine', 'trueLine'],
      marketing: ['cacLine', 'sourceNote'],
      lifetime: ['ltvLine']
    }[section.id] || [];
    var labels = {
      growthLine: 'Direction',
      threeLine: 'Three-year picture',
      netLine: 'New and moved on',
      splitLine: 'Automatic and will-call',
      tankLine: 'Tank mix',
      seasonLine: 'Route volume',
      marginLine: 'Margin per gallon',
      grossLine: 'Margin per delivery',
      tripLine: 'Cost per delivery',
      trueLine: 'True profit per delivery',
      cacLine: 'CAC',
      sourceNote: 'Sources vs the yearly new-customer count',
      ltvLine: 'Lifetime value'
    };
    var outs = outputs.map(function (id) {
      return '<div class="out"><b>' + labels[id] + '</b><p data-out="' + id + '">\u2014</p></div>';
    }).join('');
    return '<section class="card" id="sec-' + section.id + '"><p class="kicker">' + section.kicker + '</p><h2>' + section.title + '</h2><p class="sub">' + section.lede + '</p><div class="grid two">' + section.fields.map(fieldHtml).join('') + '</div><div class="outs">' + outs + '</div></section>';
  }

  app.innerHTML = [
    '<header class="top wrap">',
    '<p class="kicker">' + cfg.kicker + '</p>',
    '<h1>' + cfg.title + '</h1>',
    '<p class="lede">' + cfg.lede + '</p>',
    '<div class="actions noprint">',
    '<button type="button" class="btn primary" id="printBtn">Print / Save as PDF</button>',
    '<button type="button" class="btn" id="resetBtn">Reset</button>',
    '</div>',
    '<p class="saved" id="savedNote"></p>',
    '</header>',
    '<div class="gauge"><div class="gauge-in">',
    '<svg class="truck" viewBox="0 0 230 78" role="img" aria-label="Oil truck tank gauge">',
    '<title>Oil truck</title>',
    '<rect x="8" y="48" width="190" height="6" rx="2" fill="#4A5058"/>',
    '<rect x="14" y="20" width="128" height="36" rx="16" fill="#fff" stroke="#4A5058" stroke-width="2"/>',
    '<clipPath id="tankClip"><rect x="16" y="22" width="124" height="32" rx="14"/></clipPath>',
    '<rect id="oilFill" x="16" y="54" width="124" height="0" fill="#0057FF" clip-path="url(#tankClip)"/>',
    '<path d="M146 34 h34 l18 12 v14 h-52 z" fill="#4A5058"/>',
    '<rect x="168" y="38" width="16" height="10" rx="2" fill="#F2F4F6"/>',
    '<circle cx="48" cy="58" r="9" fill="#4A5058"/><circle cx="48" cy="58" r="3" fill="#F2F4F6"/>',
    '<circle cx="108" cy="58" r="9" fill="#4A5058"/><circle cx="108" cy="58" r="3" fill="#F2F4F6"/>',
    '<circle cx="176" cy="58" r="9" fill="#4A5058"/><circle cx="176" cy="58" r="3" fill="#F2F4F6"/>',
    '</svg>',
    '<div class="gauge-copy"><div class="gauge-pct" id="gaugePct">0%<span>FULL</span></div><p class="gauge-note" id="gaugeNote"></p></div>',
    '</div></div>',
    '<div class="wrap">',
    cfg.sections.map(sectionHtml).join(''),
    '<section class="card" id="snapshot">',
    '<p class="kicker">Your snapshot</p><h2>The numbers to keep</h2>',
    '<div class="metrics">',
    metric('mLtv', 'Lifetime value', 'Profit per delivery \u00d7 deliveries a year \u00d7 years'),
    metric('mCac', 'CAC', 'From the source chosen above'),
    metric('mRatio', 'LTV : CAC', 'Target is 3 : 1 or better', 'ratioCard'),
    metric('mProfit', 'True profit per delivery', 'After fuel margin and the trip'),
    metric('mRevenue', 'Annual revenue estimate', 'Active customers \u00d7 deliveries \u00d7 gallons \u00d7 price'),
    metric('mAnnualProfit', 'Annual profit estimate', 'Active customers \u00d7 deliveries \u00d7 true profit'),
    '</div>',
    '<div class="out" style="margin-top:12px"><b>Profit after a year of the current ad spend</b><p data-out="mAfterAds">\u2014</p></div>',
    '<div class="out"><b>Growth trend</b><p data-out="mGrowth">\u2014</p><div class="bars" id="trendBars">',
    '<div class="bar" data-bar="0"><i></i><em>\u2014</em><span>3 years ago</span></div>',
    '<div class="bar" data-bar="1"><i></i><em>\u2014</em><span>1 year ago</span></div>',
    '<div class="bar now" data-bar="2"><i></i><em>\u2014</em><span>Now</span></div>',
    '</div></div>',
    '</section>',
    '<section class="card" id="projection">',
    '<p class="kicker">Projection</p><h2>What ' + cfg.extraPerMonth + ' more customers a month would mean</h2>',
    '<div class="outs"><div class="out"><p data-out="projIntro"></p></div><div class="out"><p data-out="projYear">\u2014</p></div><div class="out"><p data-out="projLife">\u2014</p></div></div>',
    '</section>',
    '<section class="card" id="scenario">',
    '<p class="kicker">Ad scenario</p><h2>$' + cfg.scenario.ads.toLocaleString('en-US') + ' ads + $' + cfg.scenario.management.toLocaleString('en-US') + ' management</h2>',
    '<p class="sub">Turn this on to price a heavier month. It does not change the snapshot above until you compare the two CACs.</p>',
    '<button type="button" class="switch" id="scenarioToggle" aria-pressed="false">Show the ad scenario</button>',
    '<div class="scenario-body" id="scenarioBody" hidden>',
    '<p data-out="scenSpend"></p>',
    '<label class="field" style="margin-top:12px"><span>' + cfg.scenario.inputLabel + '</span><input data-question="scenarioNew" id="q-scenarioNew" type="number" inputmode="decimal" min="0" step="1" autocomplete="off"></label>',
    '<div class="out" style="margin-top:12px"><b>Scenario CAC</b><p data-out="scenCac">\u2014</p><p data-out="scenCompare"></p></div>',
    '</div></section>',
    '<p class="foot">Built by <a href="https://sethquest.com">Seth Quest</a></p>',
    '</div>',
    '<div id="gaugeLive" class="visually-hidden" aria-live="polite"></div>'
  ].join('');

  function metric(id, label, hint, extraId) {
    return '<article class="metric"' + (extraId ? ' id="' + extraId + '"' : '') + '><div class="lbl">' + label + '</div><div class="num" data-out="' + id + '">\u2014</div><p class="sub">' + hint + '</p></article>';
  }

  var style = document.createElement('style');
  style.textContent = '.visually-hidden{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0}';
  document.head.appendChild(style);

  fieldList().forEach(function (id) {
    var el = document.getElementById('q-' + id) || document.querySelector('[data-question="' + id + '"]');
    if (!el) return;
    if (state.values[id] != null && state.values[id] !== '') el.value = state.values[id];
  });
  if (state.touched.automaticPct) {
    var range = document.getElementById('q-automaticPct');
    if (range && state.values.automaticPct != null) range.value = state.values.automaticPct;
  }
  var scenarioBody = document.getElementById('scenarioBody');
  var scenarioToggle = document.getElementById('scenarioToggle');
  if (state.scenarioOn) {
    scenarioBody.hidden = false;
    scenarioToggle.setAttribute('aria-pressed', 'true');
    scenarioToggle.textContent = 'Hide the ad scenario';
  }

  document.getElementById('app').addEventListener('input', function (e) {
    var el = e.target;
    if (!el.dataset || !el.dataset.question) return;
    state.values[el.dataset.question] = el.value;
    if (el.type === 'range') state.touched[el.dataset.question] = true;
    if (el.dataset.question === 'orderMix' && el.value !== 'custom' && el.value !== '') {
      state.touched.automaticPct = true;
      state.values.automaticPct = el.value;
      var rangeEl = document.getElementById('q-automaticPct');
      if (rangeEl) rangeEl.value = el.value;
    }
    if (el.dataset.question === 'automaticPct') {
      state.values.orderMix = 'custom';
      var mix = document.getElementById('q-orderMix');
      if (mix) mix.value = 'custom';
    }
    save();
    paint();
  });
  scenarioToggle.addEventListener('click', function () {
    state.scenarioOn = !state.scenarioOn;
    scenarioBody.hidden = !state.scenarioOn;
    scenarioToggle.setAttribute('aria-pressed', state.scenarioOn ? 'true' : 'false');
    scenarioToggle.textContent = state.scenarioOn ? 'Hide the ad scenario' : 'Show the ad scenario';
    save();
    paint();
  });
  document.getElementById('printBtn').addEventListener('click', function () { window.print(); });
  document.getElementById('resetBtn').addEventListener('click', function () {
    if (!window.confirm('Clear every answer on this computer?')) return;
    state = { values: {}, touched: {}, scenarioOn: false };
    try { localStorage.removeItem(cfg.storageKey); } catch (e) {}
    document.querySelectorAll('[data-question]').forEach(function (el) {
      if (el.type === 'range') el.value = '50';
      else if (el.tagName === 'SELECT') el.selectedIndex = 0;
      else el.value = '';
    });
    scenarioBody.hidden = true;
    scenarioToggle.setAttribute('aria-pressed', 'false');
    scenarioToggle.textContent = 'Show the ad scenario';
    var note = document.getElementById('savedNote');
    if (note) note.textContent = '';
    paint();
    window.scrollTo(0, 0);
  });
  window.addEventListener('scroll', gauge, { passive: true });
  paint();
})();
