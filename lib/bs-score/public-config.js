/**
 * Public, non-secret settings for the landing page.
 * Missing values stay empty. Nothing here is a credential.
 */

function httpsUrl(value) {
  var text = String(value || "").trim();
  if (!text) return "";
  try {
    var url = new URL(text);
    if (url.protocol !== "https:") return "";
    if (!url.hostname || url.username || url.password) return "";
    return url.toString();
  } catch (err) {
    return "";
  }
}

function publicConfig(env) {
  var source = env || process.env;
  return {
    chromeStoreUrl: httpsUrl(source.BS_SCORE_CHROME_STORE_URL),
    tipUrl: httpsUrl(source.BS_SCORE_TIP_URL)
  };
}

module.exports = {
  httpsUrl: httpsUrl,
  publicConfig: publicConfig
};
