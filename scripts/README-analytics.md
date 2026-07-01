# Weekly GA4 Digest — Setup Guide

This folder contains a small Python script (`ga4_pull.py`) that pulls the last
7 days of Google Analytics 4 (GA4) data for **Virar Stationery & Jumbo Xerox**
and produces a clean weekly digest you can **paste back to your AI analyst**.

You do this **once a week** (about 1 minute once it's set up). The one-time
setup below takes ~15 minutes.

> **Heads up on IDs.** Your GA4 *measurement id* is `G-5VNFP63J2R`. That is **NOT**
> what this script needs. This script needs the **numeric Property ID** (a number
> like `123456789`). Where to find it is in Step 6.

---

## What you get

Running the script creates two files in `scripts/out/`:

- **`ga4_weekly_digest.md`** — the human-readable weekly report. **This is the
  file you paste to your AI analyst each week.** It ends with a ready-made
  "AI ANALYST PROMPT" so the AI knows exactly how to analyze it.
- **`ga4_weekly.csv`** — the raw numbers in a tidy spreadsheet format, if you
  ever want to dig in yourself.

---

## One-time setup

### Step 1 — Create a Google Cloud project
1. Go to <https://console.cloud.google.com/>.
2. Click the project dropdown (top bar) → **New Project**.
3. Name it e.g. `virar-stationery-analytics` → **Create**.
4. Make sure the new project is selected (project dropdown shows its name).

### Step 2 — Enable the "Google Analytics Data API"
1. In the search bar at the top, type **Google Analytics Data API**.
2. Open it → click **Enable**.
   (This is the API that lets the script read your GA4 data.)

### Step 3 — Create a service account
1. Left menu → **APIs & Services → Credentials**.
2. Click **+ Create Credentials → Service account**.
3. Name it e.g. `ga4-digest-reader` → **Create and continue**.
4. You can skip the optional "grant access" steps → **Done**.

### Step 4 — Download the JSON key
1. On the **Credentials** page, click your new service account.
2. Go to the **Keys** tab → **Add key → Create new key**.
3. Choose **JSON** → **Create**. A `.json` file downloads to your computer.
4. Keep this file safe — it is a password. Note its full path, e.g.
   `/Users/you/keys/ga4-digest-reader.json`.
5. Also copy the service account's **email** (looks like
   `ga4-digest-reader@your-project.iam.gserviceaccount.com`). You need it next.

### Step 5 — Give the service account access to GA4 (Viewer)
1. Open **Google Analytics** → **Admin** (gear icon, bottom-left).
2. In the **Property** column → **Property Access Management**.
3. Click **+** (top right) → **Add users**.
4. Paste the service account **email** from Step 4.
5. Set the role to **Viewer** → **Add**.
   *(Viewer is read-only — the script can never change your analytics.)*

### Step 6 — Find your numeric Property ID
1. Still in **Admin** → in the **Property** column → **Property Settings**.
2. Near the top you'll see **PROPERTY ID** — a number like `123456789`.
3. Copy that number. (Again: this is the numeric Property ID, **not** the
   `G-5VNFP63J2R` measurement id.)

---

## Install & run

### Step 7 — Install Python dependencies
From the repo root, in a terminal:

```bash
pip install -r scripts/requirements.txt
```

### Step 8 — Set your two environment variables
```bash
# Path to the JSON key you downloaded in Step 4:
export GOOGLE_APPLICATION_CREDENTIALS="/full/path/to/ga4-digest-reader.json"

# The numeric Property ID from Step 6:
export GA4_PROPERTY_ID="123456789"
```

(On Windows PowerShell use `setx` or `$env:GOOGLE_APPLICATION_CREDENTIALS="..."`.)

### Step 9 — Run it
```bash
python scripts/ga4_pull.py --days 7
```

You'll see it write two files:

```
Wrote scripts/out/ga4_weekly.csv
Wrote scripts/out/ga4_weekly_digest.md
```

---

## Every week (the 1-minute habit)

1. Run `python scripts/ga4_pull.py --days 7`.
2. Open **`scripts/out/ga4_weekly_digest.md`**.
3. **Paste the whole file back to your AI analyst weekly.** The built-in
   "AI ANALYST PROMPT" at the bottom tells the AI exactly how to analyze it for
   ranking #1 in Virar and growing WhatsApp orders.

---

## Options

```bash
python scripts/ga4_pull.py --days 30          # look back 30 days instead of 7
python scripts/ga4_pull.py --property 123456789   # override the env var
python scripts/ga4_pull.py --out reports/ga4      # write somewhere else
```

---

## Troubleshooting

| Message | Fix |
| --- | --- |
| `GOOGLE_APPLICATION_CREDENTIALS is not set` | Re-run the `export` from Step 8. |
| `... is not numeric` | You used the `G-...` id. Use the **numeric** Property ID (Step 6). |
| `a GA4 report call failed` / `PermissionDenied` | The service account isn't a **Viewer** on the property (Step 5), or the **Data API** isn't enabled (Step 2). |
| `every report came back empty` | Check the property id, widen `--days`, and confirm the events are actually firing. |

---

## Optional: run it automatically every Monday

There is a GitHub Actions workflow at `.github/workflows/ga4-digest.yml` that can
run this for you weekly and attach the digest as a downloadable artifact. To turn
it on, add two repository secrets (see that file's comments):

- **`GA4_SA_KEY`** — the *contents* of your service-account JSON key (Step 4).
- **`GA4_PROPERTY_ID`** — your numeric Property ID (Step 6).

Until both secrets exist, the workflow safely skips itself.
