import { CONFIG } from '../config.js';
import { escapeHtml } from '../utils/helpers.js';
import { getFirestoreContext } from '../core/firebase.js';

const DISPLAY_DURATION = 7000;
const INITIAL_DELAY = 3000; // Faster hook
const MIN_INTERVAL = 12000; // 12s
const MAX_INTERVAL = 25000; // 25s
const FIREBASE_VERSION = '10.12.5';

let shownCount = 0;
let scheduledTimeout = null;
let containerEl = null;
let dataPool = [];

const randomInterval = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const MOCK_DATA_POOL = [
  { type: 'pickup', action: 'Ready for pickup', detail: 'Spiral bound project file', location: 'Recent customer', icon: 'fa-solid fa-book-open', time: 'Just now' },
  { type: 'order', action: 'Just ordered', detail: '50 Color Printouts on 100gsm paper', location: 'Someone from Virar West', icon: 'fa-solid fa-palette', time: '2 mins ago' },
  { type: 'trending', action: 'Trending', detail: '14 people are currently looking at Jumbo Xerox', location: 'High demand', icon: 'fa-solid fa-fire', time: 'Live' },
  { type: 'pickup', action: 'Ready for pickup', detail: 'Bulk Lamination (100 A4 Sheets)', location: 'Recent customer', icon: 'fa-solid fa-layer-group', time: '1 min ago' },
  { type: 'order', action: 'Just ordered', detail: '10 Sets of Thesis Binding', location: 'Someone from Nalasopara', icon: 'fa-solid fa-book-bookmark', time: '4 mins ago' },
  { type: 'trending', action: 'Trending', detail: '25+ inquiries today for Same-Day Printing', location: 'Fast service', icon: 'fa-solid fa-bolt', time: 'Live' },
  { type: 'pickup', action: 'Ready for pickup', detail: 'A0 Autocad Plotting', location: 'Recent customer', icon: 'fa-solid fa-ruler-combined', time: '3 mins ago' },
  { type: 'order', action: 'Just ordered', detail: 'Passport Size Photos (32 copies)', location: 'Someone from Vasai', icon: 'fa-solid fa-camera', time: '5 mins ago' }
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
      align-items: center;
      gap: 14px;
      background: var(--color-surface, #ffffff);
      border: 1px solid var(--color-border, rgba(0, 0, 0, 0.08));
      border-radius: 14px;
      padding: 16px 18px 20px 18px; /* Extra bottom padding for progress bar */
      box-shadow: 0 12px 48px -12px rgba(11, 42, 91, 0.25), 0 2px 8px rgba(0, 0, 0, 0.06);
      max-width: 380px;
      pointer-events: auto;
      opacity: 0;
      transform: translateY(30px) scale(0.95);
      transition: opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1),
                  transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative;
      overflow: hidden;
    }

    .social-proof-notification.is-visible {
      opacity: 1;
      transform: translateY(0) scale(1);
    }

    .social-proof-notification.is-dismissing {
      opacity: 0;
      transform: translateY(20px) scale(0.95);
    }

    /* Top right Time Context */
    .social-proof-notification__time {
      position: absolute;
      top: 12px;
      right: 36px;
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
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    }

    /* Dynamic Icon Colors */
    .social-proof-notification[data-type="pickup"] .social-proof-notification__icon {
      background: rgba(40, 167, 69, 0.15);
      color: #28a745;
    }
    .social-proof-notification[data-type="order"] .social-proof-notification__icon {
      background: rgba(26, 115, 232, 0.15);
      color: #1a73e8;
    }
    .social-proof-notification[data-type="trending"] .social-proof-notification__icon {
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
      padding-right: 12px;
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
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.03em;
    }
    
    .social-proof-notification[data-type="trending"] .social-proof-notification__location {
      background: rgba(255, 152, 0, 0.1);
      color: #e65100;
    }

    .social-proof-notification__close {
      position: absolute;
      top: 10px;
      right: 10px;
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      border: none;
      background: transparent;
      color: var(--color-text-muted, #9ca3af);
      cursor: pointer;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      padding: 0;
      pointer-events: auto;
      transition: color 0.2s;
    }
    .social-proof-notification__close:hover {
      color: #1a1a2e;
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
  container.setAttribute('aria-label', 'Recent activity notifications');
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
  return { type: 'pickup', action, detail, location, icon, time: 'Just now' };
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
  const notification = document.createElement('div');
  notification.classList.add('social-proof-notification');
  notification.setAttribute('data-type', item.type || 'pickup');

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
    <div class="social-proof-notification__icon">
      <i class="${escapeHtml(item.icon)}" aria-hidden="true"></i>
    </div>
    <div class="social-proof-notification__body">
      <p class="social-proof-notification__text">
        <strong>${escapeHtml(item.action)}:</strong> ${escapeHtml(item.detail)}
      </p>
      <div class="social-proof-notification__meta">
        <span class="social-proof-notification__location">
          <i class="fa-solid ${item.type === 'trending' ? 'fa-chart-line' : 'fa-user'}" aria-hidden="true"></i>
          ${escapeHtml(item.location)}
        </span>
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
    ?.addEventListener('click', () => dismissNotification(notificationEl));

  window.setTimeout(() => dismissNotification(notificationEl), DISPLAY_DURATION);
  shownCount += 1;

  if (shownCount < dataPool.length) {
    scheduleNext();
  }
}

export const initSocialProof = () => {
  if (!document.body) return;

  // Always initialize because we have an engaging mock data pool now
  window.setTimeout(async () => {
    try {
      const livePickups = await loadPickups();
      
      // Combine live firebase data with randomized mock data to ensure high engagement
      const randomizedMocks = shuffleArray([...MOCK_DATA_POOL]);
      dataPool = [...livePickups, ...randomizedMocks];

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
