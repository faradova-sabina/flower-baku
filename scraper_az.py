"""
Auto-scraper for buket.az — fetches real bouquets with real photos every 5 minutes.
Writes to data/az_offers.json with magical Russian descriptions.
"""
import json
import time
import hashlib
import logging
from pathlib import Path
from datetime import datetime

import requests
from bs4 import BeautifulSoup

BASE_DIR   = Path(__file__).parent
DATA_FILE  = BASE_DIR / "data" / "az_offers.json"
LOG_FILE   = BASE_DIR / "data" / "scraper.log"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler(),
    ],
)
log = logging.getLogger("scraper")

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "ru-RU,ru;q=0.9,en;q=0.8",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
}

STOCK_DOMAINS = (
    "pexels.com", "unsplash.com", "pixabay.com",
    "shutterstock.com", "gettyimages.com",
)

# Pages to scrape on buket.az
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

# Occasion keywords for auto-classification
OCCASION_MAP = {
    "romance":     ["rose", "роза", "romantic", "love", "date", "свидан", "love"],
    "birthday":    ["birthday", "день рождения", "праздн", "gerbera", "sunflower", "подсолнух", "яркий"],
    "wedding":     ["wed", "свадьб", "bride", "невест", "bridal", "белый", "white"],
    "anniversary": ["юбил", "anniversary", "101", "51", "grand", "luxury", "premium"],
    "corporate":   ["corporate", "корпорат", "business", "деловой", "eustoma", "алберт", "alstroemeria"],
    "graduation":  ["graduation", "выпускн", "school", "tulip", "тюльпан"],
    "just_because":["field", "полевой", "mix", "casual", "simple", "simple", "small", "kraft"],
}

FOR_WHOM_MAP = {
    "girlfriend": ["rose", "роза", "pink", "romantic", "love", "peony", "пион"],
    "wife":       ["rose", "роза", "lily", "hydrangea", "premium", "пион", "гортензия"],
    "mom":        ["lily", "лилия", "eustoma", "sunflower", "подсолнух", "alstroemeria"],
    "friend":     ["gerbera", "field", "полев", "tulip", "тюльпан", "colorful", "mixed"],
    "colleague":  ["eustoma", "lily", "alstroemeria", "corporate", "white", "elegant"],
    "teacher":    ["lily", "eustoma", "alstroemeria", "mixed", "field"],
    "child":      ["gerbera", "sunflower", "field", "colorful", "tulip", "bright"],
    "man":        ["tropical", "anthurium", "exotic", "sunflower"],
}

COLOR_MAP = {
    "red":    ["red", "красн", "alaya", "crimson", "scarlet"],
    "pink":   ["pink", "розов"],
    "white":  ["white", "белый", "белая"],
    "yellow": ["yellow", "жёлт", "зелен", "sunflower", "подсолнух"],
    "purple": ["purple", "violet", "фиолет", "лавандов", "eustoma"],
    "mixed":  ["mix", "mixed", "colorful", "multicolor", "разноцвет"],
}

TYPE_KEYWORDS = {
    "food":   ["фрукт", "клубника", "ягода", "fruit", "strawberry",
               "фруктовый", "ягодный", "berry", "exotic fruit"],
    "alcohol":["виски", "вино", "коньяк", "пиво", "шампанское", "для него",
               "whiskey", "wine", "beer", "cognac", "champagne", "alcohol"],
    "sweets": ["зефир", "маршмеллоу", "сладкий", "конфеты", "шоколад",
               "marshmallow", "candy", "sweet", "chocolate", "зефирный"],
}

def classify_type(title: str, composition: list) -> str:
    text = (title + " " + " ".join(composition)).lower()
    for type_key, keywords in TYPE_KEYWORDS.items():
        if any(kw in text for kw in keywords):
            return type_key
    return "flowers"

