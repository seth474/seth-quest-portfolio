# Dealer site template

This folder is a static dealer concept. Layout, pages, and behavior live in `site.js` and `site.css`. Everything that belongs to one store lives in `data.js`.

## Spin up another dealer

1. Copy this folder to a new path, for example `demos/your-dealer`.
2. Edit `data.js` only:
   - `dealer`: name, logo words, phone (digits only, used for calls, SMS, and WhatsApp), address, city, language-storage key, credit link, and colors (`bg`, `card`, `line`, `mut`, `red`, `wa`).
   - `media`: hero poster and video, New / Pre-owned tiles, and the startup clip.
   - `categories`: homepage category cards (id must match a unit `category`, plus the EN/ES label key and photo).
   - `brands`: slug, display name, and thumbnail file in `img/`.
   - `styles`: inventory style id, card photo, and the EN/ES label under the photo.
   - `lot`: the “on the lot” counts shown in the hero.
   - `featured`: unit ids for the homepage row. Each id must exist in `units`, and each photo must be unique.
   - `copy.en` and `copy.es`: every string the chrome and pages render.
   - `units`: the sample inventory. `style` must match a `styles[].id` when that unit should appear under a style card.
3. Put photos in `img/` and add a license line to `img/credits.json`. Use files you can ship (CC BY, CC BY-SA, CC0, or public domain). No hotlinks.
4. Point the pages’ stylesheet, script, and asset URLs at the new folder. In `site.js` the `BASE` path must match.
5. Add the same rewrite rules you use for brands, models, and unit URLs.

`site.js` reads `window.BROWARD` and applies the colors as CSS variables. Do not fork the layout for a new store unless the layout itself should change.

## Photo rule

Every image the site shows has to be its own file. A unit card and that unit’s detail hero may share one file. Category tiles, brand thumbnails, style cards, the hero poster, and model-page art may not reuse a listing photo or each other.

Check it:

```bash
node scripts/broward-photo-audit.js
```

The script hashes listing photos from `units` and every other image named in `data.js`, HTML, CSS, and `site.js`. It fails on a shared hash.

Photos should show the right vehicle, in a warm or clean setting. No snow, winter mountains, military scenes, or crowds standing in for the vehicle.

## Mobile QA checklist

Review at 375px and 390×844, in English and Spanish, and again at 1440×900:

- Header is the logo and menu only on a phone. EN/ES and Get pre-approved stay in the menu.
- Hero copy sits in the bottom third. The top of the video stays clear.
- WhatsApp and Text stay hidden until the third section (hero counts as one), then sit at the bottom-right. They hide again above that section. Motion respects `prefers-reduced-motion`.
- Brand names sit above square photos, with no count and no card border.
- Style cards are a swipe row: photo, label, no counts. The next card peeks.
- No horizontal page scroll, no one-word columns, tap targets at least 44px.
- Inventory, brand, model, unit, the note form, and the footer still fit.
