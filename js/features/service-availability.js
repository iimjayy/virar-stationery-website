// js/features/service-availability.js
// Self-contained Service Availability Badges feature module.
// Dynamically renders time-aware availability badges on .service-card elements.
// Logic: open hours → 'available', peak hours → 'busy', specific services → 'limited'.
// Badges are injected if absent and updated every 20 minutes.
// Dependencies: CONFIG (hours only) — pure DOM otherwise.

import { CONFIG } from '../config.js';

// ---------------------------------------------------------------------------
// initServiceAvailability — public entry point called by main.js
// ---------------------------------------------------------------------------
export const initServiceAvailability = () => {
  const serviceCards = Array.from(document.querySelectorAll('.service-card'));
  if (!serviceCards.length) {
    return;
  }

  // Status display map — class and label for each availability tier.
  const statusMap = {
    available: { label: 'Available Now',      className: 'is-available' },
    busy:      { label: 'Busy - Slight Delay', className: 'is-busy'      },
    limited:   { label: 'High Demand',         className: 'is-limited'   }
  };

  // Services that are always shown as 'limited' (high-demand, specialized).
  const limitedServices = new Set([
    'Jumbo Xerox',
    'Smart Card',
    'Visiting Card',
    'Project Printing'
  ]);

  // Services that are shown as 'busy' during peak window hours.
  const busyServices = new Set([
    'Color Printing',
    'Xerox / Photocopy',
    'Spiral Binding'
  ]);

  // Derive a base time-status from the current hour.
  // Outside open hours → limited; peak windows → busy; otherwise → available.
  const getTimeStatus = () => {
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    const openMinutes  = CONFIG.hours.openHour  * 60;
    const closeMinutes = CONFIG.hours.closeHour * 60;

    if (minutes < openMinutes || minutes >= closeMinutes) {
      return 'limited';
    }

    // Peak windows: lunch (11:00–14:00) and evening rush (18:00–20:00).
    if (
      (minutes >= 11 * 60 && minutes <= 14 * 60) ||
      (minutes >= 18 * 60 && minutes <= 20 * 60)
    ) {
      return 'busy';
    }

    return 'available';
  };

  // Render or update the badge element for every card.
  const applyStatus = () => {
    const baseStatus = getTimeStatus();

    serviceCards.forEach((card) => {
      const title = card.querySelector('h3')?.textContent?.trim() || '';

      // Allow explicit override via data-availability attribute on the card.
      let resolvedStatus = card.dataset.availability || 'auto';

      if (resolvedStatus === 'auto') {
        if (limitedServices.has(title)) {
          resolvedStatus = 'limited';
        } else if (busyServices.has(title)) {
          resolvedStatus = 'busy';
        } else {
          resolvedStatus = baseStatus;
        }
      }

      const statusInfo = statusMap[resolvedStatus] || statusMap.available;

      // Inject badge if the card doesn't already have one.
      let badge = card.querySelector('.service-status-badge');
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'service-status-badge';
        badge.innerHTML =
          '<span class="service-status-dot" aria-hidden="true"></span>' +
          '<span class="service-status-text"></span>';
        card.insertAdjacentElement('afterbegin', badge);
      }

      // Update state — remove all tier classes, add the resolved one.
      badge.classList.remove('is-available', 'is-busy', 'is-limited');
      badge.classList.add(statusInfo.className);

      const textEl = badge.querySelector('.service-status-text');
      if (textEl) {
        textEl.textContent = statusInfo.label;
      }
    });
  };

  // Run immediately on page load, then every 20 minutes.
  applyStatus();
  window.setInterval(applyStatus, 20 * 60 * 1000);
};
