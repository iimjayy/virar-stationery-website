// js/features/reviews-live.js
// Live Google reviews loader. Keeps the homepage rating + review count
// honest by reading assets/data/reviews.json (refreshed daily by the
// scripts/fetch-reviews.mjs GitHub Action). Fully fail-safe: a reviews
// outage must never break render or throw — the page keeps its last good
// numbers and the social-proof ticker keeps working.

import { CONFIG } from '../config.js';

const DATA_URL = 'assets/data/reviews.json';

const runWhenIdle = (callback) => {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(callback, { timeout: 2500 });
    return;
  }

  window.setTimeout(callback, 1800);
};

// Mirror textContent into every matching node (there may be more than one
// place showing the rating, e.g. hero + footer trust strip).
const setText = (selector, value) => {
  const nodes = document.querySelectorAll(selector);
  nodes.forEach((node) => {
    node.textContent = value;
  });
};

export const initLiveReviews = () => {
  // Default-on: only skip if the integration is explicitly disabled.
  if (CONFIG.integrations?.liveReviews?.enabled === false) {
    return;
  }

  runWhenIdle(() => {
    fetch(DATA_URL, { cache: 'no-cache' })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`reviews.json HTTP ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (!data || typeof data.rating !== 'number') {
          return;
        }

        const rating = data.rating;
        const reviewCount =
          typeof data.reviewCount === 'number' ? data.reviewCount : null;
        const reviews = Array.isArray(data.reviews) ? data.reviews : [];

        // (a) Update any visible live-rating / live-count elements.
        setText('[data-live-rating]', String(rating));
        if (reviewCount !== null) {
          setText('[data-live-review-count]', String(reviewCount));
        }

        // (b) Publish for the social-proof ticker (real snippets + numbers).
        window.__virarReviews = { rating, reviewCount, reviews };

        // (c) Notify anyone waiting (social-proof may init before or after us).
        document.dispatchEvent(
          new CustomEvent('virar:reviews-ready', {
            detail: { rating, reviewCount, reviews },
          })
        );
      })
      .catch(() => {
        // Reviews are best-effort. Never surface failures to the customer —
        // the seed/last-good JSON and existing markup stay in place.
      });
  });
};
