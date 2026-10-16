/* Time-cost copy for the One-Week AI Setup snapshot. Customer text stays plain. */

var RATE_BILL = { r75: 75, r100: 100, r135: 135, r175: 175, r200: 200 };
var RATE_WAGE = { w18: 18, w20: 20, w25: 25, w30: 30 };

function money(n) {
  return '$' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function label(map, key) {
  return (map && map[key]) || '';
}

var TRADE = { pool: 'Pool', hvac: 'HVAC', plumb: 'Plumbing', elec: 'Electric', lawn: 'Lawn and landscape', other: 'Other' };
var TEAM = { solo: 'Just you', small: '2 to 4 people', mid: '5 to 10 people', big: 'More than 10' };
var EMAILS = { u10: 'Under 10 emails a day', d25: '10 to 25 emails a day', d50: '25 to 50 emails a day', more: 'More than 50 emails a day' };
var WHO = { me: 'You answer them', split: 'You split them with someone', else: 'Someone else answers them', sit: 'They sit' };
var QHOW = { notes: 'Typed up from notes', sheet: 'A spreadsheet', tool: 'Jobber, Housecall Pro, or ServiceTitan', else: 'Someone else writes them' };
var QTIME = { m15: 'Under 15 minutes', m30: '15 to 30 minutes', m60: '30 to 60 minutes', over: 'Over an hour' };
var FOLLOW = { every: 'Every quiet quote gets a follow-up', some: 'Follow-up happens sometimes', rare: 'Follow-up is rare', never: 'Quiet quotes do not get a follow-up' };
var SCHED = { texts: 'You juggle it in texts', cal: 'A shared calendar', else: 'Someone else books the jobs', mess: 'A mix of calls and texts' };
var ADMIN = { u2: 'Under 2 hours', h5: '2 to 5 hours', h10: '5 to 10 hours', more: 'More than 10 hours' };
var FILES = { roll: 'Camera roll and texts', one: 'One folder on a computer', job: 'A folder per job', drive: 'A shared drive the crew uses' };
var SINK = { email: 'Email', quotes: 'Writing quotes', follow: 'Following up', sched: 'Scheduling', paper: 'Paperwork and files' };

function hoursFor(a) {
  var emailBase = { u10: 2, d25: 5, d50: 8, more: 11 }[a.emails] || 5;
  var who = { me: 1, split: 0.65, else: 0.4, sit: 1 }[a.who] || 1;
  var email = emailBase * who;

  var perWeek = { solo: 5, small: 8, mid: 14, big: 20 }[a.team] || 8;
  var each = { m15: 0.25, m30: 0.45, m60: 0.8, over: 1.35 }[a.qtime] || 0.5;
  var how = { notes: 1.1, sheet: 1, tool: 0.7, else: 0.4 }[a.qhow] || 1;
  var quotes = perWeek * each * how;
  var follow = { every: Math.max(1.2, perWeek * 0.12), some: Math.max(0.8, perWeek * 0.07), rare: 0.5, never: 0.3 }[a.follow] || 0.8;

  var sched = { texts: 2.5, cal: 1, else: 0.5, mess: 3.2 }[a.sched] || 2;
  var files = { roll: 1.8, one: 1, job: 0.4, drive: 0.3 }[a.files] || 1;
  var other = { u2: 0.5, h5: 1.5, h10: 3, more: 5 }[a.admin] || 2;

  function whole(n) { return Math.max(1, Math.round(n)); }
  var emailH = whole(email);
  var quoteH = whole(quotes + follow);
  var paperH = whole(sched + files + other);
  return {
    email: emailH,
    quotes: quoteH,
    paper: paperH,
    total: emailH + quoteH + paperH,
    perWeek: perWeek
  };
}

function rateOf(a) {
  if (a.rateKind === 'wage') return RATE_WAGE[a.rate] || 20;
  return RATE_BILL[a.rate] || 135;
}

function yearOf(hours, rate) {
  return Math.round(hours * rate * 52);
}

function emailLine(a) {
  var count = { u10: 'Under 10 emails come in a day', d25: '10 to 25 emails come in a day', d50: '25 to 50 emails come in a day', more: 'More than 50 emails come in a day' }[a.emails] || 'Email volume was not set';
  var who = { me: 'you answer them', split: 'you split them with someone', else: 'someone else answers them', sit: 'they sit unanswered' }[a.who] || 'who answers them was not set';
  return count + ', and ' + who + '.';
}

function quoteLine(a) {
  var how = { notes: 'Quotes are typed up from notes', sheet: 'Quotes live in a spreadsheet', tool: 'Quotes are built in a job tool', else: 'Someone else writes the quotes' }[a.qhow] || 'Quote writing was not set';
  var time = { m15: 'each one takes under 15 minutes', m30: 'each one takes 15 to 30 minutes', m60: 'each one takes 30 to 60 minutes', over: 'each one takes over an hour' }[a.qtime] || 'the time per quote was not set';
  var follow = { every: 'every quiet quote gets a follow-up', some: 'follow-up happens sometimes', rare: 'follow-up is rare', never: 'quiet quotes do not get a follow-up' }[a.follow] || 'follow-up was not set';
  return how + ', ' + time + ', and ' + follow + '.';
}

function paperLine(a) {
  var sched = { texts: 'scheduling is a string of texts', cal: 'jobs sit on a shared calendar', else: 'someone else books the jobs', mess: 'scheduling is a mix of calls and texts' }[a.sched] || 'scheduling was not set';
  var files = { roll: 'photos live in the camera roll', one: 'files sit in one folder', job: 'each job has a folder', drive: 'the crew uses a shared drive' }[a.files] || 'file storage was not set';
  var admin = { u2: 'other paperwork is under 2 hours a week', h5: 'other paperwork is 2 to 5 hours a week', h10: 'other paperwork is 5 to 10 hours a week', more: 'other paperwork is more than 10 hours a week' }[a.admin] || 'paperwork hours were not set';
  return sched.charAt(0).toUpperCase() + sched.slice(1) + ', ' + files + ', and ' + admin + '.';
}

function tasksFor(a, h) {
  var bump = { email: 0, quotes: 0, follow: 0, sched: 0, paper: 0 };
  if (bump[a.sink] != null) bump[a.sink] = 3;
  var list = [
    { key: 'email', hrs: h.email + bump.email, t: 'Email replies drafted in your voice.', d: 'You read each one and tap send. Nothing goes out until you say so.' },
    { key: 'quotes', hrs: h.quotes + bump.quotes, t: 'Same-day estimates from the photos you already take.', d: 'Your prices, your line items, your logo. You approve it before it goes to the customer.' },
    { key: 'follow', hrs: (h.quotes * 0.4) + bump.follow, t: 'A follow-up on every quiet quote.', d: 'A short note on day 2 and day 5. It stops when they reply.' },
    { key: 'sched', hrs: (h.paper * 0.45) + bump.sched, t: 'Scheduling replies with real times.', d: 'Less back and forth to put a job on the board.' },
    { key: 'paper', hrs: h.paper + bump.paper, t: 'Job photos and notes stay with the job.', d: 'Not a camera roll you scroll at night.' },
    { key: 'list', hrs: 1, t: 'Your customer list, in one place.', d: 'Names and numbers from your phone, cleaned up.' }
  ];
  list.sort(function (x, y) { return y.hrs - x.hrs; });
  return list;
}

function buildModel(input) {
  var a = input.answers || {};
  var h = hoursFor(a);
  var rate = rateOf(a);
  var kind = a.rateKind === 'wage' ? 'an assistant wage' : 'your billable rate';
  var year = yearOf(h.total, rate);
  var rows = [
    { key: 'email', name: 'Email', hours: h.email, line: emailLine(a) },
    { key: 'quotes', name: 'Quotes & Follow-up', hours: h.quotes, line: quoteLine(a) },
    { key: 'paper', name: 'Paperwork & Files', hours: h.paper, line: paperLine(a) }
  ];
  rows.forEach(function (row) {
    row.year = yearOf(row.hours, rate);
    row.yearLabel = money(row.year);
    row.high = row.hours >= 4;
  });
  var tasks = tasksFor(a, h);
  return {
    business: input.business || 'Your business',
    name: input.name || '',
    trade: label(TRADE, a.trade),
    dateLabel: input.dateLabel || '',
    hours: h.total,
    high: h.total >= 8,
    rate: rate,
    rateKind: kind,
    rateLabel: money(rate) + '/hr',
    year: year,
    yearLabel: money(year),
    insight: 'About ' + h.total + ' hours a week goes to email, quotes, and paperwork. At ' + money(rate) + ' an hour, that is about ' + money(year) + ' a year.',
    note: 'Estimate. Hours come from your answers. Dollars are those hours times ' + money(rate) + ' an hour, 52 weeks.',
    rows: rows,
    tasks: tasks,
    open: tasks.slice(0, 3),
    locked: tasks.slice(3),
    answers: {
      email: [
        { k: 'Emails a day', v: label(EMAILS, a.emails) || 'Not set' },
        { k: 'Who answers', v: label(WHO, a.who) || 'Not set' },
        { k: 'Trade', v: label(TRADE, a.trade) || 'Not set' },
        { k: 'Crew', v: label(TEAM, a.team) || 'Not set' }
      ],
      quotes: [
        { k: 'How quotes are made', v: label(QHOW, a.qhow) || 'Not set' },
        { k: 'Time each quote', v: label(QTIME, a.qtime) || 'Not set' },
        { k: 'Follow-up', v: label(FOLLOW, a.follow) || 'Not set' },
        { k: 'Biggest time sink', v: label(SINK, a.sink) || 'Not set' }
      ],
      paper: [
        { k: 'Scheduling', v: label(SCHED, a.sched) || 'Not set' },
        { k: 'Photos and files', v: label(FILES, a.files) || 'Not set' },
        { k: 'Other paperwork', v: label(ADMIN, a.admin) || 'Not set' },
        { k: 'Rate used', v: money(rate) + '/hr · ' + kind }
      ]
    },
    setup: {
      email: [
        { t: 'Reply drafts in your voice.', d: 'The right price, the right date, the right next step. You tap send.' },
        { t: 'Nothing goes out without you.', d: 'You read it first. Customers hear back the same day.' },
        { t: 'Reply drafts waiting in the inbox.', d: 'You read each one and tap send.' }
      ],
      quotes: [
        { t: 'Same-day estimates from phone photos.', d: 'Your prices and your line items. You approve before it goes out.' },
        { t: 'A follow-up on day 2 and day 5.', d: 'A short note. It stops when they reply.' },
        { t: 'Scheduling replies with real times.', d: 'Less back and forth to put a job on the board.' }
      ],
      paper: [
        { t: 'Photos and notes stay with the job.', d: 'The estimate is built from what you already captured on site.' },
        { t: 'Scheduling replies with real times.', d: 'Less back and forth to put a job on the board.' },
        { t: 'A customer list in one place.', d: 'Names and numbers from your phone, cleaned up.' }
      ]
    },
    plan: [
      { day: 'Audit', t: 'Where the time goes', d: 'An audit of your company workflow. It finds where you are losing the most time, then picks the best solution. $1,000 kickoff. Non-refundable.' },
      { day: '5 days', t: 'One AI agent', d: 'One AI agent is built into that workflow with you.' },
      { day: 'Handoff', t: 'End of the 5 days', d: 'I hand it over and show you how it works. $1,400 at handoff.' }
    ],
    price: '$2,400',
    kickoff: '$1,000',
    handoff: '$1,400',
    phone: '934-899-0796',
    url: 'sethquest.com/time-is-money',
    cta: 'Book a free 15-min call'
  };
}

var MAPS = { TRADE: TRADE, TEAM: TEAM, EMAILS: EMAILS, WHO: WHO, QHOW: QHOW, QTIME: QTIME, FOLLOW: FOLLOW, SCHED: SCHED, ADMIN: ADMIN, FILES: FILES, SINK: SINK, RATE_BILL: RATE_BILL, RATE_WAGE: RATE_WAGE };

export { buildModel, money, MAPS };
