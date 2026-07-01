#!/usr/bin/env python3
"""
ga4_pull.py — Weekly GA4 digest puller for "Virar Stationery & Jumbo Xerox".

WHAT THIS DOES
--------------
Pulls the last N days (default 7) of Google Analytics 4 data via the GA4 Data
API (BetaAnalyticsDataClient) and writes two files into scripts/out/:

  * ga4_weekly.csv          — tidy long-format dump of every report (one row per
                              metric value, with a "report" column to tell them
                              apart). Good for spreadsheets / re-analysis.
  * ga4_weekly_digest.md    — a human + AI friendly Markdown digest with headline
                              metrics, conversions by source section, top
                              services, local/geo breakdown, a day-by-day trend,
                              and an "AI ANALYST PROMPT" block you paste (together
                              with the digest) into your AI analyst each week.

The site fires these GA4 events (we only report the business-relevant ones):
  whatsapp_click, call_click, directions_click, gallery_image_open,
  pdf_download, quote_completed, scroll_depth, view_section, select_service,
  site_search, begin_quote, attach_pdf, form_start, form_submit, chat_open,
  engaged_session, lead_score_update.

USAGE
-----
  # 1. Point at your service-account key (see scripts/README-analytics.md):
  export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"

  # 2. Set your NUMERIC GA4 Property ID (Admin -> Property Settings).
  #    NOTE: this is NOT the "G-5VNFP63J2R" measurement id — it is a number
  #    like 123456789.
  export GA4_PROPERTY_ID="123456789"

  # 3. Run it:
  python ga4_pull.py --days 7

  # Optional overrides:
  python ga4_pull.py --days 30 --property 123456789 --out scripts/out

Then paste scripts/out/ga4_weekly_digest.md back to your AI analyst weekly.

WHY A SERVICE ACCOUNT
---------------------
Auth uses Application Default Credentials. The simplest path for an automation
is a service-account JSON key referenced by the GOOGLE_APPLICATION_CREDENTIALS
environment variable. The service account's email must be added as a *Viewer*
on the GA4 property (Admin -> Property Access Management).
"""

from __future__ import annotations

import argparse
import csv
import os
import sys
from datetime import date, datetime, timedelta
from typing import Dict, List, Optional, Sequence

import pandas as pd

# The GA4 Data API client + request/response types.
# (pip install google-analytics-data — see scripts/requirements.txt)
try:
    from google.analytics.data_v1beta import BetaAnalyticsDataClient
    from google.analytics.data_v1beta.types import (
        DateRange,
        Dimension,
        Filter,
        FilterExpression,
        FilterExpressionList,
        Metric,
        OrderBy,
        RunReportRequest,
    )
except ImportError as exc:  # pragma: no cover - import guard for friendlier error
    sys.stderr.write(
        "ERROR: could not import the GA4 Data API client.\n"
        "       Install dependencies first:\n"
        "           pip install -r scripts/requirements.txt\n"
        f"       (underlying import error: {exc})\n"
    )
    raise SystemExit(2)


# --------------------------------------------------------------------------- #
# Configuration: the events we actually care about for this print shop.
# --------------------------------------------------------------------------- #

# The full set of business-relevant events we report on in report (1).
BUSINESS_EVENTS: List[str] = [
    "whatsapp_click",
    "call_click",
    "directions_click",
    "gallery_image_open",
    "pdf_download",
    "quote_completed",
    "scroll_depth",
    "view_section",
    "select_service",
    "site_search",
    "begin_quote",
    "attach_pdf",
    "form_start",
    "form_submit",
    "chat_open",
    "engaged_session",
    "lead_score_update",
]

# The two events that represent a real lead / "conversion" for the owner.
CONVERSION_EVENTS: List[str] = ["whatsapp_click", "call_click"]


# --------------------------------------------------------------------------- #
# Small helpers
# --------------------------------------------------------------------------- #

