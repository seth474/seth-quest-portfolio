# Daily board data

The UI retains the original visual design and supports evidence-backed visit and
meeting drill-downs, category browsing, map coverage, revenue distinctions, and
the November 30, 2026 departure goal in America/New_York.

Without a private dataset, the API serves the existing curated snapshot and the
UI identifies missing history and directory records. Aggregate counts are never
expanded into invented visits or meetings. Prepared presentations are separate
from completed meeting history. Unknown collections are not displayed as zero.

An authorized operator can supply a private server-side snapshot through
`DASHBOARD_CRM_SNAPSHOT_B64` (gzip-compressed JSON encoded as base64), or
`DASHBOARD_DATA_JSON` for a small plain JSON snapshot. This is snapshot support,
not a live Google Sheets integration. No credentials or environment settings
were changed in this release. Check the platform's environment size limit before
configuration; never put a private CRM payload in this public repository.

The optional dataset extends the original shape with:

- `companies`: records with stable `id`/`companyId`, name, trade, stage, nextStep,
  address, numeric lat/lng, contact fields and optional notes/source.
- `directoryComplete` and `sourceLabel`: explicit coverage and provenance.
- `visits`: companyId, name, date, status, notes, source and substantive boolean.
  Only sourced entries are shown. Conversations deduplicate by companyId.
- `meetingHistory`: sourced company records with status `completed`; prepared
  presentations do not belong in this collection.
- `deals`: name, amount, status (`agreed` or `proposed`), collected (number or
  null), and optional note/source. Null means payment is unconfirmed.

Only valid supplied coordinates are mapped; no town-center pins are fabricated.
Missing coordinates and visit exclusions have visible counts and browse lists.
Private source updates and geocoding require a separate authorized data workflow.

Run `node --test tests/*.test.js`. There are no third-party runtime dependencies.
