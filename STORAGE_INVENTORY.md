# Site inventory

Generated for the storage cleanup on `cursor/storage-cleanup-e605`. Dates are the last git commit that touched each file before this cleanup. Routes assume `cleanUrls` (a path without `.html` serves the matching file).

Bytes removed from the deploy by this change: **20,701,647** (8,647,036 of exact duplicates deleted, 12,054,611 from recompressing two videos).

## Removed files

Every file below was SHA-256 identical to the copy that was kept. Repo search covered html, js, css, json, and `vercel.json`.

| Removed | Bytes | References before deletion | What kept it working |
| --- | ---: | --- | --- |
| `pumamala-social.mp4` | 3,252,391 | `index.html` video `src` and asset label | Label and `src` now `/pumamala/pumamala-social.mp4`. Redirect `/pumamala-social.mp4` → that file. |
| `elua/elua/index.html` | 262,007 | None | Redirect `/elua/elua` and `/elua/elua/index.html` → `/elua`. Kept `elua/index.html`. |
| `elua/elua/elua-social.mp4` | 2,480,181 | None | Redirect `/elua/elua/:path*` → `/elua/:path*`. Kept `elua/elua-social.mp4`. |
| `elua/elua/elua-social-poster.jpg` | 38,281 | None | Same wildcard redirect. Kept `elua/elua-social-poster.jpg`. |
| `elua/elua/elua-1.jpg` | 125,756 | None | Explicit redirect → `/elua/elua-report.jpg` (same bytes). |
| `elua/elua/elua-2.jpg` | 126,480 | None | Explicit redirect → `/elua/elua-explore.jpg`. |
| `elua/elua/elua-3.jpg` | 222,155 | None | Explicit redirect → `/elua/elua-hero.jpg`. |
| `elua/elua-1.jpg` | 125,756 | `index.html`, `elua-ux/index.html` | Both now use `/elua/elua-report.jpg`. Redirect from `/elua/elua-1.jpg`. |
| `elua/elua-2.jpg` | 126,480 | `elua-ux/index.html` | Now `/elua/elua-explore.jpg`. Redirect from `/elua/elua-2.jpg`. |
| `elua/elua-3.jpg` | 222,155 | `elua-ux/index.html` | Now `/elua/elua-hero.jpg`. Redirect from `/elua/elua-3.jpg`. |
| `elua-ux/elua-report.jpg` | 125,756 | None (page uses `/elua/…`) | Redirect → `/elua/elua-report.jpg`. `elua-ux/index.html` kept. |
| `elua-ux/elua-explore.jpg` | 126,480 | None | Redirect → `/elua/elua-explore.jpg`. |
| `elua-ux/elua-hero.jpg` | 222,155 | None | Redirect → `/elua/elua-hero.jpg`. |
| `dfb-dashboard.html` | 596,770 | None (`dfb-dashboard.jpg` is a different file and stays) | Redirect `/dfb-dashboard` and `/dfb-dashboard.html` → `/dfb` (`dfb/index.html`, same bytes). |
| `sethquest-update.zip` | 594,233 | None | Deleted. No page to redirect to. |

## Left in place

| File | Bytes | Reference status |
| --- | ---: | --- |
| `pumamala-reel.mp4` | 4,723,513 | Referenced by `pumamala/index.html` and `clientpumamala/index.html`. Kept. |
| `dfb-funnel.html` | 598,079 | Referenced as `/dfb-funnel` from `deep-fried-bananas/index.html`. Kept. |
| `trade-workshop/video/general-v1.mp4` | 2,025,389 | Referenced by `trade-workshop/trades.js`. Kept. |
| `dfb-reel.mp4` | 3,657,716 | Unreferenced. Removed in the follow-up cleanup. |

## Videos recompressed

Same filenames. H.264, CRF 26, AAC audio copied, `+faststart`. Long side capped at 1080; neither file was upscaled.