def _date_range(days: int) -> DateRange:
    """Return a DateRange covering the last `days` days, ending yesterday.

    GA4 "today" is partial/unstable, so we end on yesterday for a clean week.
    """
    end = date.today() - timedelta(days=1)
    start = end - timedelta(days=days - 1)
    return DateRange(start_date=start.isoformat(), end_date=end.isoformat())


def _in_list_filter(field_name: str, values: Sequence[str]) -> FilterExpression:
    """Build an `inListFilter` FilterExpression for a dimension."""
    return FilterExpression(
        filter=Filter(
            field_name=field_name,
            in_list_filter=Filter.InListFilter(values=list(values)),
        )
    )


def _rows_to_records(
    response,
    dimension_names: Sequence[str],
    metric_names: Sequence[str],
) -> List[Dict[str, object]]:
    """Convert a RunReportResponse into a list of plain dicts (wide-ish).

    Handles empty responses gracefully (returns []). Metric values are cast to
    numbers where possible so pandas can aggregate them.
    """
    records: List[Dict[str, object]] = []
    for row in getattr(response, "rows", []) or []:
        record: Dict[str, object] = {}
        for name, dim in zip(dimension_names, row.dimension_values):
            record[name] = dim.value
        for name, met in zip(metric_names, row.metric_values):
            raw = met.value
            try:
                # GA4 returns metric values as strings; cast to int/float.
                num: object = int(raw)
            except (TypeError, ValueError):
                try:
                    num = float(raw)
                except (TypeError, ValueError):
                    num = raw
            record[name] = num
        records.append(record)
    return records


def _df(
    response,
    dimension_names: Sequence[str],
    metric_names: Sequence[str],
) -> pd.DataFrame:
    """Build a DataFrame from a response, with stable columns even when empty."""
    records = _rows_to_records(response, dimension_names, metric_names)
    columns = list(dimension_names) + list(metric_names)
    if not records:
        return pd.DataFrame(columns=columns)
    return pd.DataFrame.from_records(records, columns=columns)


# --------------------------------------------------------------------------- #
# The five reports
# --------------------------------------------------------------------------- #

def report_key_events(client, prop: str, dr: DateRange) -> pd.DataFrame:
    """(1) Key events by eventName — eventCount + totalUsers.

    Filtered to the business-relevant events so noise (page_view, etc.) is out.
    """
    req = RunReportRequest(
        property=f"properties/{prop}",
        date_ranges=[dr],
        dimensions=[Dimension(name="eventName")],
        metrics=[Metric(name="eventCount"), Metric(name="totalUsers")],
        dimension_filter=_in_list_filter("eventName", BUSINESS_EVENTS),
        order_bys=[
            OrderBy(metric=OrderBy.MetricOrderBy(metric_name="eventCount"), desc=True)
        ],
        limit=250,
    )
    resp = client.run_report(req)
    return _df(resp, ["eventName"], ["eventCount", "totalUsers"])


def report_conversions_by_section(client, prop: str, dr: DateRange) -> pd.DataFrame:
    """(2) whatsapp_click / call_click broken down by source_section param."""
    req = RunReportRequest(
        property=f"properties/{prop}",
        date_ranges=[dr],
        dimensions=[
            Dimension(name="eventName"),
            Dimension(name="customEvent:source_section"),
        ],
        metrics=[Metric(name="eventCount"), Metric(name="totalUsers")],
        dimension_filter=_in_list_filter("eventName", CONVERSION_EVENTS),
        order_bys=[
            OrderBy(metric=OrderBy.MetricOrderBy(metric_name="eventCount"), desc=True)
        ],
        limit=250,
    )
    resp = client.run_report(req)
    df = _df(resp, ["eventName", "source_section"], ["eventCount", "totalUsers"])
    # GA4 returns "(not set)" when a param is missing; make it readable.
    if not df.empty:
        df["source_section"] = df["source_section"].replace("(not set)", "(none)")
    return df


