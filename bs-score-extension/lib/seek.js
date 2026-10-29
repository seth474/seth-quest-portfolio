(() => {
function seekVideo(video, startSec) {
  const time = Number(startSec);
  if (!video || typeof video.currentTime !== "number" || !Number.isFinite(time) || time < 0) return false;
  video.currentTime = time;
  if (typeof video.play === "function") {
    const pending = video.play();
    if (pending && typeof pending.catch === "function") pending.catch(() => {});
  }
  return true;
}

const api = { seekVideo };
if (typeof globalThis !== "undefined") globalThis.BSScoreSeek = api;
if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