# Magical Russian descriptions by composition keyword
DESCRIPTION_TEMPLATES = {
    "пион": [
        "Пышные, как мечта, пионы в полном цвету — это не просто букет, это поэма. Их нежный аромат окутает комнату шёлком утреннего сада.",
        "Каждый пион — это целый мир нежности, завёрнутый в лепестки. Такой букет помнят годами.",
    ],
    "подсолнух": [
        "Солнечные великаны, пахнущие летом и счастьем — букет, который невозможно не полюбить с первого взгляда.",
        "Подсолнухи несут тепло туда, куда бы ни попали. Один взгляд — и день сразу становится лучше.",
    ],
    "роза": [
        "Розы — это язык, который понимает каждое сердце. Свежесрезанные, они хранят в себе всё, что слова выразить не могут.",
        "Классика, которая никогда не устаревает: роза остаётся самым красноречивым признанием.",
    ],
    "тюльпан": [
        "Тюльпаны — первый знак весны и надежды. Нежные, прямые, честные — как настоящие чувства.",
        "В каждом тюльпане — обещание нового начала. Подарите весну, даже если за окном другое время года.",
    ],
    "гортензия": [
        "Воздушные шары гортензий — как кусочек неба, пойманный в букет. Роскошный выбор для особенных людей.",
        "Гортензии похожи на облака, которые сошли на землю специально, чтобы стать частью вашего праздника.",
    ],
    "лилия": [
        "Белоснежные лилии с королевской осанкой — благородный выбор для тех, кто ценит безупречный вкус.",
        "Лилия говорит: я уважаю тебя и ценю каждый момент рядом с тобой.",
    ],
    "альстромерия": [
        "Альстромерии — цветы инков, несущие послание дружбы. Яркие и стойкие — как настоящая дружба.",
        "Пёстрые лепестки альстромерии расскажут о радости без слов.",
    ],
    "эустома": [
        "Эустома — это когда природа нарисовала розу из мечты. Нежные лепестки создают букет, выглядящий вдвое дороже.",
        "Лизиантус — цветок с характером: нежный снаружи и стойкий внутри, прямо как вы.",
    ],
    "гербера": [
        "Разноцветные герберы — как набор красок для тех, кто рисует жизнь в ярких тонах. Стильно и абсолютно в точку.",
        "Яркие, открытые, честные — герберы не умеют притворяться. Они просто радуются жизни.",
    ],
    "ромашка": [
        "Букет, который пахнет детством, свободой и солнечным лугом. Полевые цветы — самые искренние.",
        "Ромашки не притворяются — они просто существуют, и этого достаточно.",
    ],
    "полевые": [
        "Букет, который пахнет летним лугом и свободой. Для тех, кто ценит простоту и искренность.",
        "Полевые цветы как первое признание — немного робкое, очень честное и невероятно трогательное.",
    ],
    "хризантема": [
        "Хризантемы — символ долголетия и мудрости, оформленные в роскошный букет.",
        "Пышные хризантемы создают объём и ощущение праздника одним своим присутствием.",
    ],
    "default": [
        "Свежий букет, собранный с любовью — лучший способ сказать что-то важное без слов.",
        "Этот букет создан для тех особых моментов, которые хочется помнить вечно.",
        "Красота, собранная в одном месте — ради одного особенного человека.",
    ],
}


def make_offer_id(title: str, price: int) -> str:
    raw = f"{title.lower()}{price}"
    return "sc" + hashlib.md5(raw.encode()).hexdigest()[:8]


def is_stock_photo(url: str) -> bool:
    if not url:
        return True
    return any(d in url for d in STOCK_DOMAINS)


def classify_occasions(title: str, composition: list[str]) -> list[str]:
    text = (title + " " + " ".join(composition)).lower()
    found = []
    for occ, keywords in OCCASION_MAP.items():
        if any(kw in text for kw in keywords):
            found.append(occ)
    if not found:
        found = ["just_because", "birthday"]
    return list(dict.fromkeys(found))  # dedupe preserving order


