(() => {
  if (globalThis.__bsScoreInstalled) {
    globalThis.__bsScoreRefresh?.();
    return;
  }
  globalThis.__bsScoreInstalled = true;

  const CSS = `
    .wrap { display: block; font-family: "Segoe UI", Helvetica, Arial, sans-serif; color: #f4f0e6; line-height: 1.45; }
    button { font: inherit; cursor: pointer; }
    .check { display: inline-flex; align-items: center; gap: 8px; border: 1px solid #e2b657; background: #1c1a16; color: #f4f0e6; border-radius: 999px; padding: 7px 14px; font-size: 13px; font-weight: 600; }
    .check::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: #e2b657; }
    .check:hover { background: #2a261c; }
    .check:disabled { opacity: 0.65; cursor: progress; }
    .check:focus-visible, .close:focus-visible, .retry:focus-visible { outline: 2px solid #e2b657; outline-offset: 2px; }
    .panel { margin-top: 10px; width: min(100%, 420px); background: #14130f; border: 1px solid #343026; border-radius: 14px; padding: 14px; box-shadow: 0 10px 28px rgba(0, 0, 0, 0.28); }
    .panel[hidden] { display: none; }
    .status { margin: 0; font-size: 14px; }
    .status.error { color: #f0c2b4; }
    .head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
    .score { margin: 0; font-size: 42px; line-height: 1; font-weight: 600; }
    .emoji { margin: 8px 0 0; font-size: 16px; }
    .badge { margin: 10px 0 0; color: #e2b657; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; }
    .note, .caveat, .alert, .real, .facts { margin: 8px 0 0; font-size: 13px; color: #c8c1b3; }
    .alert { color: #f0d3b0; }
    .real strong { color: #f4f0e6; font-weight: 600; }
    .dims { list-style: none; margin: 12px 0 0; padding: 0; }
    .dims li { display: flex; justify-content: space-between; gap: 12px; border-top: 1px solid #343026; padding: 6px 0; font-size: 12px; color: #c8c1b3; }
    .dims span:last-child { color: #f4f0e6; }
    .close, .retry { border: 1px solid #343026; background: transparent; color: #f4f0e6; border-radius: 999px; padding: 4px 10px; font-size: 12px; }
    .retry { margin-top: 10px; }
  `;

  let requestSerial = 0;
  let mountedVideoId = "";
  const firstLoadVideoId = new URLSearchParams(location.search).get("v") || "";
  let buttonShadow = null;
  let seekListener = false;
  let retryTimer = 0;
  let anchorObserver = null;
  let anchorObserverTarget = null;

  function boot() {
    ensureMounted();
    scheduleRetries();
  }

  globalThis.__bsScoreRefresh = boot;
  document.addEventListener("yt-navigate-finish", boot);
  window.addEventListener("popstate", boot);
  boot();

  function currentVideoId() {
    if (location.pathname !== "/watch") return "";
    return new URL(location.href).searchParams.get("v") || "";
  }

  function scheduleRetries() {
    window.clearInterval(retryTimer);
    let tries = 0;
    retryTimer = window.setInterval(() => {
      tries += 1;
      ensureMounted();
      const host = document.getElementById("bs-score-host");
      if (!currentVideoId() || host?.dataset.placement === "inline" || tries > 25) {
        window.clearInterval(retryTimer);
      }
    }, 400);
  }

  function ensureMounted() {
    const videoId = currentVideoId();
    const existing = document.getElementById("bs-score-host");
    if (!videoId) {
      existing?.remove();
      document.getElementById("bs-score-drawer")?.remove();
      anchorObserver?.disconnect();
      anchorObserver = null;
      anchorObserverTarget = null;
      return;
    }
    const drawer = document.getElementById("bs-score-drawer");
    if (mountedVideoId && mountedVideoId !== videoId) {
      // SPA navigation: drop any in-flight score and the stale panel.
      requestSerial += 1;
      drawer?.remove();
    } else if (drawer?.dataset.videoId && drawer.dataset.videoId !== videoId) {
      drawer.remove();
    }
    mountedVideoId = videoId;
    document.querySelectorAll("#bs-score-host").forEach((node, index) => {
      if (index > 0 || node.dataset.videoId !== videoId) node.remove();
    });
    watchMetadata();
    if (existing?.isConnected && existing.dataset.videoId === videoId) {
      if (existing.dataset.placement !== "inline") {
        const anchor = findAnchor();
        if (anchor) place(existing, anchor);
      }
      return;
    }
    existing?.remove();
    const host = document.createElement("div");
    host.id = "bs-score-host";
    host.dataset.videoId = videoId;
    place(host, findAnchor());
    const shadow = host.attachShadow({ mode: "open" });
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(CSS);
    shadow.adoptedStyleSheets = [sheet];
    shadow.innerHTML = '<div class="wrap"><button type="button" class="check">Check BS Score</button></div>';
    buttonShadow = shadow;
    shadow.addEventListener("click", (event) => {
      const button = event.target instanceof Element ? event.target.closest("button.check") : null;
      if (!button) return;
      event.preventDefault();
      void scoreCurrent();
    });
    host.addEventListener("click", (event) => event.stopPropagation());
    if (!seekListener) {
      seekListener = true;
      chrome.runtime.onMessage.addListener((message) => {
        if (message?.type !== "bs-score:seek") return undefined;
        const video = document.querySelector("video");
        globalThis.BSScoreSeek.seekVideo(video, message.startSec);
        return undefined;
      });
    }
  }

  function watchMetadata() {
    const meta = document.querySelector("ytd-watch-metadata");
    if (!meta || meta === anchorObserverTarget) return;
    anchorObserver?.disconnect();
    anchorObserver = new MutationObserver(() => {
      const host = document.getElementById("bs-score-host");
      if (!currentVideoId()) return;
      if (!host?.isConnected || host.dataset.placement !== "inline") ensureMounted();
    });
    anchorObserver.observe(meta, { childList: true, subtree: true });
    anchorObserverTarget = meta;
  }

  function findAnchor() {
    const title = document.querySelector(
      "ytd-watch-metadata #title, #above-the-fold #title, ytd-watch-metadata h1",
    );
    const node = title?.closest?.("#title") || title;
    if (!node?.parentElement) return null;
    return { parent: node.parentElement, before: node.nextSibling };
  }

  function place(host, anchor) {
    if (anchor) {
      anchor.parent.insertBefore(host, anchor.before);
      host.dataset.placement = "inline";
      host.style.cssText = "display:block;width:100%;margin:10px 0 6px;clear:both;";
      return;
    }
    if (!host.isConnected) document.body.appendChild(host);
    host.dataset.placement = "floating";
    host.style.cssText =
      "display:block;position:fixed;top:72px;right:16px;width:min(360px, calc(100vw - 24px));z-index:2147483646;margin:0;";
  }

  function ensureDrawer() {
    let host = document.getElementById("bs-score-drawer");
    if (host?.shadowRoot) return host;
    host?.remove();
    host = document.createElement("div");
    host.id = "bs-score-drawer";
    host.hidden = true;
    host.style.cssText =
      "position:fixed;top:64px;right:12px;width:min(380px,calc(100vw - 24px));max-height:calc(100vh - 80px);z-index:2147483647;border-radius:14px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,.35);";
    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: "open" });
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(globalThis.BSCardCSS || "");
    shadow.adoptedStyleSheets = [sheet];
    shadow.innerHTML = '<div class="drawer"></div>';
    shadow.addEventListener("click", (event) => {
      const button = event.target instanceof Element ? event.target.closest("button") : null;
      if (!button) return;
      if (button.classList.contains("close")) {
        cancel();
      } else if (button.classList.contains("retry")) {
        event.preventDefault();
        void scoreCurrent();
      } else if (button.classList.contains("seek")) {
        const video = document.querySelector("video");
        const moved = globalThis.BSScoreSeek.seekVideo(video, button.dataset.startSec);
        const note = shadow.querySelector(".email-note");
        if (!moved && note) note.textContent = "Couldn't find the video player to seek.";
      }
    });
    shadow.addEventListener("submit", (event) => {
      event.preventDefault();
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      const input = form.querySelector("input[type=email]");
      void submitEmail(input instanceof HTMLInputElement ? input.value : "");
    });
    return host;
  }

  function show(state) {
    const check = buttonShadow?.querySelector("button.check");
    const loading = state.kind === "loading";
    if (check) {
      check.disabled = loading;
      check.setAttribute("aria-busy", loading ? "true" : "false");
    }
    const host = ensureDrawer();
    const drawer = host.shadowRoot?.querySelector(".drawer");
    if (!drawer) return;
    if (state.kind === "idle") {
      host.hidden = true;
      drawer.innerHTML = "";
      return;
    }
    host.hidden = false;
    const next = { ...state, tipUrl: state.tipUrl || globalThis.BSConfig?.tipUrl };
    try {
      drawer.innerHTML = globalThis.BSScore.renderPanel(next);
    } catch {
      if (check) {
        check.disabled = false;
        check.setAttribute("aria-busy", "false");
      }
      drawer.textContent = "";
      const message = document.createElement("p");
      message.setAttribute("role", "alert");
      message.style.cssText = "margin:0;padding:22px 20px;color:#f0c2b4;font:14px sans-serif;";
      message.textContent = "BS Score could not draw its panel. Reload the extension and try again.";
      const close = document.createElement("button");
      close.type = "button";
      close.className = "close";
      close.textContent = "Close";
      drawer.append(message, close);
      return;
    }
    if (state.kind === "result" && chrome.storage?.local) {
      chrome.storage.local.set({ bsLastScore: next });
    }
  }

  function cancel() {
    requestSerial += 1;
    show({ kind: "idle" });
  }

  async function submitEmail(email) {
    const host = document.getElementById("bs-score-drawer");
    const note = host?.shadowRoot?.querySelector(".email-note");
    const stored = await chrome.storage?.local?.get("bsLastScore");
    const last = stored?.bsLastScore;
    const result = await globalThis.BSInterest.saveInterest(
      {
        email,
        videoId: host?.dataset.videoId || "",
        overallScore: Number(host?.dataset.score),
      },
      {
        storage: {
          async get(key) {
            const value = await chrome.storage.local.get(key);
            return value[key];
          },
          async set(key, value) {
            await chrome.storage.local.set({ [key]: value });
          },
        },
        endpoint: globalThis.BSConfig?.interestUrl,
        fetchImpl: async (_url, init) => {
          const record = JSON.parse(init.body);
          return chrome.runtime.sendMessage({ type: "bs-score:interest", record });
        },
      },
    );
    if (host && last?.body?.videoId) host.dataset.videoId = last.body.videoId;
    if (note) note.textContent = result.message;
  }

  const STEPS = ["Reading title and description", "Fetching captions", "Reading comments", "Scoring"];

  function progress(serial, steps) {
    if (serial !== requestSerial) return;
    show({ kind: "loading", steps: STEPS.map((label, index) => ({ label, state: steps[index] || "todo" })) });
  }

  async function scoreCurrent() {
    const serial = ++requestSerial;
    const started = Date.now();
    try {
      progress(serial, ["active", "todo", "todo", "todo"]);
    } catch {
      // Rendering problems are handled by the error state below.
    }
    try {
      await scoreSteps(serial, started);
    } catch {
      if (serial !== requestSerial) return;
      show({ kind: "error", message: "BS Score hit an unexpected problem on this page. Try again." });
    }
  }

  async function scoreSteps(serial, started) {
    let page;
    try {
      page = await withTimeout(collectPage(serial), 6000, null);
    } catch {
      page = null;
    }
    if (serial !== requestSerial) return;
    if (page && page.videoId !== currentVideoId()) return;
    if (!page) {
      show({ kind: "error", message: "Could not read this watch page in time. Try again." });
      return;
    }
    const built = globalThis.BSScore.buildPayload(page);
    if (!built.ok) {
      show({ kind: "error", message: built.error });
      return;
    }
    progress(serial, ["done", stepState(page.captionState), "done", "active"]);
    let response;
    try {
      response = await withTimeout(
        chrome.runtime.sendMessage({ type: "bs-score:analyze", payload: built.payload }),
        20000,
        { ok: false, status: 0, body: null, source: null },
      );
    } catch {
      response = { ok: false, status: 0, body: null, source: null };
    }
    if (serial !== requestSerial) return;
    const view = globalThis.BSScore.viewFromResponse(response);
    if (view.kind === "result") {
      view.scraped = built.scraped;
      view.transcript = built.payload.transcript;
      view.elapsedMs = Date.now() - started;
      const host = document.getElementById("bs-score-drawer");
      if (host) {
        host.dataset.videoId = built.payload.videoId;
        host.dataset.score = String(view.body?.overallScore ?? "");
        host.dataset.elapsedMs = String(view.elapsedMs);
      }
    }
    show(view);
  }

  function stepState(captionState) {
    return captionState === "ok" ? "done" : "skipped";
  }

  async function freshWatchHtml(videoId) {
    // After SPA navigation the embedded JSON belongs to the first video, so
    // fetch this video's own watch page and parse its JSON instead.
    if (!videoId || videoId === firstLoadVideoId) return "";
    try {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 2500);
      const response = await fetch(`/watch?v=${encodeURIComponent(videoId)}`, {
        credentials: "include",
        signal: controller.signal,
      });
      const text = response.ok ? await response.text() : "";
      window.clearTimeout(timer);
      return text.length < 6_000_000 ? text : "";
    } catch {
      return "";
    }
  }

  async function collectPage(serial) {
    const href = location.href;
    const videoId = currentVideoId();
    const html = await freshWatchHtml(videoId);
    if (serial !== requestSerial) return null;
    const page = globalThis.BSScore.scrapeWatchPage(document, href, { html });
    if (page.videoId !== videoId) throw new Error("stale page data");
    if (!Array.isArray(page.transcript)) page.transcript = [];
    progress(serial, ["done", "active", "active", "todo"]);
    const captions = readCaptions(page.captionUrl).then((result) => {
      progress(serial, ["done", stepState(result.captionState), "active", "todo"]);
      return result;
    });
    const comments =
      (page.comments || []).length < 20
        ? withTimeout(readCommentsAfterScroll(), 1800, []).catch(() => [])
        : Promise.resolve([]);
    const [caption, more] = await Promise.all([captions, comments]);
    if (page.captionUrl) {
      page.transcript = caption.transcript;
      page.captionState = caption.captionState;
    }
    page.comments = globalThis.BSScore.mergeComments(page.comments || [], more || []);
    return page;
  }

  async function readCaptions(captionUrl) {
    if (!captionUrl) return { transcript: [], captionState: "none" };
    let fetched = null;
    try {
      fetched = await withTimeout(
        chrome.runtime.sendMessage({ type: "bs-score:timedtext", url: captionUrl }),
        3500,
        null,
      );
    } catch {
      fetched = null;
    }
    if (fetched?.ok && typeof fetched.body === "string") {
      const transcript = globalThis.BSScore.parseTimedText(fetched.body);
      return { transcript, captionState: transcript.length ? "ok" : "empty" };
    }
    return { transcript: [], captionState: "unreadable" };
  }

  async function readCommentsAfterScroll() {
    const already = globalThis.BSScore.readDomComments(document);
    if (already.length >= 20) return already;
    const section = document.querySelector("#comments, ytd-comments");
    if (!section) return already;
    const previous = window.scrollY;
    section.scrollIntoView({ block: "center", behavior: "auto" });
    let comments = already;
    for (let waited = 0; waited < 1500; waited += 150) {
      await delay(150);
      comments = globalThis.BSScore.readDomComments(document);
      if (comments.length >= 10) break;
    }
    window.scrollTo(0, previous);
    return comments;
  }

  function withTimeout(promise, ms, fallback) {
    return new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => resolve(fallback), ms);
      Promise.resolve(promise).then(
        (value) => {
          window.clearTimeout(timer);
          resolve(value);
        },
        (error) => {
          window.clearTimeout(timer);
          reject(error);
        },
      );
    });
  }

  function delay(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }
})();
