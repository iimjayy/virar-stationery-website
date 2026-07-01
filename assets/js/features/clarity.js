// js/features/clarity.js
// Lazy Microsoft Clarity loader (free heatmaps + session recordings).
// Mirrors google-analytics.js: read an id from CONFIG, bail on placeholder,
// inject during idle, never break the customer experience.

import { CONFIG } from '../config.js';

const PLACEHOLDER_ID = 'CLARITY_PROJECT_ID';

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

export const initClarity = () => {
  const projectId = CONFIG.integrations?.microsoftClarity?.projectId;
  if (!projectId || projectId === PLACEHOLDER_ID) {
    return;
  }

  // Standard Clarity queue shim — calls are buffered until the script loads.
  window.clarity = window.clarity || function clarity(){ (window.clarity.q = window.clarity.q || []).push(arguments); };

  runWhenIdle(() => {
    loadScript(`https://www.clarity.ms/tag/${encodeURIComponent(projectId)}`)
      .catch(() => {
        // Heatmaps should never affect the customer experience.
      });
  });
};