| File | Before | After | Saved | Picture |
| --- | ---: | ---: | ---: | --- |
| `more/make-more-money.mp4` | 17,615,915 | 9,362,200 | 8,253,715 | 720×1280 → 608×1080, 73.80s, audio kept |
| `real-estate/lizzie-social.mp4` | 9,698,315 | 5,897,419 | 3,800,896 | 480×848 unchanged (already under 1080), 48.41s, audio kept |

## Deploy ignore

`.vercelignore` excludes `*.zip` and `*.md` / `**/*.md` from the Vercel upload. That covers `elua-app.zip` (72,608 bytes, unreferenced app archive, still in git) and docs such as `VSL_SCRIPT.md`. The resume PDF and site media are still uploaded. This report is markdown, so it stays in git and stays out of the deploy.

## Public routes

Rewrites in `vercel.json` (still in place):

| Route | Serves | What it is |
| --- | --- | --- |
| `/workshop` | `/trade-workshop/landing` | Trade workshop signup |
| `/hvac-workshop` | `/trade-workshop/landing` | Same landing |
| `/electrician-workshop` | `/trade-workshop/landing` | Same landing |
| `/plumbing-workshop` | `/trade-workshop/landing` | Same landing |
| `/workshop/registered` | `/trade-workshop/registered` | Registration confirmation |
| `/hvac-workshop/registered` | `/trade-workshop/registered` | Same confirmation |
| `/electrician-workshop/registered` | `/trade-workshop/registered` | Same confirmation |
| `/plumbing-workshop/registered` | `/trade-workshop/registered` | Same confirmation |
| `/api/subscribe` | `api/subscribe.js` | Do or Don't Beehiiv signup (POST). Last commit 2026-06-02. |

Redirects added in this change are listed with the removed files above. They answer the old URL with a 308 to the kept file.

## Pages

Flags: **old** = superseded version still in the repo. **unlisted** = not linked from `/` or the workshop rewrites (direct URL or a private cluster). **broken** = a local image or video on that page 404s. Pages with no flag are linked from the public site and their local assets resolve.

