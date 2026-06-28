// js/core/firebase.js
// Shared, fail-safe Firebase (Firestore) layer.
//
// Design goals:
//  - SINGLE initialization point. getFirestoreContext() is getApps()-guarded,
//    so multiple features (lead capture, order tracking, social-proof pickups)
//    can use Firestore without ever double-initializing the app.
//  - LAZY: the SDK is dynamically imported from gstatic on first use only, so
//    it never weighs down initial page load.
//  - FAIL-SAFE: every helper swallows its own errors. A Firebase outage,
//    missing config, or blocked write can NEVER break the site's primary
//    WhatsApp flow.

import { CONFIG } from '../config.js';

// Keep in lockstep with the version used elsewhere so the browser reuses the
// same cached SDK module (and the same app registry for getApps()).
const FIREBASE_VERSION = '10.12.5';

let _ctxPromise = null;

/** True only when a real Firebase project is configured (not a placeholder). */
export const isFirebaseConfigured = () => {
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

/**
 * Lazily load the Firebase SDK and return a shared context.
 * Reuses an existing app instance if one already exists (getApps guard),
 * so this is safe to call from any number of features.
 * @returns {Promise<{ app: object, db: object, fs: object }>}
 */
export async function getFirestoreContext() {
  if (_ctxPromise) return _ctxPromise;
  _ctxPromise = (async () => {
    const [appMod, fs] = await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-firestore.js`),
    ]);
    const app = appMod.getApps().length
      ? appMod.getApp()
      : appMod.initializeApp(CONFIG.integrations.firebase.config);
    return { app, db: fs.getFirestore(app), fs };
  })();
  return _ctxPromise;
}

const trim = (value, max) => (typeof value === 'string' ? value.slice(0, max) : value);

/**
 * Best-effort lead capture. NEVER throws and NEVER blocks the caller — call it
 * fire-and-forget right before redirecting the customer to WhatsApp.
 * @param {string} type  Lead type, e.g. 'contact' | 'bulk'.
 * @param {Record<string, any>} data  Customer-entered fields.
 * @returns {Promise<void>}
 */
export async function captureLead(type, data = {}) {
  try {
    if (!isFirebaseConfigured()) return;
    const { db, fs } = await getFirestoreContext();

    const clean = {};
    for (const [key, value] of Object.entries(data)) {
      if (value == null || value === '') continue;
      clean[key] = trim(value, 2000);
    }

    await fs.addDoc(fs.collection(db, 'leads'), {
      type: String(type || 'unknown'),
      ...clean,
      source: 'website',
      pageUrl: trim(location.href, 300),
      userAgent: trim(navigator.userAgent, 180),
      createdAt: fs.serverTimestamp(),
    });
  } catch (err) {
    // Swallow — capture is best-effort; WhatsApp is the real delivery channel.
    console.warn('[firebase] captureLead skipped (non-blocking):', err?.message || err);
  }
}

/**
 * Subscribe to a single order document for LIVE status updates (#3).
 * Reads one doc by id only (no listing) so order data can't be enumerated.
 * @param {string} orderId
 * @param {(order: object|null|undefined) => void} onChange
 *        Receives the order object when found, null when no such order,
 *        or undefined on a read error.
 * @returns {Promise<null | (() => void)>} An unsubscribe function, or null if
 *          Firebase is unavailable (caller should fall back).
 */
export async function subscribeToOrder(orderId, onChange) {
  try {
    if (!isFirebaseConfigured() || !orderId) return null;
    const { db, fs } = await getFirestoreContext();
    const ref = fs.doc(db, 'orders', String(orderId));
    return fs.onSnapshot(
      ref,
      (snap) => onChange(snap.exists() ? { id: snap.id, ...snap.data() } : null),
      (err) => {
        console.warn('[firebase] order subscribe error:', err?.message || err);
        onChange(undefined);
      }
    );
  } catch (err) {
    console.warn('[firebase] subscribeToOrder failed:', err?.message || err);
    return null;
  }
}
