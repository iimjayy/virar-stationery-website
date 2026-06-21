// js/features/google-analytics.js
// Lazy GA4 loader. Keeps initial render free of analytics network work.

import { CONFIG } from '../config.js';

const PLACEHOLDER_ID = 'GA4_MEASUREMENT_ID';

const runWhenIdle = (callback) => {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(callback, { timeout: 2500 });
    return;
  }

  window.setTimeout(callback, 1800);
};

const loadScript = (src) =>
  new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.defer = true;
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

export const initGoogleAnalytics = () => {
  const measurementId = CONFIG.integrations?.googleAnalytics?.measurementId;
  if (!measurementId || measurementId === PLACEHOLDER_ID) {
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag(){ window.dataLayer.push(arguments); };

  runWhenIdle(() => {
    loadScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`)
      .then(() => {
        window.gtag('js', new Date());
        window.gtag('config', measurementId, {
          send_page_view: true,
          anonymize_ip: true
        });
      })
      .catch(() => {
        // Analytics should never affect the customer experience.
      });
  });
};
