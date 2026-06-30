import { CONFIG } from '../config.js';
import { escapeHtml } from '../utils/helpers.js';

const DISPLAY_DURATION = 9000;
const INITIAL_DELAY = 4000;
const MIN_INTERVAL = 14000;
const MAX_INTERVAL = 22000;

let shownCount = 0;
let scheduledTimeout = null;
let containerEl = null;
let dataPool = [];

const randomInterval = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const getDynamicTimeNudge = () => {
  const currentHour = new Date().getHours();
  if (currentHour >= 8 && currentHour < 12) {
    return { type: 'status', title: 'Morning Fast Queue ⚡', detail: 'The print queue is moving super fast right now! Drop by for quick 5-minute printing.', badge: 'Shop Open', icon: 'fa-solid fa-sun', href: '#contact' };
  } else if (currentHour >= 12 && currentHour < 17) {
    return { type: 'status', title: 'We\'re Fully Operational ☀️', detail: 'No lunch break interruptions here! We are open and printing all afternoon.', badge: 'Open till 9 PM', icon: 'fa-regular fa-clock', href: '#contact' };
  } else if (currentHour >= 17 && currentHour < 21) {
    return { type: 'status', title: 'Evening Rush Hours 🌙', detail: 'We\'re open until 9:00 PM tonight. Send your files over WhatsApp now for same-day pickup!', badge: 'Closing soon', icon: 'fa-solid fa-moon', href: 'https://wa.me/917021072757' };
  } else {
    return { type: 'status', title: 'We\'re Catching Some Zzz\'s 😴', detail: 'We open tomorrow at 8:00 AM. But you can drop your files on WhatsApp right now!', badge: 'After hours', icon: 'fa-solid fa-store-slash', href: 'https://wa.me/917021072757' };
  }
};

