/* East End Fuel snapshot.
   Clone snapshot/ for another trade: copy this folder, change the
   labels and compute(), and point index.html at the new config.
   A lawn route would swap gallons for the price of a visit and
   tank sizes for how often they mow. snapshot.js draws whatever
   this object describes. */
(function () {
  var ADS = 1250;
  var MGMT = 750;
  var CHANNELS = [
    { id: 'radio', label: 'Radio' },
    { id: 'print', label: 'Print' },
    { id: 'google', label: 'Google' },
    { id: 'facebook', label: 'Facebook' },
    { id: 'other', label: 'Other' }
  ];
  var TANKS = [
    { id: 'tank275', label: '275 gal', gallons: 275 },
    { id: 'tank330', label: '330 gal', gallons: 330 },
    { id: 'tank500', label: '500 gal', gallons: 500 },
    { id: 'tank1000', label: '1,000 gal', gallons: 1000 }
  ];

  function num(v) {
    if (v === '' || v === null || v === undefined) return null;
    var n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  function ready(list) {
    for (var i = 0; i < list.length; i++) if (list[i] === null) return false;
    return true;
  }
  function money(n, digits) {
    if (n === null || !Number.isFinite(n)) return '\u2014';
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD',
      minimumFractionDigits: digits, maximumFractionDigits: digits
    }).format(n);
  }
  function plain(n) {
    if (n === null || !Number.isFinite(n)) return '\u2014';
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);
  }
  function ratioText(n) {
    if (n === null || !Number.isFinite(n)) return '\u2014';
    return (Math.round(n * 10) / 10).toFixed(1) + ' : 1';
  }
  var UNIT_DEFAULT = {
    minutesPerDelivery: 'minutes',
    quoteMake: 'minutes',
    quoteReach: 'days',
    responsePhone: 'minutes',
    responseVoicemail: 'minutes',
    responseEmail: 'hours',
    responseWeb: 'minutes'
  };
  function hoursOf(v, id) {
    var n = num(v[id]);
    if (n === null) return null;
    var unit = v[id + 'Unit'] || UNIT_DEFAULT[id] || 'minutes';
    if (unit === 'days') return n * 24;
    if (unit === 'hours') return n;
    return n / 60;
  }
  function amountLabel(n, unit) {
    if (n === null || !Number.isFinite(n)) return '\u2014';
    var rounded = Math.round(n * 10) / 10;
    var text = rounded % 1 === 0 ? String(rounded) : rounded.toFixed(1);
    var word = unit === 'days' ? 'day' : unit === 'hours' ? 'hour' : 'minute';
    return text + ' ' + word + (rounded === 1 ? '' : 's');
  }
  function hoursLabel(n) {
    if (n === null || !Number.isFinite(n)) return '\u2014';
    var rounded = Math.round(n * 10) / 10;
    var text = rounded % 1 === 0 ? String(rounded) : rounded.toFixed(1);
    return text + (rounded === 1 ? ' hour' : ' hours');
  }

  window.SNAPSHOT = {
    storageKey: 'sq-snapshot-east-end-fuel',
    kicker: 'Business snapshot',
    title: "Steve's East End Fuel",
    lede: 'Heating oil delivery, East Hampton. Fill this in together. The numbers update as you type. Nothing leaves this computer.',
    extraPerMonth: 10,
    scenario: { ads: ADS, management: MGMT, inputLabel: 'Expected new customers a month from this spend' },
    ltvCacTarget: 3,
    channels: CHANNELS,
    sections: [
      {
        id: 'customers',
        kicker: '1 \u00b7 Customers',
        title: 'Who is on the route',
        lede: 'Growth, flat, or down. The words stay neutral either way.',
        fields: [
          { id: 'activeNow', label: 'Active customers now', type: 'number', min: 0, step: 1 },
          { id: 'active1', label: 'Active customers 1 year ago', type: 'number', min: 0, step: 1 },
          { id: 'active3', label: 'Active customers 3 years ago', type: 'number', min: 0, step: 1 },
          { id: 'newPerYear', label: 'New customers per year', type: 'number', min: 0, step: 1 },
          { id: 'movedOnPerYear', label: 'Customers who moved on per year', type: 'number', min: 0, step: 1 }
        ]
      },
      {
        id: 'deliveries',
        kicker: '2 \u00b7 Deliveries',
        title: 'What a season looks like',
        lede: 'One heating season is the year. Tank mix is the share of customers, and it should add up to 100.',
        fields: [
          { id: 'deliveriesPerSeason', label: 'Deliveries per customer per season', type: 'number', min: 0, step: 1 },
          { id: 'gallonsPerDelivery', label: 'Average gallons per delivery', type: 'number', min: 0, step: 1 },
          {
            id: 'orderMix',
            label: 'Automatic vs will-call',
            type: 'select',
            options: [
              { value: '', label: 'Choose a mix' },
              { value: '80', label: 'Mostly automatic (80%)' },
              { value: '50', label: 'About half and half' },
              { value: '20', label: 'Mostly will-call (20% automatic)' },
              { value: 'custom', label: 'Set a custom percent' }
            ]
          },
          { id: 'automaticPct', label: 'Percent of customers on automatic', type: 'range', min: 0, max: 100, step: 1, showWhen: { field: 'orderMix', value: 'custom' } },
          { id: 'tanks', label: 'Tank sizes on the route', type: 'mix', items: TANKS }
        ]
      },
      {
        id: 'money',
        kicker: '3 \u00b7 Money',
        title: 'Price, cost, margin',
        lede: 'Margin here is before the truck rolls. The trip cost comes next.',
        fields: [
          { id: 'pricePerGallon', label: 'Price per gallon', type: 'number', min: 0, step: 0.01 },
          { id: 'costPerGallon', label: 'Cost per gallon', type: 'number', min: 0, step: 0.01 }
        ]
      },
      {
        id: 'trip',
        kicker: '4 \u00b7 Cost per trip',
        title: 'What a delivery really costs',
        lede: 'Driver time includes the drive. Pick minutes, hours, or days. Truck cost is fuel and the rest of the mile.',
        fields: [
          { id: 'driverWage', label: 'Driver hourly wage', type: 'number', min: 0, step: 0.01 },
          { id: 'minutesPerDelivery', label: 'Time per delivery, including the drive', type: 'duration', unit: 'minutes', legacyUnit: 'minutes', goalHours: 0.5, goalLabel: '30 minutes', weekly: 'deliveries' },
          { id: 'costPerMile', label: 'Truck cost per mile', type: 'number', min: 0, step: 0.01 },
          { id: 'milesPerTrip', label: 'Miles per trip', type: 'number', min: 0, step: 0.1 }
        ]
      },
      {
        id: 'time',
        kicker: '5 \u00b7 Time',
        title: 'How long things take',
        lede: 'A number and a unit. The snapshot turns minutes, hours, and days into hours.',
        fields: [
          { id: 'quoteMake', label: 'How long does it take to make a quote?', type: 'duration', unit: 'minutes', goalHours: 0.5, goalLabel: '30 minutes', weekly: 'newCustomers' },
          { id: 'quoteReach', label: 'How long until the quote reaches the customer?', type: 'duration', unit: 'days', goalHours: 24, goalLabel: 'Same day', weekly: 'newCustomers' },
          { id: 'responsePhone', label: 'Response time to a phone call', type: 'duration', unit: 'minutes', goalHours: 0.25, goalLabel: '15 minutes', weekly: 'inquiries' },
          { id: 'responseVoicemail', label: 'Response time to a voicemail', type: 'duration', unit: 'minutes', goalHours: 1, goalLabel: '1 hour', weekly: 'inquiries' },
          { id: 'responseEmail', label: 'Response time to an email', type: 'duration', unit: 'hours', goalHours: 24, goalLabel: 'Same day', weekly: 'inquiries' },
          { id: 'responseWeb', label: 'Response time to a web form', type: 'duration', unit: 'minutes', goalHours: 1, goalLabel: '1 hour', weekly: 'inquiries' },
          { id: 'inquiriesPerWeek', label: 'Customer inquiries a week', type: 'number', min: 0, step: 1 }
        ]
      },
      {
        id: 'marketing',
        kicker: '6 \u00b7 Marketing',
        title: 'Spend and where customers come from',
        lede: 'Monthly numbers. A channel with spend and no new customers has no CAC yet.',
        fields: [
          { id: 'channels', type: 'channels', channels: CHANNELS },
          {
            id: 'cacSource',
            label: 'CAC used on the snapshot',
            type: 'select',
            options: [{ value: 'overall', label: 'Overall' }].concat(CHANNELS.map(function (c) {
              return { value: c.id, label: c.label };
            }))
          }
        ]
      },
      {
        id: 'lifetime',
        kicker: '7 \u00b7 Lifetime',
        title: 'How long a customer stays',
        lede: 'Lifetime value is true profit per delivery, times deliveries a year, times years.',
        fields: [
          { id: 'yearsStay', label: 'Average years a customer stays', type: 'number', min: 0, step: 0.5 }
        ]
      }
    ],
    compute: function (v) {
      var activeNow = num(v.activeNow);
      var active1 = num(v.active1);
      var active3 = num(v.active3);
      var newPerYear = num(v.newPerYear);
      var movedOn = num(v.movedOnPerYear);
      var deliveries = num(v.deliveriesPerSeason);
      var gallons = num(v.gallonsPerDelivery);
      var price = num(v.pricePerGallon);
      var cost = num(v.costPerGallon);
      var wage = num(v.driverWage);
      var deliveryHours = hoursOf(v, 'minutesPerDelivery');
      var perMile = num(v.costPerMile);
      var miles = num(v.milesPerTrip);
      var years = num(v.yearsStay);
      var auto = v.orderMix === 'custom' ? num(v.automaticPct) : num(v.orderMix);

      var marginGal = ready([price, cost]) ? price - cost : null;
      var grossDelivery = ready([marginGal, gallons]) ? marginGal * gallons : null;
      var labor = ready([wage, deliveryHours]) ? wage * deliveryHours : null;
      var truck = ready([perMile, miles]) ? perMile * miles : null;
      var tripCost = ready([labor, truck]) ? labor + truck : null;
      var profitDel = ready([grossDelivery, tripCost]) ? grossDelivery - tripCost : null;
      var ltv = ready([profitDel, deliveries, years]) ? profitDel * deliveries * years : null;

      var spendSum = 0;
      var newSum = 0;
      var anySpend = false;
      var anyNew = false;
      var channelRows = CHANNELS.map(function (c) {
        var spend = num(v['spend_' + c.id]);
        var fresh = num(v['new_' + c.id]);
        if (spend !== null) { spendSum += spend; anySpend = true; }
        if (fresh !== null) { newSum += fresh; anyNew = true; }
        var cac = (spend !== null && fresh) ? spend / fresh : null;
        var cacLabel = '\u2014';
        if (spend > 0 && fresh === 0) cacLabel = 'No new customers';
        else if (fresh) cacLabel = money(cac, 2);
        return { id: c.id, cac: cacLabel, cacValue: (fresh ? cac : null), spend: spend || 0, fresh: fresh || 0 };
      });
      var overallCac = anyNew && newSum > 0 && anySpend ? spendSum / newSum : null;
      var source = v.cacSource || 'overall';
      var usedCac = overallCac;
      if (source !== 'overall') {
        var row = channelRows.filter(function (r) { return r.id === source; })[0];
        usedCac = row ? row.cacValue : null;
      }
      var ratio = (ltv !== null && usedCac) ? ltv / usedCac : null;
      var ratioState = 'empty';
      if (ratio !== null) ratioState = ratio >= 3 ? 'target' : 'below';
      else if (ltv !== null && usedCac === 0) ratioState = 'target';

      var annualRevenue = ready([activeNow, deliveries, gallons, price]) ? activeNow * deliveries * gallons * price : null;
      var annualProfit = ready([activeNow, deliveries, profitDel]) ? activeNow * deliveries * profitDel : null;
      var annualAds = anySpend ? spendSum * 12 : null;
      var profitAfterAds = ready([annualProfit, annualAds]) ? annualProfit - annualAds : null;

      var growthLine = '\u2014';
      var growthWord = '\u2014';
      if (ready([activeNow, active1])) {
        var diff = activeNow - active1;
        if (diff > 0) {
          growthWord = 'Growing';
          growthLine = 'Growing. ' + plain(diff) + ' more active customers than a year ago.';
        } else if (diff < 0) {
          growthWord = 'Down';
          growthLine = 'Down. ' + plain(Math.abs(diff)) + ' fewer active customers than a year ago.';
        } else {
          growthWord = 'Flat';
          growthLine = 'Flat. The same number of active customers as a year ago.';
        }
      }
      var threeLine = '\u2014';
      if (ready([activeNow, active1, active3])) {
        threeLine = plain(active3) + ' three years ago, ' + plain(active1) + ' last year, ' + plain(activeNow) + ' now.';
      }
      var netLine = '\u2014';
      if (ready([newPerYear, movedOn])) {
        var net = newPerYear - movedOn;
        var netWord = net === 0 ? 'flat' : (net > 0 ? 'a gain of ' + plain(net) : 'a loss of ' + plain(Math.abs(net)));
        netLine = plain(newPerYear) + ' new per year, ' + plain(movedOn) + ' moved on. That is ' + netWord + ' a year.';
      }

      var mixSum = 0;
      var mixAny = false;
      var weightedNum = 0;
      TANKS.forEach(function (t) {
        var pct = num(v[t.id]);
        if (pct !== null) {
          mixAny = true;
          mixSum += pct;
          weightedNum += pct * t.gallons;
        }
      });
      var tankLine = '\u2014';
      if (mixAny && mixSum > 0) {
        tankLine = 'Average tank about ' + plain(weightedNum / mixSum) + ' gallons. The shares add up to ' + plain(mixSum) + '%.';
      }
      var splitLine = '\u2014';
      if (ready([activeNow, auto])) {
        var autoN = activeNow * auto / 100;
        var willN = activeNow - autoN;
        splitLine = plain(Math.round(autoN)) + ' automatic, ' + plain(Math.round(willN)) + ' will-call.';
      }
      var seasonLine = '\u2014';
      if (ready([activeNow, deliveries])) {
        seasonLine = plain(activeNow * deliveries) + ' deliveries a season across the route.';
      }

      var marginLine = ready([marginGal]) ? money(marginGal, 2) + ' per gallon.' : '\u2014';
      var grossLine = ready([grossDelivery]) ? money(grossDelivery, 2) + ' per delivery, before the trip.' : '\u2014';
      var tripLine = ready([tripCost]) ? money(tripCost, 2) + ' (' + money(labor, 2) + ' labor + ' + money(truck, 2) + ' truck).' : '\u2014';
      var trueLine = ready([profitDel]) ? money(profitDel, 2) + ' after the trip.' : '\u2014';
      var ltvLine = ready([ltv, profitDel, deliveries, years])
        ? money(profitDel, 2) + ' \u00d7 ' + plain(deliveries) + ' deliveries \u00d7 ' + plain(years) + ' years = ' + money(ltv, 0)
        : '\u2014';

      var cacLine = '\u2014';
      if (anySpend && anyNew && newSum > 0) cacLine = money(overallCac, 2) + ' overall (' + money(spendSum, 0) + ' spend, ' + plain(newSum) + ' new customers).';
      else if (anySpend && anyNew && newSum === 0) cacLine = 'Spend is in, and no new customers were entered.';
      var sourceNote = '\u2014';
      if (ready([newPerYear]) && anyNew) {
        sourceNote = 'Sources add up to ' + plain(newSum) + ' new customers a month, about ' + plain(newSum * 12) + ' a year. You entered ' + plain(newPerYear) + ' new per year.';
      }

      var perMonth = 10;
      var perYear = perMonth * 12;
      var projIntro = perMonth + ' more customers a month is ' + plain(perYear) + ' in a year.';
      var projYear = '\u2014';
      var projLife = '\u2014';
      if (ready([deliveries, gallons, price, profitDel])) {
        projYear = 'Give those ' + plain(perYear) + ' a full year on the route: ' + money(perYear * deliveries * gallons * price, 0) + ' of revenue and ' + money(perYear * deliveries * profitDel, 0) + ' of profit.';
      }
      if (ready([ltv])) {
        projLife = 'If they stay the average, that one year of extra customers is worth ' + money(perYear * ltv, 0) + ' over their life.';
      }

      var expect = num(v.scenarioNew);
      var scenarioSpend = ADS + MGMT;
      var scenarioCac = expect ? scenarioSpend / expect : null;
      var scenarioRatio = (ltv !== null && scenarioCac) ? ltv / scenarioCac : null;

      var deliveriesPerWeek = ready([activeNow, deliveries]) ? (activeNow * deliveries) / 52 : null;
      var quotesPerWeek = newPerYear === null ? null : newPerYear / 52;
      var inquiries = num(v.inquiriesPerWeek);
      var durationFields = [];
      this.sections.forEach(function (section) {
        section.fields.forEach(function (field) {
          if (field.type === 'duration') durationFields.push(field);
        });
      });
      var responseFilled = durationFields.filter(function (field) {
        return field.weekly === 'inquiries' && hoursOf(v, field.id) !== null;
      }).length;
      var inquiryShare = (inquiries !== null && responseFilled > 0) ? inquiries / responseFilled : null;
      var timeRows = [];
      var savedSum = 0;
      var savedAny = false;
      durationFields.forEach(function (field) {
        var amount = num(v[field.id]);
        var unit = v[field.id + 'Unit'] || UNIT_DEFAULT[field.id] || 'minutes';
        var current = hoursOf(v, field.id);
        var perWeek = null;
        if (field.weekly === 'deliveries') perWeek = deliveriesPerWeek;
        else if (field.weekly === 'newCustomers') perWeek = quotesPerWeek;
        else if (field.weekly === 'inquiries') perWeek = inquiryShare;
        var saved = null;
        if (current !== null && perWeek !== null) {
          saved = Math.max(0, current - field.goalHours) * perWeek;
          savedSum += saved;
          savedAny = true;
        }
        timeRows.push({
          label: field.label,
          now: amountLabel(amount, unit),
          goal: field.goalLabel,
          saved: saved === null ? '\u2014' : hoursLabel(saved)
        });
      });

      var maxBar = Math.max(active3 || 0, active1 || 0, activeNow || 0, 1);
      var bars = [
        { label: '3 years ago', value: active3, height: active3 === null ? 0 : Math.max(4, (active3 / maxBar) * 100) },
        { label: '1 year ago', value: active1, height: active1 === null ? 0 : Math.max(4, (active1 / maxBar) * 100) },
        { label: 'Now', value: activeNow, height: activeNow === null ? 0 : Math.max(4, (activeNow / maxBar) * 100), now: true }
      ];

      return {
        ratioState: ratioState,
        channels: channelRows,
        bars: bars,
        time: {
          rows: timeRows,
          total: savedAny ? hoursLabel(savedSum) : '\u2014',
          note: 'Delivery time uses the route, spread across 52 weeks. Quote time uses new customers a year. Response time splits the weekly inquiries across the channels you filled in. A time already at its goal saves nothing.'
        },
        text: {
          growthLine: growthLine,
          threeLine: threeLine,
          netLine: netLine,
          tankLine: tankLine,
          splitLine: splitLine,
          seasonLine: seasonLine,
          marginLine: marginLine,
          grossLine: grossLine,
          tripLine: tripLine,
          trueLine: trueLine,
          ltvLine: ltvLine,
          cacLine: cacLine,
          sourceNote: sourceNote,
          mLtv: money(ltv, 0),
          mCac: usedCac === null ? '\u2014' : money(usedCac, 2),
          mRatio: ratioText(ratio),
          mProfit: money(profitDel, 2),
          mRevenue: money(annualRevenue, 0),
          mAnnualProfit: money(annualProfit, 0),
          mAfterAds: money(profitAfterAds, 0),
          mGrowth: growthWord,
          projIntro: projIntro,
          projYear: projYear,
          projLife: projLife,
          scenSpend: money(scenarioSpend, 0) + ' a month (' + money(ADS, 0) + ' ads + ' + money(MGMT, 0) + ' management).',
          scenCac: expect === null ? 'Enter the new customers you expect.' : (expect === 0 ? 'No new customers, so there is no CAC.' : money(scenarioCac, 2) + ' CAC. ' + ratioText(scenarioRatio) + ' against lifetime value.'),
          scenCompare: (usedCac !== null && scenarioCac) ? 'Current CAC is ' + money(usedCac, 2) + '.' : ''
        }
      };
    }
  };
})();
