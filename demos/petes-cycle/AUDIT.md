# Pete's Cycle site audit

Live site: [petescycle.com](https://www.petescycle.com/). Reviewed 4 Nov 2026 for a Loom walkthrough. Viewports in the brief: 1440 desktop and 390×844 mobile.

What this pass could check directly: the public pages (home, about, hours, both location pages, Yamaha and Sea-Doo inventory, Kawasaki and motorcycle-specials listings) and a public technology fingerprint of the domain ([clientsbee.com/website/petescycle.com](https://clientsbee.com/website/petescycle.com/)). Headless Chrome was stopped by a Cloudflare challenge, so this pass did not click the live Kenect widget, did not record a Lighthouse score, and did not save annotated screenshots of the production site. Issues Seth already saw on a phone are included below and marked as his observed behavior. The redesign treats them as in-scope defects.

## Keep

- Family-owned since 1938. Honda dealer for six decades and Yamaha dealer for five, as the about page states.
- Two real stores. Baltimore: 7511 Belair Rd, Baltimore, MD 21236, (410) 663-8556. Severna Park: 800 Ritchie Hwy, Severna Park, MD 21146, (410) 647-5880.
- Hours differ by store and by desk. Baltimore sales and parts Mon–Fri 10–6, Sat 10–5, Sunday closed. Service Mon–Fri 10–6, Sat 10–4. Severna Park is closed Monday. Sales and parts Tue–Fri 10–6, Sat 10–5. Service Tue–Fri 10–6, Sat 10–4.
- Lines named on the about page: Honda, Yamaha, Kawasaki, Suzuki, Sea-Doo, Can-Am, Polaris, Triumph, and Kayo. The Baltimore inventory index also lists Aprilia, Ducati, Harley-Davidson, Royal Enfield, Slingshot, STACYC, and Load Rite.
- Service, parts, and a finance desk are real offers. Do not add guarantees, rankings, or savings the page did not print.

## Platform

The site is an **ARI** dealer site (ARI Network Services), not Dealer Spike. Published assets load from `published-assets.ari-build.com` for site id `18363`. The front end fingerprint also lists Bootstrap, jQuery, OWL Carousel, and Slick.

**AudioEye is an overlay add-on, not the site builder.** The same fingerprint lists AudioEye. Seth saw the overlay and a “personalize your experience” control that drops the page to black and white.

**The “Text us” widget is Kenect.** The fingerprint lists Kenect. Kenect’s own widget opens from a “Text Us” button, can require a location (`EVENT_LOCATION_SELECTED`), then collects a contact name and phone before the message. That matches the flow Seth hit: pick a store, then first name, last name, mobile, and message. It is not an `sms:` link. The fingerprint also lists WhatsApp Business Chat and EngageToSell, so the page is carrying more than one chat layer.

## Issues, highest severity first

### 1. Critical — Mobile “Text us” bar and chat panel miss the visible bottom

**What’s wrong.** Seth: the sticky bottom bar and “Text us!” bubble do not sit on the visual bottom once the mobile browser toolbar hides on scroll, and the message box is cut off. Kenect (and any `position: fixed; bottom: 0` widget) is pinned to the layout viewport. When Safari or Chrome collapses its toolbar, that viewport and the visible screen disagree, so the bubble floats in the wrong place or slides under the chrome.

**Why it hurts.** On a phone, texting is the lead path. A control the thumb cannot reach, or a form cut in half, drops the conversation before a salesperson ever sees it.

**Redesign.** No Kenect, no chat panel, no bottom bar. Call is `tel:` and text is `sms:` on the store that is selected. The two buttons are fixed, start only at section 3 so they do not cover the hero, and are repositioned from `visualViewport` plus `env(safe-area-inset-bottom)` so they follow the visible bottom when the toolbar hides.

### 2. Critical — “Text us” is a form, not a text

**What’s wrong.** Seth: the widget forces a location, then first name, last name, mobile, and a message. Kenect is built to capture a lead into its inbox. The shopper never lands in their own Messages app.

**Why it hurts.** Every extra field is a place to quit. A person who is ready to text the store is asked to retype the same details Kenect will send anyway. It also hides which human, and which store number, will answer.

**Redesign.** One native `sms:+1…?&body=` link for the selected store. The body can name a unit when they are on a unit page. No name form and no vendor script.

### 3. Critical — Call does not dial, and both stores share the Baltimore number

**What’s wrong.** Seth: Call pops up a 410 number instead of starting a call. The number on every page checked, including the Severna Park location page, is the header “Call Us: (410) 663-8556”. Severna Park’s own line, printed in the address block, is (410) 647-5880.

**Why it hurts.** A popup is an extra step, and on a phone it often fails to hand off to the dialer. A Severna Park customer who taps Call reaches Baltimore, or thinks the Severna Park desk has no direct line.

**Redesign.** The header, the financing link, the financing section, and the floating button are `tel:` links. Baltimore is the default. Choosing Severna Park switches the number to (410) 647-5880.

### 4. High — AudioEye and “personalize” sit on top of the store

**What’s wrong.** AudioEye’s overlay is a third-party widget. Seth: “personalize your experience” turns the whole site black and white. It is not part of ARI’s page structure, and it does not fix the underlying markup.

**Why it hurts.** The control covers inventory and the phone number. A grayscale toggle reads as a gimmick, not as access. Shoppers who need real structure (labels, focus, contrast) still get a carousel site with a sticker on it.

**Redesign.** No AudioEye, no personalize button, no other overlay. Text is black on white, buttons are ordinary links, and the map is the only grayscale surface.

### 5. High — Inventory is a carousel of sparse, inconsistent cards

**What’s wrong.** Seth: inventory carousels show one unit at a time, with large empty white cards and photos that do not match in crop or background. The public inventory pages agree with the “hard to scan” half of that. Each Yamaha or Sea-Doo unit is a long block: base price, discount, freight, prep, documentation fee, then the advertised price. The same model is repeated over and over (several TT-R230s, several Kodiaks, several Spark and Fish Pro lines). Status labels mix “In Stock / New”, “In Stock / 1 Miles”, and “In Stock / 15 Hours”. Some rows are “Call for Price” with no number. OWL Carousel and Slick are both on the stack, which is what produces the one-card homepage carousels.

**Why it hurts.** A buyer comparing two Ninjas has to drag one card at a time, or scroll through a fee essay, and the photos do not look like one catalog. Empty cards make the lot feel thin even when the store is full.

**Redesign.** Inventory is a grid (two columns on a phone, four on a desktop). One price per card, the figure published on petescycle.com, with the condition on the photo. Sample units are a handful of real listings, not a fake full lot. Fees are not restated as a second price.

### 6. High — Hours and locations make the wrong store easy to pick

**What’s wrong.** The hours page itself is a clear table, and that part should stay. Around it, the global header phone is Baltimore even on the Severna Park page. Monday is a workday in Baltimore and a closed day in Severna Park. Service stops at 4 on Saturday while sales and parts stay until 5. The about page also says the store serves “the Bel Air community” and “our neighbors in Bel Air,” while the two open stores are Baltimore and Severna Park.

**Why it hurts.** A Monday trip to Severna Park is a wasted drive. A Saturday 4:30 service drop-off meets a closed door. Bel Air reads like a third store that is not on the location list.

**Redesign.** A location switcher shows both names. On a phone the closed control shows only the store name, and it opens on Baltimore. The panel prints that store’s address, sales hours, and the earlier Saturday service close. The map and the Google Maps button follow the same choice. Bel Air is not listed as a store.

### 7. High — Nothing in the header stays put

**What’s wrong.** Seth: there is no sticky header. Once the shopper scrolls into a carousel, the logo, the phone, and the section links leave the screen. The only persistent chrome is the Kenect bar, which has the viewport bug in issue 1.

**Why it hurts.** Finding “call” means scrolling back to the top, or hunting a bubble that is not on the visual bottom.

**Redesign.** A white header sticks to the top on every page: logo, section links, store switcher, and a red Call link. It is a thin bar, not a black slab.

### 8. Medium — Two navigations for the same brands

**What’s wrong.** Seth: arrow buttons in the top nav step through brands left and right, and a “Shop by Brand” block repeats those brands. OWL Carousel is loaded, which fits an arrowed brand strip.

**Why it hurts.** The second control does not add a brand. It spends the top of the page on a widget the next section already covers, and the arrows are easy to mistake for “next page.”

**Redesign.** One brand section. Names sit on the photos and go to that brand’s sample inventory. There is no second brand carousel in the header.

### 9. Medium — The visual system looks older than the inventory

**What’s wrong.** Seth: black frames around white cards, red used as a general theme, and a vertical “TRADE or SELL” tab on the side. The tab’s vendor was not identified in this pass (it is a common bolted-on trade widget, separate from the page).

**Why it hurts.** Frames and a side tab compete with the motorcycles. Red stops meaning “do this.” The trade tab follows the scroll and covers photos.

**Redesign.** White page. Black is for type and for a 1px break between sections. Red is only the action: search, call, submit, and Google Maps. Trade-in is a section in the page, not a tab. The note stays in the browser. It does not promise a same-day number.

### 10. Medium — Third-party weight, and no measured Lighthouse score

**What’s wrong.** The technology fingerprint lists on the order of 100 services. Treat that count as noisy, but the named set that matches the page is already heavy: Google Tag Manager, Google Analytics, Google Ads, Facebook Pixel, Hotjar, Microsoft Clarity, Tealium, Kenect, AudioEye, OWL Carousel, Slick, plus the chat widgets above. Lighthouse could not be run from this environment because Cloudflare challenged headless Chrome. A score is not invented here.

**Why it hurts.** Every widget contends with the first paint and with the tap the shopper meant to make. Session-replay tools also record shoppers who only came to read hours.

**Redesign.** Static files. No tag manager, no replay, no overlay. Images are local.

### 11. Medium — Search and listing copy bury the bike

**What’s wrong.** Inventory search results lead with fee math. Two public prices often exist for one model name (the motorcycle specials list showed a Ninja 500 at $4,999 and another at $4,699, and a GSX-8S at $9,249 and $7,399) without a one-line reason on the card. Homepage grouping also placed 2026 Kawasaki Z125 PRO and Z900RS Cafe under a “Pre-Owned Equipment” heading in the text extract. That may be a CMS grouping bug. It should be checked on the live homepage before anyone repeats it in an ad.

**Why it hurts.** The shopper cannot tell which number is the one to pay, or whether a 2026 bike is used.

**Redesign.** Cards show one condition and one published figure. The sample does not mark a bike pre-owned unless the source page did (the 2023 MT-07 at $7,198 is the one treated as pre-owned).

### 12. Low — Superlatives do the selling the inventory should do

**What’s wrong.** The about page says “Maryland’s largest volume dealer” and “Baltimore’s number one and oldest dealer.” “Since 1938” and “family-owned” are checkable. “Largest” and “number one” are not, on the page, tied to a source.

**Why it hurts.** A skeptical buyer discounts the next sentence, including the true one about 1938.

**Redesign.** The headline is “Family-owned powersports in Baltimore since 1938.” No ranking and no savings claim that this concept did not copy from a specific unit.

## SEO

Page titles that came back with the text are specific (“Powersports Vehicles For Sale in Baltimore, MD | Pete’s Cycle”, “Store & Service Hours”). That part is fine. Meta descriptions, canonicals, and indexability were not visible in the text extract, and the headless dump never got past Cloudflare, so they are unchecked. The concept demo sends `noindex` on purpose. It is not a replacement SEO recommendation for petescycle.com.

## Broken links and images

No full crawl. Nothing in the fetched location, hours, or about copy 404’d. Photo consistency is the visual defect in issue 5, not a confirmed set of 404 image URLs.

## How the concept maps

The redesign lives at `/demos/petes-cycle`. It is a sample, not their live inventory feed. Prices are figures those public pages showed on 4 Nov 2026. Stock numbers are included only where a listing printed one.
