// js/features/order-status.js
// Self-contained Order Status Portal feature module.
// Provides a client-side order tracking system with mock data.
// Supports lookup by order ID, full phone number, or last 4 digits.
// Dependencies: CONFIG (WhatsApp number), showEnquiryToast (notifications).

import { showEnquiryToast } from '../core/toast.js';
import { CONFIG } from '../config.js';

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

/** @type {Array<{id: string, phone: string, customerName: string, service: string, details: string, status: string, createdAt: string, estimatedPickup: string, total: string}>} */
const MOCK_ORDERS = [
  {
    id: 'VS-2026-0847',
    phone: '7021072757',
    customerName: 'Rahul Sharma',
    service: 'Color Printing',
    details: '45 pages, A4, Color, Spiral Binding',
    status: 'ready',
    createdAt: '2026-06-16 10:30 AM',
    estimatedPickup: 'Today, 4:00 PM',
    total: 'Rs 580'
  },
  {
    id: 'VS-2026-0848',
    phone: '9876543210',
    customerName: 'Priya Patil',
    service: 'Thesis Printing',
    details: '120 pages, A4, B&W, 3 copies, Hardbound',
    status: 'printing',
    createdAt: '2026-06-17 9:00 AM',
    estimatedPickup: 'Today, 6:00 PM',
    total: 'Rs 1,250'
  },
  {
    id: 'VS-2026-0849',
    phone: '8899776655',
    customerName: 'Amit Desai',
    service: 'Bulk Xerox',
    details: '500 pages, A4, B&W',
    status: 'queued',
    createdAt: '2026-06-17 11:15 AM',
    estimatedPickup: 'Tomorrow, 10:00 AM',
    total: 'Rs 750'
  },
  {
    id: 'VS-2026-0846',
    phone: '7021072757',
    customerName: 'Rahul Sharma',
    service: 'Lamination',
    details: '10 sheets, A4, Glossy',
    status: 'collected',
    createdAt: '2026-06-15 3:00 PM',
    estimatedPickup: 'Collected on Jun 15',
    total: 'Rs 100'
  }
];

// ---------------------------------------------------------------------------
// Status Steps
// ---------------------------------------------------------------------------

/**
 * Ordered pipeline stages for order tracking.
 * @type {Array<{key: string, label: string, icon: string}>}
 */
