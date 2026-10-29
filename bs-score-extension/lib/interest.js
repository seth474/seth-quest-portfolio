(() => {
function isValidEmail(value) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

async function readServer(response) {
  if (!response) return { ok: false, body: null };
  if (typeof response.json === "function") {
    let body = null;
    try {
      body = await response.json();
    } catch (err) {
      body = null;
    }
    return { ok: response.ok === true, body: body };
  }
  const body = response.body && typeof response.body === "object" ? response.body : null;
  return { ok: response.ok === true, body: body };
}

async function saveInterest(input, deps) {
  const email = typeof input?.email === "string" ? input.email.trim() : "";
  if (!isValidEmail(email)) {
    return { ok: false, posted: false, persistent: false, message: "Enter a valid email." };
  }
  const record = {
    email: email,
    source: "extension",
    videoId: typeof input.videoId === "string" ? input.videoId : "",
    overallScore: typeof input.overallScore === "number" && Number.isFinite(input.overallScore) ? input.overallScore : null,
    page: "youtube",
  };
  let response;
  try {
    response = await deps.fetchImpl(deps.endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(record),
    });
  } catch (err) {
    return {
      ok: false,
      posted: false,
      persistent: false,
      message: "Could not reach the early list. This address was not saved.",
    };
  }
  const result = await readServer(response);
  if (!result.ok) {
    const message =
      result.body && typeof result.body.message === "string" && result.body.message.trim()
        ? result.body.message.trim()
        : "The early list did not save this address.";
    return { ok: false, posted: true, persistent: false, message: message };
  }
  const persistent = !result.body || result.body.persistent !== false;
  const message =
    result.body && typeof result.body.message === "string" && result.body.message.trim()
      ? result.body.message.trim()
      : persistent
        ? "You're on the early list."
        : "This address was not saved.";
  return { ok: persistent, posted: true, persistent: persistent, message: message };
}

const api = { isValidEmail, saveInterest };
if (typeof globalThis !== "undefined") globalThis.BSInterest = api;
if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
