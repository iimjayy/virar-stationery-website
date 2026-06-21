/**
 * @module social-proof
 * @description Firestore-backed pickup notifications. Shows only real,
 * public-safe pickup entries from the `pickups` collection and hides if none
 * are available or Firebase is not configured.
 */

import { CONFIG } from '../config.js';
import { escapeHtml } from '../utils/helpers.js';

const DISPLAY_DURATION = 7000;
const INITIAL_DELAY = 12000;
const MIN_INTERVAL = 25000;
const MAX_INTERVAL = 35000;
const FIREBASE_VERSION = '10.12.5';

let shownCount = 0;
let scheduledTimeout = null;
let containerEl = null;

const randomInterval = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

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
      gap: 12px;
      background: var(--color-surface, #ffffff);
      border: 1px solid var(--color-border, rgba(0, 0, 0, 0.08));
      border-radius: 12px;
      padding: 14px 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06);
      max-width: 360px;
      pointer-events: auto;
      opacity: 0;
      transform: translateY(20px) translateX(-10px);
      transition: opacity 0.4s cubic-bezier(0.22, 1, 0.36, 1),
                  transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
    }

    .social-proof-notification.is-visible {
      opacity: 1;
      transform: translateY(0) translateX(0);
    }

    .social-proof-notification.is-dismissing {
      opacity: 0;
      transform: translateY(10px) translateX(-20px);
    }

    .social-proof-notification__icon {
      flex-shrink: 0;
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: var(--color-primary-light, #e8f0fe);
      color: var(--color-primary, #1a73e8);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
    }

    .social-proof-notification__body {
      flex: 1;
      min-width: 0;
    }

    .social-proof-notification__text {
      font-size: 13px;
      font-weight: 500;
      color: var(--color-text, #1a1a2e);
      line-height: 1.4;
      margin: 0;
    }

    .social-proof-notification__text strong {
      font-weight: 700;
    }

    .social-proof-notification__meta {
      margin-top: 4px;
      font-size: 11px;
      color: var(--color-text-muted, #6b7280);
    }

    .social-proof-notification__location {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: var(--color-primary-light, #e8f0fe);
      color: var(--color-primary, #1a73e8);
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.02em;
    }

    .social-proof-notification__close {
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
      font-size: 14px;
      padding: 0;
      pointer-events: auto;
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
  container.setAttribute('aria-label', 'Recent pickup notifications');
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
  return { action, detail, location, icon };
};

const loadPickups = async () => {
  const [{ initializeApp }, firestore] = await Promise.all([
    import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-firestore.js`)
  ]);

  const app = initializeApp(CONFIG.integrations.firebase.config);
  const db = firestore.getFirestore(app);
  const collectionName = CONFIG.integrations.firebase.pickupsCollection || 'pickups';
  const pickupQuery = firestore.query(
    firestore.collection(db, collectionName),
    firestore.orderBy('timestamp', 'desc'),
    firestore.limit(CONFIG.integrations.firebase.maxPickupNotifications || 6)
  );

  const snapshot = await firestore.getDocs(pickupQuery);
  return snapshot.docs.map(sanitizePickup).filter(Boolean);
};

const buildNotification = (item) => {
  const notification = document.createElement('div');
  notification.classList.add('social-proof-notification');

  notification.innerHTML = `
    <div class="social-proof-notification__icon">
      <i class="${item.icon}" aria-hidden="true"></i>
    </div>
    <div class="social-proof-notification__body">
      <p class="social-proof-notification__text">
        <strong>${escapeHtml(item.action)}:</strong> ${escapeHtml(item.detail)}
      </p>
      <div class="social-proof-notification__meta">
        <span class="social-proof-notification__location">
          <i class="fa-solid fa-user" aria-hidden="true"></i>
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

const scheduleNext = (pool) => {
  scheduledTimeout = window.setTimeout(() => showNotification(pool), randomInterval(MIN_INTERVAL, MAX_INTERVAL));
};

function showNotification(pool) {
  if (!containerEl || document.hidden || shownCount >= pool.length) {
    return;
  }

  const item = pool[shownCount % pool.length];
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

  if (shownCount < pool.length) {
    scheduleNext(pool);
  }
}

export const initSocialProof = () => {
  if (!document.body || !isFirebaseConfigured()) return;

  window.setTimeout(async () => {
    try {
      const pickups = await loadPickups();
      if (!pickups.length) return;

      injectStyles();
      containerEl = createContainer();
      scheduledTimeout = window.setTimeout(() => showNotification(pickups), INITIAL_DELAY);

      document.addEventListener('visibilitychange', () => {
        if (document.hidden && scheduledTimeout) {
          window.clearTimeout(scheduledTimeout);
          scheduledTimeout = null;
        } else if (!document.hidden && shownCount < pickups.length && !scheduledTimeout) {
          scheduleNext(pickups);
        }
      });
    } catch {
      // Hide quietly if Firebase is unavailable or rules deny reads.
    }
  }, 2500);
};
