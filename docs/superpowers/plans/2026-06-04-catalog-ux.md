# DreamBouquet — Catalog & UX (Sub-project A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add new product categories (sweets/food/alcohol) with real scraped data, apply 10% price markup, calculate delivery by distance via Google Maps, replace occasion tabs with Airbnb-style cards, and hide shop sources from all UI.

**Architecture:** Backend changes (scraper, app.py, translations) first, then CSS/templates. Each task is independently testable. Prices stay raw in JSON; `markup_price()` applies only at render time. Delivery cost is calculated server-side on demand via `/calculate_delivery`.

**Tech Stack:** Python 3 / Flask, BeautifulSoup4, requests, Google Maps Distance Matrix API, Vanilla JS, Jinja2

---

## File Map

| File | Changes |
|------|---------|
| `scraper_az.py` | Add `classify_type()`, new SCRAPE_PAGES, `type` field in `enrich_offer()` |
| `app.py` | `is_valid_offer()`, `markup_price()`, `SHOP_COORDS`, `/calculate_delivery`, apply markup everywhere |
| `translations.py` | New keys: `cat_sweets`, `cat_food`, `cat_alcohol`, `delivery_distance`, `delivery_cost`, `delivery_total`, `order_total` |
| `static/css/style.css` | Replace `.occasion-tabs` with `.occasion-cards`/`.occasion-card`; add category section styles |
| `templates/index.html` | Replace occasion-tabs HTML; add 3 new category sections; show marked-up prices |
| `templates/order.html` | Remove shop display; show marked-up price; add delivery address + live cost calculation |
| `templates/confirmation.html` | Remove shop display; show bouquet + delivery totals |
| `static/js/main.js` | Update occasion filter to use new cards; add delivery cost fetch |
| `.env.example` | New file with `GOOGLE_MAPS_API_KEY=` |

---

## Task 1: Environment & test setup

**Files:**
- Create: `.env.example`
- Create: `tests/__init__.py`
- Create: `tests/test_app_logic.py`

- [ ] **Step 1: Create .env.example**

```
GOOGLE_MAPS_API_KEY=your_key_here
SECRET_KEY=dev-secret-change-in-prod
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
NOTIFY_EMAIL=
```

- [ ] **Step 2: Create tests directory**

```bash
mkdir -p /mnt/c/ai/my-ai-assistant/website/tests
touch /mnt/c/ai/my-ai-assistant/website/tests/__init__.py
```

- [ ] **Step 3: Install pytest**

```bash
cd /mnt/c/ai/my-ai-assistant/website && pip install pytest
```

- [ ] **Step 4: Create test file with failing tests for markup_price and classify_type**

Create `tests/test_app_logic.py`:

```python
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

def test_markup_price_rounds_up():
    from app import markup_price
    assert markup_price(100) == 110
    assert markup_price(55) == 61   # round(55*1.1) = round(60.5) = 60 in Python banker's rounding → use math approach
    assert markup_price(0) == 0

def test_markup_price_integer_result():
    from app import markup_price
    result = markup_price(73)
    assert isinstance(result, int)

def test_classify_type_flowers():
    from scraper_az import classify_type
    assert classify_type("Букет из роз", ["роза", "гипсофила"]) == "flowers"

def test_classify_type_sweets():
    from scraper_az import classify_type
    assert classify_type("Зефирный букет", ["зефир", "маршмеллоу"]) == "sweets"

def test_classify_type_food():
    from scraper_az import classify_type
    assert classify_type("Фруктовый букет", ["клубника", "виноград"]) == "food"

def test_classify_type_alcohol():
    from scraper_az import classify_type
    assert classify_type("Букет для него", ["виски", "конфеты"]) == "alcohol"
```

- [ ] **Step 5: Run tests — expect ImportError (functions not yet defined)**

```bash
cd /mnt/c/ai/my-ai-assistant/website && python -m pytest tests/test_app_logic.py -v 2>&1 | head -30
```

Expected: `ImportError: cannot import name 'markup_price'`

- [ ] **Step 6: Commit**

```bash
git add .env.example tests/ && git commit -m "chore: test setup and .env.example"
```

---

## Task 2: Extend scraper_az.py

**Files:**
- Modify: `scraper_az.py`

- [ ] **Step 1: Add `classify_type` function after the existing `COLOR_MAP` dict (around line 82)**

Find the block ending with `}` after `COLOR_MAP` and insert after it:

```python
TYPE_KEYWORDS = {
    "sweets": ["зефир", "маршмеллоу", "сладкий", "конфеты", "шоколад",
               "marshmallow", "candy", "sweet", "chocolate", "зефирный"],
    "food":   ["фрукт", "клубника", "ягода", "fruit", "strawberry",
               "фруктовый", "ягодный", "berry", "exotic fruit"],
    "alcohol":["виски", "вино", "коньяк", "пиво", "шампанское", "для него",
               "whiskey", "wine", "beer", "cognac", "champagne", "alcohol"],
}

def classify_type(title: str, composition: list) -> str:
    text = (title + " " + " ".join(composition)).lower()
    for type_key, keywords in TYPE_KEYWORDS.items():
        if any(kw in text for kw in keywords):
            return type_key
    return "flowers"
```

