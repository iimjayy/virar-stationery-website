#!/usr/bin/env node
/**
 * fetch-reviews.mjs — Live Google Reviews Fetcher
 *
 * Pulls the shop's real rating, total review count, and latest reviews
 * from the Google Places API (New) and writes them to
 * assets/data/reviews.json — the single source of truth the homepage
 * reads for its live "4.8★ / 182 reviews" social proof.
 *
 * Endpoint:  GET https://places.googleapis.com/v1/places/<PLACE_ID>
 * Headers:   X-Goog-Api-Key   = env.PLACES_API_KEY
 *            X-Goog-FieldMask = rating,userRatingCount,reviews
 *
 * Env:
 *   PLACES_API_KEY    Google Cloud API key, restricted to Places API (New).
 *   GOOGLE_PLACE_ID   The shop's Google Place ID (starts with "ChI...").
 *
 * Where to find GOOGLE_PLACE_ID:
 *   • Google Place ID Finder:
 *     https://developers.google.com/maps/documentation/places/web-service/place-id
 *     (search the business, the ID is shown on the map marker), OR
 *   • Places API Text Search ("places:searchText") with the shop name +
 *     "Virar West" — the returned place.id is the Place ID.
 *
 * Fail-safe contract:
 *   On ANY error (missing env, network failure, bad response, no reviews)
 *   the script LOGS and exits 0 WITHOUT touching assets/data/reviews.json.
 *   A bad run can therefore never wipe known-good seed/live data, and the
 *   workflow stays green. The existing file simply remains the fallback.
 *
 * Usage:   node scripts/fetch-reviews.mjs
 * Runtime: Node 20+ (uses global fetch — no dependencies).
 */

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUTPUT = join(ROOT, 'assets', 'data', 'reviews.json');

const MAX_REVIEWS = 8;
const TEXT_MAX_CHARS = 280;
const REQUEST_TIMEOUT_MS = 15000;

// --- helpers -------------------------------------------------------------

// Collapse newlines/whitespace and hard-truncate review text so the
// homepage cards stay tidy and the JSON stays small.
const sanitizeText = (raw) => {
  if (typeof raw !== 'string') return '';
  const clean = raw.replace(/\s+/g, ' ').trim();
  if (clean.length <= TEXT_MAX_CHARS) return clean;
  return `${clean.slice(0, TEXT_MAX_CHARS - 1).trimEnd()}…`;
};

// Places API (New) returns localised text under { text, languageCode }
// for displayName / text, and a plain string for relativePublishTimeDescription.
const pickText = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value.text === 'string') return value.text;
  return '';
};

// Soft-fail: log the reason and exit cleanly without overwriting the file.
const bailOut = (reason) => {
  console.warn(`[fetch-reviews] Skipped — ${reason}. Existing reviews.json left intact.`);
  process.exit(0);
};

// --- main ----------------------------------------------------------------

const run = async () => {
  const apiKey = process.env.PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;

  if (!apiKey) bailOut('PLACES_API_KEY is not set');
  if (!placeId) bailOut('GOOGLE_PLACE_ID is not set');

  const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'rating,userRatingCount,reviews',
      },
      signal: controller.signal,
    });
  } catch (error) {
    bailOut(`network error (${error.name === 'AbortError' ? 'timeout' : error.message})`);
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    bailOut(`HTTP ${response.status} from Places API ${body ? `— ${body.slice(0, 200)}` : ''}`);
  }

  let data;
  try {
    data = await response.json();
  } catch {
    bailOut('response was not valid JSON');
  }

  const rating = typeof data.rating === 'number' ? data.rating : null;
  const reviewCount =
    typeof data.userRatingCount === 'number' ? data.userRatingCount : null;

  if (rating === null || reviewCount === null) {
    bailOut('response missing rating or userRatingCount');
  }

  // Prefer the most flattering reviews (5★ then 4★), then fill with the rest,
  // keeping up to MAX_REVIEWS. We keep original order within each tier.
  const rawReviews = Array.isArray(data.reviews) ? data.reviews : [];

  const normalised = rawReviews
    .map((r) => {
      const text = sanitizeText(pickText(r.text) || pickText(r.originalText));
      const reviewRating = typeof r.rating === 'number' ? r.rating : null;
      return {
        author: pickText(r.authorAttribution?.displayName) || 'Google user',
        rating: reviewRating,
        text,
        relativeTime: pickText(r.relativePublishTimeDescription),
        profilePhoto: r.authorAttribution?.photoUri || undefined,
      };
    })
    // Only keep reviews that actually have text to display.
    .filter((r) => r.text.length > 0 && r.rating !== null);

  const fiveStar = normalised.filter((r) => r.rating === 5);
  const fourStar = normalised.filter((r) => r.rating === 4);
  const rest = normalised.filter((r) => r.rating !== 5 && r.rating !== 4);

  const reviews = [...fiveStar, ...fourStar, ...rest]
    .slice(0, MAX_REVIEWS)
    // Drop the undefined profilePhoto keys so the JSON stays clean.
    .map((r) => {
      const out = {
        author: r.author,
        rating: r.rating,
        text: r.text,
        relativeTime: r.relativeTime,
      };
      if (r.profilePhoto) out.profilePhoto = r.profilePhoto;
      return out;
    });

  const payload = {
    rating: Math.round(rating * 10) / 10,
    reviewCount,
    fetchedAt: new Date().toISOString(),
    reviews,
  };

  try {
    await writeFile(OUTPUT, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  } catch (error) {
    bailOut(`could not write reviews.json (${error.message})`);
  }

  // Sanity log so the workflow output shows what landed.
  const previous = await readFile(OUTPUT, 'utf8').catch(() => '');
  void previous;
  console.log(
    `[fetch-reviews] Wrote ${payload.reviews.length} reviews — ` +
      `${payload.rating}★ / ${payload.reviewCount} ratings (fetched ${payload.fetchedAt}).`
  );
};

// Top-level guard: nothing here may throw out of the process with a non-zero
// code, since a reviews outage must never fail the workflow or the site.
run().catch((error) => {
  bailOut(`unexpected error (${error?.message || error})`);
});
