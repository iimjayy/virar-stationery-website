/**
 * @module social-proof
 * @description Shows subtle notification popups with representative activity
 * to showcase the variety of services handled daily. Notifications slide in
 * from the bottom-left, auto-dismiss after 7 seconds, and are capped at
 * 6 per page load.
 */

/** @type {Array<{action: string, detail: string, location: string, icon: string}>} */
const ACTIVITY_POOL = [
  { action: 'Printed & delivered', detail: 'Spiral Bound Project Reports', location: 'College student', icon: 'fa-solid fa-book' },
  { action: 'Completed', detail: 'Color Brochures — bulk order', location: 'Local business', icon: 'fa-solid fa-palette' },
  { action: 'Ready for pickup', detail: 'Passport Photo Set', location: 'Walk-in customer', icon: 'fa-solid fa-camera' },
  { action: 'Bulk xerox done', detail: 'B&W Xerox Copies — office set', location: 'Nearby office', icon: 'fa-solid fa-copy' },
  { action: 'Lamination done', detail: 'Certificates — glossy finish', location: 'School order', icon: 'fa-solid fa-layer-group' },
  { action: 'Printed & bound', detail: 'Thesis — hardbound copies', location: 'Engineering student', icon: 'fa-solid fa-print' },
  { action: 'Completed', detail: 'Visiting Cards — premium stock', location: 'Small business owner', icon: 'fa-solid fa-address-card' },
  { action: 'Printed', detail: 'Smart ID Cards — company batch', location: 'Corporate order', icon: 'fa-solid fa-id-card' },
  { action: 'Delivered', detail: 'A3 Color Posters — event set', location: 'Event organizer', icon: 'fa-solid fa-expand' },
  { action: 'Completed', detail: 'Letterhead Printing — bulk', location: 'Professional office', icon: 'fa-solid fa-heading' },
  { action: 'Printed & bound', detail: 'Blackbook — architecture project', location: 'Architecture student', icon: 'fa-solid fa-folder-open' },
  { action: 'Xerox done', detail: 'Exam Notes — full set', location: 'Coaching class', icon: 'fa-solid fa-file-lines' },
  { action: 'Printed', detail: 'Resumes — clean format', location: 'Job applicant', icon: 'fa-solid fa-file-lines' },
  { action: 'Completed', detail: 'Aadhar & PAN Smart Cards', location: 'Walk-in customer', icon: 'fa-solid fa-id-card' },
  { action: 'Spiral binding done', detail: 'Project Files — transparent cover', location: 'College student', icon: 'fa-solid fa-book' }
];

/** Maximum number of notifications to show per page load. */
const SESSION_LIMIT = 6;

/** Duration (ms) each notification stays visible before auto-dismiss. */
const DISPLAY_DURATION = 7000;

/** Initial delay (ms) before the first notification appears. */
const INITIAL_DELAY = 15000;

/** Minimum interval (ms) between subsequent notifications. */
const MIN_INTERVAL = 25000;

/** Maximum interval (ms) between subsequent notifications. */
const MAX_INTERVAL = 35000;

/** Module-scoped counter tracking how many notifications have been shown. */
let shownCount = 0;

/** @type {number|null} Module-scoped timeout ID for scheduling. */
let scheduledTimeout = null;

/** @type {HTMLElement|null} Reference to the ticker container element. */
let containerEl = null;

/** @type {boolean} Whether the user prefers reduced motion. */
let prefersReducedMotion = false;

/**
 * Shuffles an array in place using the Fisher-Yates algorithm.
 * @param {Array} array - The array to shuffle.
 * @returns {Array} The shuffled array (same reference).
 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 * @param {number} min - Minimum value.
 * @param {number} max - Maximum value.
 * @returns {number} Random integer in [min, max].
 */
