# BS Score extension

Chrome extension for desktop YouTube watch pages. **Check BS Score** sits under the video title. The click reads the watch page and posts it to `POST https://sethquest.com/api/bs-score/analyze`, then opens a panel with the score, verdict, red flags, and skip-to-the-meat timestamps.

The panel labels the result **Heuristic** when the scoring server has no `XAI_API_KEY`, and **Grok** when that server called Grok. Better alternatives are listed only when the scoring server has `YOUTUBE_API_KEY`.

`config.js` points at production:

- `apiBase`: `https://sethquest.com/api/bs-score`
- `interestUrl`: `https://sethquest.com/api/bs-score/interest`

The email field posts to that interest URL. The address is stored only when Seth has configured Blob, KV, or a Google Sheet on the Vercel project. `tipUrl` stays empty until a destination is verified. Set it in `config.js` only after that check. Do not commit a secret.

To score against a local server instead, change `apiBase` and `interestUrl` in `config.js` to `http://127.0.0.1:4721/api/bs-score` and reload the extension. `host_permissions` already includes that origin.

## Web Store zip

From the repo root:

```bash
node bs-score-extension/build.js
```

That writes `bs-score-extension/bs-score-chrome.zip` with `manifest.json` at the root of the archive. Upload that zip to the Chrome Web Store. It does not include fixtures or this README.

## Load unpacked

1. Open `chrome://extensions`.
2. Turn on **Developer mode**. If a managed policy hides that switch, stop. Do not change the policy to get around it.
3. Click **Load unpacked** and choose this folder (the one that contains `manifest.json`).
4. Open a video on `https://www.youtube.com/watch?v=…`.
5. Click **Check BS Score** under the title.

Reload the YouTube tab if the button is missing after you load the extension.
