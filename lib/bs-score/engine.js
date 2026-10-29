/**
 * BS Score heuristic and optional Grok scoring.
 * Bundled from the open prototype (analyze, alternatives, rubric).
 * No API keys live in this file. XAI_API_KEY and YOUTUBE_API_KEY are read
 * from the environment at call time. Heuristic mode is the default.
 */
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// ../tmp/bs-src/index.ts
var index_exports = {};
__export(index_exports, {
  GrokError: () => GrokError,
  RUBRIC: () => RUBRIC,
  ValidationError: () => ValidationError,
  analyze: () => analyze,
  buildResponse: () => buildResponse,
  emojiRating: () => emojiRating,
  findAlternatives: () => findAlternatives,
  normalizeVideo: () => normalizeVideo,
  overallFrom: () => overallFrom,
  rankCandidates: () => rankCandidates,
  responseFromModelPayload: () => responseFromModelPayload,
  roundToTenth: () => roundToTenth,
  rubricWeightTotal: () => rubricWeightTotal,
  scoreHeuristic: () => scoreHeuristic,
  scoreWithGrok: () => scoreWithGrok,
  xaiApiKey: () => xaiApiKey,
  xaiModel: () => xaiModel,
  youtubeApiKey: () => youtubeApiKey
});
module.exports = __toCommonJS(index_exports);

// ../tmp/bs-src/rubric.ts
var RUBRIC = [
  {
    id: "actionability",
    label: "Actionability / Practical Value",
    weight: 25
  },
  {
    id: "transparency",
    label: "Transparency / Monetization",
    weight: 20
  },
  {
    id: "intent",
    label: "Intent / Clickbait",
    weight: 15
  },
  {
    id: "headline",
    label: "Headline Accuracy",
    weight: 10
  },
  {
    id: "credibility",
    label: "Credibility / Expertise",
    weight: 10
  },
  {
    id: "depth",
    label: "Depth / Completeness",
    weight: 10
  },
  { id: "clarity", label: "Clarity", weight: 5 },
  { id: "originality", label: "Originality", weight: 5 },
  { id: "engagement", label: "Engagement vs Value", weight: 5 },
  { id: "comments", label: "Comment Authenticity", weight: 5 }
];
function rubricWeightTotal() {
  return RUBRIC.reduce((sum, dimension) => sum + dimension.weight, 0);
}

// ../tmp/bs-src/types.ts
var ALTERNATIVES_UNAVAILABLE_LABEL = "Alternatives are unavailable until YOUTUBE_API_KEY is set on the scoring server.";
function unavailableAlternatives(label = ALTERNATIVES_UNAVAILABLE_LABEL) {
  return { status: "unavailable", label, items: [] };
}