def report_top_services(client, prop: str, dr: DateRange) -> pd.DataFrame:
    """(3) Top services by service_name / service_id param.

    These params ride on events like select_service / begin_quote / quote_completed.
    We don't filter by eventName here — any event carrying a service_name counts —
    but we drop rows where neither service param is set.
    """
    req = RunReportRequest(
        property=f"properties/{prop}",
        date_ranges=[dr],
        dimensions=[
            Dimension(name="customEvent:service_name"),
            Dimension(name="customEvent:service_id"),
        ],
        metrics=[Metric(name="eventCount"), Metric(name="totalUsers")],
        order_bys=[
            OrderBy(metric=OrderBy.MetricOrderBy(metric_name="eventCount"), desc=True)
        ],
        limit=100,
    )
    resp = client.run_report(req)
    df = _df(resp, ["service_name", "service_id"], ["eventCount", "totalUsers"])
    if not df.empty:
        # Drop the "(not set)/(not set)" bucket — events with no service attached.
        mask = (df["service_name"] != "(not set)") | (df["service_id"] != "(not set)")
        df = df[mask].reset_index(drop=True)
    return df


def report_traffic_geo(client, prop: str, dr: DateRange) -> pd.DataFrame:
    """(4) Traffic by channel + device + city — supports the LOCAL SEO goal.

    Lets the owner see Virar vs other cities, and which channel/device combos
    bring people in.
    """
    req = RunReportRequest(
        property=f"properties/{prop}",
        date_ranges=[dr],
        dimensions=[
            Dimension(name="sessionDefaultChannelGroup"),
            Dimension(name="deviceCategory"),
            Dimension(name="city"),
        ],
        metrics=[
            Metric(name="sessions"),
            Metric(name="totalUsers"),
            Metric(name="engagedSessions"),
        ],
        order_bys=[
            OrderBy(metric=OrderBy.MetricOrderBy(metric_name="sessions"), desc=True)
        ],
        limit=500,
    )
    resp = client.run_report(req)
    return _df(
        resp,
        ["sessionDefaultChannelGroup", "deviceCategory", "city"],
        ["sessions", "totalUsers", "engagedSessions"],
    )


def report_conversion_trend(client, prop: str, dr: DateRange) -> pd.DataFrame:
    """(5) Day-by-day trend of conversions (whatsapp_click + call_click)."""
    req = RunReportRequest(
        property=f"properties/{prop}",
        date_ranges=[dr],
        dimensions=[Dimension(name="date"), Dimension(name="eventName")],
        metrics=[Metric(name="eventCount")],
        dimension_filter=_in_list_filter("eventName", CONVERSION_EVENTS),
        order_bys=[
            OrderBy(dimension=OrderBy.DimensionOrderBy(dimension_name="date"))
        ],
        limit=1000,
    )
    resp = client.run_report(req)
    df = _df(resp, ["date", "eventName"], ["eventCount"])
    if df.empty:
        return df
    # GA4 "date" comes back as YYYYMMDD; pretty it up and pivot to a day table.
    df["date"] = pd.to_datetime(df["date"], format="%Y%m%d").dt.date.astype(str)
    pivot = (
        df.pivot_table(
            index="date",
            columns="eventName",
            values="eventCount",
            aggfunc="sum",
            fill_value=0,
        )
        .reset_index()
    )
    # Make sure both conversion columns always exist.
    for ev in CONVERSION_EVENTS:
        if ev not in pivot.columns:
            pivot[ev] = 0
    pivot["total_conversions"] = pivot[CONVERSION_EVENTS].sum(axis=1)
    ordered_cols = ["date"] + CONVERSION_EVENTS + ["total_conversions"]
    return pivot[ordered_cols].sort_values("date").reset_index(drop=True)


# --------------------------------------------------------------------------- #
# Output writers
# --------------------------------------------------------------------------- #

