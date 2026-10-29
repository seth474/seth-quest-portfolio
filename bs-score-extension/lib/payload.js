(() => {
const API_URL = "https://sethquest.com/api/bs-score/analyze";

const api = {
  API_URL,
  scrapeWatchPage,
  buildPayload,
  viewFromResponse,
  renderPanel,
  redFlags,
  escapeHtml,
  roundToTenth,
  bandFor,
  parseTimedText: (body) => extractApi().parseTimedText(body),
  mergeComments: (primary, extra) => extractApi().mergeComments(primary, extra),
  readDomComments: (doc) => extractApi().readDomComments(doc),
};

function scrapeWatchPage(doc, href, options) {
  return extractApi().collectWatchPage(doc, href, options);
}

function buildPayload(page) {
  const extract = extractApi();
  const videoId = clean(page?.videoId);
  const title = clean(page?.title);
  const channelName = clean(page?.channelName);
  const chapters = Array.isArray(page?.chapters) ? page.chapters : [];
  const description = extract
    .descriptionWithChapters(clean(page?.description), chapters)
    .slice(0, 20000);
  const transcript = extract.normalizeCues(page?.transcript);
  const comments = extract.mergeComments(page?.comments || [], []).slice(0, extract.COMMENT_LIMIT);
  const missing = [];
  if (!videoId) missing.push("video id");
  if (!title) missing.push("title");
  if (!channelName) missing.push("channel");
  if (missing.length > 0) {
    return {
      ok: false,
      error: `Could not read the ${missing.join(", ")} from this watch page.`,
    };
  }
  const captionState =
    page?.captionState || (page?.captionUrl ? (transcript.length ? "ok" : "empty") : "none");
  return {
    ok: true,
    scraped: {
      hasDescription: clean(page?.description).length > 0,
      transcriptCount: transcript.length,
      commentCount: comments.length,
      captionState,
      viewsLabel: clean(page?.viewsLabel),
      published: clean(page?.published),
      durationLabel: clean(page?.durationLabel),
      chapters,
      linkCounts: page?.linkCounts || { affiliate: 0, short: 0, course: 0 },
    },
    payload: {
      videoId: videoId.slice(0, 80),
      title: title.slice(0, 300),
      channelName: channelName.slice(0, 200),
      description,
      transcript,
      comments,
    },
  };
}

function extractApi() {
  if (typeof require === "function") return require("./extract.js");
  return globalThis.BSExtract;
}

function viewFromResponse(response) {
  if (!response || response.status === 0) {
    return {
      kind: "error",
      offline: true,
      message:
        "Can't reach BS Score at https://sethquest.com (the scoring API did not answer). Check the connection, then click Try again.",
    };
  }
  if (!response.ok) {
    const error = response.body?.error || `The scoring API returned ${response.status}.`;
    const detail = response.body?.detail ? ` ${response.body.detail}` : "";
    return { kind: "error", message: `${error}${detail}`.trim() };
  }
  const body = response.body;
  if (!body || typeof body.overallScore !== "number" || typeof body.emojiRating !== "string") {
    return { kind: "error", message: "The scoring API response did not include a score." };
  }
  return { kind: "result", body, source: response.source || "" };
}

function renderPanel(state) {
  if (state.kind === "loading") {
    const steps = Array.isArray(state.steps) && state.steps.length
      ? state.steps
      : [{ label: state.message || "Scoring this video…", state: "active" }];
    const items = steps
      .map((step) => {
        const mark = { done: "✓", skipped: "–", active: "", todo: "" }[step.state] ?? "";
        const note = step.state === "skipped" ? ' <span class="step-note">(not available, using title + description)</span>' : "";
        return `<li class="step ${escapeHtml(step.state || "todo")}"><span class="dot" aria-hidden="true">${mark}</span>${escapeHtml(step.label)}${note}</li>`;
      })
      .join("");
    return `<section class="card loading"><div class="head"><p class="kicker">BS Score</p><button type="button" class="close" aria-label="Close BS Score">Close</button></div><p class="status" role="status" aria-busy="true">Checking this video…</p><ol class="steps">${items}</ol></section>`;
  }
  if (state.kind === "error") {
    const message = state.message || "Something went wrong while checking this video.";
    const title = state.offline ? `<p class="err-title">Can't reach BS Score server</p>` : "";
    return `<section class="card error"><div class="head"><p class="kicker">BS Score</p><button type="button" class="close" aria-label="Close BS Score">Close</button></div>${title}<p class="status error" role="alert">${escapeHtml(message)}</p><button type="button" class="retry">Try again</button></section>`;
  }
  if (state.kind !== "result") return "";

  const body = state.body;
  const source = sourceCopy(state.source);
  const realTitle =
    typeof body.realTitle === "string" && body.realTitle.trim()
      ? `<p class="kicker">Real title</p><h3 class="real">${escapeHtml(body.realTitle.trim())}</h3>`
      : "";
  const funnel =
    typeof body.hiddenFunnelAlert === "string" && body.hiddenFunnelAlert.trim()
      ? `<p class="alert"><span class="kicker">Hidden funnel</span> ${escapeHtml(body.hiddenFunnelAlert.trim())}</p>`
      : `<p class="clear">No hidden funnel flagged.</p>`;
  const descriptionNote = state.scraped?.hasDescription
    ? ""
    : `<p class="caveat">No description text was available.</p>`;
  const facts = factsLine(state.scraped);
  const chapters = chapterLine(state.scraped?.chapters);
  const links = linkLine(state.scraped?.linkCounts);
  const dims = Array.isArray(body.dimensionBreakdown)
    ? `<ul class="dims">${body.dimensionBreakdown
        .slice(0, 10)
        .map((dimension) => {
          const label = escapeHtml(dimension?.label || dimension?.id || "Dimension");
          const score = typeof dimension?.score === "number" ? dimension.score : 0;
          const width = Math.max(0, Math.min(10, score)) * 10;
          const note = typeof dimension?.note === "string" && dimension.note.trim()
            ? `<p class="dim-note">${escapeHtml(dimension.note.trim())}</p>`
            : "";
          return `<li>
            <div class="dim-top"><span>${label}</span><span>${formatScore(score)}</span></div>
            <div class="bar" aria-hidden="true"><span style="width:${width}%"></span></div>
            ${note}
          </li>`;
        })
        .join("")}</ul>`
    : "";
  const stamps = Array.isArray(body.skipToTheMeatTimestamps) && body.skipToTheMeatTimestamps.length
    ? `<div class="stamps">${body.skipToTheMeatTimestamps
        .slice(0, 6)
        .map((stamp) => {
          const startSec = Number(stamp?.startSec);
          if (!Number.isFinite(startSec) || startSec < 0) return "";
          const clock = extractApi().formatClock(startSec);
          const label = escapeHtml(stamp?.label || "Skip here");
          return `<button type="button" class="seek" data-start-sec="${startSec}">${escapeHtml(clock)} ${label}</button>`;
        })
        .join("")}</div>`
    : chapterSeekFallback(state.scraped?.chapters);
  const tip = tipMarkup(state.tipUrl);

  return `<article class="card" role="status">
    <header class="head">
      <div class="hero">
        ${dialMarkup(body.overallScore)}
        <div>
          <p class="mark">BS Score</p>
          <p class="emoji verdict ${bandClass(body.overallScore)}">${escapeHtml(bandFor(body.overallScore))}</p>
          <p class="score sr">${formatScore(body.overallScore)}</p>
        </div>
      </div>
      <button type="button" class="close">Close</button>
    </header>
    ${redFlagsBlock(body, state.transcript)}
    <p class="badge">${escapeHtml(source.badge)}</p>
    <p class="note">${escapeHtml(source.detail)}</p>
    ${facts ? `<p class="facts">${escapeHtml(facts)}</p>` : ""}
    ${chapters ? `<p class="facts">${escapeHtml(chapters)}</p>${chapterButtons(state.scraped?.chapters)}` : ""}
    ${links ? `<p class="facts">${escapeHtml(links)}</p>` : ""}
    ${realTitle}
    ${funnel}
    <section>
      <h2>Skip to the meat</h2>
      ${stamps}
    </section>
    <section>
      <h2>Breakdown</h2>
      ${dims}
    </section>
    ${descriptionNote}
    <p class="caveat">${escapeHtml(coverageSentence(state.scraped))}</p>
    ${alternativesBlock(body.threeBetterAlternatives)}
    <form class="interest">
      <p class="kicker">Optional email</p>
      <p class="note">Join the early list. Your email is saved on sethquest.com when the signup is accepted.</p>
      <div class="row">
        <input type="email" name="email" autocomplete="email" placeholder="you@example.com" aria-label="Email">
        <button type="submit">Save</button>
      </div>
      <p class="email-note" role="status"></p>
    </form>
    ${tip}
  </article>`;
}

function alternativesBlock(value) {
  const result = value && typeof value === "object" && !Array.isArray(value)
    ? value
    : { status: "unavailable", label: "Alternatives were not included in this response.", items: [] };
  const label = escapeHtml(result.label || "Alternatives were not included in this response.");
  const items = result.status === "ready" && Array.isArray(result.items)
    ? result.items
        .slice(0, 3)
        .map((item) => {
          const url = safeHttpUrl(item?.url);
          if (!url || !item?.title || !item?.videoId) return "";
          return `<li>
            <a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${escapeHtml(item.title)}</a>
            <span class="alt-meta">${escapeHtml(item.channelName || "")} · ${formatScore(Number(item.overallScore) || 0)} ${escapeHtml(bandFor(Number(item.overallScore) || 0))}</span>
          </li>`;
        })
        .join("")
    : "";
  return `<section class="alts">
    <h2>Better alternatives</h2>
    <p class="note">${label}</p>
    ${items ? `<ol>${items}</ol>` : ""}
  </section>`;
}

function safeHttpUrl(value) {
  try {
    const url = new URL(String(value || ""));
    if (url.protocol === "https:" || url.protocol === "http:") return url.toString();
  } catch {
    return "";
  }
  return "";
}

function coverageSentence(scraped) {
  const transcriptCount = scraped?.transcriptCount || 0;
  const commentCount = scraped?.commentCount || 0;
  let transcriptLine = "No captions were available.";
  if (transcriptCount > 0) {
    transcriptLine = `Sent ${transcriptCount} caption cue${transcriptCount === 1 ? "" : "s"}.`;
  } else if (scraped?.captionState === "unreadable") {
    transcriptLine = "Captions were listed, but the track could not be read.";
  } else if (scraped?.captionState === "empty") {
    transcriptLine = "The caption track had no text cues.";
  }
  const commentLine =
    commentCount > 0
      ? `Sent ${commentCount} comment${commentCount === 1 ? "" : "s"}.`
      : "No comments were available.";
  return `${transcriptLine} ${commentLine}`;
}

function factsLine(scraped) {
  return [scraped?.viewsLabel, scraped?.published, scraped?.durationLabel].filter(Boolean).join(" · ");
}

function seekButton(startSec, label) {
  const sec = Number(startSec);
  if (!Number.isFinite(sec) || sec < 0) return "";
  return `<button type="button" class="seek" data-start-sec="${sec}">${escapeHtml(extractApi().formatClock(sec))} ${escapeHtml(label || "")}</button>`;
}

function chapterButtons(chapters) {
  if (!Array.isArray(chapters) || chapters.length === 0) return "";
  return `<div class="stamps chapters">${chapters.slice(0, 12).map((c) => seekButton(c?.startSec, c?.label)).join("")}</div>`;
}

function chapterSeekFallback(chapters) {
  const list = Array.isArray(chapters)
    ? chapters.filter((c) => Number(c?.startSec) > 0 && !/^(intro|introduction|start)$/i.test(String(c?.label || "").trim()))
    : [];
  if (!list.length) return `<p class="note">No skip points were marked.</p>`;
  return `<p class="note">From the description chapters:</p><div class="stamps">${list.slice(0, 4).map((c) => seekButton(c.startSec, c.label)).join("")}</div>`;
}

function chapterLine(chapters) {
  if (!Array.isArray(chapters) || chapters.length === 0) return "";
  const preview = chapters
    .slice(0, 4)
    .map((chapter) => `${extractApi().formatClock(chapter.startSec)} ${chapter.label}`)
    .join(" · ");
  const extra = chapters.length > 4 ? ` · +${chapters.length - 4} more` : "";
  return `${chapters.length} chapter${chapters.length === 1 ? "" : "s"}: ${preview}${extra}`;
}

function linkLine(counts) {
  if (!counts) return "";
  const parts = [];
  if (counts.affiliate) parts.push(`${counts.affiliate} affiliate`);
  if (counts.short) parts.push(`${counts.short} short`);
  if (counts.course) parts.push(`${counts.course} course`);
  if (!parts.length) return "";
  return `Flagged links: ${parts.join(", ")}.`;
}

function sourceCopy(source) {
  if (source === "grok") {
    return { badge: "Grok", detail: "Scored by Grok." };
  }
  if (source === "heuristic") {
    return {
      badge: "Heuristic",
      detail: "The scoring server has no API key, so this is the heuristic score.",
    };
  }
  return { badge: "Score", detail: "The scoring server did not label heuristic or Grok." };
}

function roundToTenth(value) {
  if (!Number.isFinite(value)) return 0;
  const sign = value < 0 ? -1 : 1;
  const thousandths = Math.round(Math.abs(value) * 1000);
  const tenths = Math.floor((thousandths + 50) / 100);
  return (sign * tenths) / 10;
}

function bandFor(score) {
  const rounded = roundToTenth(score);
  if (rounded < 5) return "⚠️🐂💩 High BS";
  if (rounded <= 7) return "🤔📖😐 Mixed / Caution";
  return "✅😊🏆 Gold Mine";
}

function bandClass(score) {
  const rounded = roundToTenth(Number(score));
  if (rounded < 5) return "band-high";
  if (rounded <= 7) return "band-mixed";
  return "band-gold";
}

function dialMarkup(score) {
  const value = Math.max(0, Math.min(10, roundToTenth(Number(score)) || 0));
  const circumference = 2 * Math.PI * 34;
  const filled = (value / 10) * circumference;
  return `<div class="dial ${bandClass(value)}" role="img" aria-label="BS Score ${formatScore(value)} out of 10">
    <svg viewBox="0 0 80 80" width="86" height="86" aria-hidden="true">
      <circle class="track" cx="40" cy="40" r="34" fill="none" stroke-width="7"></circle>
      <circle class="meter" cx="40" cy="40" r="34" fill="none" stroke-width="7" stroke-linecap="round"
        stroke-dasharray="${filled.toFixed(1)} ${circumference.toFixed(1)}" transform="rotate(-90 40 40)"></circle>
    </svg>
    <span class="dial-num">${formatScore(value)}</span>
  </div>`;
}

const FLAG_CUES = {
  headline: ["subscribe", "smash", "secret", "won't believe", "nobody tells", "shocking"],
  engagement: ["subscribe", "like and", "smash", "comment below", "notification"],
  transparency: ["link in", "sponsor", "discount", "coupon", "affiliate", "promo code"],
  intent: ["course", "sign up", "dm me", "link in", "masterclass", "coaching"],
  credibility: ["guaranteed", "100%", "overnight", "passive income", "doctors hate"],
};

function findFlagCue(id, transcript) {
  const words = FLAG_CUES[id];
  if (!words || !Array.isArray(transcript)) return null;
  for (const cue of transcript) {
    const text = String(cue?.text || "").toLowerCase();
    if (words.some((word) => text.includes(word)) && Number.isFinite(Number(cue?.startSec))) {
      return Number(cue.startSec);
    }
  }
  return null;
}

function redFlags(body, transcript) {
  const flags = [];
  if (typeof body?.hiddenFunnelAlert === "string" && body.hiddenFunnelAlert.trim()) {
    flags.push({ label: "Hidden funnel", note: body.hiddenFunnelAlert.trim(), startSec: findFlagCue("intent", transcript) });
  }
  const dims = Array.isArray(body?.dimensionBreakdown) ? body.dimensionBreakdown : [];
  dims
    .filter((d) => typeof d?.score === "number" && d.score < 6.5)
    .sort((x, y) => x.score - y.score)
    .forEach((d) => {
      flags.push({
        label: `${d.label || d.id} · ${formatScore(d.score)}`,
        note: typeof d.note === "string" ? d.note.trim() : "",
        startSec: findFlagCue(d.id, transcript),
      });
    });
  return flags.slice(0, 3);
}

function redFlagsBlock(body, transcript) {
  const flags = redFlags(body, transcript);
  if (!flags.length) return `<section class="flags"><h2>Red flags</h2><p class="clear">No major red flags.</p></section>`;
  const items = flags
    .map((flag) => {
      const stamp = flag.startSec !== null && flag.startSec !== undefined
        ? `<button type="button" class="seek flag-seek" data-start-sec="${flag.startSec}">${escapeHtml(extractApi().formatClock(flag.startSec))}</button>`
        : "";
      return `<li><div class="flag-top"><span class="flag-label">🚩 ${escapeHtml(flag.label)}</span>${stamp}</div>${flag.note ? `<p class="dim-note">${escapeHtml(flag.note)}</p>` : ""}</li>`;
    })
    .join("");
  return `<section class="flags"><h2>Top red flags</h2><ol class="flag-list">${items}</ol></section>`;
}

function formatScore(score) {
  return roundToTenth(Number(score)).toFixed(1);
}

function tipMarkup(tipUrl) {
  const configured = safeHttpUrl(tipUrl);
  if (!configured) {
    return `<p class="tip-row"><span class="tip">Tip link placeholder. No destination is configured.</span></p>`;
  }
  return `<p class="tip-row"><a class="tip" href="${escapeHtml(configured)}" target="_blank" rel="noreferrer">Tip</a></p>`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

if (typeof globalThis !== "undefined") globalThis.BSScore = api;
if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
