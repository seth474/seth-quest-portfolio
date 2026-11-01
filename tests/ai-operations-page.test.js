const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'more/ai-operations/index.html'), 'utf8');
const js = fs.readFileSync(path.join(root, 'more/ai-operations/page.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'more/ai-operations/page.css'), 'utf8');
const vercel = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

const phrases = [
  'Stop Paying Good People to Do Busywork.',
  'MORE. puts AI agents to work inside the email, files and trackers you already use, so your team spends less time on admin and more time on the work you hired them for.',
  'For owner-operated service businesses with 3–30 employees. No long-term contract.',
  'Watch one customer email become a finished estimate, a drafted reply and an updated job tracker, all reviewed by a person before anything goes out.',
  "Your team isn't slow. They're buried.",
  'You hired capable people. Then the admin found them.',
  'The inbox runs the morning.',
  'The files are everywhere.',
  'The same info gets typed four times.',
  'Your manager is the help desk.',
  'You pay for ChatGPT, and it rewrites emails.',
  "That's about it.",
  "You probably don't need more people. You need to stop wasting the time of the people you already have.",
  'Chat answers questions. Agents do the work.',
  'The old way',
  'You ask ChatGPT something. You copy the answer. Then you go do the work yourself.',
  'The new way',
  "You give an AI agent a task.",
  'What an agent can help your team do',
  'Summarize and organize long email threads',
  'Turn a repeated task into a process anyone on the team can run',
  'You stay in control',
  'You choose what it can access.',
  'You approve what goes out. Agents draft. People send.',
  "We'll tell you plainly what's possible with your tools.",
  'One email. One instruction. One review.',
  'Reads the email and understands the request.',
  'Flags what it couldn\'t confirm, instead of guessing.',
  'Then a person reviews it, changes one line and hits send.',
  'Demo shown with sample data.',
  'Team AI Implementation',
  'Four weeks. Your team. Your tools. Your accounts.',
  'Week 1:',
  'Week 4:',
  'Each week includes one 2-hour working session with your team, with implementation work done between sessions.',
  'Investment:',
  '$4,800',
  'for 2–5 people on your team.',
  "What's included",
  'Four 2-hour working sessions with your team (one per week)',
  "Everything set up in your accounts, in your name. On completion, it's yours.",
  'Software costs:',
  '$20–$50 per month',
  'Questions Owners Ask',
  'Is this going to replace my staff?',
  'Do you guarantee a certain number of hours saved?',
  'What if we\'re not a fit?',
  "Then we'll tell you on the call.",
  "Find where AI can cut your team's admin work.",
  'For service businesses with 3–30 employees. No long-term contract. Tools and accounts stay in your name.'
];

describe('ai operations page', () => {
  test('keeps the supplied copy in order', () => {
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

  test('video slot is 16:9, captions-ready, and does not autoplay', () => {
    assert.match(css, /aspect-ratio:\s*16\s*\/\s*9/);
    assert.match(js, /video\.autoplay = false/);
    assert.match(js, /autoplay', '0'/);
    assert.doesNotMatch(html, /autoplay/i);
    assert.match(js, /kind = 'captions'/);
    assert.match(js, /captions\.vtt/);
    assert.equal(fs.existsSync(path.join(root, 'more/ai-operations/captions.vtt')), true);
  });

  test('step flow is css only', () => {
    assert.match(css, /@keyframes winon/);
    assert.match(css, /@keyframes pip/);
    assert.match(html, /class="flow"/);
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
    ['handoff', 'one on one', 'one-on-one', 'testimonial', 'exclusive'].forEach(function (word) {
      assert.equal(blob.includes(word), false, word);
    });
    assert.equal((html.match(/guarantee/gi) || []).length, 1);
  });
});