def write_tidy_csv(reports: Dict[str, pd.DataFrame], path: str) -> None:
    """Write all reports to a single tidy long-format CSV.

    Each metric value becomes one row:
        report, dim_1..dim_n (as key=value pairs in `dimensions`), metric, value
    This keeps a single flat file that's trivial to filter in a spreadsheet.
    """
    rows: List[Dict[str, object]] = []
    for report_name, df in reports.items():
        if df.empty:
            continue
        # Heuristic: object/string columns are dimensions; numeric are metrics.
        metric_cols = [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c])]
        dim_cols = [c for c in df.columns if c not in metric_cols]
        for _, r in df.iterrows():
            dim_desc = "; ".join(f"{c}={r[c]}" for c in dim_cols) if dim_cols else ""
            for m in metric_cols:
                rows.append(
                    {
                        "report": report_name,
                        "dimensions": dim_desc,
                        "metric": m,
                        "value": r[m],
                    }
                )

    with open(path, "w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(
            fh, fieldnames=["report", "dimensions", "metric", "value"]
        )
        writer.writeheader()
        writer.writerows(rows)


def _md_table(df: pd.DataFrame, max_rows: Optional[int] = None) -> str:
    """Render a DataFrame as a GitHub-flavoured Markdown table.

    Returns an italic placeholder when the frame is empty so the digest never
    has a blank section.
    """
    if df is None or df.empty:
        return "_No data for this period._"
    view = df.head(max_rows) if max_rows else df
    header = "| " + " | ".join(str(c) for c in view.columns) + " |"
    sep = "| " + " | ".join("---" for _ in view.columns) + " |"
    lines = [header, sep]
    for _, r in view.iterrows():
        lines.append("| " + " | ".join(str(r[c]) for c in view.columns) + " |")
    return "\n".join(lines)


