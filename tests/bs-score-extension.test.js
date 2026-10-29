const test = require("node:test");
const assert = require("node:assert/strict");
const cp = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..", "bs-score-extension");

test("production config, manifest, and store zip point at sethquest.com", () => {
  const config = fs.readFileSync(path.join(root, "config.js"), "utf8");
  assert.match(config, /https:\/\/sethquest\.com\/api\/bs-score/);
  assert.match(config, /https:\/\/sethquest\.com\/api\/bs-score\/interest/);
  assert.equal(config.includes("127.0.0.1"), false);

  const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
  assert.equal(manifest.manifest_version, 3);
  assert.ok(manifest.host_permissions.includes("https://sethquest.com/*"));
  assert.ok(manifest.host_permissions.includes("https://www.youtube.com/*"));
  assert.deepEqual(manifest.content_scripts[0].js, [
    "lib/extract.js",
    "lib/payload.js",
    "lib/seek.js",
    "lib/interest.js",
    "lib/card.css.js",
    "config.js",
    "content.js"
  ]);

  const background = fs.readFileSync(path.join(root, "background.js"), "utf8");
  assert.match(background, /apiBase\(\) \+ "\/analyze"/);
  assert.equal(background.includes("http://127.0.0.1:4721/api/analyze"), false);

  for (const size of [16, 48, 128]) {
    const bytes = fs.readFileSync(path.join(root, "icons", "icon" + size + ".png"));
    assert.equal(bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  }

  const files = [
    "background.js",
    "content.js",
    "sidepanel.js",
    "config.js",
    "build.js",
    "lib/extract.js",
    "lib/payload.js",
    "lib/seek.js",
    "lib/interest.js",
    "lib/card.css.js"
  ];
  files.forEach(function (file) {
    const syntax = cp.spawnSync(process.execPath, ["--check", path.join(root, file)]);
    assert.equal(syntax.status, 0, file + "\n" + syntax.stderr.toString());
  });

  cp.execFileSync(process.execPath, [path.join(root, "build.js")], { stdio: "pipe" });
  const listing = cp.execFileSync("zipinfo", ["-1", path.join(root, "bs-score-chrome.zip")], { encoding: "utf8" });
  assert.match(listing, /^manifest\.json$/m);
  assert.match(listing, /^config\.js$/m);
  assert.equal(/fixtures\//.test(listing), false);
  assert.equal(/README/.test(listing), false);
});

test("the panel names the production host and the early list is actually posted", async () => {
  const payload = require(path.join(root, "lib/payload.js"));
  const interest = require(path.join(root, "lib/interest.js"));
  const offline = payload.viewFromResponse({ ok: false, status: 0, body: null });
  assert.match(offline.message, /sethquest\.com/);
  assert.equal(offline.message.includes("127.0.0.1"), false);
  const html = payload.renderPanel(offline);
  assert.match(html, /Try again/);

  const card = payload.renderPanel({
    kind: "result",
    source: "heuristic",
    scraped: { hasDescription: true },
    body: {
      overallScore: 2.9,
      emojiRating: "wrong band",
      realTitle: "<script>alert(\"x\")</script>",
      hiddenFunnelAlert: null,
      dimensionBreakdown: [{ id: "clarity", label: "Clarity", weight: 5, score: 6.8 }],
      threeBetterAlternatives: [{ title: "should not render" }]
    }
  });
  assert.match(card, /2\.9/);
  assert.match(card, /High BS/);
  assert.match(card, /Heuristic/);
  assert.match(card, /early list/);
  assert.match(card, /&lt;script&gt;/);
  assert.equal(card.includes("<script>"), false);
  assert.equal(card.includes("should not render"), false);
  assert.equal(card.includes("Nonpersistent"), false);

  let posted = "";
  const saved = await interest.saveInterest(
    { email: "ada@example.com", videoId: "abc", overallScore: 2.9 },
    {
      endpoint: "https://sethquest.com/api/bs-score/interest",
      fetchImpl: async function (url, init) {
        posted = init.body;
        assert.equal(url, "https://sethquest.com/api/bs-score/interest");
        return {
          ok: true,
          json: async function () {
            return { ok: true, persistent: true, stored: "blob", message: "You're on the early list." };
          }
        };
      }
    }
  );
  assert.equal(saved.persistent, true);
  assert.match(saved.message, /early list/);
  assert.match(posted, /ada@example.com/);
  assert.match(posted, /"source":"extension"/);

  const missed = await interest.saveInterest(
    { email: "ada@example.com", videoId: "abc", overallScore: 2.9 },
    {
      endpoint: "https://sethquest.com/api/bs-score/interest",
      fetchImpl: async function () {
        return {
          ok: false,
          json: async function () {
            return { ok: false, persistent: false, message: "The early list isn't ready yet, so this email was not saved." };
          }
        };
      }
    }
  );
  assert.equal(missed.ok, false);
  assert.equal(missed.persistent, false);
  assert.match(missed.message, /not saved/);

  const invalid = await interest.saveInterest({ email: "nope" }, { fetchImpl: async function () { return { ok: true }; } });
  assert.equal(invalid.ok, false);

  const sandbox = { globalThis: null };
  sandbox.globalThis = sandbox;
  const context = vm.createContext(sandbox);
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
  manifest.content_scripts[0].js.filter(function (file) { return file !== "content.js"; }).forEach(function (file) {
    vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file });
  });
  ["BSExtract", "BSScore", "BSScoreSeek", "BSInterest", "BSCardCSS"].forEach(function (name) {
    assert.ok(sandbox[name], name);
  });
  assert.match(sandbox.BSConfig.apiBase, /sethquest\.com\/api\/bs-score$/);
});

test("landing page keeps the store button disabled until a URL is configured", () => {
  const page = fs.readFileSync(path.join(__dirname, "..", "bs-score/index.html"), "utf8");
  assert.match(page, /Join the early list/);
  assert.match(page, /Coming soon to the Chrome Web Store/);
  assert.match(page, /id="chrome"[^>]*aria-disabled="true"/);
  assert.match(page, /company_website/);
  assert.match(page, /\/api\/bs-score\/interest/);
  assert.match(page, /\/api\/bs-score\/config/);
  assert.match(page, /og:title/);
  assert.equal(/testimonial|exclusive|waitlist only|limited spots|\$\d+/i.test(page), false);
  assert.match(page, /Free and open|No paywall/);
});