// ../tmp/bs-src/text.ts
var STOP = /* @__PURE__ */ new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "of",
  "to",
  "in",
  "on",
  "for",
  "with",
  "this",
  "that",
  "you",
  "your",
  "i",
  "we",
  "they",
  "it",
  "is",
  "are",
  "was",
  "be",
  "from",
  "at",
  "by",
  "as",
  "if",
  "my",
  "how",
  "what",
  "why",
  "who",
  "im",
  "its",
  "our",
  "their",
  "but",
  "not",
  "just",
  "so",
  "do",
  "did",
  "can",
  "will",
  "about",
  "into",
  "than",
  "then",
  "them",
  "his",
  "her",
  "she",
  "he"
]);
var SMALL = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
  hundred: 100
};
function roundToTenth(value) {
  if (!Number.isFinite(value)) return 0;
  const sign = value < 0 ? -1 : 1;
  const thousandths = Math.round(Math.abs(value) * 1e3);
  const tenths = Math.floor((thousandths + 50) / 100);
  return sign * tenths / 10;
}
function round1(n) {
  return roundToTenth(n);
}
function clampScore(n) {
  return round1(Math.min(10, Math.max(0, n)));
}
function normalizeApostrophes(text) {
  return text.replace(/[\u2018\u2019\u201B]/g, "'").replace(/[\u201C\u201D]/g, '"');
}
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function words(text) {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/) : [];
}
function contentTokens(text) {
  return text.toLowerCase().replace(/\$/g, " ").split(/[^\p{L}\p{N}]+/u).filter((token) => token.length > 1 && !STOP.has(token) && !/^\d+$/.test(token));
}
function numericTokens(text) {
  const found = /* @__PURE__ */ new Set();
  for (const match of text.matchAll(/\$?\d[\d,]*(?:\.\d+)?/g)) {
    found.add(match[0].replace(/[$,]/g, ""));
  }
  const parts = text.toLowerCase().split(/[^\p{L}\p{N}]+/u);
  for (let i = 0; i < parts.length; i += 1) {
    const base = SMALL[parts[i]];
    if (base === void 0) continue;
    const scale = parts[i + 1];
    if (scale === "thousand") found.add(String(base * 1e3));
    else if (scale === "hundred" && base < 100) found.add(String(base * 100));
    else found.add(String(base));
  }
  return found;
}
function findPhrases(text, phrases) {
  const sorted = [...phrases].sort((a, b) => b.length - a.length);
  let hay = text.toLowerCase();
  const found = [];
  for (const phrase of sorted) {
    const pattern = `(?<![\\p{L}\\p{N}])${escapeRegExp(phrase.toLowerCase())}(?![\\p{L}\\p{N}])`;
    if (!new RegExp(pattern, "iu").test(hay)) continue;
    found.push(phrase);
    hay = hay.replace(new RegExp(pattern, "giu"), " ");
  }
  return found.sort(
    (a, b) => text.toLowerCase().indexOf(a.toLowerCase()) - text.toLowerCase().indexOf(b.toLowerCase())
  );
}
function humanList(items) {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}
function capitalize(text) {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// ../tmp/bs-src/score.ts
var EMOJI_BANDS = [
  { range: "Under 5.0", rating: "\u26A0\uFE0F\u{1F402}\u{1F4A9} High BS" },
  { range: "5.0\u20137.0 inclusive", rating: "\u{1F914}\u{1F4D6}\u{1F610} Mixed / Caution" },
  { range: "Above 7.0", rating: "\u2705\u{1F60A}\u{1F3C6} Gold Mine" }
];
function emojiRating(overall) {
  const rounded = roundToTenth(overall);
  if (rounded < 5) return EMOJI_BANDS[0].rating;
  if (rounded <= 7) return EMOJI_BANDS[1].rating;
  return EMOJI_BANDS[2].rating;
}
function weightedRaw(dimensions) {
  const weightTotal = dimensions.reduce((acc, dimension) => acc + dimension.weight, 0) || rubricWeightTotal();
  const sum = dimensions.reduce((acc, dimension) => acc + dimension.score * dimension.weight, 0);
  return weightTotal === 0 ? 0 : sum / weightTotal;
}
function overallFrom(dimensions) {
  return roundToTenth(weightedRaw(dimensions));
}
function buildResponse(args) {
  const rawOverallScore = weightedRaw(args.dimensions);
  const overallScore = roundToTenth(rawOverallScore);
  return {
    overallScore,
    rawOverallScore,
    emojiRating: emojiRating(overallScore),
    realTitle: args.realTitle,
    hiddenFunnelAlert: args.hiddenFunnelAlert,
    skipToTheMeatTimestamps: args.skipToTheMeatTimestamps,
    dimensionBreakdown: args.dimensions,
    threeBetterAlternatives: unavailableAlternatives()
  };
}

// ../tmp/bs-src/heuristic.ts
var CLICKBAIT = [
  "they don't want you to know",
  "they dont want you to know",
  "you won't believe",
  "you wont believe",
  "what they won't tell you",
  "nobody talks about",
  "one weird trick",
  "this one trick",
  "this simple trick",
  "make money fast",
  "passive income",
  "free money",
  "gone wrong",
  "must watch",
  "don't miss",
  "mind-blowing",
  "mind blowing",
  "secret method",
  "guaranteed",
  "overnight",
  "shocking",
  "exposed",
  "insane",
  "secret"
];
var TEMPLATES = [
  "thanks for watching",
  "without further ado",
  "smash that like",
  "smash the like",
  "like and subscribe",
  "before we start",
  "before we begin",
  "drop a comment",
  "hit the bell",
  "in this video",
  "let's get into it",
  "lets get into it",
  "welcome back",
  "what's up",
  "whats up",
  "hey guys",
  "see you in the next"
];
var SKIP = [
  ...TEMPLATES,
  "quick word from",
  "link in the description",
  "link in description",
  "use code",
  "sponsor"
];
var ACTION = [
  "step by step",
  "for example",
  "here's how",
  "here is how",
  "how to",
  "write down",
  "try this",
  "make sure",
  "you open",
  "open the",
  "checklist",
  "template",
  "specifically",
  "calculate",
  "compare",
  "practice",
  "install",
  "minutes",
  "step"
];
var ACTION_VERBS = [
  "open",
  "type",
  "post",
  "write",
  "read",
  "compare",
  "check",
  "find",
  "look",
  "measure",
  "use",
  "start",
  "install",
  "practice",
  "give"
];
var CITATIONS = [
  "according to",
  "peer-reviewed",
  "peer reviewed",
  "systematic review",
  "meta-analysis",
  "randomized",
  "the study",
  "a study",
  "et al",
  "doi.org",
  "journal"
];
var EXTRAORDINARY = [
  "they don't want you to know",
  "passive income",
  "free money",
  "make money",
  "guaranteed",
  "miracle"
];
var FILLERS = ["you know", "sort of", "kind of", "basically", "kinda", "um", "uh"];
var COURSE = [
  "free training",
  "enroll now",
  "limited time",
  "my course",
  "promo code",
  "use code"
];
var AFFILIATE_DISCLOSURE = [
  "qualifying purchases",
  "qualifying purchase",
  "paid partnership",
  "earn a commission",
  "i earn from",
  "advertisement",
  "sponsored links",
  "affiliates",
  "affiliate",
  "commission",
  "#ad"
];
var LINK_CHECKS = [
  {
    label: "an Amazon affiliate tag",
    test: (text) => /[?&]tag=/i.test(text)
  },
  {
    label: "an Amazon link",
    test: (text) => /amazon\.com|amzn\.to/i.test(text) && !/[?&]tag=/i.test(text)
  },
  {
    label: "a short link",
    test: (text) => /bit\.ly|tinyurl\.com/i.test(text)
  },
  {
    label: "a creator-store or course link",
    test: (text) => /stan\.store|gumroad\.com|skool\.com/i.test(text)
  },
  {
    label: "campaign-tracking parameters",
    test: (text) => /[?&]utm_/i.test(text)
  }
];
function scoreHeuristic(video) {
  const transcript = video.cues.map((cue) => cue.text).join("\n");
  const blob = `${video.title}
${video.channelName}
${video.description}
${transcript}`;
  const titleBait = findPhrases(video.title, CLICKBAIT);
  const spokenBait = findPhrases(transcript, CLICKBAIT);
  const meat = video.cues.filter((cue) => !isPreamble(cue));
  const meatText = meat.map((cue) => cue.text).join(" ");
  const meatWords = words(meatText).length;
  const transcriptWords = words(transcript);
  const wordCount = transcriptWords.length;
  const meatFraction = wordCount === 0 ? 0 : meatWords / wordCount;
  const stepMarkers = transcript.match(/\bstep\s+(?:one|two|three|four|five|six|seven|eight|\d+)\b/gi)?.length ?? 0;
  const actionHits = findPhrases(transcript, ACTION);
  const preambleFraction = video.cues.length === 0 ? 0 : (video.cues.length - meat.length) / video.cues.length;
  const actionability = scoreActionability(actionHits, stepMarkers, wordCount, meatFraction);
  const transparency = scoreTransparency(blob);
  const intent = scoreIntent(video.title, titleBait, spokenBait);
  const headline = scoreHeadline(video.title, meatText || transcript, titleBait);
  const credibility = scoreCredibility(blob, titleBait.length + spokenBait.length);
  const depth = scoreDepth(wordCount, meatFraction, stepMarkers);
  const clarity = scoreClarity(transcript);
  const originality = scoreOriginality(transcript);
  const engagement = scoreEngagement(
    intent.score,
    actionability.score,
    preambleFraction,
    titleBait.length
  );
  const comments = scoreComments(video.comments);
  const dimensions = [
    actionability,
    transparency.dimension,
    intent,
    headline,
    credibility,
    depth,
    clarity,
    originality,
    engagement,
    comments
  ].map((dimension, index) => ({
    id: RUBRIC[index].id,
    label: RUBRIC[index].label,
    weight: RUBRIC[index].weight,
    score: dimension.score,
    note: dimension.note
  }));
  return buildResponse({
    realTitle: deriveRealTitle(video, titleBait.length, meat),
    hiddenFunnelAlert: transparency.hiddenFunnelAlert,
    skipToTheMeatTimestamps: meat.slice(0, 4).map((cue) => ({
      startSec: cue.startSec,
      label: labelFromCue(cue.text)
    })),
    dimensions
  });
}
function isPreamble(cue) {
  if (words(cue.text).length > 45) return false;
  return findPhrases(cue.text, SKIP).length > 0;
}
function scoreActionability(hits, stepMarkers, wordCount, meatFraction) {
  let score = 2 + Math.min(hits.length, 6) * 0.8 + Math.min(stepMarkers, 5) * 0.7;
  if (wordCount >= 80) score += 0.4;
  if (hits.length === 0 && stepMarkers === 0) score = Math.min(score, 3);
  if (stepMarkers === 0 && hits.length <= 1) score = Math.min(score, 3.4);
  if (meatFraction < 0.45) score = Math.min(score, 3.2);
  let note = "The transcript never moves from the hook into a concrete step.";
  if (stepMarkers >= 3) {
    note = `The transcript gives ${stepMarkers} explicit steps a viewer can follow.`;
  } else if (hits.length >= 4 || stepMarkers > 0) {
    note = `Practical moves show up in the transcript (${humanList(hits.slice(0, 3))}).`;
  } else if (hits.length > 0) {
    note = "The transcript gestures at a method and never turns it into steps.";
  }
  return { score: clampScore(score), note };
}
function scoreTransparency(blob) {
  const links = LINK_CHECKS.filter((check) => check.test(blob)).map((check) => check.label);
  const disclosed = findPhrases(blob, AFFILIATE_DISCLOSURE).length > 0;
  const course = findPhrases(blob, COURSE);
  const sponsor = findPhrases(blob, ["paid partnership", "sponsored", "sponsor"]);
  let score = 8.7;
  let hidden = null;
  if (links.length > 0 && !disclosed) {
    hidden = `The description includes ${humanList(links)} with no affiliate or paid-placement disclosure.`;
    score = 2.8;
  } else if (links.length > 0) {
    score -= 0.8 + links.length * 0.3;
  }
  if (course.length > 0) score -= hidden || disclosed ? 0.4 : 1.1;
  if (sponsor.length > 0 && links.length === 0) score -= 0.5;
  if (hidden) score = Math.min(score, 2.8);
  let note = "No affiliate links, short links, or sponsor read showed up in the description or transcript.";
  if (hidden) note = hidden;
  else if (links.length > 0) {
    note = "Commercial links are present, and the video says they are affiliate or paid.";
  } else if (course.length > 0) {
    note = "A course or code pitch is in the open, without a concealed affiliate link.";
  } else if (sponsor.length > 0) {
    note = "A sponsor is named, and no concealed affiliate link showed up beside it.";
  }
  return {
    dimension: { score: clampScore(score), note },
    hiddenFunnelAlert: hidden
  };
}
function scoreIntent(title, titleBait, spokenBait) {
  const caps = title.match(/\b[A-Z]{4,}\b/g)?.length ?? 0;
  const bangs = title.match(/!/g)?.length ?? 0;
  let score = 8.8 - titleBait.length * 1.6 - Math.min(caps, 5) * 0.4 - Math.min(bangs, 4) * 0.35;
  if (/\$\s?\d/.test(title)) score -= 1.2;
  if (spokenBait.length > 0) score -= 0.8;
  const quoted = titleBait.slice(0, 3).map((phrase) => `"${phrase}"`);
  const note = titleBait.length > 0 ? `The title leans on ${humanList(quoted)}${/\$\s?\d/.test(title) ? ", and it leads with a dollar figure" : ""}.` : "The title states the topic without a bait stack.";
  return { score: clampScore(score), note };
}
function scoreHeadline(title, supportText, titleBait) {
  const cleaned = stripHype(title);
  const titleTokens = contentTokens(cleaned);
  const support = new Set(contentTokens(supportText));
  const overlap = titleTokens.filter((token) => support.has(token));
  const ratio = titleTokens.length === 0 ? 0 : overlap.length / titleTokens.length;
  const titleNumbers = [...numericTokens(title)];
  const supportNumbers = numericTokens(supportText);
  const unmet = titleNumbers.filter((value) => !supportNumbers.has(value));
  let score = 2.4 + ratio * 7;
  if (titleBait.length >= 2) score -= 1.6;
  if (unmet.length > 0) score -= 1.4;
  let note = "The title's content words show up in the body of the video.";
  if (unmet.length > 0) {
    note = `The title's figure ${humanList(unmet)} never appears in the teaching portion.`;
  } else if (titleBait.length >= 2) {
    note = "The headline is a hook, and the teaching portion carries a smaller claim.";
  } else if (ratio < 0.6) {
    note = "Only part of the title is supported by the transcript.";
  }
  return { score: clampScore(score), note };
}
function scoreCredibility(blob, baitCount) {
  const credential = /\b(ph\.?d\.?|m\.?d\.?|professor|researcher|university|faculty|licensed)\b/i.test(blob) || /\bdr\.?\s+[A-Z]/i.test(blob);
  const citations = findPhrases(blob, CITATIONS);
  const scholarly = /doi\.org|\.edu\b|\.gov\b|pubmed|arxiv\.org/i.test(blob);
  const extraordinary = findPhrases(blob, EXTRAORDINARY).length > 0 || baitCount >= 3;
  let score = 4.4;
  if (credential) score += 2.4;
  score += Math.min(citations.length, 4) * 0.65;
  if (scholarly) score += 0.8;
  if (extraordinary && citations.length === 0) score -= 2.4;
  let note = "Nothing in the channel, description, or transcript establishes expertise or a source.";
  if (credential && citations.length > 0) {
    note = "The channel states relevant expertise, and the video points at sources.";
  } else if (extraordinary && citations.length === 0) {
    note = "The video makes a strong money or miracle claim without a source.";
  } else if (credential) {
    note = "The channel states relevant expertise.";
  } else if (citations.length > 0) {
    note = "The video points at a source for the claim it is making.";
  }
  return { score: clampScore(score), note };
}
function scoreDepth(wordCount, meatFraction, stepMarkers) {
  let score = wordCount < 50 ? 2 : wordCount < 100 ? 3.4 : wordCount < 180 ? 5.4 : wordCount < 320 ? 6.6 : wordCount < 600 ? 7.5 : 8.3;
  if (meatFraction < 0.5) score -= 1.7;
  if (stepMarkers >= 3 && meatFraction > 0.7) score += 1;
  let note = `The transcript runs about ${wordCount} words.`;
  if (wordCount < 120 && meatFraction < 0.5) {
    note = `About ${wordCount} words, and most of them are intro, bait, or a sign-off.`;
  } else if (stepMarkers >= 3 && meatFraction > 0.7) {
    note = "The runtime is short, and it still walks through a complete procedure.";
  }
  return { score: clampScore(score), note };
}
function scoreClarity(transcript) {
  const fillers = findPhrases(transcript, FILLERS);
  const sentences = transcript.split(/[.!?]+/).map((sentence) => sentence.trim()).filter(Boolean);
  const wordCount = words(transcript).length;
  const average = wordCount / Math.max(sentences.length, 1);
  let score = 8.2 - fillers.length * 0.7;
  if (average > 32) score -= 1;
  if (average < 6 && wordCount > 40) score -= 0.4;
  const note = fillers.length > 0 ? `Filler phrasing shows up (${humanList(fillers.slice(0, 3))}).` : "Sentences stay direct, and the filler words stay out.";
  return { score: clampScore(score), note };
}
function scoreOriginality(transcript) {
  const templates = findPhrases(transcript, TEMPLATES);
  const score = 7.6 - Math.min(templates.length, 6) * 0.85;
  let note = "The wording does not follow a stock creator script.";
  if (templates.length >= 3) {
    note = `The script uses stock creator lines (${humanList(templates.slice(0, 3))}).`;
  } else if (templates.length > 0) {
    note = `A stock line shows up (${templates[0]}), alongside more specific wording.`;
  }
  return { score: clampScore(score), note };
}
function scoreEngagement(intent, actionability, preambleFraction, titleBait) {
  let score = intent * 0.45 + actionability * 0.55;
  if (preambleFraction >= 0.5) score -= 2.2;
  let note = "Engagement and teaching time land in the same range.";
  if (preambleFraction >= 0.5 && titleBait >= 2) {
    note = "Most of the runtime is hook, sponsor, or sign-off, under a bait title.";
  } else if (actionability >= 7 && titleBait === 0) {
    note = "The attention stays on the procedure the title promised.";
  }
  return { score: clampScore(score), note };
}
function scoreComments(comments) {
  if (comments.length === 0) {
    return {
      score: 5,
      note: "No comments were supplied, so this dimension stays neutral."
    };
  }
  const genericFlags = comments.map((comment) => isGenericComment(comment.text));
  const genericCount = genericFlags.filter(Boolean).length;
  const genericRatio = genericCount / comments.length;
  let score = 8.6 - genericRatio * 6.2;
  const seen = /* @__PURE__ */ new Set();
  let duplicates = 0;
  for (const comment of comments) {
    const key = comment.text.toLowerCase().replace(/\s+/g, " ").trim();
    if (seen.has(key)) duplicates += 1;
    seen.add(key);
  }
  if (duplicates > 0) score -= 1;
  const totalLikes = comments.reduce((sum, comment) => sum + (comment.likeCount ?? 0), 0);
  const genericLikes = comments.reduce(
    (sum, comment, index) => sum + (genericFlags[index] ? comment.likeCount ?? 0 : 0),
    0
  );
  const likesSkew = totalLikes > 0 && genericLikes / totalLikes > 0.75 && genericCount < comments.length;
  if (likesSkew) score -= 0.3;
  const specific = comments.length - genericCount;
  let note = "The comments talk about the actual contents of the video.";
  if (genericRatio >= 0.6 && specific === 1 && likesSkew) {
    note = "Most of the likes sit on generic praise, and one comment engages the claim.";
  } else if (genericRatio >= 0.6 && specific === 1) {
    note = "Most comments are generic praise, and one comment engages the claim.";
  } else if (genericRatio >= 0.6 && likesSkew) {
    note = "Most comments are generic praise, and those comments hold most of the likes.";
  } else if (genericRatio >= 0.6) {
    note = "Most comments are generic praise rather than discussion of the video.";
  } else if (duplicates > 0) {
    note = "Some comments repeat each other instead of adding a reaction to the video.";
  }
  return { score: clampScore(score), note };
}
function isGenericComment(text) {
  const normalized = text.trim().toLowerCase().replace(/[!?.]+$/g, "").replace(/[\p{Extended_Pictographic}\uFE0F]/gu, "").trim();
  if (!normalized) return true;
  const generic = /* @__PURE__ */ new Set([
    "great video",
    "good video",
    "nice video",
    "love this",
    "loved this",
    "awesome video",
    "awesome",
    "amazing",
    "cool",
    "nice",
    "great",
    "first",
    "thanks",
    "thank you",
    "so true",
    "wow",
    "lol",
    "haha",
    "subscribe",
    "liked",
    "fire",
    "goat"
  ]);
  if (generic.has(normalized)) return true;
  return normalized.length < 18 && !/\d/.test(normalized) && !normalized.includes("?");
}
function deriveRealTitle(video, baitCount, meat) {
  const cleaned = stripHype(video.title);
  const richEnough = contentTokens(cleaned).length >= 4 && baitCount < 2;
  if (richEnough) return cleaned;
  return bestClaim(meat) || cleaned || video.title;
}
function stripHype(title) {
  let next = title.replace(/\([^)]*\)/g, " ").replace(/\[[^\]]*\]/g, " ");
  for (const phrase of [...CLICKBAIT].sort((a, b) => b.length - a.length)) {
    next = next.replace(
      new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(phrase)}(?![\\p{L}\\p{N}])`, "giu"),
      " "
    );
  }
  return next.replace(/!+/g, "").replace(/\s+/g, " ").replace(/^[\s,.:;\-–—]+|[\s,.:;\-–—]+$/g, "").trim();
}
function bestClaim(cues) {
  let best = null;
  for (const cue of cues) {
    const sentences = cue.text.split(/(?<=[.!?])\s+/).map((sentence) => sentence.trim()).filter(Boolean);
    for (const sentence of sentences.length > 0 ? sentences : [cue.text]) {
      const claim = toPlainClaim(sentence);
      const tokens = contentTokens(claim);
      if (tokens.length < 3) continue;
      const score = tokens.length + (findPhrases(sentence, ACTION_VERBS).length > 0 ? 3 : 0);
      if (!best || score > best.score) best = { score, text: claim };
    }
  }
  return best?.text ?? null;
}
function toPlainClaim(sentence) {
  let text = sentence.trim();
  if (/\b(i made|i earned|\$\s?\d)/i.test(text) && /\bbut\b/i.test(text)) {
    text = text.split(/\bbut\b/i)[1]?.trim() ?? text;
  }
  for (let pass = 0; pass < 4; pass += 1) {
    const next = text.replace(
      /^(?:so|well|ok|okay|and|then|now|basically|actually|just|you know)\b[\s,]+/i,
      ""
    );
    if (next === text) break;
    text = next;
  }
  text = text.replace(
    /^(?:you)\s+(open|use|start|take|write|type|post|click|try|read|find|look|check|give|compare)\b/i,
    (_, verb) => capitalize(verb)
  );
  text = text.replace(
    /\byou\s+(open|use|start|take|write|type|post|click|try|read|find|look|check|give|compare)\b/gi,
    (_, verb) => verb.toLowerCase()
  );
  text = text.replace(/[.!?]+$/g, "").replace(/\s+/g, " ").trim();
  const parts = text.split(" ").slice(0, 16);
  while (parts.length > 3 && /^(?:and|or|the|a|an|of|to|for|with)$/i.test(parts[parts.length - 1] ?? "")) {
    parts.pop();
  }
  return capitalize(parts.join(" "));
}
function labelFromCue(text) {
  const sentence = text.split(/(?<=[.!?])\s+/)[0] ?? text;
  const claim = toPlainClaim(sentence);
  const parts = claim.split(/\s+/).slice(0, 8);
  while (parts.length > 3 && /^(?:and|or|the|a|an|of|to|for|with)$/i.test(parts[parts.length - 1] ?? "")) {
    parts.pop();
  }
  const label = parts.join(" ");
  return label.length > 72 ? label.slice(0, 72).replace(/\s+\S*$/, "") : label;
}

// ../tmp/bs-src/alternatives.ts
var SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";
async function findAlternatives(args) {
  const apiKey = args.apiKey?.trim();
  if (!apiKey) return unavailableAlternatives();
  const fetchImpl = args.fetchImpl ?? fetch;
  try {
    const query = searchQuery(args.realTitle, args.video.title);
    const url = new URL(SEARCH_URL);
    url.searchParams.set("part", "snippet");
    url.searchParams.set("type", "video");
    url.searchParams.set("maxResults", "8");
    url.searchParams.set("q", query);
    url.searchParams.set("key", apiKey);
    const response = await fetchImpl(url, { signal: AbortSignal.timeout(8e3) });
    if (!response.ok) {
      return unavailableAlternatives(`YouTube search failed (${response.status}).`);
    }
    const payload = await response.json();
    const sourceScore = metadataScore(args.video);
    const items = rankCandidates(args.video.videoId, sourceScore, payload.items || []);
    if (items.length === 0) {
      return {
        status: "ready",
        label: "Searched YouTube. None of the results scored higher on public title and description.",
        items: []
      };
    }
    return {
      status: "ready",
      label: "Higher-scoring videos on this topic, ranked from public title and description rather than a full transcript.",
      items
    };
  } catch {
    return unavailableAlternatives("YouTube search failed before alternatives could be ranked.");
  }
}
function rankCandidates(sourceVideoId, sourceScore, items) {
  const ranked = [];
  const seen = /* @__PURE__ */ new Set();
  for (const item of items) {
    const candidate = toCandidate(item);
    if (!candidate || candidate.videoId === sourceVideoId || seen.has(candidate.videoId)) continue;
    seen.add(candidate.videoId);
    const scored = scoreHeuristic(candidate);
    if (scored.overallScore <= sourceScore) continue;
    ranked.push({
      videoId: candidate.videoId,
      title: candidate.title,
      channelName: candidate.channelName,
      url: `https://www.youtube.com/watch?v=${encodeURIComponent(candidate.videoId)}`,
      overallScore: scored.overallScore,
      emojiRating: scored.emojiRating
    });
  }
  return ranked.sort((a, b) => b.overallScore - a.overallScore).slice(0, 3);
}
function toCandidate(item) {
  if (!item || typeof item !== "object") return null;
  const record = item;
  const videoId = typeof record.id?.videoId === "string" ? decodeBasic(record.id.videoId).trim() : "";
  const title = typeof record.snippet?.title === "string" ? decodeBasic(record.snippet.title).trim() : "";
  const channelName = typeof record.snippet?.channelTitle === "string" ? decodeBasic(record.snippet.channelTitle).trim() : "";
  const description = typeof record.snippet?.description === "string" ? decodeBasic(record.snippet.description).trim() : "";
  if (!videoId || !title || !channelName) return null;
  return { videoId, title, channelName, description, cues: [], comments: [] };
}
function metadataScore(video) {
  return scoreHeuristic({ ...video, cues: [], comments: [] }).overallScore;
}
function searchQuery(realTitle, title) {
  const query = (realTitle || title).replace(/\s+/g, " ").trim();
  return query.slice(0, 120) || title.slice(0, 120);
}
function decodeBasic(value) {
  return value.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code))).replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}