const getFeatureNudges = () => [
  { type: 'feature', title: 'In a hurry? 🚀', detail: 'Send PDFs on WhatsApp. We\\'ll print them before you arrive!', badge: 'Try it now', icon: 'fa-brands fa-whatsapp', href: 'https://wa.me/917021072757' },
  { type: 'trust', title: 'Virar\\'s Favorite ✨', detail: 'Rated 4.9/5 on Google Maps. Read our customer reviews!', badge: 'View on Maps', icon: 'fa-brands fa-google', href: CONFIG.business?.mapsUrl || 'https://maps.google.com' },
  { type: 'promo', title: 'Student Perks 🎓', detail: 'Special Black & White printing rates for your thesis and projects.', badge: 'View Services', icon: 'fa-solid fa-graduation-cap', href: 'pages/services/thesis-printing.html' },
  { type: 'feature', title: 'Instant Quotes 🧮', detail: 'Use our Price Calculator to instantly check costs for bulk prints.', badge: 'Calculate now', icon: 'fa-solid fa-calculator', href: 'pages/pricing.html' },
  { type: 'promo', title: 'Jumbo Printing 📏', detail: 'High-quality Autocad plotting & Jumbo Xerox for professionals.', badge: 'View details', icon: 'fa-solid fa-ruler-combined', href: 'pages/services/xerox.html' },
  { type: 'feature', title: 'Free Delivery 🛵', detail: 'Get free home delivery in Virar West on all orders over ₹500.', badge: 'Learn More', icon: 'fa-solid fa-motorcycle', href: '#contact' },
  { type: 'promo', title: 'Same Day Binding 📚', detail: 'Spiral and hardbound project binding done in minutes.', badge: 'Fast Service', icon: 'fa-solid fa-book-bookmark', href: 'pages/services/binding.html' },
  { type: 'feature', title: 'Vibrant Colors 🖨️', detail: 'Premium color copies on 100gsm paper for presentations.', badge: 'Premium Quality', icon: 'fa-solid fa-palette', href: 'pages/services/color-printing.html' },
  { type: 'promo', title: 'Protect Documents 🛡️', detail: 'Instant lamination services for your important certificates.', badge: 'Secure it', icon: 'fa-solid fa-layer-group', href: 'pages/services/lamination.html' },
  { type: 'feature', title: 'Bulk Discounts 📉', detail: 'Printing 100+ pages? Ask us about our special bulk volume rates.', badge: 'Save Money', icon: 'fa-solid fa-tags', href: '#contact' },
  { type: 'promo', title: 'Custom Stamps ✒️', detail: 'Get your custom business rubber stamps made in just 24 hours.', badge: 'Order Now', icon: 'fa-solid fa-stamp', href: '#contact' },
  getDynamicTimeNudge()
];

const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const injectStyles = () => {
  if (document.getElementById('social-proof-styles')) return;

  const style = document.createElement('style');
  style.id = 'social-proof-styles';
  
  // High-end CSS with Glassmorphism and Spring physics
  style.textContent = `
    .sp-ticker {
      position: fixed;
      bottom: 40px;
      left: 30px;
      z-index: 9999;
      pointer-events: none;
      font-family: inherit;
      perspective: 1000px;
    }

    .sp-card {
      display: flex;
      align-items: center;
      gap: 12px;
      
      /* Glassmorphism */
      background: rgba(255, 255, 255, 0.75);
      backdrop-filter: blur(24px) saturate(180%);
      -webkit-backdrop-filter: blur(24px) saturate(180%);
      border: 1px solid rgba(255, 255, 255, 0.6);
      
      border-radius: 18px;
      padding: 12px 14px;
      max-width: 320px;
      pointer-events: auto;
      
      /* Soft colored shadow */
      box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.1), 
                  0 0 0 1px rgba(255, 255, 255, 0.4) inset,
                  0 10px 30px -5px rgba(26, 115, 232, 0.08); /* subtle blue glow */
      
      /* Entrance State */
      opacity: 0;
      transform: translateY(40px) scale(0.9) rotateX(10deg);
      
      /* Premium Spring Physics */
      transition: opacity 0.6s ease,
                  transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1),
                  box-shadow 0.4s ease;
                  
      position: relative;
      text-decoration: none !important;
      cursor: pointer;
      color: var(--color-text, #1a1a2e);
    }

    .sp-card:hover {
      transform: translateY(-4px) scale(1.02) rotateX(0deg) !important;
      box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.15), 
                  0 0 0 1px rgba(255, 255, 255, 0.6) inset,
                  0 15px 40px -5px rgba(26, 115, 232, 0.12);
    }

    .sp-card.is-visible {
      opacity: 1;
      transform: translateY(0) scale(1) rotateX(0deg);
    }

    .sp-card.is-dismissing {
      opacity: 0;
      transform: translateY(20px) scale(0.9) !important;
      pointer-events: none;
      transition: all 0.4s cubic-bezier(0.36, 0, 0.66, -0.56); /* Fall away */
    }

    /* Floating Icon Container */
    .sp-icon-wrap {
      flex-shrink: 0;
      width: 44px;
      height: 44px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      position: relative;
      background: linear-gradient(135deg, #f8f9fa, #e9ecef);
      box-shadow: 0 8px 16px -4px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.8);
      transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .sp-card:hover .sp-icon-wrap {
      transform: scale(1.1) rotate(-5deg);
    }

    /* Icon Theme Colors */
    .sp-card[data-theme="feature"] .sp-icon-wrap {
      background: linear-gradient(135deg, #dcfce7, #bbf7d0);
      color: #166534;
      box-shadow: 0 8px 16px -4px rgba(22, 101, 52, 0.2);
    }
    .sp-card[data-theme="trust"] .sp-icon-wrap {
      background: linear-gradient(135deg, #dbeafe, #bfdbfe);
      color: #1e40af;
      box-shadow: 0 8px 16px -4px rgba(30, 64, 175, 0.2);
    }
    .sp-card[data-theme="promo"] .sp-icon-wrap {
      background: linear-gradient(135deg, #fef3c7, #fde68a);
      color: #92400e;
      box-shadow: 0 8px 16px -4px rgba(146, 64, 14, 0.2);
    }
    .sp-card[data-theme="status"] .sp-icon-wrap {
      background: linear-gradient(135deg, #fee2e2, #fecaca);
      color: #991b1b;
      box-shadow: 0 8px 16px -4px rgba(153, 27, 27, 0.2);
    }

    .sp-body {
      flex: 1;
      min-width: 0;
      padding-right: 20px; /* space for close btn */
    }

    .sp-title {
      font-size: 14px;
      font-weight: 800;
      color: #111827;
      margin: 0 0 3px 0;
      line-height: 1.2;
      letter-spacing: -0.01em;
    }

    .sp-detail {
      font-size: 12.5px;
      font-weight: 500;
      color: #4b5563;
      line-height: 1.4;
      margin: 0 0 8px 0;
    }

    /* Modern Pill Badge */
    .sp-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: rgba(17, 24, 39, 0.05);
      color: #374151;
      padding: 3px 10px;
      border-radius: 100px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      transition: all 0.3s ease;
      border: 1px solid rgba(0,0,0,0.05);
    }
    
    .sp-card:hover .sp-badge {
      background: #111827;
      color: #ffffff;
      border-color: transparent;
      transform: translateX(4px);
    }

    /* Premium Close Button */
    .sp-close {
      position: absolute;
      top: 12px;
      right: 12px;
      width: 28px;
      height: 28px;
      border: none;
      background: transparent;
      color: #9ca3af;
      cursor: pointer;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      padding: 0;
      pointer-events: auto;
      transition: all 0.2s ease;
      z-index: 10;
    }
    .sp-close:hover {
      background: rgba(0,0,0,0.06);
      color: #111827;
      transform: rotate(90deg);
    }

    /* Neon Edge Progress */
    .sp-progress-track {
      position: absolute;
      bottom: 0;
      left: 10%;
      width: 80%;
      height: 3px;
      background: transparent;
      border-radius: 4px 4px 0 0;
      overflow: hidden;
    }
    
    .sp-progress-fill {
      height: 100%;
      width: 100%;
      background: linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899);
      transform-origin: left;
    }

    .sp-card.is-visible .sp-progress-fill {
      animation: neon-drain ${DISPLAY_DURATION}ms linear forwards;
    }

    @keyframes neon-drain {
      from { transform: scaleX(1); opacity: 1; }
      to { transform: scaleX(0); opacity: 0.2; }
    }

    @media (max-width: 480px) {
      .sp-ticker {
        left: 16px;
        right: 16px;
        bottom: 80px; /* Above mobile nav if present */
      }
      .sp-card {
        max-width: 100%;
        padding: 14px 16px;
      }
    }
  `;
  document.head.appendChild(style);
};

const createContainer = () => {
  const container = document.createElement('div');
  container.classList.add('sp-ticker');
  document.body.appendChild(container);
  return container;
};

const buildNotification = (item) => {
  const card = document.createElement('a');
  card.classList.add('sp-card');
  card.setAttribute('data-theme', item.type || 'feature');
  
  if (item.href && item.href !== '#') {
    card.href = item.href;
    if (item.href.startsWith('http')) {
      card.target = '_blank';
      card.rel = 'noopener noreferrer';
    }
  } else {
    card.href = '#';
    card.onclick = (e) => e.preventDefault();
  }

  card.innerHTML = `
    <div class="sp-icon-wrap">
      <i class="${escapeHtml(item.icon)}" aria-hidden="true"></i>
    </div>
    <div class="sp-body">
      <h4 class="sp-title">${escapeHtml(item.title)}</h4>
      <p class="sp-detail">${escapeHtml(item.detail)}</p>
      <div class="sp-badge">
        ${escapeHtml(item.badge)}
        <i class="fa-solid fa-arrow-right" style="font-size:9px;"></i>
      </div>
    </div>
    <button class="sp-close" aria-label="Dismiss" type="button">
      <i class="fa-solid fa-xmark" aria-hidden="true"></i>
    </button>
    <div class="sp-progress-track">
      <div class="sp-progress-fill"></div>
    </div>
  `;

  return card;
};

const dismissNotification = (card) => {
  if (!card?.parentNode) return;
  card.classList.remove('is-visible');
  card.classList.add('is-dismissing');
  window.setTimeout(() => card.remove(), 500);
};

const scheduleNext = () => {
  scheduledTimeout = window.setTimeout(() => showNotification(), randomInterval(MIN_INTERVAL, MAX_INTERVAL));
};

function showNotification() {
  if (!containerEl || document.hidden || shownCount >= dataPool.length) {
    return;
  }

  const item = dataPool[shownCount % dataPool.length];
  const card = buildNotification(item);
  containerEl.innerHTML = '';
  containerEl.appendChild(card);

  // Force reflow for animation
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => card.classList.add('is-visible'));
  });

  card.querySelector('.sp-close')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dismissNotification(card);
  });

  window.setTimeout(() => dismissNotification(card), DISPLAY_DURATION);
  shownCount += 1;

  if (shownCount < dataPool.length) {
    scheduleNext();
  }
}

export const initSocialProof = () => {
  if (!document.body) return;

  window.setTimeout(() => {
    try {
      dataPool = shuffleArray(getFeatureNudges());

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
    } catch (e) {
      console.error('Nudge error:', e);
    }
  }, 1000);
};