- [ ] **Step 2: Add new URLs to SCRAPE_PAGES**

Replace the existing `SCRAPE_PAGES` list with:

```python
SCRAPE_PAGES = [
    "https://buket.az/en/bouquets-order",
    "https://buket.az/en/bouquets-tulips-order",
    "https://buket.az/en/cheap-flowers",
    "https://buket.az/en/101-roses-baku-azerbaijan",
    "https://buket.az/en",
    # Sweet bouquets
    "https://buket.az/en/sweet-bouquet",
    "https://buket.az/en/zefir-buket",
    # Food / fruit bouquets
    "https://buket.az/en/fruit-bouquet",
    # Alcohol bouquets for men
    "https://buket.az/en/bouquet-for-men",
    "https://buket.az/en/alcohol-bouquet",
]
```

- [ ] **Step 3: Add `type` field to `enrich_offer()`**

In `enrich_offer()`, after the line `description = generate_description(composition)`, add:

```python
    offer_type = classify_type(title, composition)
```

Then in the returned dict, add `"type": offer_type,` after `"id": make_offer_id(title, price),`.

- [ ] **Step 4: Run tests — classify_type tests should pass now**

```bash
cd /mnt/c/ai/my-ai-assistant/website && python -m pytest tests/test_app_logic.py::test_classify_type_flowers tests/test_app_logic.py::test_classify_type_sweets tests/test_app_logic.py::test_classify_type_food tests/test_app_logic.py::test_classify_type_alcohol -v
```

Expected: 4 PASSED

- [ ] **Step 5: Verify scraper runs without errors (one-shot)**

```bash
cd /mnt/c/ai/my-ai-assistant/website && python scraper_az.py --once 2>&1 | tail -5
```

