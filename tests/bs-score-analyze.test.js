const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const engine = require("../lib/bs-score/engine.js");
const analyze = require("../api/bs-score/analyze.js");
const alternatives = require("../api/bs-score/alternatives.js");

const fixture = JSON.parse(
  fs.readFileSync(path.join(__dirname, "fixtures/bs-score-sample-video.json"), "utf8")
);

function clearKeys() {
  delete process.env.XAI_API_KEY;
  delete process.env.XAI_BASE_URL;
  delete process.env.XAI_MODEL;
  delete process.env.YOUTUBE_API_KEY;
}

function call(handler, req) {
  return new Promise(function (resolve, reject) {
    const result = { headers: {} };
    const res = {
      setHeader(key, value) {
        result.headers[key] = value;
      },
      status(code) {
        result.status = code;
        return this;
      },
      json(body) {
        result.body = body;
        resolve(result);
      },
      end() {
        resolve(result);
      }
    };
    Promise.resolve(handler(req, res)).catch(reject);
  });
}

function expectedOverall(dimensions) {
  const weightTotal = dimensions.reduce(function (acc, dimension) {
    return acc + dimension.weight;
  }, 0);
  const sum = dimensions.reduce(function (acc, dimension) {
    return acc + dimension.score * dimension.weight;
  }, 0);
  return Math.round((sum / weightTotal + Number.EPSILON) * 10) / 10;
}

const healthy = {
  videoId: "abs10min",
  title: "How to read a peer-reviewed abstract in 10 minutes",
  channelName: "Dr. Lena Ortiz, University Methods Lab",
  description:
    "A short method for screening a paper before you commit to the full text.\n\nI teach research methods at the university. The worked example is a randomized trial.\n\nPaper: https://doi.org/10.1000/example-abstract",
  transcript: [
    { startSec: 0, text: "A peer-reviewed abstract is a compressed argument. Here is how to read one in 10 minutes without getting lost in the jargon." },
    { startSec: 20, text: "Step one: write down the population and the comparison. Specifically, who was studied and what the control group did." },
    { startSec: 55, text: "Step two: find the outcome they actually measured. According to the CONSORT checklist, the primary outcome should be named in the abstract." },
    { startSec: 95, text: "Step three: look for the effect size, not only the p-value. For example, a risk difference of 2 points can be statistically significant and still too small to matter." },
    { startSec: 140, text: "Step four: check whether the trial was randomized and how many people dropped out. The study design is the credibility check." },
    { startSec: 185, text: "Give the abstract 10 minutes. If the population, outcome, and design are still unclear, skip the paper or open the methods section next." }
  ],
  comments: [
    { text: "The reminder to look for the effect size instead of the p-value is the part I keep skipping. Going to try this on the next journal club paper.", likeCount: 24 },
    { text: "Does step two still work when the abstract uses a composite outcome?", likeCount: 11 },
    { text: "Used the four steps on a nutrition trial and realized the control group was not doing nothing. Thanks for the checklist.", likeCount: 7 }
  ]
};

test("rubric, bands, and half-up tenths match the score contract", () => {
  clearKeys();
  assert.equal(engine.rubricWeightTotal(), 110);
  assert.equal(engine.emojiRating(4.9), "⚠️🐂💩 High BS");
  assert.equal(engine.emojiRating(5), "🤔📖😐 Mixed / Caution");
  assert.equal(engine.emojiRating(7), "🤔📖😐 Mixed / Caution");
  assert.equal(engine.emojiRating(7.1), "✅😊🏆 Gold Mine");
  const edges = [
    [4.94, 4.9, "⚠️🐂💩 High BS"],
    [4.95, 5, "🤔📖😐 Mixed / Caution"],
    [7.04, 7, "🤔📖😐 Mixed / Caution"],
    [7.05, 7.1, "✅😊🏆 Gold Mine"]
  ];
  edges.forEach(function (edge) {
    assert.equal(engine.roundToTenth(edge[0]), edge[1]);
    assert.equal(engine.emojiRating(edge[0]), edge[2]);
  });
});