| Route | What it is | Last commit | Flags |
| --- | --- | --- | --- |
| `/` | Portfolio home. Case studies: Island Glow, Do or Don't, Deep Fried Bananas, Elua, Puma Mala, LizzieTours, Oceanis. | 2026-10-06 | Asset paths for Elua and Puma Mala retargeted in this cleanup. |
| `/island-glow` | Island Glow AI ad case study. | 2026-10-06 | |
| `/do-or-dont-project` | Do or Don't product/UX case study. Links to the live app and the sample newsletter. | 2026-06-03 | |
| `/do-or-dont` | Do or Don't live app. | 2026-06-03 | |
| `/do-or-dont-newsletter` | Sample newsletter embedded by the case study. | 2026-06-02 | |
| `/deep-fried-bananas` | Deep Fried Bananas case study. Links to `/dfb-funnel`. | 2026-06-07 | |
| `/dfb` | Deep Fried Bananas workspace app. Canonical copy of the removed root dashboard. | 2026-06-07 | |
| `/dfb-funnel` | Café landing page ("grow your café with AI"). | 2026-06-07 | |
| `/elua-ux` | Elua case study. Carousel now uses the canonical report, explore, and hero images. | 2026-06-06 | Paths updated in this cleanup. |
| `/elua` | Elua interactive report app ("Who Will Resist the Wage Floor"). | 2026-06-06 | |
| `/pumamala` | Puma Mala case study. Embeds `/clientpumamala`. Phone video uses the kept social file. | 2026-06-03 | Poster generated from the social video. |
| `/clientpumamala` | Puma Mala concept site ("A new model for living well"), iframed by the case study. Uses `pumamala-reel.mp4`. | 2026-05-30 | |
| `/real-estate-ai-tours` | Current LizzieTours case study, linked from the homepage. | 2026-06-06 | |
| `/lizzietours-index` | Removed. Redirects to `/real-estate-ai-tours/`. | | |
| `/oceanis-project` | Oceanis case study. Links to the live app. | 2026-10-06 | Poster generated from `oceanisshort.mp4`. |
| `/oceanis` | Oceanis live app. | 2026-06-06 | |
| `/make-more-money` | Current "Make More Money" offer page. Workshop registration links here. Video recompressed in place. | 2026-10-11 | |
| `/make-more-money/report` | Lead report view for that offer. | 2026-10-10 | |
| `/more` | Removed flyer. Exact path redirects to `/make-more-money/`. `/more/dunemere/*` and `/more/make-more-money.mp4` stay. | | |
| `/trade-workshop/landing` | Workshop signup page (also served by `/workshop` and the trade aliases). | 2026-10-12 | |
| `/trade-workshop/registered` | Post-signup confirmation. | 2026-10-11 | |
| `/customer-report` | "What Your Customers Really Think" lead form. Direct URL only. | 2026-10-01 | **unlisted** |
| `/demo/first-light-electric` | First Light Electric client demo. Direct URL only. | 2026-10-12 | **unlisted** |
| `/more/dunemere` | Private Dunemere client home ("Welcome back, Ryan"). | 2026-10-05 | **unlisted** (cluster is cross-linked, not linked from `/`) |
| `/more/dunemere/recap` | Dunemere funnel recap. | 2026-10-11 | **unlisted** |
| `/more/dunemere/audit` | Dunemere funnel scorecard. | 2026-10-11 | **unlisted** |
| `/more/dunemere/webaudit` | dunemeremgt.com website audit. | 2026-10-11 | **unlisted** |
| `/more/dunemere/brand` | Brand and positioning. | 2026-10-11 | **unlisted** |
| `/more/dunemere/agree` | Working agreement. | 2026-10-11 | **unlisted** |
| `/more/dunemere/road` | Growth roadmap. | 2026-10-11 | **unlisted** |
| `/more/dunemere/webplan` | Website plan. | 2026-10-11 | **unlisted** |
| `/more/dunemere/concept` | New website concept. | 2026-10-05 | **unlisted** |
| `/more/dunemere/posts` | 12 Instagram drafts. | 2026-10-11 | **unlisted** |
| `/more/dunemere/emails` | Email drafts. | 2026-10-11 | **unlisted** |
| `/more/dunemere/master` | Master task list. | 2026-10-11 | **unlisted** |
| `/more/dunemere/crm` | Hamptons realtor CRM. | 2026-10-11 | **unlisted** |
| `/dunemere-site-preview/site` | Dunemere Management website preview. Not linked from the concept page or the homepage. | 2026-10-08 | **unlisted** |

Related pages that are not old copies of each other: `/elua` is the report app and `/elua-ux` is the case study; `/dfb`, `/dfb-funnel`, and `/deep-fried-bananas` are the app, the client landing, and the case study; `/oceanis` and `/oceanis-project` match that same split; `/clientpumamala` is the live concept embedded in the Puma Mala case study.

## Other unreferenced files (not deleted)

| File | Bytes | Note |
| --- | ---: | --- |
| `dfb-reel.mp4` | 3,657,716 | Removed after the follow-up confirmed it was still unreferenced. |
| `elua-app.zip` | 72,608 | No references. Still in git. Excluded from the Vercel upload by `.vercelignore`. |
| `oceanis/oceanis-burn.jpg` | 113,763 | Filename never appears in html, js, css, or json. |
| `oceanis/oceanis-dashboard.jpg` | 135,183 | Same. |
| `oceanis/oceanis-financials.jpg` | 100,457 | Same. |
| `oceanis/oceanis-tour-poster.jpg` | 116,197 | Same. The case study asks for `oceanis-social-poster.jpg`, which is not this file. |

`seth-quest-resume.pdf` is referenced from the homepage and is still deployed.