const STATUS_STEPS = [
  { key: 'queued',    label: 'Queued',    icon: 'fa-solid fa-clock' },
  { key: 'printing',  label: 'Printing',  icon: 'fa-solid fa-print' },
  { key: 'ready',     label: 'Ready',     icon: 'fa-solid fa-circle-check' },
  { key: 'collected', label: 'Collected', icon: 'fa-solid fa-bag-shopping' }
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Normalize a user query by stripping spaces and dashes.
 * @param {string} value - Raw input value.
 * @returns {string} Cleaned, lowercase string.
 */
const normalizeQuery = (value) => value.replace(/[\s-]/g, '').toLowerCase();

/**
 * Search MOCK_ORDERS for matches by order ID, full phone, or last 4 digits.
 * @param {string} raw - Raw user input.
 * @returns {Array<typeof MOCK_ORDERS[0]>} Matching order(s).
 */
const findOrders = (raw) => {
  const query = normalizeQuery(raw);
  if (!query) {
    return [];
  }

  return MOCK_ORDERS.filter((order) => {
    const normalizedId = normalizeQuery(order.id);
    const normalizedPhone = normalizeQuery(order.phone);

    // Exact order ID match (case-insensitive, stripped).
    if (normalizedId === query) {
      return true;
    }

    // Full phone number match.
    if (normalizedPhone === query) {
      return true;
    }

    // Last 4 digits of phone match.
    if (query.length === 4 && normalizedPhone.endsWith(query)) {
      return true;
    }

    return false;
  });
};

/**
 * Build a WhatsApp URL with a pre-filled message about an order.
 * @param {string} orderId - The order ID to reference.
 * @returns {string} Full WhatsApp click-to-chat URL.
 */
const buildWhatsAppUrl = (orderId) => {
  const message = encodeURIComponent(
    `Hi! I have a question about my order ${orderId}.`
  );
  return `https://wa.me/${CONFIG.business.whatsAppNumber}?text=${message}`;
};

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

/**
 * Render the animated stepper for a given order status.
 * Each step shows an icon, label, and visual connector. Completed steps
 * receive a checked state; the current step is highlighted.
 * @param {string} currentStatus - One of: queued | printing | ready | collected.
 * @returns {string} HTML string for the stepper.
 */
const renderStepper = (currentStatus) => {
  const currentIndex = STATUS_STEPS.findIndex((s) => s.key === currentStatus);

  const stepsHtml = STATUS_STEPS.map((step, i) => {
    let stepClass = 'order-step';
    let iconHtml = `<i class="${step.icon}" aria-hidden="true"></i>`;

    if (i < currentIndex) {
      // Completed step — show checkmark.
      stepClass += ' is-completed';
      iconHtml = '<i class="fa-solid fa-check" aria-hidden="true"></i>';
    } else if (i === currentIndex) {
      // Active / current step.
      stepClass += ' is-active';
    }

    const connector =
      i < STATUS_STEPS.length - 1
        ? `<span class="order-step-connector${i < currentIndex ? ' is-filled' : ''}"></span>`
        : '';

    return (
      `<div class="${stepClass}" style="animation-delay: ${i * 120}ms">` +
        `<span class="order-step-icon">${iconHtml}</span>` +
        `<span class="order-step-label">${step.label}</span>` +
      `</div>` +
      connector
    );
  }).join('');

  return `<div class="order-stepper" role="list" aria-label="Order progress">${stepsHtml}</div>`;
};

/**
 * Render a single order result card.
 * @param {typeof MOCK_ORDERS[0]} order - The order data object.
 * @returns {string} HTML string for the card.
 */
const renderOrderCard = (order) => {
  const whatsappUrl = buildWhatsAppUrl(order.id);

  return (
    `<article class="order-card" aria-label="Order ${order.id}">` +

      `<header class="order-card-header">` +
        `<span class="order-id-badge">${order.id}</span>` +
        `<span class="order-date">${order.createdAt}</span>` +
      `</header>` +

      `<div class="order-card-body">` +
        `<h4 class="order-customer">${order.customerName}</h4>` +
        `<p class="order-service">${order.service}</p>` +
        `<p class="order-details">${order.details}</p>` +

        renderStepper(order.status) +

        `<div class="order-meta">` +
          `<div class="order-meta-item">` +
            `<i class="fa-regular fa-clock" aria-hidden="true"></i>` +
            `<span>${order.estimatedPickup}</span>` +
          `</div>` +
          `<div class="order-meta-item order-meta-total">` +
            `<i class="fa-solid fa-indian-rupee-sign" aria-hidden="true"></i>` +
            `<span>${order.total}</span>` +
          `</div>` +
        `</div>` +
      `</div>` +

      `<footer class="order-card-footer">` +
        `<a href="${whatsappUrl}" target="_blank" rel="noopener noreferrer" class="order-whatsapp-cta">` +
          `<i class="fa-brands fa-whatsapp" aria-hidden="true"></i> Questions about this order?` +
        `</a>` +
      `</footer>` +

    `</article>`
  );
};

/**
 * Render the "no results" state with a WhatsApp fallback CTA.
 * @param {string} query - The user's original search query.
 * @returns {string} HTML string for the empty state.
 */
const renderNoResults = (query) => {
  const message = encodeURIComponent(
    `Hi! I'd like to check the status of my order. Reference: ${query}`
  );
  const whatsappUrl = `https://wa.me/${CONFIG.business.whatsAppNumber}?text=${message}`;

  return (
    `<div class="order-no-results" role="status">` +
      `<i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>` +
      `<h4>No order found</h4>` +
      `<p>We couldn't find an order matching "<strong>${query}</strong>".<br>` +
        `Double-check your Order ID or phone number.</p>` +
      `<a href="${whatsappUrl}" target="_blank" rel="noopener noreferrer" class="order-whatsapp-cta">` +
        `<i class="fa-brands fa-whatsapp" aria-hidden="true"></i> Ask us on WhatsApp` +
      `</a>` +
    `</div>`
  );
};

// ---------------------------------------------------------------------------
// initOrderStatus — public entry point called by main.js
// ---------------------------------------------------------------------------

/**
 * Initialise the Order Status portal.
 * Wires form submission, input clearing, and result rendering.
 */
export const initOrderStatus = () => {
  const form = document.getElementById('orderStatusForm');
  const resultContainer = document.getElementById('orderStatusResult');

  if (!form || !resultContainer) {
    return;
  }

  const input = document.getElementById('orderLookupInput');
  if (!input) {
    return;
  }

  /**
   * Handle form submission — look up and render order(s).
   * @param {SubmitEvent} e
   */
  const handleSubmit = (e) => {
    e.preventDefault();

    const raw = input.value.trim();
    if (!raw) {
      resultContainer.innerHTML = '';
      return;
    }

    const matches = findOrders(raw);

    if (matches.length > 0) {
      resultContainer.innerHTML = matches.map(renderOrderCard).join('');
      showEnquiryToast(
        matches.length === 1
          ? 'Order found!'
          : `${matches.length} orders found!`
      );
    } else {
      resultContainer.innerHTML = renderNoResults(raw);
      showEnquiryToast('No matching order found.', { isError: true });
    }
  };

  form.addEventListener('submit', handleSubmit);

  // Clear results when input is emptied.
  input.addEventListener('input', () => {
    if (!input.value.trim()) {
      resultContainer.innerHTML = '';
    }
  });
};