test("heuristic analyze is deterministic and flags the sample funnel", async () => {
  clearKeys();
  const first = await call(analyze, { method: "POST", headers: {}, body: fixture });
  const second = await call(analyze, { method: "POST", headers: {}, body: fixture });
  assert.equal(first.status, 200);
  assert.equal(first.headers["X-BS-Score-Source"], "heuristic");
  assert.equal(first.headers["Cache-Control"], "no-store");
  assert.deepEqual(first.body, second.body);
  assert.deepEqual(Object.keys(first.body), [
    "overallScore",
    "rawOverallScore",
    "emojiRating",
    "realTitle",
    "hiddenFunnelAlert",
    "skipToTheMeatTimestamps",
    "dimensionBreakdown",
    "threeBetterAlternatives"
  ]);
  assert.equal(first.body.threeBetterAlternatives.status, "unavailable");
  assert.match(first.body.threeBetterAlternatives.label, /YOUTUBE_API_KEY/);
  assert.deepEqual(first.body.threeBetterAlternatives.items, []);
  assert.ok(first.body.overallScore < 5);
  assert.equal(first.body.emojiRating, "⚠️🐂💩 High BS");
  assert.match(first.body.realTitle, /ChatGPT/);
  assert.match(first.body.hiddenFunnelAlert, /affiliate/i);
  assert.equal(first.body.dimensionBreakdown.length, 10);
  assert.deepEqual(
    first.body.dimensionBreakdown.map(function (dimension) { return dimension.id; }),
    engine.RUBRIC.map(function (dimension) { return dimension.id; })
  );
  assert.equal(first.body.overallScore, expectedOverall(first.body.dimensionBreakdown));
  assert.ok(first.body.skipToTheMeatTimestamps.some(function (stamp) { return stamp.startSec === 71; }));
});

test("a substantive sample scores above the bait sample", async () => {
  clearKeys();
  const bait = await call(analyze, { method: "POST", headers: {}, body: fixture });
  const good = await call(analyze, { method: "POST", headers: {}, body: healthy });
  assert.equal(good.status, 200);
  assert.ok(good.body.overallScore > 7);
  assert.ok(good.body.overallScore > bait.body.overallScore);
  assert.equal(good.body.emojiRating, "✅😊🏆 Gold Mine");
  assert.equal(good.body.hiddenFunnelAlert, null);
  assert.match(good.body.realTitle, /abstract/i);
});

test("timed text and SRT skip past the intro", async () => {
  clearKeys();
  const timed = await call(analyze, {
    method: "POST",
    headers: {},
    body: {
      videoId: "timed1",
      title: "How to compare a title with the claim",
      channelName: "Methods Bench",
      description: "A two-line timed transcript.",
      transcript: "0:00 Hey guys smash that like button and subscribe.\n1:15 Write down the one claim the speaker actually makes and compare it with the title.",
      comments: []
    }
  });
  assert.equal(timed.status, 200);
  assert.ok(timed.body.skipToTheMeatTimestamps.some(function (stamp) { return stamp.startSec === 75; }));
  const comments = timed.body.dimensionBreakdown.find(function (dimension) { return dimension.id === "comments"; });
  assert.equal(comments.score, 5);
  assert.match(comments.note, /no comments/i);

  const srt = await call(analyze, {
    method: "POST",
    headers: {},
    body: {
      videoId: "srt1",
      title: "How to compare a title with the claim",
      channelName: "Methods Bench",
      description: "An SRT transcript.",
      transcript: "WEBVTT\n\n00:00:08.000 --> 00:00:12.000\nHey guys please subscribe.\n\n00:01:02.500 --> 00:01:20.000\nCompare the claim in the title with the method that follows.\n"
    }
  });
  assert.equal(srt.status, 200);
  assert.ok(srt.body.skipToTheMeatTimestamps.some(function (stamp) { return stamp.startSec === 62.5; }));
});

test("bad payloads are rejected and comments past 50 do not change the score", async () => {
  clearKeys();
  const missing = await call(analyze, {
    method: "POST",
    headers: {},
    body: { videoId: "x", channelName: "Channel", description: "", transcript: [] }
  });
  assert.equal(missing.status, 400);
  assert.match(missing.body.error, /title/);

  const garbage = await call(analyze, { method: "POST", headers: { "content-type": "application/json" }, body: "not-json" });
  assert.equal(garbage.status, 400);

  const badLike = await call(analyze, {
    method: "POST",
    headers: {},
    body: Object.assign({}, fixture, { comments: [{ text: "A real question about the method?", likeCount: "lots" }] })
  });
  assert.equal(badLike.status, 400);

  const generics = Array.from({ length: 50 }, function (_, index) {
    return { text: "so good " + String.fromCharCode(97 + (index % 26)) + String.fromCharCode(97 + Math.floor(index / 26)) };
  });
  const capped = await call(analyze, { method: "POST", headers: {}, body: Object.assign({}, fixture, { comments: generics }) });
  const extra = await call(analyze, {
    method: "POST",
    headers: {},
    body: Object.assign({}, fixture, {
      comments: generics.concat([{ text: "This extra comment past the cap asks a specific question about the Stripe screenshot and should be ignored." }])
    })
  });
  const replaced = await call(analyze, {
    method: "POST",
    headers: {},
    body: Object.assign({}, fixture, {
      comments: generics.slice(0, 49).concat([{ text: "This fiftieth comment asks where the Stripe screenshot is and should change the comment score." }])
    })
  });
  const commentScore = function (payload) {
    return payload.dimensionBreakdown.find(function (dimension) { return dimension.id === "comments"; }).score;
  };
  assert.equal(commentScore(capped.body), commentScore(extra.body));
  assert.notEqual(commentScore(capped.body), commentScore(replaced.body));
});

