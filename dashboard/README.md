# MORE. board (`/dashboard`)

The board keeps the same layout: $10,000 goal, November 30 countdown (America/New_York), clickable numbers, Hot / Warm / Cold, pipeline, map, and lead cards. Map and Categories read the authenticated `/api/crm` payload (`places`, `companies`, `categories`). They show every company in the connected directory, not only the pipeline cards on the home screen.

There is no client-side passphrase and no CRM file under `dashboard/`. The old `dashboard/data.json` snapshot was removed from the repo (it remains in git history).

## What the owner must set in Vercel

Set these on the Vercel project that deploys `sethquest.com` (Production, and Preview if you use it). Nothing here is hardcoded in the repo.

### Lock (do this first)

Until `DASHBOARD_PASSPHRASE` is set, `/dashboard` stays **open** so this deploy cannot lock you out. The page says `Lock not armed`. Set the passphrase before the sheet credentials if the site is already public.

| Env var | Required | Value |
| --- | --- | --- |
| `DASHBOARD_PASSPHRASE` | **Yes, to lock the board** | The passphrase you already use for this board. Exact, case-sensitive. If this is unset, the board stays open. Do not commit the value. |
| `DASHBOARD_SESSION_SECRET` | **Yes, to sign the cookie with its own key** | A long random string (for example `openssl rand -base64 32`). If this is unset but the passphrase is set, the cookie is still signed so you are not locked out. |

Bookmark that keeps working: `https://sethquest.com/dashboard?k=YOUR_PASSPHRASE`. The server checks it, sets an HttpOnly, Secure, SameSite=Lax cookie for 30 days, and redirects to `/dashboard` with the passphrase removed from the URL.

### Full directory (Map + Categories, all companies)

The source of truth is the Google Sheet **Hamptons Business CRM — Six Locations | Home & Property Services**, tab `Companies`.

| Env var | Required | Value |
| --- | --- | --- |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | **Yes, for the full directory** | The service-account key JSON, pasted as one line. Share the sheet with that account's `client_email` (Viewer is enough to read; Editor lets geocoded coordinates be written back into `Lat` / `Lng` columns). |
| `CRM_SHEET_ID` | **Yes, for the full directory** | `1cXJT1Q8DAtNX9a5lD-xmxFr-U8NtpDf7y32YHNKTUUo` |
| `GEOCODING_API_KEY` | **Yes, to pin addresses that do not already have coordinates** | A Google Geocoding API key. Rows with no street address are skipped. Existing lat/lng pins are kept when this is unset. |

Optional: `CRM_SHEET_TAB` (default `Companies`).

If the sheet cannot be read, the board stays up on the fallback snapshot and the footer says so. A bad key does not return 401.

### Fallback when those are unset

If the sheet env vars are not set, `/api/crm` serves the 15-record snapshot from the server-only module `api/_lib/snapshot.js` (not a public URL). Map pins are the coordinates already stored on those records. Categories list only those companies. Goal, countdown, Hot/Warm/Cold, pipeline, and lead cards still work.

### Optional private store

Used only when the sheet env vars are **not** set. Put a JSON document shaped like the snapshot, or `{ "companies": [ ... ] }`, or a bare array of company objects.

| Env var | Required | Value |
| --- | --- | --- |
| `BLOB_READ_WRITE_TOKEN` | No | Vercel Blob read-write token. Preferred when both Blob and KV are present. Object path defaults to `dashboard/crm.json`. Geocode cache: `dashboard/geocode.json`. |
| `KV_REST_API_URL` | No | Vercel KV / Upstash REST URL. Used when Blob is not configured. |
| `KV_REST_API_TOKEN` | No | Matching KV token. |
| `CRM_STORE_KEY` | No | Overrides the Blob path or KV key. |

Legacy overrides, still fail-closed when the JSON is invalid and the sheet is not configured: `DASHBOARD_DATA_JSON`, `DASHBOARD_CRM_SNAPSHOT_B64` (gzip, then base64). Do not commit either value.

## Data the UI reads

- **Home pipeline** — Hot / Warm / Cold cards and the pipeline sheet use `leads` (the working set, plus any sheet row already marked High or Medium).
- **Categories** — every company on `companies`, grouped by trade. The count on a category is the number of those companies.
- **Map** — a pin for every geocoded, visit-eligible record on `places`, clustered within 1 km. PO boxes and do-not-contact rows stay off the map and are counted as excluded. Rows with no address are not sent to the geocoder.

## Tests

```bash
node --test --test-concurrency=1 tests/*.test.js
```

No third-party runtime dependencies.