function randomInterval(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Injects the required CSS styles for the social proof ticker into
 * the document head. Styles are only injected once.
 */
function injectStyles() {
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
      transition: opacity 0.3s ease-in, transform 0.3s ease-in;
    }

    /* Reduced motion: no transforms, simple fade */
    @media (prefers-reduced-motion: reduce) {
      .social-proof-notification {
        transform: none !important;
        transition: opacity 0.15s ease !important;
      }
      .social-proof-notification.is-visible {
        transform: none !important;
      }
      .social-proof-notification.is-dismissing {
        transform: none !important;
      }
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
      display: flex;
      align-items: center;
      gap: 8px;
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
      transition: background 0.2s ease, color 0.2s ease;
      pointer-events: auto;
    }

    .social-proof-notification__close:hover {
      background: var(--color-border, rgba(0, 0, 0, 0.06));
      color: var(--color-text, #1a1a2e);
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
}

/**
 * Creates the ticker container element and appends it to the document body.
 * @returns {HTMLElement} The created container element.
 */
function createContainer() {
  const container = document.createElement('div');
  container.classList.add('social-proof-ticker');
  container.setAttribute('role', 'status');
  container.setAttribute('aria-live', 'polite');
  container.setAttribute('aria-label', 'Recent activity notifications');
  document.body.appendChild(container);
  return container;
}

/**
 * Builds the notification element for a given activity item.
 * @param {{action: string, detail: string, location: string, icon: string}} item - The activity data.
 * @returns {HTMLElement} The notification DOM element.
 */
function buildNotification(item) {
  const notification = document.createElement('div');
  notification.classList.add('social-proof-notification');

  notification.innerHTML = `
    <div class="social-proof-notification__icon">
      <i class="${item.icon}" aria-hidden="true"></i>
    </div>
    <div class="social-proof-notification__body">
      <p class="social-proof-notification__text">
        <strong>${item.action}:</strong> ${item.detail}
      </p>
      <div class="social-proof-notification__meta">
        <span class="social-proof-notification__location">
          <i class="fa-solid fa-user" aria-hidden="true"></i>
          ${item.location}
        </span>
      </div>
    </div>
    <button class="social-proof-notification__close" aria-label="Dismiss notification" type="button">
      <i class="fa-solid fa-xmark" aria-hidden="true"></i>
    </button>
  `;

  return notification;
}

/**
 * Dismisses a notification element with a fade + slide out animation,
 * then removes it from the DOM.
 * @param {HTMLElement} notificationEl - The notification element to dismiss.
 */
function dismissNotification(notificationEl) {
  if (!notificationEl || !notificationEl.parentNode) return;

  notificationEl.classList.remove('is-visible');
  notificationEl.classList.add('is-dismissing');

  const onTransitionEnd = () => {
    notificationEl.removeEventListener('transitionend', onTransitionEnd);
    if (notificationEl.parentNode) {
      notificationEl.parentNode.removeChild(notificationEl);
    }
  };

  notificationEl.addEventListener('transitionend', onTransitionEnd);

  // Safety fallback in case transitionend never fires
  setTimeout(() => {
    if (notificationEl.parentNode) {
      notificationEl.parentNode.removeChild(notificationEl);
    }
  }, 500);
}

/**
 * Shows a single notification from the shuffled activity pool.
 * Handles auto-dismiss, close button, and session limit tracking.
 * @param {Array} pool - The shuffled activity data pool.
 */
function showNotification(pool) {
  if (!containerEl) return;
  if (document.hidden) {
    scheduleNext(pool);
    return;
  }

  const item = pool[shownCount % pool.length];
  const notificationEl = buildNotification(item);

  // Clear any existing notification first
  containerEl.innerHTML = '';
  containerEl.appendChild(notificationEl);

  // Trigger slide-in on next frame
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      notificationEl.classList.add('is-visible');
    });
  });

  // Close button handler
  const closeBtn = notificationEl.querySelector('.social-proof-notification__close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      dismissNotification(notificationEl);
    });
  }

  // Auto-dismiss after DISPLAY_DURATION
  setTimeout(() => {
    dismissNotification(notificationEl);
  }, DISPLAY_DURATION);

  shownCount++;

  // Check session limit
  if (shownCount >= SESSION_LIMIT) {
    cleanup();
  } else {
    scheduleNext(pool);
  }
}

/**
 * Schedules the next notification with a randomized delay
 * between MIN_INTERVAL and MAX_INTERVAL milliseconds.
 * @param {Array} pool - The shuffled activity data pool.
 */
function scheduleNext(pool) {
  const delay = randomInterval(MIN_INTERVAL, MAX_INTERVAL);
  scheduledTimeout = setTimeout(() => {
    showNotification(pool);
  }, delay);
}

/**
 * Cleans up all social proof ticker resources: removes the container
 * from the DOM, clears any scheduled timeouts, and nullifies references.
 */
function cleanup() {
  if (scheduledTimeout) {
    clearTimeout(scheduledTimeout);
    scheduledTimeout = null;
  }

  // Allow the last notification to finish its dismiss animation
  setTimeout(() => {
    if (containerEl && containerEl.parentNode) {
      containerEl.parentNode.removeChild(containerEl);
    }
    containerEl = null;
  }, DISPLAY_DURATION + 600);
}

/**
 * Handles the Page Visibility API change event. Pauses scheduling
 * when the tab is hidden and resumes when visible again.
 * @param {Array} pool - The shuffled activity data pool.
 */
function handleVisibilityChange(pool) {
  if (document.hidden) {
    // Pause: clear any pending timeout
    if (scheduledTimeout) {
      clearTimeout(scheduledTimeout);
      scheduledTimeout = null;
    }
  } else {
    // Resume: schedule the next notification if we haven't hit the limit
    if (shownCount < SESSION_LIMIT && !scheduledTimeout) {
      scheduleNext(pool);
    }
  }
}

/**
 * Initializes the Social Proof Ticker module.
 * Creates the notification container, shuffles the activity pool,
 * and begins the notification cycle after an initial delay.
 *
 * @returns {void}
 */
export const initSocialProof = () => {
  // Null-guard: bail if body isn't available
  if (!document.body) return;

  // Don't run if session limit was somehow already reached
  if (shownCount >= SESSION_LIMIT) return;

  // Check for reduced motion preference
  prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Inject styles and create container
  injectStyles();
  containerEl = createContainer();

  // Shuffle the pool for variety
  const pool = shuffleArray([...ACTIVITY_POOL]);

  // Listen for visibility changes to pause/resume
  document.addEventListener('visibilitychange', () => handleVisibilityChange(pool));

  // Start after initial delay to let the user settle in
  scheduledTimeout = setTimeout(() => {
    showNotification(pool);
  }, INITIAL_DELAY);
};
