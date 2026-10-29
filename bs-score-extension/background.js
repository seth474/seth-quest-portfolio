if (typeof importScripts === "function") {
  try {
    importScripts("config.js");
  } catch (err) {
    // The production URLs below still apply when config.js cannot load.
  }
}

function apiBase() {
  const configured = globalThis.BSConfig && globalThis.BSConfig.apiBase;
  const base = typeof configured === "string" && configured.trim() ? configured.trim() : "https://sethquest.com/api/bs-score";
  return base.replace(/\/$/, "");
}

function interestEndpoint() {
  const configured = globalThis.BSConfig && globalThis.BSConfig.interestUrl;
  if (typeof configured === "string" && configured.trim()) return configured.trim();
  return apiBase() + "/interest";
}

chrome.runtime.onInstalled.addListener(() => {
  if (chrome.sidePanel?.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || typeof message.type !== "string") return undefined;
  if (message.type === "bs-score:analyze") {
    analyze(message.payload).then(sendResponse);
    return true;
  }
  if (message.type === "bs-score:timedtext") {
    fetchTimedText(message.url).then(sendResponse);
    return true;
  }
  if (message.type === "bs-score:interest") {
    postInterest(message.record).then(sendResponse);
    return true;
  }
  return undefined;
});

async function postInterest(record) {
  try {
    const response = await fetch(interestEndpoint(), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(record),
    });
    let body = null;
    try {
      body = await response.json();
    } catch (err) {
      body = null;
    }
    return { ok: response.ok, status: response.status, body };
  } catch (err) {
    return { ok: false, status: 0, body: null };
  }
}

async function fetchTimedText(value) {
  const url = normalizeTimedTextUrl(value);
  if (!url) return { ok: false, body: "" };
  try {
    const response = await fetch(url, { credentials: "include", signal: AbortSignal.timeout(3000) });
    if (!response.ok) return { ok: false, body: "" };
    const body = await response.text();
    if (body.length > 1_500_000) return { ok: false, body: "" };
    return { ok: true, body };
  } catch {
    return { ok: false, body: "" };
  }
}

function normalizeTimedTextUrl(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  const withProtocol = trimmed.startsWith("//") ? `https:${trimmed}` : trimmed;
  try {
    const url = new URL(withProtocol);
    if (
      url.protocol === "https:" &&
      (url.hostname === "www.youtube.com" || url.hostname === "youtube.com") &&
      url.pathname === "/api/timedtext"
    ) {
      return url.toString();
    }
  } catch {
    return "";
  }
  return "";
}

async function analyze(payload) {
  try {
    const response = await fetch(apiBase() + "/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(50000),
    });
    const source = response.headers.get("x-bs-score-source");
    const text = await response.text();
    let body = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = { error: "The scoring API returned a response that was not JSON." };
    }
    return { ok: response.ok, status: response.status, source, body };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      source: null,
      body: null,
      error: error instanceof Error ? error.message : "The scoring API did not answer.",
    };
  }
}