def classify_for_whom(title: str, composition: list[str]) -> list[str]:
    text = (title + " " + " ".join(composition)).lower()
    found = []
    for person, keywords in FOR_WHOM_MAP.items():
        if any(kw in text for kw in keywords):
            found.append(person)
    if not found:
        found = ["friend", "mom", "girlfriend"]
    return found


def classify_colors(title: str, composition: list[str]) -> list[str]:
    text = (title + " " + " ".join(composition)).lower()
    found = []
    for color, keywords in COLOR_MAP.items():
        if any(kw in text for kw in keywords):
            found.append(color)
    if not found:
        found = ["mixed"]
    return found


def generate_description(composition: list[str]) -> str:
    comp_text = " ".join(composition).lower()
    for keyword, templates in DESCRIPTION_TEMPLATES.items():
        if keyword in comp_text:
            import random
            return random.choice(templates)
    import random
    return random.choice(DESCRIPTION_TEMPLATES["default"])


def parse_buket_az_page(url: str) -> list[dict]:
    """Parse a single buket.az catalog page and return offers."""
    offers = []
    try:
        resp = requests.get(url, headers=HEADERS, timeout=12)
        if resp.status_code != 200:
            log.warning("Got %d from %s", resp.status_code, url)
            return []
        soup = BeautifulSoup(resp.content, "html.parser")

        # buket.az product cards — try multiple selectors
        cards = (
            soup.select(".product-card") or
            soup.select(".product-item") or
            soup.select("article.product") or
            soup.select("[class*='product']") or
            soup.select(".card")
        )

        if not cards:
            # Try to find images with prices nearby
            imgs = soup.select("img[src*='/storage/']")
            log.info("No cards found on %s, found %d storage images", url, len(imgs))
            for img in imgs[:20]:
                src = img.get("src", "")
                if not src or is_stock_photo(src):
                    continue
                # Try to find price nearby
                parent = img.find_parent(["div", "article", "li", "section"])
                if not parent:
                    continue
                price_el = parent.find(string=lambda t: t and "₼" in str(t))
                if not price_el:
                    continue
                price_str = "".join(c for c in str(price_el) if c.isdigit() or c == ".")
                try:
                    price = int(float(price_str))
                except (ValueError, TypeError):
                    continue
                if price <= 0 or price > 5000:
                    continue

                title_el = parent.find(["h2", "h3", "h4", "a"])
                title = title_el.get_text(strip=True) if title_el else "Букет"
                if len(title) < 3:
                    continue

                comp_text = title.lower()
                composition = [w for w in comp_text.split() if len(w) > 3][:3] or [title]

                if not src.startswith("http"):
                    src = "https://buket.az" + src

                offers.append({
                    "title": title,
                    "price": price,
                    "photo": src,
                    "composition": composition,
                })
            return offers

        for card in cards[:30]:
            img = card.find("img")
            if not img:
                continue
            src = img.get("src") or img.get("data-src") or ""
            if not src or is_stock_photo(src):
                continue
            if not src.startswith("http"):
                src = "https://buket.az" + src

            # Price
            price_el = card.find(class_=lambda c: c and "price" in c.lower())
            price = 0
            if price_el:
                price_text = price_el.get_text()
                digits = "".join(c for c in price_text if c.isdigit() or c == ".")
                try:
                    price = int(float(digits))
                except (ValueError, TypeError):
                    pass
            if price <= 0:
                continue

            # Title
            title_el = card.find(["h2", "h3", "h4"]) or card.find("a")
            title = title_el.get_text(strip=True) if title_el else img.get("alt", "Букет")
            if not title or len(title) < 2:
                continue

            composition = [w for w in title.lower().split() if len(w) > 3][:3] or [title]

            offers.append({
                "title": title,
                "price": price,
                "photo": src,
                "composition": composition,
            })

    except requests.RequestException as e:
        log.error("Request failed for %s: %s", url, e)
    except Exception as e:
        log.exception("Parse error for %s: %s", url, e)

    return offers


