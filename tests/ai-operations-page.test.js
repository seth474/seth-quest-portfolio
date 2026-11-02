const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'more/ai-operations/index.html'), 'utf8');
const js = fs.readFileSync(path.join(root, 'more/ai-operations/page.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'more/ai-operations/page.css'), 'utf8');
const vercel = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

const phrases = [
  'An AI coworker for the busywork',
  'For East End service businesses',
  'Watch the 30-second video',
  'The morning inbox is already full.',
  'Estimates take too long.',
  'Hours go to hunting for files.',
  "Photos aren't organized or titled.",
  'Chatting with AI can answer your questions.',
  'AI agents can do the work for you.',
  'AI is a toy.',
  'The price is usually the easy part.',
  'Estimates just take time.',
  'The file is somewhere. Finding it is the work.',
  'Our files are too messy.',
  'A job photo with no name is just a scroll.',
  'Nobody names photos.',
  'The next sheet can start from the one you have.',
  'Spreadsheets need an expert.',
  'How it works',
  'Three steps. Then your team runs it.',
  'We find the busywork.',
  'We build it in your tools.',
  'Your team runs it.',
  "I'm Seth. I help East Hampton service businesses put AI to work.",
  'Now we can connect on a free 15-minute Zoom',
  'Three-Week Setup',
  '$2,400',
  '$800 a week. One improvement each week.',
  'Team AI Implementation',
  '$4,800',
  'Six weeks at $800 a week',
  '2 to 5 people',
  'On completion, you own the tools.',
  'You pay weekly.',
  'You see each improvement before the next one starts.',
  "My team won't use it.",
  'Is my data safe?',
  "I don't have time.",
  'Do I need new software?',
  'Booking placeholder',
  'Book a free 15-minute Zoom',
  'The one-question survey',
  "One question. That's the whole survey.",
  'Your most annoying office task',
  'The AI Coworker Course',
  '12 short videos. Set up AI to handle the busywork in your service business, at your own pace.',
  'AI chat vs. AI agents',
  'Setting up your AI coworker the right way',
  'Clearing the morning inbox in minutes',
  'Email templates that write themselves',
  'Turning notes and handwritten sheets into estimates',
  'Faster quotes your customers can say yes to',
  'One place for every file your team needs',
  'Naming and sorting job photos automatically',
  'Spreadsheets and reports that build themselves',
  'Scheduling, reminders and follow-ups',
  'Getting your team to actually use it',
  'Your 30-day AI rollout plan',
  "What you'll walk away with",
  "What's included: 12 videos, watch on any device, lifetime access to these lessons.",
  '$480',
  'Get the course'
];

describe('ai operations page', () => {
  test('keeps the page copy in order', () => {
    const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    let at = 0;
    phrases.forEach(function (phrase) {
      const next = text.indexOf(phrase, at);
      assert.notEqual(next, -1, 'missing or out of order: ' + phrase);
      at = next + phrase.length;
    });
  });

  test('uses placeholder links instead of click-to-call', () => {
    assert.equal((js.match(/const BOOKING_URL\s*=/g) || []).length, 1);
    assert.match(js, /const BOOKING_URL = ''/);
    assert.match(js, /const SIGNUP_URL = ''/);
    assert.match(js, /const BUY_COURSE_URL = ''/);
    assert.equal((js.match(/const VSL_EMBED\s*=/g) || []).length, 1);
    assert.match(js, /const VSL_EMBED = ''/);
    const blob = html + '\n' + js;
    assert.equal(/tel:/i.test(blob), false);
    assert.equal((html.match(/899-0796/g) || []).length, 1);
    assert.equal((html.match(/data-booking/g) || []).length, 11);
    assert.equal((html.match(/data-watch/g) || []).length, 2);
    assert.match(html, /data-signup/);
    assert.match(html, /data-buy/);
    assert.equal((html.match(/mailto:/g) || []).length, 1);
    assert.match(html, /href="mailto:seth@sethquest.com"/);
    assert.equal(html.includes('class="dock"'), false);
    assert.equal(html.includes('Call ('), false);
  });

  test('video slots are 16:9, captions-ready, and do not autoplay', () => {
    assert.match(css, /aspect-ratio:\s*16\s*\/\s*9/);
    assert.match(css, /aspect-ratio:\s*9\s*\/\s*16/);
    assert.equal(html.includes('Captions are included'), false);
    assert.equal(html.includes('nobody knows which file is the latest.'), true);
    assert.equal(html.includes('no place the team trusts'), false);
    assert.match(js, /video\.autoplay = false/);
    assert.match(js, /autoplay', '0'/);
    assert.doesNotMatch(html, /autoplay/i);
    assert.match(js, /kind = 'captions'/);
    assert.match(js, /captions\.vtt/);
    assert.equal(fs.existsSync(path.join(root, 'more/ai-operations/captions.vtt')), true);
    assert.equal((html.match(/class="frame( |")/g) || []).length, 6);
    assert.equal((html.match(/frame-meta">Video placeholder/g) || []).length, 6);
    assert.match(html, /id="vsl"/);
    assert.match(html, /class="poster"/);
    assert.match(html, /class="hero"[\s\S]*id="vsl"/);
  });

  test('pain videos are separate scenes, not one stacked menu', () => {
    ['Inbox', 'Estimates', 'Files and desktop', 'Photos', 'Google Sheet'].forEach(function (label) {
      assert.ok(html.includes(label), label);
    });
    assert.match(html, /chapter flip/);
    assert.match(html, /class="frame frame-wide"/);
    assert.match(html, /class="break"/);
    assert.equal(html.includes('>How it works<'), true);
    assert.equal((html.match(/>How it works</g) || []).length, 2);
  });

  test('has no sliding-dot timeline', () => {
    assert.equal(html.includes('class="flow"'), false);
    assert.equal(html.includes('flow-bar'), false);
    assert.equal(css.includes('@keyframes pip'), false);
    assert.equal(css.includes('@keyframes bead'), false);
    assert.equal(css.includes('@keyframes winon'), false);
    assert.equal(html.includes('One email. One instruction. One review.'), false);
    assert.equal((html.match(/class="steps"/g) || []).length, 1);
    assert.equal((html.match(/class="step-n"/g) || []).length, 3);
    assert.match(html, /class="tier tier-mid offer-hero"/);
    assert.equal(html.toLowerCase().includes('stop after'), false);
  });

  test('is reachable at both paths and stays off the homepage', () => {
    const rewrites = vercel.rewrites.filter(function (rule) {
      return rule.source === '/less-admin' || rule.source === '/less-admin/';
    });
    assert.equal(rewrites.length, 2);
    rewrites.forEach(function (rule) {
      assert.equal(rule.destination, '/more/ai-operations');
    });
    assert.equal(home.includes('/more/ai-operations'), false);
    assert.equal(home.includes('/less-admin'), false);
  });

  test('brands this page as Get More Done', () => {
    assert.equal((html.match(/Get <span class="accent">More<\/span> Done/g) || []).length, 2);
    assert.equal((html.match(/class="dot"/g) || []).length, 2);
    assert.match(css, /\.dot, \.branch \.accent \{[^}]*var\(--accent\)/);
    assert.equal(css.includes('--green'), false);
    assert.equal(css.includes('#1fbf5a'), false);
    const money = fs.readFileSync(path.join(root, 'make-more-money/index.html'), 'utf8');
    assert.equal(money.includes('Get More Done'), false);
  });

  test('does not add forbidden sales claims', () => {
    const blob = (html + '\n' + js + '\n' + css).toLowerCase();
    ['handoff', 'one on one', 'one-on-one', 'testimonial', 'exclusive', 'three times', 'hamptons adventure'].forEach(function (word) {
      assert.equal(blob.includes(word), false, word);
    });
    assert.equal((html.match(/guarantee/gi) || []).length, 0);
    assert.equal(blob.includes('roi'), false);
  });
});
