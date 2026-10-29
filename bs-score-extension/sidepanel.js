const root = document.getElementById("root");
const style = document.createElement("style");
style.textContent = globalThis.BSCardCSS || "";
document.head.appendChild(style);

async function render() {
  const stored = await chrome.storage.local.get("bsLastScore");
  const state = stored.bsLastScore;
  if (!state || state.kind !== "result") {
    root.innerHTML =
      '<p class="empty">Score a video from its watch page. Check BS Score sits under the title. This panel keeps the latest card.</p>';
    return;
  }
  root.innerHTML = `<div class="drawer">${globalThis.BSScore.renderPanel({
    ...state,
    tipUrl: state.tipUrl || globalThis.BSConfig?.tipUrl,
  })}</div>`;
}

root.addEventListener("click", (event) => {
  const button = event.target instanceof Element ? event.target.closest("button.seek") : null;
  if (!button) return;
  const startSec = Number(button.dataset.startSec);
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0]?.id;
    if (tabId == null) return;
    chrome.tabs.sendMessage(tabId, { type: "bs-score:seek", startSec });
  });
});

root.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;
  const input = form.querySelector("input[type=email]");
  const email = input instanceof HTMLInputElement ? input.value : "";
  const stored = await chrome.storage.local.get("bsLastScore");
  const last = stored.bsLastScore;
  const result = await globalThis.BSInterest.saveInterest(
    {
      email,
      videoId: last?.body?.videoId || "",
      overallScore: last?.body?.overallScore,
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
  const note = form.querySelector(".email-note");
  if (note) note.textContent = result.message;
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.bsLastScore) render();
});

render();
