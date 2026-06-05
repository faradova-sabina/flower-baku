# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**DreamBouquet** — a Flask-based flower marketplace website for Baku, Azerbaijan. It aggregates bouquet offers from buket.az via scraping, supports trilingual UI (Russian/English/Azerbaijani), and lets customers place and pay for orders.

## Commands

```bash
# Install dependencies
pip install -r requirements.txt

# Run dev server (port 5000)
python app.py

# Run in production
gunicorn app:app

# Scrape buket.az once (populates data/az_offers.json)
python scraper_az.py --once

# Run scraper in loop (every 5 minutes)
python scraper_az.py

# Import local offers from local_sources/ (JSON or CSV)
python importer.py
```

No test suite currently exists.

## Architecture

### Data flow
1. `scraper_az.py` fetches bouquets from buket.az → writes `data/az_offers.json`
2. `importer.py` merges local JSON/CSV files from `local_sources/` → writes `data/local_offers.json`
3. `offers.py` provides `load_offers()`, `analyze_offers()`, `find_offer()` — simple JSON-backed reads
4. `app.py` loads `data/az_offers.json` on every request, filters it, and renders templates

### Offer schema (az_offers.json)
Each offer has: `id` (md5-based), `title`, `price` (AZN), `photo` (URL), `composition` (list of flower names), `occasion` (list), `for_whom` (list), `age_range` (list), `colors` (list), `shop`, `scraped_at` (present on scraped offers, absent on curated ones).

**Important filtering rules in `app.py`:**
- `is_flower_offer()` — keyword-checks title/description/composition against `FLOWER_KEYWORDS`
- `has_real_photo()` — rejects stock photo domains (pexels, unsplash, etc.)
- Both filters are applied on every page load before rendering

### Recommendation engine (`/recommend` POST)
Accepts JSON `{occasion, for_whom, age_range, budget, flowers, color}`. Scores each offer (weighted: occasion=40, for_whom=25, price_fit=20+10, age=15, color=10) and returns top 3 as JSON. Called by the quiz widget in the frontend.

### Multilingual support
`translations.py` holds a `TRANSLATIONS` dict with keys `ru`, `en`, `az`. The active language is stored in Flask session. `get_t(lang)` returns the dict for the current language. All UI strings live here — add new keys to all three languages simultaneously.

### Orders
Orders are written to `data/orders/<uuid>.json`. The sandbox payment endpoint `/pay_sandbox` (POST, JSON `{order_id}`) marks an order as paid and appends to `data/notifications.log`. Real SMTP email is sent if `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `NOTIFY_EMAIL` env vars are set.

### Templates
`templates/base.html` defines the shared layout (nav, footer, CSS/JS imports). Other templates extend it. `templates/builder.html` is the custom bouquet builder (CSS 3D canvas + drag-to-rotate, WhatsApp order CTA).

### Environment variables
| Var | Purpose |
|-----|---------|
| `SECRET_KEY` | Flask session secret (defaults to insecure dev value) |
| `SMTP_HOST` / `SMTP_PORT` | Email notifications |
| `SMTP_USER` / `SMTP_PASS` | SMTP auth |
| `NOTIFY_EMAIL` | Recipient for order-paid emails |
