// js/utils/helpers.js
// Pure utility functions extracted from the monolithic script.
// No DOM side-effects — safe to import anywhere.

import { CONFIG } from '../config.js';

/**
 * Escape HTML special characters in a string to prevent XSS.
 * @param {*} value
 * @returns {string}
 */
export const escapeHtml = (value) => {
  const text = String(value ?? '');
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
};

/**
 * Normalise a string for search comparison.
 * Lowercases, replaces `&` with ` and `, strips non-alphanumeric chars.
 * @param {*} value
 * @returns {string}
 */
export const normalizeText = (value) =>
  String(value ?? '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/**
 * Build a canonical lookup key from a text value.
 * Extends `normalizeText` with additional normalisations
 * (colour→color, printing→print, printout→print).
 * @param {*} value
 * @returns {string}
 */
export const toLookupKey = (value) =>
  normalizeText(value)
    .replace(/\bcolour\b/g, 'color')
    .replace(/\bprinting\b/g, 'print')
    .replace(/\bprintout\b/g, 'print')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Strip all non-digit characters from a phone number string.
 * @param {*} value
 * @returns {string}
 */
export const normalizePhoneNumber = (value) => String(value ?? '').replace(/\D+/g, '');

/**
 * Resolve the business WhatsApp number from the page's own `wa.me` or
 * `api.whatsapp.com/send` links.  Falls back to the CONFIG default.
 * @returns {string}
 */
export const resolveBusinessWhatsAppNumber = () => {
  const defaultNumber = CONFIG.business.whatsAppNumber;
  const whatsappLink = document.querySelector('a[href*="wa.me/"], a[href*="api.whatsapp.com/send"]');
  const href = whatsappLink?.getAttribute('href') || '';

  const waMatch = href.match(/wa\.me\/(\d+)/i);
  if (waMatch?.[1]) {
    return normalizePhoneNumber(waMatch[1]) || defaultNumber;
  }

  try {
    const parsedUrl = new URL(href, window.location.origin);
    const phoneParam = parsedUrl.searchParams.get('phone');
    if (phoneParam) {
      return normalizePhoneNumber(phoneParam) || defaultNumber;
    }
  } catch {
    return defaultNumber;
  }

  return defaultNumber;
};

/**
 * Resolve the business email from the page's own `mailto:` links.
 * Falls back to the CONFIG default.
 * @returns {string}
 */
export const resolveBusinessEmail = () => {
  const defaultEmail = CONFIG.business.email;
  const emailLink = document.querySelector('a[href^="mailto:"]');
  const href = emailLink?.getAttribute('href') || '';

  if (!href) {
    return defaultEmail;
  }

  const emailAddress = href.replace(/^mailto:/i, '').split('?')[0].trim();
  return emailAddress || defaultEmail;
};

/**
 * Build a device-aware WhatsApp URL for a given phone number and message.
 * Uses wa.me on mobile, api.whatsapp.com/send on desktop.
 * @param {string} phoneNumber - Raw or normalized phone number
 * @param {string} message - Message to pre-fill
 * @returns {string}
 */
export const buildWhatsAppUrl = (phoneNumber, message) => {
  const isMobile = /Android|iPhone|iPad|iPod|Windows Phone|webOS|Mobile/i.test(
    navigator.userAgent || ''
  );
  const safePhone = normalizePhoneNumber(phoneNumber);
  const encodedMessage = encodeURIComponent(message || '');

  if (isMobile) {
    return `https://wa.me/${safePhone}?text=${encodedMessage}`;
  }

  return `https://api.whatsapp.com/send?phone=${safePhone}&text=${encodedMessage}`;
};

/**
 * Build a mailto: URL with pre-filled subject and body.
 * @param {string} emailAddress
 * @param {string} subject
 * @param {string} body
 * @returns {string}
 */
export const buildMailtoUrl = (emailAddress, subject, body) => {
  const encodedSubject = encodeURIComponent(subject || '');
  const encodedBody = encodeURIComponent(body || '');
  return `mailto:${emailAddress}?subject=${encodedSubject}&body=${encodedBody}`;
};

/**
 * Open a WhatsApp URL (with a mailto: fallback) as an enquiry channel.
 * On mobile: navigates directly to WhatsApp, then falls back to email after 1.4 s
 * if the app did not open. On desktop: opens WhatsApp in a new popup window,
 * falls back to email navigation if the popup was blocked.
 * @param {string} whatsAppUrl - Pre-built WhatsApp URL
 * @param {string} mailtoUrl   - Pre-built mailto URL (fallback)
 * @returns {boolean} true if WhatsApp was opened, false if only email fallback fired
 */
export const openEnquiryChannel = (whatsAppUrl, mailtoUrl) => {
  const isMobile = /Android|iPhone|iPad|iPod|Windows Phone|webOS|Mobile/i.test(
    navigator.userAgent || ''
  );

  if (isMobile) {
    const currentLocation = window.location.href;
    window.location.assign(whatsAppUrl);

    window.setTimeout(() => {
      if (window.location.href === currentLocation) {
        window.location.assign(mailtoUrl);
      }
    }, 1400);

    return true;
  }

  try {
    const popup = window.open(whatsAppUrl, '_blank', 'noopener,noreferrer');
    if (popup) {
      popup.opener = null;
      return true;
    }
  } catch {
    // Popup blocked — fall through to email.
  }

  window.location.assign(mailtoUrl);
  return false;
};

/**
 * Format a timestamp for WhatsApp messages.
 * @returns {string} e.g. "20 Jun 2026, 3:45 PM"
 */
const formatTimestamp = () => {
  const now = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = now.getDate();
  const month = months[now.getMonth()];
  const year = now.getFullYear();
  const hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;
  return `${day} ${month} ${year}, ${h12}:${minutes} ${ampm}`;
};

/**
 * Build a structured WhatsApp order message for the print-agent pipeline.
 * Human-readable key:value format that is also machine-parseable.
 *
 * @param {Object} opts
 * @param {string} [opts.service]  - Service name (e.g. "Printing", "Xerox")
 * @param {string} [opts.size]     - Paper size (e.g. "A4", "A3")
 * @param {string} [opts.type]     - Color mode (e.g. "B&W", "Color")
 * @param {number|string} [opts.qty] - Quantity / page count
 * @param {string[]} [opts.addons] - Finishing options (e.g. ["Lamination", "Spiral Binding"])
 * @param {string} [opts.total]    - Estimated total (e.g. "Rs 150")
 * @param {string} opts.source     - Where on the site this was sent from
 * @param {string} [opts.orderId]  - Existing order ID (for status checks)
 * @param {string} [opts.notes]    - Free-text notes
 * @returns {string} Formatted plain-text message
 */
export const buildOrderMessage = (opts = {}) => {
  const lines = [];
  const hasDetails = opts.service || opts.orderId;

  lines.push(hasDetails ? '🖨️ New Order — virarprint.in' : '🖨️ New Enquiry — virarprint.in');
  lines.push('━━━━━━━━━━━━━━━━━━');

  if (opts.orderId) {
    lines.push(`Order: ${opts.orderId}`);
  }
  if (opts.service) {
    lines.push(`Service: ${opts.service}`);
  }
  if (opts.size) {
    lines.push(`Size: ${opts.size}`);
  }
  if (opts.type) {
    lines.push(`Type: ${opts.type}`);
  }
  if (opts.qty) {
    lines.push(`Qty: ${opts.qty}`);
  }
  if (opts.addons && opts.addons.length > 0) {
    lines.push(`Add-ons: ${opts.addons.join(', ')}`);
  }
  if (opts.total) {
    lines.push(`Estimated Total: ${opts.total}`);
  }
  if (opts.notes) {
    lines.push(`Notes: ${opts.notes}`);
  }

  if (!hasDetails) {
    lines.push("Hi! I'd like to place an order.");
  }

  lines.push('━━━━━━━━━━━━━━━━━━');
  lines.push(`Source: ${opts.source || 'Website'}`);
  lines.push(`Timestamp: ${formatTimestamp()}`);
  lines.push('');
  lines.push('📎 Please attach your file below this message.');

  return lines.join('\n');
};