test("model scores are recomputed and a dead Grok host returns 502 without leaking the key", async () => {
  clearKeys();
  const video = engine.normalizeVideo(fixture);
  const modelDimensions = engine.RUBRIC.map(function (dimension) {
    return {
      id: dimension.id,
      score: dimension.id === "actionability" ? 0 : 10,
      note: "Observed something about " + dimension.label + "."
    };
  });
  const judged = engine.responseFromModelPayload(video, {
    realTitle: "A plain title about the method",
    hiddenFunnelAlert: null,
    skipToTheMeatTimestamps: [{ startSec: 72, label: "Open the chat tool" }],
    dimensionBreakdown: modelDimensions,
    overallScore: 1
  });
  assert.equal(judged.overallScore, 7.7);
  assert.equal(judged.skipToTheMeatTimestamps[0].startSec, 71);
  assert.equal(judged.threeBetterAlternatives.status, "unavailable");
  assert.throws(function () {
    engine.responseFromModelPayload(video, { dimensionBreakdown: modelDimensions.slice(1) });
  }, /missed dimensions/);

  process.env.XAI_API_KEY = "test-key-should-not-leak";
  process.env.XAI_BASE_URL = "http://127.0.0.1:9";
  process.env.XAI_MODEL = "grok-4.7";
  try {
    const failed = await call(analyze, { method: "POST", headers: {}, body: fixture });
    assert.equal(failed.status, 502);
    assert.equal(failed.body.error, "Grok scoring failed");
    assert.equal(failed.body.detail.includes("test-key-should-not-leak"), false);
  } finally {
    clearKeys();
  }
});

test("health, method, and extension CORS", async () => {
  clearKeys();
  const health = await call(analyze, { method: "GET", headers: {} });
  assert.equal(health.status, 200);
  assert.equal(health.body.service, "bs-score");
  assert.equal(health.body.mode, "heuristic");
  assert.equal(health.body.model, null);

  const denied = await call(analyze, { method: "PUT", headers: {} });
  assert.equal(denied.status, 405);

  const origin = "chrome-extension://" + "abcdefghijklmnop".repeat(2);
  const allowed = await call(analyze, {
    method: "OPTIONS",
    headers: { origin: origin }
  });
  assert.equal(allowed.status, 204);
  assert.equal(allowed.headers["Access-Control-Allow-Origin"], origin);

  const youtube = await call(analyze, {
    method: "GET",
    headers: { origin: "https://www.youtube.com" }
  });
  assert.equal(youtube.headers["Access-Control-Allow-Origin"], "https://www.youtube.com");

  const stranger = await call(analyze, {
    method: "GET",
    headers: { origin: "https://evil.example" }
  });
  assert.equal(stranger.headers["Access-Control-Allow-Origin"], undefined);
});

test("alternatives stay empty without a key and rank a higher public title when search is stubbed", async () => {
  clearKeys();
  const route = await call(alternatives, { method: "POST", headers: {}, body: fixture });
  assert.equal(route.status, 200);
  assert.equal(route.body.status, "unavailable");
  assert.deepEqual(route.body.items, []);

  let calls = 0;
  const source = engine.normalizeVideo(fixture);
  const blocked = await engine.findAlternatives({
    video: source,
    realTitle: "Open a spreadsheet and type a prompt",
    apiKey: "",
    fetchImpl: async function () {
      calls += 1;
      throw new Error("should not search");
    }
  });
  assert.equal(calls, 0);
  assert.equal(blocked.status, "unavailable");

  const ranked = await engine.findAlternatives({
    video: source,
    realTitle: "Open a spreadsheet and type a prompt",
    apiKey: "test-youtube-key",
    fetchImpl: async function (input) {
      const url = new URL(String(input));
      assert.equal(url.searchParams.get("key"), "test-youtube-key");
      assert.equal(url.pathname, "/youtube/v3/search");
      return {
        ok: true,
        status: 200,
        json: async function () {
          return {
            items: [
              { id: { videoId: source.videoId }, snippet: { title: source.title, channelTitle: source.channelName, description: source.description } },
              {
                id: { videoId: "bettervid01" },
                snippet: {
                  title: "How to read a peer-reviewed abstract in 10 minutes",
                  channelTitle: "Dr. Lena Ortiz, University Methods Lab",
                  description: "A method with steps. According to a randomized study. https://doi.org/10.1000/example"
                }
              },
              {
                id: { videoId: "worsevid001" },
                snippet: {
                  title: "SHOCKING secret they don't want you to know overnight guaranteed!!!",
                  channelTitle: "WealthHacks Daily",
                  description: "Use code HACKS. https://bit.ly/secret-course"
                }
              }
            ]
          };
        }
      };
    }
  });
  assert.equal(ranked.status, "ready");
  assert.equal(ranked.items[0].videoId, "bettervid01");
  assert.equal(ranked.items.some(function (item) { return item.videoId === "worsevid001"; }), false);
  assert.equal(ranked.label.includes("test-youtube-key"), false);
});