def enrich_offer(raw: dict) -> dict:
    """Add metadata fields to a raw scraped offer."""
    title = raw["title"]
    composition = raw.get("composition", [title])
    price = raw["price"]
    photo = raw["photo"]

    occasions = classify_occasions(title, composition)
    for_whom = classify_for_whom(title, composition)
    colors = classify_colors(title, composition)
    description = generate_description(composition)
    offer_type = classify_type(title, composition)

    return {
        "id": make_offer_id(title, price),
        "type": offer_type,
        "title": title,
        "occasion": occasions,
        "occasion_display": " / ".join(
            {"romance": "Романтика", "birthday": "День рождения",
             "wedding": "Свадьба", "anniversary": "Юбилей",
             "graduation": "Выпускной", "corporate": "Корпоратив",
             "just_because": "Просто так"}.get(o, o)
            for o in occasions[:2]
        ),
        "category": "Свежее",
        "composition": composition,
        "price": price,
        "currency": "AZN",
        "description": description,
        "delivery_time": "Доставка по Баку",
        "photo": photo,
        "shop": "Buket.az",
        "shop_url": "https://buket.az",
        "is_special": False,
        "for_whom": for_whom,
        "age_range": ["18-30", "30-50"],
        "colors": colors,
        "tags": [],
        "scraped_at": datetime.utcnow().isoformat(),
    }


def load_existing() -> list[dict]:
    if DATA_FILE.exists():
        try:
            with DATA_FILE.open("r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []
    return []


def save_offers(offers: list[dict]) -> None:
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    with DATA_FILE.open("w", encoding="utf-8") as f:
        json.dump(offers, f, ensure_ascii=False, indent=2)


def scrape_once() -> int:
    """Run one full scrape cycle. Returns number of new offers added."""
    log.info("=== Scrape cycle started ===")
    existing = load_existing()
    existing_ids = {o["id"] for o in existing}

    # Preserve manually curated offers (those with curated descriptions)
    curated = [o for o in existing if not o.get("scraped_at")]
    curated_ids = {o["id"] for o in curated}

    new_raw: list[dict] = []
    for url in SCRAPE_PAGES:
        log.info("Fetching: %s", url)
        raw_offers = parse_buket_az_page(url)
        log.info("  Found %d raw offers", len(raw_offers))
        new_raw.extend(raw_offers)
        time.sleep(2)  # polite rate limiting

    # Dedupe by offer id
    added = 0
    enriched_map = {o["id"]: o for o in curated}

    for raw in new_raw:
        offer = enrich_offer(raw)
        oid = offer["id"]
        if oid not in curated_ids:
            if oid not in enriched_map:
                enriched_map[oid] = offer
                added += 1
            else:
                # Update price if changed
                if enriched_map[oid]["price"] != offer["price"]:
                    enriched_map[oid]["price"] = offer["price"]
                    enriched_map[oid]["scraped_at"] = offer["scraped_at"]

    all_offers = list(enriched_map.values())
    save_offers(all_offers)
    log.info("=== Scrape done: %d total, %d new ===", len(all_offers), added)
    return added


def run_loop(interval_seconds: int = 300) -> None:
    """Run scraper in an infinite loop."""
    log.info("Auto-scraper started. Interval: %ds", interval_seconds)
    while True:
        try:
            scrape_once()
        except Exception as e:
            log.exception("Scrape cycle failed: %s", e)
        log.info("Next scrape in %d seconds...", interval_seconds)
        time.sleep(interval_seconds)


if __name__ == "__main__":
    import sys
    if "--once" in sys.argv:
        added = scrape_once()
        print(f"Done. Added {added} new offers.")
    else:
        run_loop(interval_seconds=300)  # 5 minutes