def write_digest_md(
    reports: Dict[str, pd.DataFrame],
    path: str,
    *,
    days: int,
    dr: DateRange,
    property_id: str,
) -> None:
    """Write the human + AI friendly Markdown digest."""
    key_events = reports["key_events"]
    conv_section = reports["conversions_by_section"]
    top_services = reports["top_services"]
    geo = reports["traffic_geo"]
    trend = reports["conversion_trend"]

    # ---- Headline numbers (defensive against empty frames) ----
    def _event_count(event: str) -> int:
        if key_events.empty:
            return 0
        hit = key_events.loc[key_events["eventName"] == event, "eventCount"]
        return int(hit.iloc[0]) if not hit.empty else 0

    whatsapp = _event_count("whatsapp_click")
    calls = _event_count("call_click")
    directions = _event_count("directions_click")
    quotes = _event_count("quote_completed")
    pdf_downloads = _event_count("pdf_download")
    total_conversions = whatsapp + calls

    total_sessions = int(geo["sessions"].sum()) if not geo.empty else 0

    # Virar-specific sessions for the local-SEO headline.
    virar_sessions = 0
    if not geo.empty:
        virar_sessions = int(
            geo.loc[geo["city"].str.lower() == "virar", "sessions"].sum()
        )
    virar_pct = (
        f"{(virar_sessions / total_sessions * 100):.0f}%" if total_sessions else "n/a"
    )

    # A compact "top cities" view for the geo section.
    top_cities = pd.DataFrame(columns=["city", "sessions"])
    if not geo.empty:
        top_cities = (
            geo.groupby("city", as_index=False)["sessions"]
            .sum()
            .sort_values("sessions", ascending=False)
            .reset_index(drop=True)
        )

    generated = datetime.now().strftime("%Y-%m-%d %H:%M")

    md = f"""# 📊 GA4 Weekly Digest — Virar Stationery & Jumbo Xerox

**Period:** {dr.start_date} → {dr.end_date} ({days} days)
**GA4 Property:** `{property_id}`
**Generated:** {generated}

---

## 1. Headline metrics

| Metric | Value |
| --- | --- |
| 🟢 WhatsApp clicks (`whatsapp_click`) | **{whatsapp}** |
| 📞 Call clicks (`call_click`) | **{calls}** |
| ✅ Total lead conversions (WhatsApp + Call) | **{total_conversions}** |
| 🗺️ Directions clicks (`directions_click`) | {directions} |
| 🧾 Quotes completed (`quote_completed`) | {quotes} |
| 📄 PDF downloads (`pdf_download`) | {pdf_downloads} |
| 👥 Total sessions | {total_sessions} |
| 📍 Virar sessions (local) | {virar_sessions} ({virar_pct} of total) |

### All key events
{_md_table(key_events)}

---

## 2. Conversions by source section
_Where on the page are WhatsApp / Call clicks coming from? Double down on the winners._

{_md_table(conv_section)}

---

## 3. Top services
_Which services pull the most interest (select_service / begin_quote / quote_completed)._

{_md_table(top_services, max_rows=15)}

---

## 4. Local / geo breakdown
_The whole point: rank #1 in **Virar**. Watch the Virar share and the device split._

**Top cities by sessions:**

{_md_table(top_cities, max_rows=15)}

**Channel × Device × City (top 20 rows):**

{_md_table(geo, max_rows=20)}

---

## 5. Day-by-day conversion trend
_WhatsApp + Call clicks per day — look for the best/worst days._

{_md_table(trend)}

---

## 🤖 AI ANALYST PROMPT

> Copy everything above **and** the instructions below into your AI analyst.

You are a growth analyst for a **local print shop in Virar, India**
("Virar Stationery & Jumbo Xerox"). The business runs a static website; almost
all customers arrive on **mobile via WhatsApp**. The two goals are:
**(1) rank #1 in local search for Virar**, and **(2) grow WhatsApp orders.**

Using the GA4 digest above, do the following:

1. **Lead health.** Total conversions = WhatsApp clicks + Call clicks. Is the
   week up or down vs a normal week? Call out the single biggest lever.
2. **Source sections.** From "Conversions by source section", tell me which
   on-page sections drive the most WhatsApp/Call clicks, and which high-traffic
   sections are *under*-converting and need a stronger call-to-action.
3. **Services.** From "Top services", which services are in demand and which are
   ignored? Suggest one service to promote harder this week.
4. **Local SEO.** From the geo breakdown, what share of sessions is **Virar** vs
   other cities? If non-Virar traffic dominates, flag it — we want *local* intent.
   Note the **device split** (we expect ~95% mobile; anything else is suspicious).
5. **Day trend.** Which days convert best/worst? Recommend when to post on
   WhatsApp/social to match demand.
6. **Action list.** Give me **exactly 3 concrete actions** for next week, ranked
   by expected impact on (a) Virar local ranking and (b) WhatsApp orders. Keep
   each action to one sentence a shopkeeper can act on today.

Be blunt and specific. Use the real numbers from the digest. No fluff.
"""

    with open(path, "w", encoding="utf-8") as fh:
        fh.write(md)


# --------------------------------------------------------------------------- #
# Orchestration
# --------------------------------------------------------------------------- #

def resolve_property(cli_property: Optional[str]) -> str:
    """Resolve the GA4 numeric property id from CLI flag or env, with guidance."""
    prop = cli_property or os.environ.get("GA4_PROPERTY_ID", "").strip()
    if not prop:
        sys.stderr.write(
            "ERROR: GA4 property id not provided.\n"
            "       Set the GA4_PROPERTY_ID environment variable or pass --property.\n"
            "       This is the NUMERIC Property ID (e.g. 123456789), found in\n"
            "       GA4 Admin -> Property Settings — NOT the 'G-5VNFP63J2R'\n"
            "       measurement id.\n"
        )
        raise SystemExit(2)
    if not prop.isdigit():
        sys.stderr.write(
            f"ERROR: GA4_PROPERTY_ID '{prop}' is not numeric.\n"
            "       Use the numeric Property ID from Admin -> Property Settings,\n"
            "       not the 'G-...' measurement id.\n"
        )
        raise SystemExit(2)
    return prop


