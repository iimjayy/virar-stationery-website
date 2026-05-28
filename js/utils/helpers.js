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
