// js/core/toast.js
// Global toast notification system.
// Encapsulates the enquiryToast element and its timeout state
// so nothing leaks into the global scope.

/** @type {HTMLElement|null} */
let enquiryToast = null;

/** @type {number|null} */
let enquiryToastTimeoutId = null;

/**
 * Lazily create (or retrieve) the toast element and append it to the body.
 * @returns {HTMLElement}
 */
export const ensureEnquiryToast = () => {
  let toast = document.getElementById('enquiryToast');
  if (toast) {
    enquiryToast = toast;
    return toast;
  }

  toast = document.createElement('div');
  toast.id = 'enquiryToast';
  toast.className = 'enquiry-toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.setAttribute('aria-atomic', 'true');
  document.body.appendChild(toast);
  enquiryToast = toast;
  return toast;
};

/**
 * Show a toast notification with the given message.
 * Supports error styling and custom duration.
 * @param {string} message
 * @param {{ isError?: boolean, duration?: number }} options
 */
export const showEnquiryToast = (message, options = {}) => {
  if (!enquiryToast) {
    ensureEnquiryToast();
  }

  const {
    isError = false,
    duration = 1900
  } = options;

  enquiryToast.textContent = message;
  enquiryToast.classList.toggle('is-error', isError);
  enquiryToast.classList.add('is-visible');

  if (enquiryToastTimeoutId) {
    window.clearTimeout(enquiryToastTimeoutId);
  }

  enquiryToastTimeoutId = window.setTimeout(() => {
    enquiryToast.classList.remove('is-visible');
  }, duration);
};