def check_credentials() -> None:
    """Fail early with a clear message if the service-account key is missing."""
    creds = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "").strip()
    if not creds:
        sys.stderr.write(
            "ERROR: GOOGLE_APPLICATION_CREDENTIALS is not set.\n"
            "       Point it at your service-account JSON key, e.g.:\n"
            '           export GOOGLE_APPLICATION_CREDENTIALS="/path/to/key.json"\n'
            "       See scripts/README-analytics.md for how to create one.\n"
        )
        raise SystemExit(2)
    if not os.path.isfile(creds):
        sys.stderr.write(
            f"ERROR: GOOGLE_APPLICATION_CREDENTIALS points to '{creds}',\n"
            "       but that file does not exist.\n"
        )
        raise SystemExit(2)


def parse_args(argv: Optional[Sequence[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Pull a weekly GA4 digest for Virar Stationery & Jumbo Xerox.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "--days",
        type=int,
        default=7,
        help="Number of days to look back (ending yesterday).",
    )
    parser.add_argument(
        "--property",
        type=str,
        default=None,
        help="Numeric GA4 Property ID (overrides GA4_PROPERTY_ID env var).",
    )
    parser.add_argument(
        "--out",
        type=str,
        default=os.path.join("scripts", "out"),
        help="Output directory for the CSV and Markdown digest.",
    )
    args = parser.parse_args(argv)
    if args.days < 1:
        parser.error("--days must be >= 1")
    return args


def main(argv: Optional[Sequence[str]] = None) -> int:
    args = parse_args(argv)

    # Fail fast on config problems before we touch the network.
    check_credentials()
    prop = resolve_property(args.property)

    out_dir = args.out
    os.makedirs(out_dir, exist_ok=True)

    dr = _date_range(args.days)
    print(f"Pulling GA4 data for property {prop}: {dr.start_date} -> {dr.end_date}")

    # The client picks up GOOGLE_APPLICATION_CREDENTIALS automatically (ADC).
    try:
        client = BetaAnalyticsDataClient()
    except Exception as exc:  # pragma: no cover - surfaced as a clean message
        sys.stderr.write(f"ERROR: failed to create GA4 client: {exc}\n")
        return 2

    # Run all five reports. Wrap in a single try so an API/permission error is
    # reported clearly rather than as a raw traceback.
    try:
        reports: Dict[str, pd.DataFrame] = {
            "key_events": report_key_events(client, prop, dr),
            "conversions_by_section": report_conversions_by_section(client, prop, dr),
            "top_services": report_top_services(client, prop, dr),
            "traffic_geo": report_traffic_geo(client, prop, dr),
            "conversion_trend": report_conversion_trend(client, prop, dr),
        }
    except Exception as exc:  # pragma: no cover
        sys.stderr.write(
            "ERROR: a GA4 report call failed.\n"
            f"       {type(exc).__name__}: {exc}\n"
            "       Common causes: the service account is not added as a Viewer on\n"
            "       the property, the wrong (non-numeric) property id, or the\n"
            "       Google Analytics Data API is not enabled. See README-analytics.md.\n"
        )
        return 1

    csv_path = os.path.join(out_dir, "ga4_weekly.csv")
    md_path = os.path.join(out_dir, "ga4_weekly_digest.md")

    write_tidy_csv(reports, csv_path)
    write_digest_md(
        reports, md_path, days=args.days, dr=dr, property_id=prop
    )

    # A short console summary so a cron/Actions log is useful at a glance.
    rows_total = sum(len(df) for df in reports.values())
    print(f"Wrote {csv_path}")
    print(f"Wrote {md_path}")
    print(f"Done. {len(reports)} reports, {rows_total} data rows total.")
    if rows_total == 0:
        print(
            "WARNING: every report came back empty. Check the date range, that the\n"
            "         events are firing, and that the property id is correct."
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
