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
  'Video placeholder',
  '16:9',
  "Your team isn't slow. The busywork is.",
  'The morning inbox is already full.',
  'Estimates take too long.',
  'Hours go to hunting for files.',
  'Files are scattered across the company.',
  "Photos aren't organized or titled.",
  'Spreadsheets get rebuilt by hand.',
  'Chatting with AI can answer your questions.',
  'AI agents can do the work for you.',
  'How it works',
  'We find the busywork.',
  'We build it in your tools.',
  'Your team runs it.',
  'Seth on camera',
  'Team AI Implementation',
  '$4,800',
  '$1,200 per week',
  'for 2–5 people on your team.',
  '$20–$50 per month',
  'Week 1:',
  'Week 4:',
  'Each week includes one 2-hour working session with your team, with implementation work done between sessions.',
  "What's included",
  'Four 2-hour working sessions with your team (one per week)',
  "Everything set up in your accounts, in your name. On completion, it's yours.",
  'Questions owners ask',
  'Is this going to replace my staff?',
  'Do you guarantee a certain number of hours saved?',
  "What if we're not a fit?",
  "Then we'll tell you on the call.",
  'See if an AI coworker fits your shop.',
  'For service businesses with 3–30 employees. No long-term contract. Tools and accounts stay in your name.'
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

  test('uses one booking constant and one video constant', () => {
    assert.equal((js.match(/const BOOKING_URL\s*=/g) || []).length, 1);
    assert.match(js, /const BOOKING_URL = 'tel:\+19348990796'/);
    assert.equal((js.match(/const VSL_EMBED\s*=/g) || []).length, 1);
    assert.match(js, /const VSL_EMBED = ''/);
    assert.equal((html.match(/tel:\+19348990796/g) || []).length, 0);
    assert.equal((html.match(/mailto:/g) || []).length, 1);
    assert.match(html, /href="mailto:seth@sethquest.com"/);
    assert.ok(html.includes('data-booking'));
    assert.equal((html.match(/data-booking/g) || []).length, 6);
  });

  test('video slots are 16:9, captions-ready, and do not autoplay', () => {
    assert.match(css, /aspect-ratio:\s*16\s*\/\s*9/);
    assert.match(js, /video\.autoplay = false/);
    assert.match(js, /autoplay', '0'/);
    assert.doesNotMatch(html, /autoplay/i);
    assert.match(js, /kind = 'captions'/);
    assert.match(js, /captions\.vtt/);
    assert.equal(fs.existsSync(path.join(root, 'more/ai-operations/captions.vtt')), true);
    assert.equal((html.match(/class="slate-kicker"/g) || []).length, 8);
    assert.equal((html.match(/Video placeholder/g) || []).length, 16);
    assert.match(html, /id="vsl"/);
    assert.match(html, /class="poster slate/);
  });

  test('pain menu has six separate placeholder videos', () => {
    assert.equal((html.match(/class="pain"/g) || []).length, 6);
    ['Morning inbox', 'Estimates', 'Hunting for files', 'Scattered files', 'Untitled photos', 'Rebuilt spreadsheets'].forEach(function (label) {
      assert.ok(html.includes(label), label);
    });
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

  test('does not add forbidden sales claims', () => {
    const blob = (html + '\n' + js + '\n' + css).toLowerCase();
    ['handoff', 'one on one', 'one-on-one', 'testimonial', 'exclusive', 'three times', 'hamptons adventure'].forEach(function (word) {
      assert.equal(blob.includes(word), false, word);
    });
    assert.equal((html.match(/guarantee/gi) || []).length, 1);
    assert.equal(blob.includes('roi'), false);
  });
});
