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
  'Make AI Your Coworker for the Busywork',
  'For owner-operated local service businesses with 3–30 employees.',
  'Watch the video',
  'Video placeholder',
  '16:9',
  'Seth on camera',
  "Your team isn't slow. The busywork is.",
  'The morning inbox is already full.',
  'Estimates take too long.',
  'Chatting with AI can answer your questions.',
  'AI agents can do the work for you.',
  'Hours go to hunting for files.',
  'Files are scattered across the company.',
  "Photos aren't organized or titled.",
  'Spreadsheets get rebuilt by hand.',
  'How it works',
  'We find the busywork.',
  'We build it in your tools.',
  'Your team runs it.',
  'Who I am',
  'What happens on the Zoom',
  'Get the weekly video',
  '$480',
  'Three-Week Setup',
  '$2,400',
  '$800 a week for three weeks',
  'Team AI Implementation',
  '$4,800',
  'Six weeks at $800 a week',
  '2 to 5 people',
  'On completion, you own the tools.',
  'Questions owners ask',
  'Who owns the tools on completion?',
  'Do you guarantee a certain number of hours saved?',
  "What if we're not a fit?",
  "Then we'll say so on the Zoom.",
  'Booking placeholder',
  'Book a free 15-minute Zoom'
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
    assert.equal((html.match(/data-booking/g) || []).length, 4);
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
    assert.match(js, /video\.autoplay = false/);
    assert.match(js, /autoplay', '0'/);
    assert.doesNotMatch(html, /autoplay/i);
    assert.match(js, /kind = 'captions'/);
    assert.match(js, /captions\.vtt/);
    assert.equal(fs.existsSync(path.join(root, 'more/ai-operations/captions.vtt')), true);
    assert.equal((html.match(/class="frame( |")/g) || []).length, 7);
    assert.equal((html.match(/frame-meta">Video placeholder/g) || []).length, 7);
    assert.match(html, /id="vsl"/);
    assert.match(html, /class="poster"/);
    assert.match(html, /class="hero"[\s\S]*id="vsl"/);
  });

  test('pain videos are separate scenes, not one stacked menu', () => {
    ['Morning inbox', 'Estimates', 'Hunting for files', 'Scattered files', 'Untitled photos', 'Rebuilt spreadsheets'].forEach(function (label) {
      assert.ok(html.includes(label), label);
    });
    assert.match(html, /chapter flip/);
    assert.match(html, /class="frame frame-wide"/);
    assert.match(html, /class="bento"/);
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
    assert.match(html, /class="tier tier-mid"/);
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
    assert.equal((html.match(/guarantee/gi) || []).length, 1);
    assert.equal(blob.includes('roi'), false);
  });
});
