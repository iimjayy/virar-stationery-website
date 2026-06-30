import { CONFIG } from '../config.js';
import { escapeHtml } from '../utils/helpers.js';
import { getFirestoreContext } from '../core/firebase.js';

const DISPLAY_DURATION = 8000;
const INITIAL_DELAY = 4000;
const MIN_INTERVAL = 15000;
const MAX_INTERVAL = 25000;

let shownCount = 0;
let scheduledTimeout = null;
let containerEl = null;
let dataPool = [];

const randomInterval = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const getDynamicTimeNudge = () => {
  const currentHour = new Date().getHours();
  if (currentHour >= 8 && currentHour < 12) {
    return { type: 'status', action: 'Morning Fast Queue', detail: 'Print queue is moving fast this morning! Drop by for quick 5-minute printing.', location: 'Shop Open', icon: 'fa-solid fa-sun', time: 'Live', href: '#contact' };
  } else if (currentHour >= 12 && currentHour < 17) {
    return { type: 'status', action: 'Afternoon Hours', detail: 'We are fully operational all afternoon. No lunch break interruptions!', location: 'Open till 9 PM', icon: 'fa-regular fa-clock', time: 'Live', href: '#contact' };
  } else if (currentHour >= 17 && currentHour < 21) {
    return { type: 'status', action: 'Evening Rush', detail: 'We are open until 9:00 PM tonight. Send your files now for same-day pickup!', location: 'Closing soon', icon: 'fa-solid fa-moon', time: 'Live', href: 'https://wa.me/917021072757' };
  } else {
    return { type: 'status', action: 'Store Closed', detail: 'We open tomorrow at 8:00 AM. You can drop your files on WhatsApp now!', location: 'After hours', icon: 'fa-solid fa-store-slash', time: 'Offline', href: 'https://wa.me/917021072757' };
  }
};

const getFeatureNudges = () => [
  { type: 'feature', action: 'Skip the line!', detail: 'Send your PDFs directly to our WhatsApp and we\'ll print them before you arrive.', location: 'Try it now', icon: 'fa-brands fa-whatsapp', time: 'Tip', href: 'https://wa.me/917021072757' },
  { type: 'trust', action: 'Top Rated in Virar', detail: 'Rated 4.9/5 by hundreds of happy customers on Google Maps. Read our reviews!', location: 'View on Maps', icon: 'fa-brands fa-google', time: 'Popular', href: CONFIG.business?.mapsUrl || 'https://maps.google.com' },
  { type: 'promo', action: 'Student Friendly', detail: 'Working on a project? We offer specialized Black & White thesis printing at student rates.', location: 'View Services', icon: 'fa-solid fa-graduation-cap', time: 'Offer', href: 'pages/services/thesis-printing.html' },
  { type: 'feature', action: 'Instant Pricing', detail: 'Need a quote? Use our Price Calculator to instantly check costs for Bulk Printing.', location: 'Calculate now', icon: 'fa-solid fa-calculator', time: 'Tool', href: 'pages/pricing.html' },
  { type: 'promo', action: 'Jumbo Printing', detail: 'Need A0 or A1 sizes? We do high-quality Autocad plotting and Jumbo Xerox.', location: 'View details', icon: 'fa-solid fa-ruler-combined', time: 'Service', href: 'pages/services/xerox.html' },
  getDynamicTimeNudge()
];

const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const isFirebaseConfigured = () => {
  const integration = CONFIG.integrations?.firebase;
  const config = integration?.config || {};
  return Boolean(
    integration?.enabled &&
    config.apiKey &&
    config.projectId &&
    !String(config.apiKey).startsWith('FIREBASE_') &&
    !String(config.projectId).startsWith('FIREBASE_')
  );
};

