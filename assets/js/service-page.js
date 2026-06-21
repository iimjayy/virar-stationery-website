// js/service-page.js
// Lightweight integration entry for static service/legal/pricing pages.

import { initGoogleAnalytics } from './features/google-analytics.js';
import { initAnalytics } from './features/analytics.js';

const runAfterReady = (callback) => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback);
  } else {
    callback();
  }
};

runAfterReady(() => {
  initGoogleAnalytics();
  initAnalytics();
});
