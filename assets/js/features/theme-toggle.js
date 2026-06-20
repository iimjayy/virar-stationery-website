// js/features/theme-toggle.js
// Self-contained Dark Mode toggle feature module.
// Owns system-aware theme detection, manual override, localStorage persistence,
// meta theme-color sync, icon swap, toast feedback, and custom event dispatch.
// Dependencies: showEnquiryToast (toast.js)

import { showEnquiryToast } from '../core/toast.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** @type {string} localStorage key for persisted theme preference */
const STORAGE_KEY = 'virar-theme';

/** @type {string} Light mode meta theme-color */
const META_COLOR_LIGHT = '#0b2a5b';

/** @type {string} Dark mode meta theme-color */
const META_COLOR_DARK = '#0f1419';

/** @type {MediaQueryList} System prefers-color-scheme media query */
const DARK_MQ = window.matchMedia('(prefers-color-scheme: dark)');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Apply the given theme to the document and update all visual indicators.
 * Sets `data-theme` on `<html>`, swaps the toggle button icon,
 * updates `<meta name="theme-color">`, and dispatches a custom event.
 *
 * @param {'light'|'dark'} theme  — the theme to apply
 * @param {HTMLElement}     btn   — the toggle button element
 */
const applyTheme = (theme, btn) => {
  document.documentElement.setAttribute('data-theme', theme);

  // The icon is now a universal hybrid sun/moon SVG, so we no longer
  // need to toggle FontAwesome classes here. The icon remains static.

  // Sync <meta name="theme-color">
  updateMetaThemeColor(theme);

  // Notify other modules
  window.dispatchEvent(
    new CustomEvent('theme:change', { detail: { theme } })
  );
};

/**
 * Update the `<meta name="theme-color">` element's `content` attribute.
 * Creates the meta tag if it doesn't already exist in the document head.
 *
 * @param {'light'|'dark'} theme — the active theme
 */
const updateMetaThemeColor = (theme) => {
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }
  meta.content = theme === 'dark' ? META_COLOR_DARK : META_COLOR_LIGHT;
};

/**
 * Determine the initial theme from localStorage or system preference.
 * Priority: localStorage → system preference → 'light' fallback.
 *
 * @returns {'light'|'dark'} the resolved theme
 */
const resolveInitialTheme = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') {
    return stored;
  }
  // User reported the homepage "gone black" on load (OS auto dark mode).
  // Default to light mode always to ensure brand consistency unless toggled manually.
  return 'light'; // Was: return DARK_MQ.matches ? 'dark' : 'light';
};

// ---------------------------------------------------------------------------
// initThemeToggle — public entry point called by main.js
// ---------------------------------------------------------------------------

/**
 * Initialise the dark-mode toggle feature.
 * Resolves the initial theme, applies it, wires up the toggle button,
 * and listens for system-level colour-scheme changes.
 *
 * @returns {void}
 */
export const initThemeToggle = () => {
  const btn = document.getElementById('themeToggleBtn');
  if (!btn) {
    return;
  }

  // --- Resolve & apply initial theme ----------------------------------------
  const initialTheme = resolveInitialTheme();
  applyTheme(initialTheme, btn);

  // --- Toggle click handler -------------------------------------------------

  /**
   * Handle click on the theme toggle button.
   * Swaps theme, persists choice, applies visuals, and shows a toast.
   */
  btn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';

    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next, btn);

    showEnquiryToast(
      next === 'dark' ? 'Dark mode enabled' : 'Light mode enabled',
      { duration: 1800 }
    );
  });

  // --- System preference listener -------------------------------------------
  // Only follow OS-level changes when the user hasn't manually set a preference.

  /**
   * React to OS-level prefers-color-scheme changes.
   * Ignored when the user has an explicit localStorage override.
   *
   * @param {MediaQueryListEvent} e — the change event
   */
  DARK_MQ.addEventListener('change', (e) => {
    // Disabled OS-level auto-toggling to prevent the site from "going black" unexpectedly.
    /*
    const hasManualPref = localStorage.getItem(STORAGE_KEY) !== null;
    if (hasManualPref) {
      return;
    }

    const systemTheme = e.matches ? 'dark' : 'light';
    applyTheme(systemTheme, btn);
    */
  });
};