// ../tmp/bs-src/env.ts
function readEnv(name) {
  const value = process.env[name]?.trim();
  return value ? value : void 0;
}
function xaiApiKey() {
  return readEnv("XAI_API_KEY");
}
function xaiModel() {
  return readEnv("XAI_MODEL") ?? "grok-4.7";
}
function xaiBaseUrl() {
  return (readEnv("XAI_BASE_URL") ?? "https://api.x.ai/v1").replace(/\/$/, "");
}
function youtubeApiKey() {
  return readEnv("YOUTUBE_API_KEY");
}

// ../tmp/bs-src/errors.ts
var ValidationError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
};
var GrokError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "GrokError";
  }
};

// ../tmp/bs-src/grok.ts
var SYSTEM_PROMPT = `You are the scoring brain for BS Score, a Rotten Tomatoes-style rating for educational YouTube videos and podcast episodes. Judge only the JSON the user sends. Do not browse, and do not assume facts that are absent from the title, description, transcript, or comments.

Score each dimension from 0 to 10. 10 means the video does well on that virtue. 0 means it fails. Use one decimal.

- actionability: Actionability / Practical Value. High means a viewer can do something concrete afterward.
- transparency: Transparency / Monetization. High means commercial ties are disclosed. Low means a hidden course, affiliate, or sponsor funnel.
- intent: Intent / Clickbait. High means the packaging is honest. Low means the title is a bait hook.
- headline: Headline Accuracy. High means the title matches the content.
- credibility: Credibility / Expertise. High means relevant expertise or real sources.
- depth: Depth / Completeness. High means the topic is actually covered.
- clarity: Clarity. High means the explanation is easy to follow.
- originality: Originality. High means this is not a generic template script.
- engagement: Engagement vs Value. High means attention is earned by substance.
- comments: Comment Authenticity. High means comments discuss the content. Low means generic or botted praise. If no comments were supplied, score 5 and say so.

Also return:
- realTitle: a plain rewrite of what the video actually covers, without a hook and without all-caps hype.
- hiddenFunnelAlert: a short warning string when affiliate links, paid placements, or a course funnel are concealed or undisclosed. null when nothing is hidden.
- skipToTheMeatTimestamps: 1 to 4 items. startSec MUST be copied from the supplied transcript cues. label is a short plain description of that moment. Skip intros, subscribe begging, and sponsor reads.

Return JSON only, with this shape:
{
  "realTitle": string,
  "hiddenFunnelAlert": string | null,
  "skipToTheMeatTimestamps": [{ "startSec": number, "label": string }],
  "dimensionBreakdown": [{ "id": "<dimension id>", "score": number, "note": string }]
}

Every dimension id must appear once. Each note is one concrete sentence about something in the payload. Do not include an overall score. Do not suggest alternative videos.`;
var DIMENSION_IDS = new Set(RUBRIC.map((dimension) => dimension.id));
async function scoreWithGrok(video) {
  const apiKey = xaiApiKey();
  if (!apiKey) throw new GrokError("XAI_API_KEY is not set.");
  const model = xaiModel();
  const body = {
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: JSON.stringify(payloadForModel(video)) }
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 1800,
    search_parameters: { mode: "off" }
  };
  if (model.startsWith("grok-4")) body.reasoning_effort = "low";
  let response;
  try {
    response = await fetch(`${xaiBaseUrl()}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(45e3)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "request failed";
    throw new GrokError(`xAI request failed: ${message}`);
  }
  if (!response.ok) {
    const text = await response.text();
    throw new GrokError(
      `xAI responded ${response.status}: ${text.replace(/\s+/g, " ").trim().slice(0, 300)}`
    );
  }
  let data;
  try {
    data = await response.json();
  } catch {
    throw new GrokError("xAI response was not JSON.");
  }
  const content = messageText(data);
  if (!content.trim()) throw new GrokError("xAI returned an empty completion.");
  return responseFromModelPayload(video, extractJson(content));
}
function responseFromModelPayload(video, payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new GrokError("xAI JSON was not an object.");
  }
  const record = payload;
  const rawDimensions = record.dimensionBreakdown ?? record.dimensions;
  if (!Array.isArray(rawDimensions)) {
    throw new GrokError("xAI JSON is missing dimensionBreakdown.");
  }
  const byId = /* @__PURE__ */ new Map();
  for (const item of rawDimensions) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const row = item;
    if (typeof row.id !== "string" || !DIMENSION_IDS.has(row.id) || byId.has(row.id)) continue;
    if (typeof row.score !== "number" || !Number.isFinite(row.score)) {
      throw new GrokError(`xAI score for ${row.id} was not a number.`);
    }
    const note = typeof row.note === "string" && row.note.trim() ? row.note.trim().replace(/\s+/g, " ").slice(0, 320) : "Score returned without an explanation.";
    byId.set(row.id, { score: clampScore(row.score), note });
  }
  if (byId.size !== RUBRIC.length) {
    const missing = RUBRIC.filter((dimension) => !byId.has(dimension.id)).map((dimension) => dimension.id);
    throw new GrokError(`xAI JSON missed dimensions: ${missing.join(", ")}.`);
  }
  const heuristic = scoreHeuristic(video);
  return buildResponse({
    realTitle: cleanModelTitle(record.realTitle) ?? heuristic.realTitle,
    hiddenFunnelAlert: cleanAlert(record.hiddenFunnelAlert),
    skipToTheMeatTimestamps: cleanStamps(
      record.skipToTheMeatTimestamps,
      video,
      heuristic.skipToTheMeatTimestamps
    ),
    dimensions: RUBRIC.map((dimension) => {
      const row = byId.get(dimension.id);
      if (!row) throw new GrokError(`xAI JSON missed ${dimension.id}.`);
      return {
        id: dimension.id,
        label: dimension.label,
        weight: dimension.weight,
        score: row.score,
        note: row.note
      };
    })
  });
}
function payloadForModel(video) {
  let budget = 2e4;
  const transcript = [];
  for (const cue of video.cues.slice(0, 400)) {
    const text = cue.text.slice(0, 700);
    budget -= text.length;
    if (budget < 0) break;
    transcript.push({ startSec: cue.startSec, text });
  }
  return {
    videoId: video.videoId.slice(0, 80),
    title: video.title.slice(0, 300),
    channelName: video.channelName.slice(0, 200),
    description: video.description.slice(0, 8e3),
    transcript,
    comments: video.comments.slice(0, 50).map((comment) => ({
      text: comment.text.slice(0, 500),
      likeCount: comment.likeCount
    }))
  };
}
function messageText(data) {
  if (!data || typeof data !== "object") return "";
  const choices = data.choices;
  if (!Array.isArray(choices) || !choices[0] || typeof choices[0] !== "object") return "";
  const content = choices[0].message?.content;
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content.map((part) => {
    if (typeof part === "string") return part;
    if (part && typeof part === "object" && "text" in part && typeof part.text === "string") {
      return part.text;
    }
    return "";
  }).join("");
}
function extractJson(content) {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced?.[1] ?? trimmed;
  try {
    return JSON.parse(raw);
  } catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(raw.slice(start, end + 1));
      } catch {
        throw new GrokError("xAI response was not JSON.");
      }
    }
    throw new GrokError("xAI response was not JSON.");
  }
}
function cleanModelTitle(value) {
  if (typeof value !== "string") return null;
  const title = value.trim().replace(/\s+/g, " ");
  if (title.length < 3 || title.length > 140) return null;
  return title;
}
function cleanAlert(value) {
  if (value === null || value === void 0) return null;
  if (typeof value !== "string") {
    throw new GrokError("hiddenFunnelAlert must be a string or null.");
  }
  const alert = value.trim().replace(/\s+/g, " ");
  return alert ? alert.slice(0, 280) : null;
}
function cleanStamps(value, video, fallback) {
  if (!Array.isArray(value) || value.length === 0) return fallback;
  const stamps = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const row = item;
    if (typeof row.startSec !== "number" || !Number.isFinite(row.startSec)) continue;
    const snapped = snapTimestamp(row.startSec, video);
    if (snapped === null) continue;
    const label = typeof row.label === "string" && row.label.trim() ? row.label.trim().replace(/\s+/g, " ").slice(0, 80) : fallback.find((stamp) => stamp.startSec === snapped)?.label ?? "Substantive segment";
    if (!stamps.some((stamp) => stamp.startSec === snapped)) {
      stamps.push({ startSec: snapped, label });
    }
    if (stamps.length === 4) break;
  }
  return stamps.length > 0 ? stamps : fallback;
}
function snapTimestamp(startSec, video) {
  if (video.cues.length === 0) return null;
  let best = video.cues[0];
  let bestDistance = Math.abs(best.startSec - startSec);
  for (const cue of video.cues) {
    const distance = Math.abs(cue.startSec - startSec);
    if (distance < bestDistance) {
      best = cue;
      bestDistance = distance;
    }
  }
  return bestDistance <= 2 ? best.startSec : null;
}

// ../tmp/bs-src/normalize.ts
var MAX_CUES = 2e3;
var MAX_CUE_CHARS = 5e3;
var MAX_COMMENTS = 50;
var MAX_FIELD_CHARS = 2e5;
function normalizeVideo(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new ValidationError("Request body must be a JSON object.");
  }
  const body = payload;
  if (!("transcript" in body)) {
    throw new ValidationError("transcript is required.");
  }
  return {
    videoId: requireString(body, "videoId"),
    title: requireString(body, "title"),
    channelName: requireString(body, "channelName"),
    description: requireString(body, "description", true),
    cues: parseTranscript(body.transcript),
    comments: parseComments(body.comments)
  };
}
function parseTranscript(input) {
  if (Array.isArray(input)) return parseCueArray(input).slice(0, MAX_CUES);
  if (typeof input === "string") return parseTimedText(input).slice(0, MAX_CUES);
  throw new ValidationError("transcript must be an array of cues or a timed-text string.");
}
function requireString(body, field, allowEmpty = false) {
  const value = body[field];
  if (typeof value !== "string") {
    throw new ValidationError(`${field} must be a string.`);
  }
  if (value.length > MAX_FIELD_CHARS) {
    throw new ValidationError(`${field} is too long.`);
  }
  const normalized = normalizeApostrophes(value).trim();
  if (!allowEmpty && !normalized) {
    throw new ValidationError(`${field} is required.`);
  }
  return normalized;
}
function parseCueArray(input) {
  const cues = [];
  input.forEach((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new ValidationError(
        `transcript[${index}] must be an object with startSec and text.`
      );
    }
    const record = item;
    if (typeof record.text !== "string") {
      throw new ValidationError(`transcript[${index}].text must be a string.`);
    }
    const start = record.startSec ?? record.start ?? record.offsetSec ?? record.offset;
    if (typeof start !== "number" || !Number.isFinite(start) || start < 0) {
      throw new ValidationError(
        `transcript[${index}].startSec must be a non-negative number.`
      );
    }
    const text = normalizeApostrophes(record.text).trim().slice(0, MAX_CUE_CHARS);
    if (!text) return;
    cues.push({ startSec: start, text });
  });
  return cues;
}
function parseComments(input) {
  if (input === void 0) return [];
  if (!Array.isArray(input)) {
    throw new ValidationError("comments must be an array.");
  }
  return input.slice(0, MAX_COMMENTS).map((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new ValidationError(`comments[${index}] must be an object.`);
    }
    const record = item;
    if (typeof record.text !== "string" || !record.text.trim()) {
      throw new ValidationError(`comments[${index}].text must be a non-empty string.`);
    }
    const likes = record.likeCount ?? record.like_count ?? record.likes;
    let likeCount = null;
    if (likes !== void 0 && likes !== null) {
      if (typeof likes !== "number" || !Number.isFinite(likes) || likes < 0) {
        throw new ValidationError(
          `comments[${index}].likeCount must be a non-negative number.`
        );
      }
      likeCount = likes;
    }
    return {
      text: normalizeApostrophes(record.text).trim(),
      likeCount
    };
  });
}
function parseTimedText(input) {
  const text = normalizeApostrophes(input).replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").trim();
  if (!text) return [];
  if (text.includes("-->")) return parseSrtOrVtt(text);
  return parseLooseLines(text);
}
function parseClock(token) {
  const plain = token.trim();
  if (/^\d+(?:\.\d+)?$/.test(plain)) return Number(plain);
  const match = plain.match(/^(?:(\d+):)?(\d{1,2}):(\d{2})(?:[.,](\d{1,3}))?$/);
  if (!match) return null;
  const hours = match[1] ? Number(match[1]) : 0;
  const mins = Number(match[2]);
  const secs = Number(match[3]);
  if (mins > 59 || secs > 59) return null;
  const frac = match[4] ? Number(match[4].padEnd(3, "0")) / 1e3 : 0;
  return hours * 3600 + mins * 60 + secs + frac;
}
function parseSrtOrVtt(input) {
  const lines = input.split("\n");
  const cues = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index].trim();
    const arrow = line.match(
      /^((?:\d+:)?\d{1,2}:\d{2}(?:[.,]\d{1,3})?)\s*-->\s*(?:(?:\d+:)?\d{1,2}:\d{2}(?:[.,]\d{1,3})?)/
    );
    if (!arrow) {
      index += 1;
      continue;
    }
    const startSec = parseClock(arrow[1]);
    index += 1;
    const parts = [];
    while (index < lines.length && lines[index].trim() !== "") {
      parts.push(lines[index].trim());
      index += 1;
    }
    const cueText = parts.join(" ").trim().slice(0, MAX_CUE_CHARS);
    if (startSec !== null && cueText) cues.push({ startSec, text: cueText });
  }
  return cues;
}
function parseLooseLines(input) {
  const cues = [];
  for (const raw of input.split("\n")) {
    const line = raw.trim();
    if (!line || line === "WEBVTT" || line.startsWith("NOTE")) continue;
    const parsed = parseLooseLine(line);
    if (parsed) {
      if (parsed.text) cues.push(parsed);
      continue;
    }
    const previous = cues[cues.length - 1];
    if (previous) {
      previous.text = `${previous.text} ${line}`.trim().slice(0, MAX_CUE_CHARS);
    }
  }
  return cues;
}
function parseLooseLine(line) {
  const bracket = line.match(
    /^(?:\[|\()\s*((?:\d+:)?\d{1,2}:\d{2}(?:[.,]\d{1,3})?|\d+(?:\.\d+)?)\s*(?:\]|\))\s*(?:[-–—:])?\s*(.*)$/
  );
  if (bracket) {
    const startSec = parseClock(bracket[1]);
    if (startSec === null) return null;
    return { startSec, text: bracket[2].trim().slice(0, MAX_CUE_CHARS) };
  }
  const clock = line.match(/^((?:\d+:)?\d{1,2}:\d{2}(?:[.,]\d{1,3})?)\s*(?:[-–—:])?\s*(.*)$/);
  if (clock) {
    const startSec = parseClock(clock[1]);
    if (startSec === null) return null;
    return { startSec, text: clock[2].trim().slice(0, MAX_CUE_CHARS) };
  }
  const seconds = line.match(/^(\d+(?:\.\d+)?)(?:\s+[-–—:]\s*|\s+)(.*)$/);
  if (seconds?.[2].trim()) {
    return { startSec: Number(seconds[1]), text: seconds[2].trim().slice(0, MAX_CUE_CHARS) };
  }
  return null;
}

// ../tmp/bs-src/analyze.ts
async function analyze(payload) {
  const video = normalizeVideo(payload);
  const source = xaiApiKey() ? "grok" : "heuristic";
  const scored = source === "grok" ? await scoreWithGrok(video) : scoreHeuristic(video);
  const threeBetterAlternatives = await findAlternatives({
    video,
    realTitle: scored.realTitle,
    apiKey: youtubeApiKey()
  }).catch(() => unavailableAlternatives("YouTube search failed before alternatives could be ranked."));
  return { body: { ...scored, threeBetterAlternatives }, source };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GrokError,
  RUBRIC,
  ValidationError,
  analyze,
  buildResponse,
  emojiRating,
  findAlternatives,
  normalizeVideo,
  overallFrom,
  rankCandidates,
  responseFromModelPayload,
  roundToTenth,
  rubricWeightTotal,
  scoreHeuristic,
  scoreWithGrok,
  xaiApiKey,
  xaiModel,
  youtubeApiKey
});
