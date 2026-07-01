# Live Google Reviews — Setup Guide

This system keeps the homepage rating and review count **real and current**
by pulling them from Google once a day — no paid plugin, no manual editing.

```
Google Places API (New)
        │   (daily, GitHub Actions)
        ▼
scripts/fetch-reviews.mjs  ──writes──▶  assets/data/reviews.json
                                                │  (lazy fetch in browser)
                                                ▼
                               assets/js/features/reviews-live.js
                                                │
                          updates [data-live-rating] / [data-live-review-count]
                          + window.__virarReviews + 'virar:reviews-ready' event
```

If the API is ever down or unconfigured, the site simply keeps the last good
`reviews.json` (the committed seed is the permanent fallback). **A reviews
outage can never break the site or the build.**

---

## One-time owner setup (~10 minutes, free)

### 1. Enable the Places API (New)

1. Go to <https://console.cloud.google.com/>.
2. Create (or pick) a project, e.g. **Virar Print**.
3. Open **APIs & Services → Library**.
4. Search **"Places API (New)"** and click **Enable**.
   - Make sure it is the **(New)** one, not the legacy "Places API".

### 2. Create an API key (restricted)

1. **APIs & Services → Credentials → Create credentials → API key**.
2. Copy the key.
3. Click the key → **API restrictions → Restrict key → Places API (New)**.
   Save. (Restricting the key limits abuse if it ever leaks.)

> Billing: Google requires a billing account on the project, but the Places API
> (New) has a generous **free monthly tier**. This job calls **Place Details
> once per day** (~30 calls/month), which sits **comfortably inside the free
> tier** — effectively ₹0.

### 3. Find the shop's Google Place ID

Pick either method:

- **Place ID Finder (easiest):**
  <https://developers.google.com/maps/documentation/places/web-service/place-id>
  Search **"Virar Stationery & Jumbo Xerox"** (or the address near Viva
  College, Virar West). The marker shows a Place ID like `ChIJ...`.
- **Text Search API:** `POST https://places.googleapis.com/v1/places:searchText`
  with body `{"textQuery":"Virar Stationery Jumbo Xerox Virar West"}` and a
  field mask of `places.id`. The returned `id` is the Place ID.

The Place ID looks like `ChIJN1t_tDeuEmsRUsoyG83frY4`.

### 4. Add the two GitHub secrets

In the repo: **Settings → Secrets and variables → Actions → New repository secret**.

| Name              | Value                                  |
| ----------------- | -------------------------------------- |
| `PLACES_API_KEY`  | the API key from step 2                |
| `GOOGLE_PLACE_ID` | the Place ID from step 3               |

> `GOOGLE_PLACE_ID` may instead be added as a **repository variable** (it is not
> secret) — the workflow reads `secrets.GOOGLE_PLACE_ID || vars.GOOGLE_PLACE_ID`.

That's it. The **Refresh Google Reviews** workflow runs daily at 06:00 UTC and
also via **Actions → Refresh Google Reviews → Run workflow**. When the numbers
change it commits `assets/data/reviews.json` with `[skip ci]`.

---

## Testing it

- **Parse-check the script:** `node --check scripts/fetch-reviews.mjs`
- **Local dry run:**
  ```bash
  PLACES_API_KEY=xxx GOOGLE_PLACE_ID=ChIJ... node scripts/fetch-reviews.mjs
  ```
  Without the env vars it logs a skip and exits 0 (file untouched) — by design.

---

## Keeping the JSON-LD aggregateRating honest (for the orchestrator)

The **visible** numbers (`[data-live-rating]` / `[data-live-review-count]`)
now auto-update from `reviews.json`. The structured-data block in
`index.html` does **not** — its `aggregateRating` (`ratingValue` /
`reviewCount`) is static markup that Google reads for rich results.

To avoid a mismatch between what users see and what the schema claims:

- Treat `assets/data/reviews.json` as the source of truth for the real numbers.
- Periodically reconcile the JSON-LD `aggregateRating.ratingValue` and
  `aggregateRating.reviewCount` in `index.html` to match `reviews.json`
  (e.g. a small build step, or update by hand when the count moves meaningfully).
- Keep the seed values in `reviews.json` and the JSON-LD in lockstep at launch
  (currently **4.8 / 182**) so they never disagree.

Do **not** let the visible numbers and the schema drift apart — that can be
flagged as misleading structured data.