const injectStyles = () => {
  if (document.getElementById('social-proof-styles')) return;

  const style = document.createElement('style');
  style.id = 'social-proof-styles';
  style.textContent = `
    .social-proof-ticker {
      position: fixed;
      bottom: 90px;
      left: 24px;
      z-index: 1040;
      pointer-events: none;
      font-family: inherit;
    }

    .social-proof-notification {
      display: flex;
      align-items: stretch;
      background: var(--color-surface, #ffffff);
      border: 1px solid var(--color-border, rgba(0, 0, 0, 0.08));
      border-radius: 14px;
      box-shadow: 0 16px 48px -12px rgba(11, 42, 91, 0.22), 0 2px 8px rgba(0, 0, 0, 0.06);
      max-width: 380px;
      pointer-events: auto;
      opacity: 0;
      transform: translateY(30px) scale(0.95);
      transition: opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1),
                  transform 0.5s cubic-bezier(0.16, 1, 0.3, 1),
                  box-shadow 0.3s ease;
      position: relative;
      overflow: hidden;
      text-decoration: none !important;
      cursor: pointer;
    }

    .social-proof-notification:hover {
      box-shadow: 0 20px 52px -12px rgba(11, 42, 91, 0.28), 0 4px 12px rgba(0, 0, 0, 0.08);
      transform: translateY(-2px) scale(1) !important;
    }

    .social-proof-notification.is-visible {
      opacity: 1;
      transform: translateY(0) scale(1);
    }

    .social-proof-notification.is-dismissing {
      opacity: 0;
      transform: translateY(20px) scale(0.95) !important;
      pointer-events: none;
    }

    .social-proof-notification__content {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px 44px 20px 18px; /* Extra right padding for close button */
      flex: 1;
      color: inherit;
    }

    /* Top right Time Context */
    .social-proof-notification__time {
      position: absolute;
      top: 12px;
      right: 44px;
      font-size: 10px;
      font-weight: 700;
      color: var(--color-text-muted, #9ca3af);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    /* Live Pulsing Dot */
    .live-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #ff4757;
      animation: pulse-dot 2s infinite ease-in-out;
    }

    @keyframes pulse-dot {
      0% { transform: scale(0.8); opacity: 0.5; }
      50% { transform: scale(1.2); opacity: 1; box-shadow: 0 0 6px rgba(255, 71, 87, 0.6); }
      100% { transform: scale(0.8); opacity: 0.5; }
    }

    .social-proof-notification__icon {
      flex-shrink: 0;
      width: 46px;
      height: 46px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .social-proof-notification:hover .social-proof-notification__icon {
      transform: scale(1.08) rotate(-3deg);
    }

    /* Dynamic Icon Colors */
    .social-proof-notification[data-type="pickup"] .social-proof-notification__icon,
    .social-proof-notification[data-type="feature"] .social-proof-notification__icon {
      background: rgba(40, 167, 69, 0.15);
      color: #28a745;
    }
    .social-proof-notification[data-type="trust"] .social-proof-notification__icon {
      background: rgba(26, 115, 232, 0.15);
      color: #1a73e8;
    }
    .social-proof-notification[data-type="promo"] .social-proof-notification__icon,
    .social-proof-notification[data-type="status"] .social-proof-notification__icon {
      background: rgba(255, 152, 0, 0.15);
      color: #ff9800;
    }

    .social-proof-notification__body {
      flex: 1;
      min-width: 0;
      margin-top: 2px;
    }

    .social-proof-notification__text {
      font-size: 13.5px;
      font-weight: 500;
      color: var(--color-text, #1a1a2e);
      line-height: 1.4;
      margin: 0;
    }

    .social-proof-notification__text strong {
      font-weight: 800;
      color: #0b2a5b;
    }

    .social-proof-notification__meta {
      margin-top: 6px;
      font-size: 11px;
    }

    .social-proof-notification__location {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #f1f5f9;
      color: #475569;
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 0.03em;
      transition: background 0.2s, color 0.2s;
    }
    
    .social-proof-notification:hover .social-proof-notification__location {
      background: var(--yellow);
      color: #0b2a5b;
    }

    .social-proof-notification__close {
      position: absolute;
      top: 10px;
      right: 10px;
      flex-shrink: 0;
      width: 28px;
      height: 28px;
      border: none;
      background: rgba(0,0,0,0.03);
      color: var(--color-text-muted, #9ca3af);
      cursor: pointer;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 15px;
      padding: 0;
      pointer-events: auto;
      transition: all 0.2s;
      z-index: 2;
    }
    .social-proof-notification__close:hover {
      background: rgba(0,0,0,0.08);
      color: #1a1a2e;
      transform: scale(1.1);
    }

    /* Auto-dismiss Progress Bar */
    .social-proof-progress {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 4px;
      background: var(--yellow, #f4d21f);
      width: 100%;
      transform-origin: left;
      z-index: 1;
    }

    .social-proof-notification.is-visible .social-proof-progress {
      animation: progress-shrink ${DISPLAY_DURATION}ms linear forwards;
    }

    @keyframes progress-shrink {
      from { transform: scaleX(1); }
      to { transform: scaleX(0); }
    }

    @media (max-width: 480px) {
      .social-proof-ticker {
        left: 12px;
        right: 12px;
        bottom: 80px;
      }
      .social-proof-notification {
        max-width: 100%;
      }
    }
  `;
  document.head.appendChild(style);
};

const createContainer = () => {
  const container = document.createElement('div');
  container.classList.add('social-proof-ticker');
  container.setAttribute('role', 'status');
  container.setAttribute('aria-live', 'polite');
  container.setAttribute('aria-label', 'Helpful nudges');
  document.body.appendChild(container);
  return container;
};

