# Pete's Cycle site audit

Live site: [petescycle.com](https://www.petescycle.com/). Reviewed 4 Nov 2026 for a Loom walkthrough. Viewports in the brief: 1440 desktop and 390×844 mobile.

Checked two ways on 4 Nov 2026. First, the public pages (home, about, hours, both location pages, and inventory listings) plus a technology fingerprint of the domain. Second, a browser pass at about 1440px wide and at 390×844. That second pass used Chrome’s device toolbar, so it does not hide a real phone’s browser chrome the way Safari does when you scroll. Lighthouse still has no score. Cloudflare interrupted one automated load; the interactive pass got through.

Where Seth’s notes and that browser pass disagree, the correction is written in the issue. Do not say on the Loom that the text box was cut off or that the desktop header does not stick. The pass did not show either of those.

## Keep

- Family-owned since 1938. Honda dealer for six decades and Yamaha dealer for five, as the about page states.
- Two real stores. Baltimore: 7511 Belair Rd, Baltimore, MD 21236, (410) 663-8556. Severna Park: 800 Ritchie Hwy, Severna Park, MD 21146, (410) 647-5880.
- Hours differ by store and by desk. Baltimore sales and parts Mon–Fri 10–6, Sat 10–5, Sunday closed. Service Mon–Fri 10–6, Sat 10–4. Severna Park is closed Monday. Sales and parts Tue–Fri 10–6, Sat 10–5. Service Tue–Fri 10–6, Sat 10–4.
- Lines named on the about page: Honda, Yamaha, Kawasaki, Suzuki, Sea-Doo, Can-Am, Polaris, Triumph, and Kayo. The Baltimore inventory index also lists Aprilia, Ducati, Harley-Davidson, Royal Enfield, Slingshot, STACYC, and Load Rite.
- Service, parts, and a finance desk are real offers. Do not add guarantees, rankings, or savings the page did not print.

## Platform

The site is an **ARI** dealer site (ARI Network Services), not Dealer Spike. Published assets load from `published-assets.ari-build.com` for site id `18363`. The front end fingerprint also lists Bootstrap, jQuery, OWL Carousel, and Slick.

**The “Text us” widget is Kenect.** The browser pass opened it. The steps are: pick a store (Baltimore or Severna Park), pick a department (Sales, Service, or Parts), then one “First and Last name” field, Mobile Number, Message, and Send. The panel says they will respond with a text. It is not an `sms:` link. In the 390×844 emulator the panel was fully on screen.

**“TRADE or SELL” is J.D. Power**, not the page builder. The red tab opens “Receive an Estimated Trade-In Value INSTANTLY!” Step 1 of 5 asks for year, make, model, miles, and VIN. The footer says “POWERED BY J.D. POWER.”

**AudioEye is an overlay add-on, not the site builder.** A blue person icon sits at the bottom left and opens a personalization toolbar with contrast controls, including a black-and-white mode.

## Issues, highest severity first

### 1. High — “Text us” is a Kenect form, not a text

**What’s wrong.** The bubble is Kenect. Tapping it asks for a store, then a department (Sales, Service, or Parts), then one “First and Last name” field, a mobile number, and a message. The send stays inside Kenect. The shopper never lands in Messages. In the 390×844 device toolbar the panel was fully visible, and the bubble stayed at the bottom of that emulator while scrolling. Seth’s note that a real phone cuts the box off when the browser toolbar hides was not reproduced here. Device mode does not collapse a phone’s toolbar, so that part is still unchecked on a physical iPhone.

**Why it hurts.** Three steps and a form sit in front of a conversation the person already meant to start. The store number they will reach is not on the button.

**Redesign.** One native `sms:+1…?&body=` link for the selected store. The body can name a unit. No name form and no Kenect script. The call and text buttons use `visualViewport` and the safe area so a real toolbar hide does not leave them stranded, which is the case this pass could not film.

### 2. High — Call is a tel link, and it is only Baltimore’s number

**What’s wrong.** “Call Us: (410) 663-8556” is a `tel:` link. On this Linux desktop, tapping the phone icon raised an “Open xdg-open?” dialog, which is the computer asking which app should take the link. It is not a fake popup with no number behind it. The number itself never changes. Severna Park’s line, (410) 647-5880, is on the location card and in the Kenect location list, and it is not what the header dials.

**Why it hurts.** A Severna Park customer who taps Call gets Baltimore.

**Redesign.** Header, financing, and the floating button are `tel:` links. Baltimore is the default. Choosing Severna Park switches the number to (410) 647-5880.

### 3. High — AudioEye sits on top of the store

**What’s wrong.** A blue AudioEye icon is fixed at the bottom left. It opens a personalization toolbar with contrast controls, including a black-and-white mode. It is not part of ARI’s page structure.

**Why it hurts.** The control covers inventory and the phone number. A grayscale toggle reads as a gimmick, not as access. Shoppers who need real structure (labels, focus, contrast) still get a carousel site with a sticker on it.

**Redesign.** No AudioEye, no personalize button, no other overlay. Text is black on white, buttons are ordinary links, and the map is the only grayscale surface.

### 4. High — Inventory is hard to scan, and the phone layout is one card wide

**What’s wrong.** On a desktop homepage the specials rows show about four cards at a time (Motorcycle, ATV, Side By Side, Pre-Owned), and the photos in that pass looked consistent. The one-up layout is the phone inventory search: one card per row, with empty space to the right. A “Ninja” search returned 33 results. One card was a 2027 Ninja ZX-6R at $13,968, stock 059988, black, listed at Baltimore, status “1 Miles.” New inventory was paging “1–30 of 811.” Listing pages still stack base price, discount, freight, prep, and a doc fee before the advertised price, and some units say “Call for Price.” A homepage banner reads “ONE PRICE TRANSPARENT PRICING - JUST ADD YOUR STATE REGISTRATION AND TAXES!” while the cards underneath still itemize fees.

**Why it hurts.** On a phone the lot is a long scroll of mostly empty cards. The “one price” line and the fee stack describe two different offers.

**Redesign.** Inventory is a grid (two columns on a phone, four on a desktop). One price per card, the figure published on petescycle.com, with the condition on the photo. Sample units are a handful of real listings, not a fake full lot. Fees are not restated as a second price.

### 5. High — Hours and locations make the wrong store easy to pick

**What’s wrong.** The hours page itself is a clear table, and that part should stay. Around it, the global header phone is Baltimore even on the Severna Park page. Monday is a workday in Baltimore and a closed day in Severna Park. Service stops at 4 on Saturday while sales and parts stay until 5. The about page also says the store serves “the Bel Air community.” The Services menu has a link titled “Motorcycle Dealer Near Bel Air, MD” and another for Towson. Those are landing pages. They are not a third showroom. The location buttons on the page are only Baltimore and Severna Park.

**Why it hurts.** A Monday trip to Severna Park is a wasted drive. A Saturday 4:30 service drop-off meets a closed door. “Near Bel Air” in the menu reads like another store until the shopper opens it.

**Redesign.** A location switcher shows both names. On a phone the closed control shows only the store name, and it opens on Baltimore. The panel prints that store’s address, sales hours, and the earlier Saturday service close. The map and the Google Maps button follow the same choice. Bel Air is not listed as a store.

### 6. Medium — The phone header does not stick

**What’s wrong.** On the desktop pass the header does stick: logo, “Call Us: (410) 663-8556”, and the Baltimore and Severna Park buttons stay put. On the 390×844 pass the header scrolls away. What stays is a bottom strip of brand logos plus the Kenect bubble. There is no sticky header on the phone.

**Why it hurts.** Mid-inventory, the menu and the phone icon are back at the top of a long page.

**Redesign.** A white header sticks on every page, including the phone: logo, store switcher, and a red Call link. It is a thin bar, not a black slab.

### 7. Medium — Two navigations for the same brands

**What’s wrong.** Both exist, and both were clicked. A top strip with arrows steps through brand logos. Farther down, “Browse by Brand” does it again. Logos seen across the two strips include Polaris, Slingshot, Sea-Doo, Can-Am, Suzuki, Honda, Kawasaki, Yamaha, Triumph, and STACYC. The same logo was not frozen twice in one frame. The duplication is two arrowed brand pickers on one page.

**Why it hurts.** The second strip does not add a line the first strip skipped. It spends the fold on a control the shopper already passed.

**Redesign.** One brand section. Names sit on the photos and go to that brand’s sample inventory. There is no second brand carousel in the header.

### 8. Medium — The visual system looks older than the inventory

**What’s wrong.** Inventory cards are white with a black frame. That part is real. Red is on the main buttons, the SALE marks, the MAP & HOURS buttons, and the vertical TRADE or SELL tab. The tab is J.D. Power’s instant-value form (year, make, model, miles, VIN), fixed to the left edge. On the phone it can sit on top of a photo. The product photos themselves looked consistent in this pass. Calling the red “too much” is a design judgment. The fact for the Loom is that red is the color of almost every control, not only the one next action.

**Why it hurts.** The trade tab follows the scroll and covers the edge of the page. A shopper cannot tell a sale button from a map button from a trade pitch when they are all the same red.

**Redesign.** White page. Black is for type and for a 1px break between sections. Red is only the action: search, call, submit, and Google Maps. Trade-in is a section in the page, not a J.D. Power tab. The note stays in the browser. It does not promise an instant value.

### 9. Medium — Third-party weight, and no measured Lighthouse score

**What’s wrong.** The technology fingerprint lists on the order of 100 services. Treat that count as noisy, but the named set that matches the page is already heavy: Google Tag Manager, Google Analytics, Google Ads, Facebook Pixel, Hotjar, Microsoft Clarity, Tealium, Kenect, AudioEye, OWL Carousel, Slick, plus the chat widgets above. Lighthouse could not be run from this environment because Cloudflare challenged headless Chrome. A score is not invented here.

**Why it hurts.** Every widget contends with the first paint and with the tap the shopper meant to make. Session-replay tools also record shoppers who only came to read hours.

**Redesign.** Static files. No tag manager, no replay, no overlay. Images are local.

### 10. Medium — Search and listing copy bury the bike

**What’s wrong.** Inventory search results lead with fee math. Two public prices often exist for one model name (the motorcycle specials list showed a Ninja 500 at $4,999 and another at $4,699, and a GSX-8S at $9,249 and $7,399) without a one-line reason on the card. Homepage grouping also placed 2026 Kawasaki Z125 PRO and Z900RS Cafe under a “Pre-Owned Equipment” heading in the text extract. That may be a CMS grouping bug. It should be checked on the live homepage before anyone repeats it in an ad.

**Why it hurts.** The shopper cannot tell which number is the one to pay, or whether a 2026 bike is used.

**Redesign.** Cards show one condition and one published figure. The sample does not mark a bike pre-owned unless the source page did (the 2023 MT-07 at $7,198 is the one treated as pre-owned).

### 11. Low — Superlatives do the selling the inventory should do

**What’s wrong.** The about page says “Maryland’s largest volume dealer” and “Baltimore’s number one and oldest dealer.” “Since 1938” and “family-owned” are checkable. “Largest” and “number one” are not, on the page, tied to a source.

**Why it hurts.** A skeptical buyer discounts the next sentence, including the true one about 1938.

**Redesign.** The headline is “Family-owned powersports in Baltimore since 1938.” No ranking and no savings claim that this concept did not copy from a specific unit.

## SEO

Page titles that came back with the text are specific (“Powersports Vehicles For Sale in Baltimore, MD | Pete’s Cycle”, “Store & Service Hours”). That part is fine. Meta descriptions, canonicals, and indexability were not visible in the text extract, and the headless dump never got past Cloudflare, so they are unchecked. The concept demo sends `noindex` on purpose. It is not a replacement SEO recommendation for petescycle.com.

## Broken links and images

No full crawl. The links that were opened (specials, new inventory, a Ninja search, Services, OEM Parts, About, Home, and the trade tab) loaded. No missing image turned up in that set. The phone inventory gap in issue 4 is empty card space, not a broken image.

## How the concept maps

The redesign lives at `/demos/petes-cycle`. It is a sample, not their live inventory feed. Prices are figures those public pages showed on 4 Nov 2026. Stock numbers are included only where a listing printed one.
