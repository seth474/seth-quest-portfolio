(() => {
const COMMENT_LIMIT = 50;
const CUE_LIMIT = 2000;

const api = {
  COMMENT_LIMIT,
  CUE_LIMIT,
  assembleWatchPage,
  collectWatchPage,
  videoIdFromHref,
  parseTimedText,
  readDomComments,
  mergeComments,
  parseCount,
  isYouTubeTimedTextUrl,
  normalizeTimedTextUrl,
  chaptersFromDescription,
  classifyLink,
};

function collectWatchPage(doc, href, options = {}) {
  // YouTube is a single-page app: the <script> JSON (ytInitialPlayerResponse /
  // ytInitialData) is written once at first load and is NOT updated when the
  // viewer clicks a related video. Only trust embedded JSON whose video id
  // matches the URL, and prefer freshly fetched watch-page HTML when given.
  const wantedId = videoIdFromHref(href);
  const html = typeof options.html === "string" ? options.html : "";
  const pick = (marker, accept) => {
    const fromHtml = html ? jsonAfterMarker(html, marker, accept) : null;
    return fromHtml || readEmbeddedJson(doc, marker, accept);
  };
  const player = pick("ytInitialPlayerResponse", (value) =>
    Boolean(value?.videoDetails) && (!wantedId || value.videoDetails.videoId === wantedId),
  );
  const initialData = pick(
    "ytInitialData",
    (value) =>
      Boolean(value && (value.contents || value.engagementPanels || value.header)) &&
      (!wantedId || !initialDataVideoId(value) || initialDataVideoId(value) === wantedId),
  );
  return assembleWatchPage({ player, initialData, dom: readDom(doc), href });
}

function videoIdFromHref(href) {
  try {
    return new URL(href).searchParams.get("v") || "";
  } catch {
    return "";
  }
}

function initialDataVideoId(value) {
  return String(value?.currentVideoEndpoint?.watchEndpoint?.videoId || "");
}

function assembleWatchPage({ player, initialData, dom, href }) {
  const pageUrl = new URL(href);
  const details = player?.videoDetails || {};
  const micro = player?.microformat?.playerMicroformatRenderer || {};
  const descriptionTexts = descriptionCandidates(player, initialData, dom);
  const description = longest(descriptionTexts);
  const chapters = chaptersFrom(player, initialData, description);
  const links = extractLinks(descriptionTexts.join("\n"));
  const track = chooseCaptionTrack(player?.captions?.playerCaptionsTracklistRenderer?.captionTracks);
  const comments = mergeComments(commentsFromInitialData(initialData), dom?.comments || []);
  const views = viewsFrom(details, micro, initialData, dom?.viewsText);
  const durationSec = durationFrom(details, micro, dom?.durationText, dom?.isoDuration);
  const published = publishedFrom(micro, initialData, dom?.dateText);

  return {
    videoId: pageUrl.searchParams.get("v") || clean(details.videoId) || "",
    title: firstText([
      details.title,
      textValue(micro.title),
      dom?.title,
    ]),
    channelName: firstText([
      details.author,
      micro.ownerChannelName,
      dom?.channelName,
    ]),
    description,
    views,
    viewsLabel: views == null ? "" : `${views.toLocaleString("en-US")} views`,
    published,
    durationSec,
    durationLabel: durationSec == null ? "" : formatClock(durationSec),
    chapters,
    links,
    linkCounts: countFlags(links),
    captionUrl: track?.url || "",
    captionLanguage: track?.languageCode || "",
    captionKind: track?.kind || "",
    transcript: [],
    comments,
  };
}

function descriptionCandidates(player, initialData, dom) {
  const micro = player?.microformat?.playerMicroformatRenderer || {};
  const texts = [
    clean(player?.videoDetails?.shortDescription),
    textValue(micro.description),
    dom?.description,
  ];
  walk(initialData, (node) => {
    const attributed = node?.attributedDescription?.content;
    if (typeof attributed === "string") texts.push(attributed);
    if (node?.attributedDescriptionBodyText?.content) texts.push(node.attributedDescriptionBodyText.content);
    if (node?.description && (node.description.runs || node.description.simpleText)) {
      texts.push(textValue(node.description));
    }
  });
  return texts.map((text) => clean(text)).filter(Boolean);
}

function chaptersFrom(player, initialData, description) {
  const marked = [];
  const visit = (node) => {
    const chapter = node?.chapterRenderer;
    if (!chapter) return;
    const label = textValue(chapter.title).replace(/\s+/g, " ").trim();
    const startMs = Number(chapter.timeRangeStartMillis);
    if (!label || !Number.isFinite(startMs) || startMs < 0) return;
    marked.push({ startSec: startMs / 1000, label });
  };
  walk(player, visit);
  walk(initialData, visit);
  const unique = dedupeChapters(marked);
  if (unique.length) return unique;
  return chaptersFromDescription(description);
}

function chaptersFromDescription(description) {
  const chapters = [];
  for (const line of String(description || "").split(/\n/)) {
    const match = line.trim().match(/^(?:(\d{1,2}):)?(\d{1,2}):(\d{2})\s+(.+)$/);
    if (!match) continue;
    const hours = match[1] ? Number(match[1]) : 0;
    const mins = Number(match[2]);
    const secs = Number(match[3]);
    if (mins > 59 || secs > 59) continue;
    const label = match[4].replace(/\s+/g, " ").trim();
    if (!label) continue;
    chapters.push({ startSec: hours * 3600 + mins * 60 + secs, label });
  }
  return dedupeChapters(chapters);
}

function dedupeChapters(chapters) {
  const seen = new Set();
  const unique = [];
  for (const chapter of chapters) {
    const key = `${chapter.startSec}|${chapter.label.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(chapter);
  }
  return unique.sort((a, b) => a.startSec - b.startSec);
}

function chooseCaptionTrack(tracks) {
  if (!Array.isArray(tracks)) return null;
  const usable = tracks
    .map((track) => ({
      url: normalizeTimedTextUrl(track?.baseUrl),
      languageCode: clean(track?.languageCode).toLowerCase(),
      kind: clean(track?.kind).toLowerCase(),
      name: textValue(track?.name),
    }))
    .filter((track) => track.url);
  const english = usable.filter((track) => track.languageCode.startsWith("en"));
  const pool = english.length ? english : usable;
  return pool.find((track) => track.kind !== "asr") || pool[0] || null;
}

function commentsFromInitialData(initialData) {
  const found = [];
  walk(initialData, (node) => {
    const renderer = node?.commentThreadRenderer?.comment?.commentRenderer;
    if (!renderer) return;
    const text = textValue(renderer.contentText).replace(/\s+/g, " ").trim();
    if (!text) return;
    const likeText =
      textValue(renderer.voteCount) || renderer.voteCount?.accessibility?.accessibilityData?.label || "";
    found.push({ text, likeCount: parseCount(likeText) });
  });
  return mergeComments(found, []);
}

function readDomComments(doc) {
  let nodes = iterable(doc?.querySelectorAll?.("ytd-comment-thread-renderer"));
  if (!nodes.length) nodes = iterable(doc?.querySelectorAll?.("ytd-comment-view-model"));
  const comments = [];
  for (const node of nodes) {
    const textNode = node.querySelector?.("#content-text, yt-attributed-string#content-text, #content-text");
    const likeNode = node.querySelector?.("#vote-count-middle, #vote-count-left");
    const text = clean(textNode?.textContent || textNode?.innerText);
    if (!text) continue;
    comments.push({
      text,
      likeCount: parseCount(likeNode?.textContent || likeNode?.getAttribute?.("aria-label") || ""),
    });
  }
  return mergeComments(comments, []);
}

function mergeComments(primary, extra) {
  const merged = [];
  const index = new Map();
  for (const comment of [...(primary || []), ...(extra || [])]) {
    const text = clean(comment?.text).replace(/\s+/g, " ");
    if (!text) continue;
    const key = text.toLowerCase();
    const likeCount = parseCount(comment?.likeCount);
    const existingIndex = index.get(key);
    if (existingIndex != null) {
      if (merged[existingIndex].likeCount == null && likeCount != null) {
        merged[existingIndex].likeCount = likeCount;
      }
      continue;
    }
    index.set(key, merged.length);
    merged.push({ text: text.slice(0, 1000), likeCount });
    if (merged.length >= COMMENT_LIMIT) break;
  }
  return merged;
}

function parseTimedText(body) {
  const trimmed = String(body || "").replace(/^\uFEFF/, "").trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      return normalizeCues(cuesFromJson3(JSON.parse(trimmed)));
    } catch {
      return [];
    }
  }
  if (!trimmed.includes("<text")) return [];
  return normalizeCues(cuesFromXml(trimmed));
}

function cuesFromXml(xml) {
  const cues = [];
  const pattern = /<text\b([^>]*)>([\s\S]*?)<\/text>/gi;
  let match = pattern.exec(xml);
  while (match) {
    const start = match[1].match(/\bstart="([^"]+)"/);
    const text = decodeXml(match[2]).replace(/\s+/g, " ").trim();
    if (start && text) cues.push({ startSec: Number(start[1]), text });
    match = pattern.exec(xml);
  }
  return cues;
}

function cuesFromJson3(data) {
  const cues = [];
  for (const event of data?.events || []) {
    const text = (event.segs || [])
      .map((segment) => segment?.utf8 || "")
      .join("")
      .replace(/\s+/g, " ")
      .trim();
    if (!text) continue;
    cues.push({ startSec: Number(event.tStartMs) / 1000, text });
  }
  return cues;
}

function normalizeCues(cues) {
  const normalized = [];
  for (const cue of cues || []) {
    const text = clean(cue?.text).replace(/\s+/g, " ");
    const startSec = Number(cue?.startSec);
    if (!text || !Number.isFinite(startSec) || startSec < 0) continue;
    normalized.push({ startSec, text: text.slice(0, 5000) });
    if (normalized.length >= CUE_LIMIT) break;
  }
  return normalized;
}

function extractLinks(text) {
  const found = new Map();
  for (const match of String(text || "").matchAll(/https?:\/\/[^\s<>"')\]]+/gi)) {
    const url = unwrapUrl(match[0].replace(/[.,]+$/, ""));
    if (!url || found.has(url)) continue;
    found.set(url, { url, flags: classifyLink(url) });
  }
  return [...found.values()];
}

function unwrapUrl(value) {
  try {
    const url = new URL(value);
    if (url.hostname.endsWith("youtube.com") && url.pathname === "/redirect") {
      const target = url.searchParams.get("q") || url.searchParams.get("url");
      if (target) return unwrapUrl(target);
    }
    return url.toString();
  } catch {
    return "";
  }
}

function classifyLink(url) {
  const value = url.toLowerCase();
  const flags = [];
  if (
    /[?&]tag=/.test(value) ||
    /amzn\.to|amazon\.com/.test(value) ||
    /shareasale|sjv\.io|rstyle\.me/.test(value)
  ) {
    flags.push("affiliate");
  }
  if (/bit\.ly|tinyurl\.com|\/\/t\.co\/|goo\.gl|ow\.ly|is\.gd|buff\.ly|cutt\.ly/.test(value)) {
    flags.push("short");
  }
  if (
    /stan\.store|gumroad\.com|skool\.com|teachable\.com|thinkific\.com|podia\.com|kajabi\.com|udemy\.com|skillshare\.com/.test(
      value,
    )
  ) {
    flags.push("course");
  }
  return flags;
}

function countFlags(links) {
  const counts = { affiliate: 0, short: 0, course: 0 };
  for (const link of links || []) {
    for (const flag of link.flags || []) {
      if (flag in counts) counts[flag] += 1;
    }
  }
  return counts;
}

function viewsFrom(details, micro, initialData, domText) {
  const direct = parseCount(details?.viewCount ?? micro?.viewCount);
  if (direct != null) return direct;
  let found = null;
  walk(initialData, (node) => {
    if (found != null) return;
    const text = textValue(node?.videoViewCountRenderer?.viewCount);
    const parsed = parseCount(text);
    if (parsed != null) found = parsed;
  });
  return found != null ? found : parseCount(domText);
}

function publishedFrom(micro, initialData, domText) {
  const iso = clean(micro?.publishDate || micro?.uploadDate);
  if (iso) return formatPublished(iso);
  let found = "";
  walk(initialData, (node) => {
    if (found || !node?.dateText) return;
    const text = textValue(node.dateText);
    if (text) found = formatPublished(text);
  });
  return found || formatPublished(domText);
}

function durationFrom(details, micro, domText, isoDuration) {
  const raw = details?.lengthSeconds ?? micro?.lengthSeconds;
  const seconds = Number(raw);
  if (raw != null && raw !== "" && Number.isFinite(seconds) && seconds >= 0) {
    return seconds;
  }
  const clock = parseClock(domText);
  if (clock != null) return clock;
  return parseIsoDuration(isoDuration);
}

function parseCount(value) {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) return Math.round(value);
  const raw = clean(value).replace(/views?|likes?/gi, "").trim();
  if (!raw) return null;
  const match = raw.match(/^([\d.,]+)\s*([kmb])?$/i);
  if (!match) return null;
  const base = Number(match[1].replace(/,/g, ""));
  if (!Number.isFinite(base)) return null;
  const unit = (match[2] || "").toLowerCase();
  const scale = unit === "b" ? 1e9 : unit === "m" ? 1e6 : unit === "k" ? 1e3 : 1;
  return Math.round(base * scale);
}

function parseClock(value) {
  const match = clean(value).match(/^(?:(\d{1,2}):)?(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = match[1] ? Number(match[1]) : 0;
  const mins = Number(match[2]);
  const secs = Number(match[3]);
  if (mins > 59 || secs > 59) return null;
  return hours * 3600 + mins * 60 + secs;
}

function parseIsoDuration(value) {
  const match = clean(value).match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match || (!match[1] && !match[2] && !match[3])) return null;
  return Number(match[1] || 0) * 3600 + Number(match[2] || 0) * 60 + Number(match[3] || 0);
}

function formatPublished(value) {
  const text = clean(value).replace(/^premiered\s+/i, "");
  const iso = text.match(/^(\d{4}-\d{2}-\d{2})/);
  return iso ? iso[1] : text;
}

function formatClock(seconds) {
  const total = Math.round(seconds);
  const hours = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const pad = (value) => String(value).padStart(2, "0");
  if (hours > 0) return `${hours}:${pad(mins)}:${pad(secs)}`;
  return `${mins}:${pad(secs)}`;
}

function descriptionWithChapters(description, chapters) {
  if (!chapters.length || /^(?:(\d{1,2}):)?(\d{1,2}):(\d{2})\s+\S/m.test(description)) return description;
  const lines = chapters.slice(0, 40).map((chapter) => `${formatClock(chapter.startSec)} ${chapter.label}`);
  const block = `Chapters:\n${lines.join("\n")}`;
  return description ? `${description}\n\n${block}` : block;
}

function readDom(doc) {
  if (!doc?.querySelector) return { comments: [] };
  return {
    title: firstText([
      textFrom(doc, "ytd-watch-metadata h1 yt-formatted-string"),
      textFrom(doc, "h1 yt-formatted-string"),
      textFrom(doc, "h1"),
      metaContent(doc, 'meta[name="title"]'),
    ]),
    channelName: firstText([
      textFrom(doc, "ytd-channel-name a"),
      textFrom(doc, "#channel-name a"),
      textFrom(doc, "#owner #channel-name a"),
      textFrom(doc, "ytd-video-owner-renderer a"),
    ]),
    description: longest([
      textFrom(doc, "#description-inline-expander yt-attributed-string"),
      textFrom(doc, "ytd-expandable-video-description-body-renderer"),
      textFrom(doc, "#description-inline-expander"),
      textFrom(doc, "ytd-text-inline-expander"),
      textFrom(doc, "#description"),
      metaContent(doc, 'meta[name="description"]'),
      metaContent(doc, 'meta[property="og:description"]'),
    ]),
    viewsText: textFrom(doc, "#info-container #count, ytd-watch-info-text"),
    dateText: textFrom(doc, "#info-strings yt-formatted-string"),
    durationText: textFrom(doc, ".ytp-time-duration"),
    isoDuration: metaContent(doc, 'meta[itemprop="duration"]'),
    comments: readDomComments(doc),
  };
}

function readEmbeddedJson(doc, marker, accept) {
  const scripts = iterable(doc?.querySelectorAll?.("script"));
  for (const script of scripts) {
    const parsed = jsonAfterMarker(script.textContent || "", marker, accept);
    if (parsed) return parsed;
  }
  return null;
}

function jsonAfterMarker(text, marker, accept) {
  let from = 0;
  while (from < text.length) {
    const index = text.indexOf(marker, from);
    if (index === -1) return null;
    const brace = text.indexOf("{", index);
    const semi = text.indexOf(";", index);
    if (brace !== -1 && (semi === -1 || brace < semi) && brace - index < 200) {
      const json = extractJsonObject(text, brace);
      if (json) {
        try {
          const parsed = JSON.parse(json);
          if (accept(parsed)) return parsed;
        } catch {
          // Keep scanning. The name can appear before the real object.
        }
      }
    }
    from = index + marker.length;
  }
  return null;
}

function extractJsonObject(text, start) {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i += 1) {
    const char = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

function isYouTubeTimedTextUrl(value) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      (url.hostname === "www.youtube.com" || url.hostname === "youtube.com") &&
      url.pathname === "/api/timedtext"
    );
  } catch {
    return false;
  }
}

function normalizeTimedTextUrl(value) {
  const trimmed = clean(value);
  if (!trimmed) return "";
  const withProtocol = trimmed.startsWith("//") ? `https:${trimmed}` : trimmed;
  return isYouTubeTimedTextUrl(withProtocol) ? withProtocol : "";
}

function walk(node, visit, depth = 0, seen = new Set()) {
  if (!node || typeof node !== "object" || depth > 28 || seen.has(node)) return;
  seen.add(node);
  visit(node);
  const values = Array.isArray(node) ? node : Object.values(node);
  for (const value of values) walk(value, visit, depth + 1, seen);
}

function textValue(node) {
  if (node == null) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (typeof node.simpleText === "string") return node.simpleText;
  if (Array.isArray(node.runs)) return node.runs.map((run) => run?.text || "").join("");
  if (typeof node.content === "string") return node.content;
  return "";
}

function textFrom(doc, selector) {
  const nodes = iterable(doc.querySelectorAll?.(selector));
  const list = nodes.length ? nodes : compact([doc.querySelector?.(selector)]);
  let best = "";
  for (const node of list) {
    const text = clean(node?.textContent || node?.innerText || node?.content || node?.getAttribute?.("content"));
    if (text.length > best.length) best = text;
  }
  return best;
}

function metaContent(doc, selector) {
  const node = doc.querySelector?.(selector);
  return clean(node?.content || node?.getAttribute?.("content"));
}

function firstText(values) {
  for (const value of values) {
    const text = clean(value).replace(/\s+/g, " ");
    if (text) return text;
  }
  return "";
}

function longest(values) {
  return values.reduce((best, value) => (clean(value).length > best.length ? clean(value) : best), "");
}

function decodeXml(value) {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function iterable(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [...value];
}

function compact(values) {
  return values.filter(Boolean);
}

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

api.descriptionWithChapters = descriptionWithChapters;
api.formatClock = formatClock;
api.normalizeCues = normalizeCues;

if (typeof globalThis !== "undefined") globalThis.BSExtract = api;
if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
