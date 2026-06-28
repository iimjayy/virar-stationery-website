# Firebase setup — order capture & live tracking

The website code is wired to Firebase (project **virarprint001**). To make it
actually store data, do these one-time steps in the Firebase / Google Cloud
console. Until then the site keeps working normally — capture just no-ops and
the WhatsApp flow is unaffected.

## 1. Enable Cloud Firestore
Firebase Console → **Build → Firestore Database → Create database** →
*Start in production mode* → pick a region (e.g. `asia-south1` / Mumbai).

## 2. Publish the security rules
Firestore → **Rules** tab → replace everything with the contents of
[`firestore.rules`](../firestore.rules) → **Publish**.

These rules are deliberately strict:
- **`leads`** (contact + bulk submissions): the website can only *create*
  records, never read/list/update/delete. Your customer data is therefore
  **write-only from the web and cannot leak**. You read leads in the console.
- **`orders`**: a customer can read a single order by its (unguessable) ID for
  live tracking, but cannot list all orders. Only you write/update them.
- **`pickups`**: read-only public "social proof" entries you curate.

## 3. (Recommended) Lock the API key
The web `apiKey` is public by design, but you should still restrict it:
Google Cloud Console → **APIs & Services → Credentials** → your *Browser key* →
**Application restrictions → HTTP referrers** → add `virarprint.in/*` and
`*.virarprint.in/*`.

## 4. (Recommended) Turn on App Check (anti-spam)
To stop bots writing junk leads: Firebase Console → **App Check** → register
the web app with **reCAPTCHA v3**, then enable enforcement for Firestore.
(Code hook can be added later; not required for launch.)

---

## How the data flows
- **Contact form** → writes a `leads` doc `{ type: "contact", name, phone,
  service, message, source, createdAt, ... }` then opens WhatsApp.
- **Bulk form** → writes a `leads` doc `{ type: "bulk", name, business, phone,
  email, service, quantity, description, ... }` then opens WhatsApp.
- Capture is **fire-and-forget**: if Firestore is down or rules block it, the
  WhatsApp redirect still happens. You never lose a customer to a backend error.

## Live order tracking (`orders`)
To let a customer track an order in real time:
1. In the console, add a doc to **`orders`** with an ID = the order code you
   give the customer (keep it unguessable, e.g. `VS-7QF3KD`).
2. Fields the UI renders: `customerName`, `service`, `details`, `status`
   (`queued` | `printing` | `ready` | `collected`), `createdAt`,
   `estimatedPickup`, `total`.
3. When you change `status` in the console, the customer's open tracking page
   updates **instantly** (via `onSnapshot`). No refresh needed.

## Verifying it works
Submit the contact form on the live site, then check **Firestore → Data →
`leads`** for a new document. If nothing appears, open the browser console:
a `[firebase] captureLead skipped` warning tells you why (usually: Firestore
not enabled yet, or rules not published).