Expected: `Done. Added N new offers.` (N can be 0 if pages 404 — that's OK)

- [ ] **Step 6: Commit**

```bash
git add scraper_az.py && git commit -m "feat: add classify_type and new category URLs to scraper"
```

---

## Task 3: Update app.py — markup, delivery, valid offer filter

**Files:**
- Modify: `app.py`

- [ ] **Step 1: Add `import math` and `markup_price` after imports section**

Add `import math` to the imports at top of `app.py`, then add this function after `has_real_photo()`:

```python
def markup_price(price):
    return int(math.ceil(price * 1.1))
```

- [ ] **Step 2: Rename `is_flower_offer` to `is_valid_offer`**

Replace:
```python
def is_flower_offer(offer):
    text = ' '.join([
        offer.get('title', ''),
        offer.get('description', ''),
        offer.get('category', ''),
        ' '.join(offer.get('composition', [])),
    ]).lower()
    return any(kw in text for kw in FLOWER_KEYWORDS)
```

With:
```python
def is_valid_offer(offer):
    if offer.get('type') in ('sweets', 'food', 'alcohol'):
        return True
    text = ' '.join([
        offer.get('title', ''),
        offer.get('description', ''),
        offer.get('category', ''),
        ' '.join(offer.get('composition', [])),
    ]).lower()
    return any(kw in text for kw in FLOWER_KEYWORDS)
```

- [ ] **Step 3: Replace all 3 occurrences of `is_flower_offer` with `is_valid_offer` in app.py**

```bash
grep -n "is_flower_offer" /mnt/c/ai/my-ai-assistant/website/app.py
```

Replace each occurrence: in `index()`, `recommend()`, and `order()`.

- [ ] **Step 4: Add `SHOP_COORDS` dict after `BASE_DIR` declaration**

```python
SHOP_COORDS = {
    "Buket.az":  (40.3777, 49.8920),
    "Flora.az":  (40.3808, 49.8513),
    "Gul.az":    (40.3753, 49.8345),
    "default":   (40.4093, 49.8671),  # Baku city centre fallback
}
```

- [ ] **Step 5: Apply `markup_price()` in `index()` route**

In `index()`, replace the list comprehension that builds `filtered` to apply markup. After building `filtered`, add:

```python
    for o in filtered:
        o['display_price'] = markup_price(o['price'])
    for o in fresh:
        o['display_price'] = markup_price(o['price'])
```

- [ ] **Step 6: Apply `markup_price()` in `recommend()` route**

In the `jsonify` return of `recommend()`, change `"price": o["price"]` to:

```python
"price": markup_price(o["price"]),
```

- [ ] **Step 7: Apply `markup_price()` in `order()` route**

In `order()`, after `offer = find_offer(fresh, offer_id)`, add:

```python
    offer['display_price'] = markup_price(offer['price'])
```

Also in the POST branch, when building `order_data`, change:
```python
            "offer": offer,
```
to also include the display price by setting it before:
```python
            offer['display_price'] = markup_price(offer['price'])
            "offer": offer,
```

- [ ] **Step 8: Add `/calculate_delivery` route**

Add this route after `pay_sandbox`:

```python
@app.route('/calculate_delivery', methods=['POST'])
def calculate_delivery():
    import math
    data = request.get_json(force=True)
    offer_id      = data.get('offer_id', '')
    delivery_addr = data.get('delivery_address', '').strip()

    if not delivery_addr:
        return jsonify(error='no_address'), 400

    raw   = load_offers(DATA_FILE)
    offer = find_offer(raw, offer_id)
    if not offer:
        return jsonify(error='offer_not_found'), 404

    shop       = offer.get('shop', 'default')
    origin     = SHOP_COORDS.get(shop, SHOP_COORDS['default'])
    origin_str = f"{origin[0]},{origin[1]}"
    dest_str   = f"{delivery_addr}, Baku, Azerbaijan"

    api_key = os.environ.get('GOOGLE_MAPS_API_KEY', '')
    if not api_key:
        # Fallback: flat 5 km estimate when no API key configured
        distance_km = 5.0
    else:
        try:
            url = (
                "https://maps.googleapis.com/maps/api/distancematrix/json"
                f"?origins={origin_str}&destinations={dest_str}"
                f"&mode=driving&key={api_key}"
            )
            resp = requests.get(url, timeout=8)
            resp.raise_for_status()
            result = resp.json()
            meters = result['rows'][0]['elements'][0]['distance']['value']
            distance_km = round(meters / 1000, 2)
        except Exception as e:
            app.logger.warning('Distance API error: %s', e)
            distance_km = 5.0

    delivery_cost = int(math.ceil(distance_km * 1.5))
    return jsonify(distance_km=distance_km, delivery_cost=delivery_cost)
```

- [ ] **Step 9: Run markup_price tests**

```bash
cd /mnt/c/ai/my-ai-assistant/website && python -m pytest tests/test_app_logic.py::test_markup_price_rounds_up tests/test_app_logic.py::test_markup_price_integer_result -v
```

Expected: 2 PASSED

- [ ] **Step 10: Smoke test the app starts**

```bash
cd /mnt/c/ai/my-ai-assistant/website && python -c "from app import app; print('OK')"
```

Expected: `OK`

- [ ] **Step 11: Commit**

```bash
git add app.py && git commit -m "feat: markup_price, is_valid_offer, SHOP_COORDS, /calculate_delivery"
```

---

## Task 4: Update translations.py

**Files:**
- Modify: `translations.py`

- [ ] **Step 1: Add new keys to the Russian (`ru`) dict**

At the end of the `ru` dict (before the closing `}`), add:

```python
        # New categories
        'cat_sweets': '🍬 Зефирные букеты',
        'cat_sweets_sub': 'Нежные букеты из зефира и маршмеллоу',
        'cat_food': '🍓 Вкусные букеты',
        'cat_food_sub': 'Съедобные букеты из фруктов и ягод',
        'cat_alcohol': '🥃 Для него',
        'cat_alcohol_sub': 'Мужские подарочные букеты с алкоголем',
        # Delivery
        'delivery_address_label': 'Адрес доставки',
        'delivery_calculating': 'Рассчитываем стоимость доставки...',
        'delivery_distance': 'Расстояние',
        'delivery_cost': 'Доставка',
        'delivery_total': 'Итого с доставкой',
        'order_bouquet_price': 'Цена букета',
        'order_total': 'Итого',
        'delivery_km': 'км',
```

- [ ] **Step 2: Add same keys to English (`en`) dict**

```python
        # New categories
        'cat_sweets': '🍬 Sweet Bouquets',
        'cat_sweets_sub': 'Delicate bouquets made of marshmallow',
        'cat_food': '🍓 Edible Bouquets',
        'cat_food_sub': 'Edible bouquets of fresh fruits and berries',
        'cat_alcohol': '🥃 For Him',
        'cat_alcohol_sub': "Men's gift bouquets with alcohol",
        # Delivery
        'delivery_address_label': 'Delivery address',
        'delivery_calculating': 'Calculating delivery cost...',
        'delivery_distance': 'Distance',
        'delivery_cost': 'Delivery',
        'delivery_total': 'Total with delivery',
        'order_bouquet_price': 'Bouquet price',
        'order_total': 'Total',
        'delivery_km': 'km',
```

- [ ] **Step 3: Add same keys to Azerbaijani (`az`) dict**

```python
        # New categories
        'cat_sweets': '🍬 Zefir Buketlər',
        'cat_sweets_sub': 'Zefir və marşmellodadn hazırlanmış buketlər',
        'cat_food': '🍓 Dadlı Buketlər',
        'cat_food_sub': 'Meyvə və giləmeyvədən yeyilə bilən buketlər',
        'cat_alcohol': '🥃 Onun Üçün',
        'cat_alcohol_sub': 'Kişilər üçün hədiyyəlik buketlər',
        # Delivery
        'delivery_address_label': 'Çatdırılma ünvanı',
        'delivery_calculating': 'Çatdırılma dəyəri hesablanır...',
        'delivery_distance': 'Məsafə',
        'delivery_cost': 'Çatdırılma',
        'delivery_total': 'Çatdırılma ilə cəmi',
        'order_bouquet_price': 'Buket qiyməti',
        'order_total': 'Cəmi',
        'delivery_km': 'km',
```

- [ ] **Step 4: Verify translations load without error**

```bash
cd /mnt/c/ai/my-ai-assistant/website && python -c "from translations import get_t; t=get_t('ru'); print(t['cat_sweets'], t['delivery_total'])"
```

Expected: `🍬 Зефирные букеты Итого с доставкой`

- [ ] **Step 5: Commit**

```bash
git add translations.py && git commit -m "feat: add category and delivery translation keys (RU/EN/AZ)"
```

---

## Task 5: Update style.css — occasion cards + category sections

**Files:**
- Modify: `static/css/style.css`

- [ ] **Step 1: Replace occasion-tabs CSS block**

Find lines 836–860 (`.occasion-tabs` and `.occasion-tab` blocks) and replace entirely with:

```css
/* ── Occasion cards (Airbnb-style) ── */
.occasion-cards {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 8px 4px 20px;
  scrollbar-width: none;
  -ms-overflow-style: none;
  scroll-snap-type: x mandatory;
  margin-bottom: 32px;
}
.occasion-cards::-webkit-scrollbar { display: none; }

.occasion-card {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 18px 22px;
  border-radius: 20px;
  border: 2.5px solid transparent;
  cursor: pointer;
  transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
  min-width: 110px;
  scroll-snap-align: start;
  font-weight: 700;
  font-size: 13px;
  color: #fff;
  text-shadow: 0 1px 3px rgba(0,0,0,.3);
  user-select: none;
}
.occasion-card .occ-icon {
  font-size: 34px;
  line-height: 1;
}
.occasion-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 28px rgba(0,0,0,.25);
}
.occasion-card.active {
  border-color: rgba(255,255,255,.75);
  box-shadow: 0 10px 36px rgba(0,0,0,.35);
  transform: translateY(-4px);
}

/* ── Special category sections ── */
.category-section {
  margin-top: 64px;
}
.category-section .section-eyebrow {
  font-size: 13px;
}
.category-section .cat-subtitle {
  color: var(--muted);
  font-size: 15px;
  margin-top: 6px;
  margin-bottom: 28px;
}
```

- [ ] **Step 2: Also update the mobile occasion-tabs responsive override (around line 1691)**

Find:
```css
  .occasion-tabs { gap: 8px; }
  .occasion-tab { font-size: 12px; padding: 8px 16px; }
```

Replace with:
```css
  .occasion-cards { gap: 8px; padding: 4px 0 16px; }
  .occasion-card { min-width: 90px; padding: 14px 16px; font-size: 12px; }
  .occasion-card .occ-icon { font-size: 26px; }
```

- [ ] **Step 3: Verify CSS parses (no syntax errors)**

```bash
python3 -c "
data = open('/mnt/c/ai/my-ai-assistant/website/static/css/style.css').read()
opens = data.count('{')
closes = data.count('}')
print(f'Braces: {opens} open, {closes} close — diff={opens-closes}')
"
```

Expected: diff = 0

- [ ] **Step 4: Commit**

```bash
git add static/css/style.css && git commit -m "feat: occasion cards CSS (Airbnb-style) + category section styles"
```

---

## Task 6: Update index.html — occasion cards + category sections

**Files:**
- Modify: `templates/index.html`
- Modify: `app.py` (add icon/color to occasions)

- [ ] **Step 1: Add occasion icon and color data to `get_occasions()` in app.py**

Replace the `get_occasions` function:

```python
def get_occasions(t):
    return [
        {"key": "all",         "label": t['occ_all'],         "icon": "🌸", "color": "#9E9E9E"},
        {"key": "romance",     "label": t['occ_romance'],     "icon": "💕", "color": "#FF6B8A"},
        {"key": "birthday",    "label": t['occ_birthday'],    "icon": "🎂", "color": "#FFB347"},
        {"key": "wedding",     "label": t['occ_wedding'],     "icon": "💍", "color": "#C9A84C"},
        {"key": "graduation",  "label": t['occ_graduation'],  "icon": "🎓", "color": "#7EC8A4"},
        {"key": "anniversary", "label": t['occ_anniversary'], "icon": "🥂", "color": "#8B1A4A"},
        {"key": "corporate",   "label": t['occ_corporate'],   "icon": "🤝", "color": "#4A7AB5"},
        {"key": "just_because","label": t['occ_just_because'],"icon": "🌷", "color": "#C4A7E7"},
    ]
```

- [ ] **Step 2: Replace the occasion-tabs HTML block in index.html**

Find (lines 136–144):
```html
    <div class="occasion-tabs reveal" id="occasion-tabs">
      {% for occ in occasions %}
      <button
        class="occasion-tab{% if occ.key == selected_occasion %} active{% endif %}"
        data-occasion="{{ occ.key }}"
        type="button"
      >{{ occ.label }}</button>
      {% endfor %}
    </div>
```

Replace with:
```html
    <div class="occasion-cards reveal" id="occasion-cards">
      {% for occ in occasions %}
      <button
        class="occasion-card{% if occ.key == selected_occasion %} active{% endif %}"
        data-occasion="{{ occ.key }}"
        style="background:{{ occ.color }}"
        type="button"
      >
        <span class="occ-icon">{{ occ.icon }}</span>
        <span>{{ occ.label }}</span>
      </button>
      {% endfor %}
    </div>
```

- [ ] **Step 3: Update price display in offer card to use display_price**

In the offer card section of index.html, find:
```html
              <div class="price">{{ offer.price }}<span class="price-currency">₼</span></div>
```

Replace with:
```html
              <div class="price">{{ offer.display_price }}<span class="price-currency">₼</span></div>
```

- [ ] **Step 4: Remove shop display from offer cards (if any)**

Search index.html for any `offer.shop` reference and remove it. (Currently none in catalog cards, but confirm.)

- [ ] **Step 5: Pass categorised offers to template — update `index()` in app.py**

In `app.py` `index()` route, after building `filtered` and before `render_template`, add:

```python
    sweets_offers  = [o for o in fresh if o.get('type') == 'sweets']
    food_offers    = [o for o in fresh if o.get('type') == 'food']
    alcohol_offers = [o for o in fresh if o.get('type') == 'alcohol']
    for lst in (sweets_offers, food_offers, alcohol_offers):
        for o in lst:
            o['display_price'] = markup_price(o['price'])
```

Add these to the `render_template` call:
```python
        sweets_offers=sweets_offers,
        food_offers=food_offers,
        alcohol_offers=alcohol_offers,
```

- [ ] **Step 6: Add three new category sections to index.html**

After the closing `</section>` of the `#catalog-grid` section and before `{# ── DELIVERY INFO ── #}`, add:

```html
  {# ── SWEET BOUQUETS ── #}
  {% if sweets_offers %}
  <section class="offers-section category-section" id="sweets">
    <div class="section-title reveal">
      <span class="section-eyebrow">{{ t.cat_sweets }}</span>
      <p class="cat-subtitle">{{ t.cat_sweets_sub }}</p>
    </div>
    <div class="offers" id="sweets-grid">
      {% for offer in sweets_offers %}
        <article class="offer-card reveal" data-id="{{ offer.id }}">
          <div class="offer-image">
            <img src="{{ offer.photo }}" alt="{{ offer.title }}" loading="lazy">
            <div class="badge">🍬</div>
            <div class="card-bloom" data-bloom></div>
          </div>
          <div class="card-top"><h3>{{ offer.title }}</h3></div>
          <p class="desc">{{ offer.description }}</p>
          <div class="card-bottom">
            <div class="price-wrap">
              <div class="price">{{ offer.display_price }}<span class="price-currency">₼</span></div>
            </div>
            <a class="button primary" href="{{ url_for('order', offer_id=offer.id) }}">{{ t.catalog_btn_order }}</a>
          </div>
        </article>
      {% endfor %}
    </div>
  </section>
  {% endif %}

  {# ── FOOD BOUQUETS ── #}
  {% if food_offers %}
  <section class="offers-section category-section" id="food">
    <div class="section-title reveal">
      <span class="section-eyebrow">{{ t.cat_food }}</span>
      <p class="cat-subtitle">{{ t.cat_food_sub }}</p>
    </div>
    <div class="offers" id="food-grid">
      {% for offer in food_offers %}
        <article class="offer-card reveal" data-id="{{ offer.id }}">
          <div class="offer-image">
            <img src="{{ offer.photo }}" alt="{{ offer.title }}" loading="lazy">
            <div class="badge">🍓</div>
            <div class="card-bloom" data-bloom></div>
          </div>
          <div class="card-top"><h3>{{ offer.title }}</h3></div>
          <p class="desc">{{ offer.description }}</p>
          <div class="card-bottom">
            <div class="price-wrap">
              <div class="price">{{ offer.display_price }}<span class="price-currency">₼</span></div>
            </div>
            <a class="button primary" href="{{ url_for('order', offer_id=offer.id) }}">{{ t.catalog_btn_order }}</a>
          </div>
        </article>
      {% endfor %}
    </div>
  </section>
  {% endif %}

  {# ── ALCOHOL BOUQUETS ── #}
  {% if alcohol_offers %}
  <section class="offers-section category-section" id="alcohol">
    <div class="section-title reveal">
      <span class="section-eyebrow">{{ t.cat_alcohol }}</span>
      <p class="cat-subtitle">{{ t.cat_alcohol_sub }}</p>
    </div>
    <div class="offers" id="alcohol-grid">
      {% for offer in alcohol_offers %}
        <article class="offer-card reveal" data-id="{{ offer.id }}">
          <div class="offer-image">
            <img src="{{ offer.photo }}" alt="{{ offer.title }}" loading="lazy">
            <div class="badge">🥃</div>
            <div class="card-bloom" data-bloom></div>
          </div>
          <div class="card-top"><h3>{{ offer.title }}</h3></div>
          <p class="desc">{{ offer.description }}</p>
          <div class="card-bottom">
            <div class="price-wrap">
              <div class="price">{{ offer.display_price }}<span class="price-currency">₼</span></div>
            </div>
            <a class="button primary" href="{{ url_for('order', offer_id=offer.id) }}">{{ t.catalog_btn_order }}</a>
          </div>
        </article>
      {% endfor %}
    </div>
  </section>
  {% endif %}
```

- [ ] **Step 7: Commit**

```bash
git add templates/index.html app.py && git commit -m "feat: occasion cards UI and new category sections in catalog"
```

---

## Task 7: Update order.html — delivery cost + remove shop

**Files:**
- Modify: `templates/order.html`

- [ ] **Step 1: Replace order.html entirely**

```html
{% extends 'base.html' %}

{% block title %}{{ t.nav_catalog }} — {{ offer.title }}{% endblock %}

{% block hero %}{% endblock %}
{% block stats %}{% endblock %}

{% block content %}
  <div class="order-card" style="padding-top:110px">
    {% with messages = get_flashed_messages(category_filter=['error']) %}
      {% if messages %}
        <div class="error">{{ messages[0] }}</div>
      {% endif %}
    {% endwith %}

    <div class="offer-summary">
      {% if offer.photo %}
        <div class="offer-image">
          <img src="{{ offer.photo }}" alt="{{ offer.title }}">
        </div>
      {% endif %}
      <div class="card-top">
        <h3>{{ offer.title }}</h3>
      </div>
      <p class="desc">{{ offer.delivery_time }}</p>
      <p class="desc">{{ offer.description }}</p>
      <p class="composition"><strong>{{ t.order_bouquet_price }}:</strong> {{ offer.display_price }} ₼</p>
    </div>

    <form method="post" class="order-form" id="order-form">
      <h2>{{ t.nav_catalog }}</h2>

      <label for="name">{% if lang == 'ru' %}Ваше имя{% elif lang == 'az' %}Adınız{% else %}Your name{% endif %}</label>
      <input id="name" name="name" required placeholder="{% if lang == 'ru' %}Полное имя{% elif lang == 'az' %}Tam adınız{% else %}Full name{% endif %}">

      <label for="phone">{% if lang == 'ru' %}Номер телефона{% elif lang == 'az' %}Telefon nömrəsi{% else %}Phone number{% endif %}</label>
      <input id="phone" name="phone" required placeholder="+994 70 ...">

      <label for="address">{{ t.delivery_address_label }}</label>
      <textarea id="address" name="address" rows="3" required
        placeholder="{% if lang == 'ru' %}Введите адрес в Баку...{% elif lang == 'az' %}Bakıda ünvanınızı daxil edin...{% else %}Enter your Baku address...{% endif %}"
      ></textarea>

      <label for="quantity">{% if lang == 'ru' %}Количество{% elif lang == 'az' %}Miqdar{% else %}Quantity{% endif %}</label>
      <select id="qty-select" name="quantity">
        {% for qty in [1,2,3,4,5] %}
          <option value="{{ qty }}">{{ qty }}</option>
        {% endfor %}
      </select>

      <!-- Delivery cost display -->
      <div id="delivery-info" style="display:none;margin-top:18px;padding:16px;background:var(--glass);border-radius:14px;border:1px solid var(--border)">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
          <span style="color:var(--muted)">{{ t.order_bouquet_price }}</span>
          <span id="price-display">{{ offer.display_price }} ₼</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
          <span style="color:var(--muted)">{{ t.delivery_cost }} (<span id="dist-display">—</span> {{ t.delivery_km }})</span>
          <span id="deliv-cost-display">— ₼</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-weight:700;border-top:1px solid var(--border);padding-top:10px;margin-top:4px">
          <span>{{ t.order_total }}</span>
          <span id="total-display">— ₼</span>
        </div>
      </div>
      <p id="delivery-calculating" style="display:none;color:var(--muted);font-size:13px;margin-top:8px">{{ t.delivery_calculating }}</p>

      <!-- Hidden fields for order totals -->
      <input type="hidden" name="display_price" id="hidden-display-price" value="{{ offer.display_price }}">
      <input type="hidden" name="delivery_cost" id="hidden-delivery-cost" value="0">
      <input type="hidden" name="distance_km" id="hidden-distance-km" value="0">

      <button class="button primary" type="submit" style="margin-top:20px;width:100%;justify-content:center">
        {% if lang == 'ru' %}Подтвердить заказ{% elif lang == 'az' %}Sifarişi təsdiq edin{% else %}Confirm order{% endif %}
      </button>
    </form>
  </div>

  <script>
  (function() {
    const offerId      = {{ offer.id | tojson }};
    const bouquetPrice = {{ offer.display_price }};
    const addrEl       = document.getElementById('address');
    const qtyEl        = document.getElementById('qty-select');
    let debounceTimer  = null;

    function calcDelivery() {
      const addr = addrEl.value.trim();
      if (addr.length < 10) {
        document.getElementById('delivery-info').style.display = 'none';
        return;
      }
      document.getElementById('delivery-calculating').style.display = 'block';
      document.getElementById('delivery-info').style.display = 'none';

      fetch('/calculate_delivery', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({offer_id: offerId, delivery_address: addr})
      })
      .then(r => r.json())
      .then(data => {
        document.getElementById('delivery-calculating').style.display = 'none';
        if (data.error) return;
        const qty          = parseInt(qtyEl.value) || 1;
        const deliveryCost = data.delivery_cost;
        const total        = bouquetPrice * qty + deliveryCost;

        document.getElementById('dist-display').textContent      = data.distance_km;
        document.getElementById('deliv-cost-display').textContent = deliveryCost + ' ₼';
        document.getElementById('price-display').textContent      = (bouquetPrice * qty) + ' ₼';
        document.getElementById('total-display').textContent      = total + ' ₼';
        document.getElementById('hidden-delivery-cost').value     = deliveryCost;
        document.getElementById('hidden-distance-km').value       = data.distance_km;
        document.getElementById('delivery-info').style.display    = 'block';
      })
      .catch(() => {
        document.getElementById('delivery-calculating').style.display = 'none';
      });
    }

    addrEl.addEventListener('input', function() {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(calcDelivery, 800);
    });
    qtyEl.addEventListener('change', calcDelivery);
  })();
  </script>
{% endblock %}
```

- [ ] **Step 2: Update order() POST handler in app.py to save delivery_cost**

In the POST branch of `order()`, update `order_data` to include delivery fields:

```python
        order_data = {
            "order_id": order_id,
            "customer_name": name,
            "phone": phone,
            "address": address,
            "quantity": int(quantity) if quantity.isdigit() else 1,
            "offer": offer,
            "display_price": int(request.form.get("display_price", offer['display_price'])),
            "delivery_cost": int(request.form.get("delivery_cost", 0)),
            "distance_km": float(request.form.get("distance_km", 0)),
            "created": datetime.utcnow().isoformat(),
        }
```

- [ ] **Step 3: Commit**

```bash
git add templates/order.html app.py && git commit -m "feat: delivery cost calculator in order page, remove shop display"
```

---

## Task 8: Update confirmation.html — totals, remove shop

**Files:**
- Modify: `templates/confirmation.html`

- [ ] **Step 1: Replace confirmation.html**

```html
{% extends 'base.html' %}

{% block title %}{% if lang == 'ru' %}Заказ оформлен{% elif lang == 'az' %}Sifariş təsdiqləndi{% else %}Order confirmed{% endif %} — DreamBouquet{% endblock %}

{% block hero %}{% endblock %}
{% block stats %}{% endblock %}

{% block content %}
  <div class="confirmation" style="padding-top:120px">
    <div style="font-size:64px;margin-bottom:16px">🌸</div>
    <h1>
      {% if lang == 'ru' %}Спасибо, {{ order.customer_name }}!
      {% elif lang == 'az' %}Təşəkkür edirik, {{ order.customer_name }}!
      {% else %}Thank you, {{ order.customer_name }}!{% endif %}
    </h1>
    <p style="color:var(--muted);font-size:17px;margin-top:8px">
      {% if lang == 'ru' %}Ваш заказ получен и скоро будет обработан.
      {% elif lang == 'az' %}Sifarişiniz qəbul edildi.
      {% else %}Your order has been received and will be processed shortly.{% endif %}
    </p>

    <ul class="order-summary">
      <li>
        <strong>{% if lang == 'ru' %}Количество{% elif lang == 'az' %}Miqdar{% else %}Quantity{% endif %}:</strong>
        {{ order.quantity }}
      </li>
      <li>
        <strong>{% if lang == 'ru' %}Адрес доставки{% elif lang == 'az' %}Çatdırılma ünvanı{% else %}Delivery address{% endif %}:</strong>
        {{ order.address }}
      </li>
      <li>
        <strong>{% if lang == 'ru' %}Телефон{% elif lang == 'az' %}Telefon{% else %}Phone{% endif %}:</strong>
        {{ order.phone }}
      </li>
      <li>
        <strong>{{ t.order_bouquet_price }}:</strong>
        {{ order.display_price * order.quantity }} ₼
      </li>
      {% if order.delivery_cost %}
      <li>
        <strong>{{ t.delivery_cost }}{% if order.distance_km %} ({{ order.distance_km }} {{ t.delivery_km }}){% endif %}:</strong>
        {{ order.delivery_cost }} ₼
      </li>
      {% endif %}
      <li style="font-weight:700;border-top:1px solid var(--border);padding-top:10px;margin-top:4px">
        <strong>{{ t.order_total }}:</strong>
        {{ order.display_price * order.quantity + (order.delivery_cost or 0) }} ₼
      </li>
    </ul>

    {% if order.payment and order.payment.status == 'paid' %}
      <p style="color:var(--green);font-weight:600">✅
        {% if lang == 'ru' %}Оплата выполнена. ID: {{ order.payment.id }}
        {% elif lang == 'az' %}Ödəniş tamamlandı. ID: {{ order.payment.id }}
        {% else %}Payment completed. ID: {{ order.payment.id }}{% endif %}
      </p>
    {% else %}
      <form style="margin-top:18px">
        <button class="button primary" data-pay-sandbox="" data-order='{{ order | tojson | safe }}' type="button">
          {% if lang == 'ru' %}Оплатить (тест){% elif lang == 'az' %}Ödə (test){% else %}Pay now (sandbox){% endif %}
        </button>
      </form>
    {% endif %}

    <a class="button primary" href="{{ url_for('index') }}" style="margin-top:24px;display:inline-flex">
      ← {% if lang == 'ru' %}В каталог{% elif lang == 'az' %}Kataloqa{% else %}Back to catalogue{% endif %}
    </a>
  </div>
{% endblock %}
```

- [ ] **Step 2: Commit**

```bash
git add templates/confirmation.html && git commit -m "feat: confirmation page with delivery totals, remove shop, trilingual"
```

---

## Task 9: Update main.js — occasion cards filter

**Files:**
- Modify: `static/js/main.js`

- [ ] **Step 1: Find the occasion tab filter code in main.js**

```bash
grep -n "occasion-tab\|occasion_tab\|data-occasion" /mnt/c/ai/my-ai-assistant/website/static/js/main.js | head -20
```

- [ ] **Step 2: Replace occasion-tab references with occasion-card**

In `main.js`, find all occurrences of `occasion-tab` (CSS class selector strings used in querySelector/querySelectorAll) and replace with `occasion-card`. The filter logic itself (reading `data-occasion` attribute and filtering `.offer-card` elements) stays the same — only the CSS class name changes.

Example: if the code contains:
```js
document.querySelectorAll('.occasion-tab')
```
Replace with:
```js
document.querySelectorAll('.occasion-card')
```

And:
```js
el.classList.contains('occasion-tab')
// or
el.classList.add('active') on occasion-tab
```
Ensure these use `occasion-card` instead.

- [ ] **Step 3: Verify the app loads in browser**

```bash
cd /mnt/c/ai/my-ai-assistant/website && python app.py &
sleep 2
curl -s http://localhost:5000/ | grep -c "occasion-card"
kill %1
```

Expected: number > 0 (occasion-card elements present in HTML)

- [ ] **Step 4: Commit**

```bash
git add static/js/main.js && git commit -m "feat: update JS occasion filter to use occasion-card class"
```

---

## Task 10: Final verification

- [ ] **Step 1: Run all tests**

```bash
cd /mnt/c/ai/my-ai-assistant/website && python -m pytest tests/ -v
```

Expected: all PASSED

- [ ] **Step 2: Start the app and verify homepage loads**

```bash
cd /mnt/c/ai/my-ai-assistant/website && python app.py &
sleep 2
curl -s http://localhost:5000/ | grep -o "occasion-card" | wc -l
```

Expected: 8 (one per occasion)

- [ ] **Step 3: Verify price markup on homepage**

```bash
python3 -c "
import json
with open('data/az_offers.json', encoding='utf-8-sig') as f:
    offers = json.load(f)
raw = offers[0]['price']
import math
marked = int(math.ceil(raw * 1.1))
print(f'Raw: {raw} → Marked up: {marked}')
"
```

Expected: marked price = ceil(raw * 1.1)

- [ ] **Step 4: Verify /calculate_delivery endpoint (no API key fallback)**

```bash
curl -s -X POST http://localhost:5000/calculate_delivery \
  -H "Content-Type: application/json" \
  -d "{\"offer_id\": \"$(python3 -c \"import json; d=json.load(open('data/az_offers.json',encoding='utf-8-sig')); print(d[0]['id'])\")\", \"delivery_address\": \"Nizami Street 10, Baku\"}" | python3 -m json.tool
```

Expected: `{"distance_km": 5.0, "delivery_cost": 8}` (fallback without API key)

- [ ] **Step 5: Kill dev server**

```bash
kill %1 2>/dev/null || true
```

- [ ] **Step 6: Final commit**

```bash
git add -A && git commit -m "feat: catalog UX sub-project A complete — new categories, markup, delivery, occasion cards"
```
