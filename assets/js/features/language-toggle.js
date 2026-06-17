/**
 * @fileoverview Language toggle module for Virar Stationery website.
 * Cycles through English → Marathi → Hindi and persists the choice.
 */

import { translations } from '../data/translations.js';
import { showEnquiryToast } from '../core/toast.js';

/** @constant {string} Storage key for persisted language preference. */
const STORAGE_KEY = 'virar-lang';

/** @constant {string[]} Ordered list of supported language codes. */
const LANG_CYCLE = ['en', 'mr', 'hi'];

/**
 * Human-readable labels shown in toast notifications when the language changes.
 * @constant {Object<string, string>}
 */
const LANG_TOAST_LABELS = {
  en: 'Language: English',
  mr: 'भाषा: मराठी',
  hi: 'भाषा: हिंदी',
};

/**
 * Short uppercase labels rendered inside the toggle button.
 * @constant {Object<string, string>}
 */
const LANG_BUTTON_LABELS = {
  en: 'EN',
  mr: 'MR',
  hi: 'HI',
};

/**
 * Reads the persisted language preference from localStorage.
 * Falls back to `'en'` when no preference is stored or the stored value is invalid.
 *
 * @returns {string} A valid language code ('en' | 'mr' | 'hi').
 */
function getSavedLanguage() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return LANG_CYCLE.includes(saved) ? saved : 'en';
}

/**
 * Persists the chosen language code to localStorage.
 *
 * @param {string} lang - The language code to save ('en' | 'mr' | 'hi').
 */
function saveLanguage(lang) {
  localStorage.setItem(STORAGE_KEY, lang);
}

/**
 * Returns the next language in the en → mr → hi → en cycle.
 *
 * @param {string} currentLang - The current language code.
 * @returns {string} The next language code in the cycle.
 */
function getNextLanguage(currentLang) {
  const currentIndex = LANG_CYCLE.indexOf(currentLang);
  return LANG_CYCLE[(currentIndex + 1) % LANG_CYCLE.length];
}

/**
 * Applies translations for the given language to every element that carries
 * a `data-i18n` attribute.
 *
 * For each matching element the function:
 * 1. Looks up `translations[lang][key]`.
 * 2. If a translation exists it replaces `element.textContent`.
 * 3. If no translation is found the existing text is left unchanged.
 *
 * Additionally updates:
 * - `<html lang="…">` to reflect the active language.
 * - The toggle button label to show the current language code.
 *
 * @param {string} lang - Target language code ('en' | 'mr' | 'hi').
 * @param {HTMLElement|null} toggleBtn - Reference to the toggle button element (may be null).
 */
function applyLanguage(lang, toggleBtn) {
  const langData = translations[lang];
  if (!langData) return;

  // Translate all [data-i18n] elements
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach((element) => {
    const key = element.dataset.i18n;
    if (langData[key] !== undefined) {
      // Handle placeholder attributes for inputs
      if (
        element.tagName === 'INPUT' ||
        element.tagName === 'TEXTAREA' ||
        element.tagName === 'SELECT'
      ) {
        element.placeholder = langData[key];
      } else {
        element.textContent = langData[key];
      }
    }
  });

  // Update <html lang>
  document.documentElement.lang = lang;

  // Update toggle button label
  if (toggleBtn) {
    toggleBtn.textContent = LANG_BUTTON_LABELS[lang] || lang.toUpperCase();
  }
}

/**
 * Initialises the language toggle feature.
 *
 * 1. Locates the toggle button (`#langToggle`) in the DOM.
 * 2. Reads the persisted language from localStorage (defaults to `'en'`).
 * 3. Applies the initial language immediately.
 * 4. Attaches a click handler that cycles through en → mr → hi → en,
 *    persists the choice, applies translations, and shows a toast notification.
 *
 * Safe to call before or after the toggle button exists in the DOM — if the
 * button is missing the function returns silently after applying the saved
 * language (so `[data-i18n]` elements still get translated).
 */
export const initLanguageToggle = () => {
  const toggleBtn = document.getElementById('langToggle');
  let currentLang = getSavedLanguage();

  // Apply saved / default language on load
  applyLanguage(currentLang, toggleBtn);

  if (!toggleBtn) {
    // No toggle button in the DOM — translations are still applied above.
    return;
  }

  toggleBtn.addEventListener('click', () => {
    currentLang = getNextLanguage(currentLang);

    // Persist & apply
    saveLanguage(currentLang);
    applyLanguage(currentLang, toggleBtn);

    // Notify user via toast
    const toastMessage = LANG_TOAST_LABELS[currentLang] || `Language: ${currentLang}`;
    showEnquiryToast(toastMessage);
  });
};