const sanitizePickup = (doc) => {
  const data = doc.data();
  const detail = String(data.itemDescription || data.detail || '').trim();
  const location = String(data.customerLabel || data.label || 'Recent customer').trim();
  const action = String(data.action || 'Ready for pickup').trim();
  const icon = String(data.icon || 'fa-solid fa-bag-shopping').trim();

  if (!detail) return null;
  return { type: 'pickup', action, detail, location, icon, time: 'Just now', href: '#' };
};

const loadPickups = async () => {
  if (!isFirebaseConfigured()) return [];
  try {
    const { db, fs } = await getFirestoreContext();
    const collectionName = CONFIG.integrations.firebase.pickupsCollection || 'pickups';
    const pickupQuery = fs.query(
      fs.collection(db, collectionName),
      fs.limit(CONFIG.integrations.firebase.maxPickupNotifications || 6)
    );

    const snapshot = await fs.getDocs(pickupQuery);
    return snapshot.docs.map(sanitizePickup).filter(Boolean);
  } catch {
    return [];
  }
};

const buildNotification = (item) => {
  const notification = document.createElement('a');
  notification.classList.add('social-proof-notification');
  notification.setAttribute('data-type', item.type || 'feature');
  if (item.href && item.href !== '#') {
    notification.href = item.href;
    if (item.href.startsWith('http')) {
      notification.target = '_blank';
      notification.rel = 'noopener noreferrer';
    }
  } else {
    notification.href = '#';
    notification.onclick = (e) => e.preventDefault();
  }

  const showLiveDot = item.time === 'Live' || item.time === 'Just now';
  const timeHtml = `
    <div class="social-proof-notification__time">
      ${showLiveDot ? '<span class="live-dot"></span>' : ''}
      ${escapeHtml(item.time)}
    </div>
  `;

  notification.innerHTML = `
    <div class="social-proof-progress"></div>
    ${timeHtml}
    <div class="social-proof-notification__content">
      <div class="social-proof-notification__icon">
        <i class="${escapeHtml(item.icon)}" aria-hidden="true"></i>
      </div>
      <div class="social-proof-notification__body">
        <p class="social-proof-notification__text">
          <strong>${escapeHtml(item.action)}:</strong> ${escapeHtml(item.detail)}
        </p>
        <div class="social-proof-notification__meta">
          <span class="social-proof-notification__location">
            ${escapeHtml(item.location)}
            <i class="fa-solid fa-arrow-right" aria-hidden="true" style="margin-left:4px; font-size:10px;"></i>
          </span>
        </div>
      </div>
    </div>
    <button class="social-proof-notification__close" aria-label="Dismiss notification" type="button">
      <i class="fa-solid fa-xmark" aria-hidden="true"></i>
    </button>
  `;

  return notification;
};

const dismissNotification = (notificationEl) => {
  if (!notificationEl?.parentNode) return;
  notificationEl.classList.remove('is-visible');
  notificationEl.classList.add('is-dismissing');
  window.setTimeout(() => notificationEl.remove(), 500);
};

const scheduleNext = () => {
  scheduledTimeout = window.setTimeout(() => showNotification(), randomInterval(MIN_INTERVAL, MAX_INTERVAL));
};

function showNotification() {
  if (!containerEl || document.hidden || shownCount >= dataPool.length) {
    return;
  }

  const item = dataPool[shownCount % dataPool.length];
  const notificationEl = buildNotification(item);
  containerEl.innerHTML = '';
  containerEl.appendChild(notificationEl);

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => notificationEl.classList.add('is-visible'));
  });

  notificationEl
    .querySelector('.social-proof-notification__close')
    ?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dismissNotification(notificationEl);
    });

  window.setTimeout(() => dismissNotification(notificationEl), DISPLAY_DURATION);
  shownCount += 1;

  if (shownCount < dataPool.length) {
    scheduleNext();
  }
}

export const initSocialProof = () => {
  if (!document.body) return;

  // Always initialize because we have an engaging feature pool now
  window.setTimeout(async () => {
    try {
      const livePickups = await loadPickups();
      
      // Combine live firebase data with randomized feature nudges
      const randomizedFeatures = shuffleArray(getFeatureNudges());
      dataPool = [...livePickups, ...randomizedFeatures];

      if (!dataPool.length) return;

      injectStyles();
      containerEl = createContainer();
      scheduledTimeout = window.setTimeout(() => showNotification(), INITIAL_DELAY);

      document.addEventListener('visibilitychange', () => {
        if (document.hidden && scheduledTimeout) {
          window.clearTimeout(scheduledTimeout);
          scheduledTimeout = null;
        } else if (!document.hidden && shownCount < dataPool.length && !scheduledTimeout) {
          scheduleNext();
        }
      });
    } catch {
      // Ignore
    }
  }, 1000); // Shorter init delay
};
