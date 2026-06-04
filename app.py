from pathlib import Path
from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify

from offers import load_offers, analyze_offers, find_offer
from translations import get_t, TRANSLATIONS, DEFAULT_LANG
import json
import math
import uuid
import smtplib
import os
import requests
from email.message import EmailMessage
from datetime import datetime

BASE_DIR = Path(__file__).resolve().parent
DATA_FILE = BASE_DIR / "data" / "az_offers.json"

SHOP_COORDS = {
    "Buket.az":  (40.3777, 49.8920),
    "Flora.az":  (40.3808, 49.8513),
    "Gul.az":    (40.3753, 49.8345),
    "default":   (40.4093, 49.8671),
}

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev-secret-change-in-prod")

FLOWER_KEYWORDS = {
    'rose', 'roses', 'peony', 'peonies', 'tulip', 'tulips', 'lily', 'lilies',
    'orchid', 'orchids', 'gerbera', 'sunflower', 'gypsophila', 'chrysanthemum',
    'anthurium', 'ranunculus', 'lisianthus', 'eustoma', 'lavender', 'carnation',
    'aster', 'daisy', 'iris', 'freesia', 'hyacinth', 'amaranthus', 'statice',
    'heliconia', 'celosia', 'lagurus', 'eucalyptus', 'greenery', 'букет',
    'bouquet', 'floral', 'flower', 'bloom', 'blossom', 'пион', 'тюльпан',
    'роза', 'лилия', 'гипсофила', 'хризантема', 'подсолнух', 'ромашка',
    'гвоздика', 'орхидея', 'эустома', 'ранункулюс', 'гортензия', 'мак',
    'антуриум', 'стрелиция', 'кротон', 'пальмовый', 'хлопок', 'лагурус',
    'лизиантус', 'альстромерия', 'матиола', 'маттиола', 'фрезия', 'васильки',
    'нигелла', 'гиацинт', 'мускари', 'эрингиум', 'незабудки', 'фиалка',
    'садовая', 'полевые', 'цветы', 'цветок', 'сирень', 'астранция',
}

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

def has_real_photo(offer):
    """Only accept photos from real shop URLs, not stock photo sites."""
    photo = offer.get('photo', '')
    if not photo:
        return False
    stock_domains = ('pexels.com', 'unsplash.com', 'pixabay.com', 'shutterstock.com', 'gettyimages.com')
    return not any(domain in photo for domain in stock_domains)

def markup_price(price):
    return int(math.ceil(round(price * 1.1, 10)))

def get_lang():
    return session.get('lang', DEFAULT_LANG)

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

@app.context_processor
def inject_globals():
    lang = get_lang()
    t = get_t(lang)
    return {
        'now': datetime.now(),
        't': t,
        'lang': lang,
        'all_langs': [
            {'code': 'ru', 'name': TRANSLATIONS['ru']['lang_name']},
            {'code': 'en', 'name': TRANSLATIONS['en']['lang_name']},
            {'code': 'az', 'name': TRANSLATIONS['az']['lang_name']},
        ],
    }


@app.route("/set_lang/<lang>")
def set_lang(lang):
    if lang in TRANSLATIONS:
        session['lang'] = lang
    return redirect(request.referrer or url_for('index'))


@app.route("/")
def index():
    lang = get_lang()
    t = get_t(lang)
    occasions = get_occasions(t)
    selected = request.args.get("occasion", "all")

    raw = load_offers(DATA_FILE)
    # Only real flower offers with real photos
    fresh = [o for o in raw if is_valid_offer(o) and has_real_photo(o)]

    if selected and selected != "all":
        filtered = [o for o in fresh if selected in o.get("occasion", [])]
    else:
        filtered = fresh

    for o in filtered:
        o['display_price'] = markup_price(o['price'])
    for o in fresh:
        o['display_price'] = markup_price(o['price'])

    sweets_offers  = [o for o in fresh if o.get('type') == 'sweets']
    food_offers    = [o for o in fresh if o.get('type') == 'food']
    alcohol_offers = [o for o in fresh if o.get('type') == 'alcohol']
    for lst in (sweets_offers, food_offers, alcohol_offers):
        for o in lst:
            o['display_price'] = markup_price(o['price'])

    return render_template(
        "index.html",
        offers=filtered,
        all_offers_json=json.dumps(fresh, ensure_ascii=False),
        analysis=analyze_offers(fresh),
        occasions=occasions,
        selected_occasion=selected,
        sweets_offers=sweets_offers,
        food_offers=food_offers,
        alcohol_offers=alcohol_offers,
    )


@app.route("/recommend", methods=["POST"])
def recommend():
    lang = get_lang()
    t = get_t(lang)
    data = request.get_json(force=True)
    occasion  = data.get("occasion", "")
    for_whom  = data.get("for_whom", "")
    age_range = data.get("age_range", "")
    budget    = int(data.get("budget", 9999))
    flowers   = data.get("flowers", "")
    color     = data.get("color", "")

    raw = load_offers(DATA_FILE)
    # Only real photos
    fresh = [o for o in raw if is_valid_offer(o) and has_real_photo(o)]

    # Hard filter by flower type — only show offers that actually contain the requested flower
    if flowers and flowers != "any":
        fresh = [
            o for o in fresh
            if any(flowers.lower() in comp.lower() for comp in o.get('composition', []))
        ]

    def score(offer):
        s = 0
        if occasion and occasion in offer.get("occasion", []):
            s += 40
        if for_whom and for_whom in offer.get("for_whom", []):
            s += 25
        if age_range and age_range in offer.get("age_range", []):
            s += 15
        price = offer.get("price", 9999)
        if price <= budget:
            s += 20
            if price >= budget * 0.6:
                s += 10
        else:
            s -= 20
        if color and color in offer.get("colors", []):
            s += 10
        return s

    scored = sorted(fresh, key=score, reverse=True)
    top3 = scored[:3]

    if not top3:
        return jsonify([])

    return jsonify([{
        "id": o["id"],
        "title": o["title"],
        "price": markup_price(o["price"]),
        "photo": o.get("photo", ""),
        "shop": o.get("shop", ""),
        "description": o.get("description", ""),
        "delivery_time": o.get("delivery_time", ""),
        "score": score(o),
    } for o in top3])


@app.route("/order/<offer_id>", methods=["GET", "POST"])
def order(offer_id):
    raw = load_offers(DATA_FILE)
    fresh = [o for o in raw if is_valid_offer(o) and has_real_photo(o)]
    offer = find_offer(fresh, offer_id)
    if offer is None:
        flash("Выбранное предложение не найдено.", "error")
        return redirect(url_for("index"))

    offer['display_price'] = markup_price(offer['price'])

    if request.method == "POST":
        name     = request.form.get("name", "").strip()
        phone    = request.form.get("phone", "").strip()
        address  = request.form.get("address", "").strip()
        quantity = request.form.get("quantity", "1").strip()

        if not name or not phone or not address:
            flash("Пожалуйста, заполните все поля заказа.", "error")
            return render_template("order.html", offer=offer)

        offer['display_price'] = markup_price(offer['price'])
        order_id   = str(uuid.uuid4())
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
        orders_dir = BASE_DIR / 'data' / 'orders'
        orders_dir.mkdir(parents=True, exist_ok=True)
        with open(orders_dir / f"{order_id}.json", 'w', encoding='utf-8') as f:
            json.dump(order_data, f, ensure_ascii=False, indent=2)

        return render_template("confirmation.html", order=order_data)

    return render_template("order.html", offer=offer)


@app.route("/builder")
def builder():
    return render_template("builder.html")


@app.route('/pay_sandbox', methods=['POST'])
def pay_sandbox():
    data = request.get_json()
    if not data or 'order_id' not in data:
        return jsonify(status='error', error='invalid_order'), 400

    order_id   = data['order_id']
    orders_dir = BASE_DIR / 'data' / 'orders'
    order_file = orders_dir / f"{order_id}.json"
    if not order_file.exists():
        return jsonify(status='error', error='order_not_found'), 404

    with open(order_file, 'r', encoding='utf-8') as f:
        order = json.load(f)

    payment_id = 'PS-' + uuid.uuid4().hex[:10]
    order['payment'] = {'id': payment_id, 'status': 'paid', 'ts': datetime.utcnow().isoformat()}
    with open(order_file, 'w', encoding='utf-8') as f:
        json.dump(order, f, ensure_ascii=False, indent=2)

    notif_file = BASE_DIR / 'data' / 'notifications.log'
    notif_file.parent.mkdir(parents=True, exist_ok=True)
    with open(notif_file, 'a', encoding='utf-8') as f:
        f.write(f"{datetime.utcnow().isoformat()} ORDER_PAID {order_id} {payment_id}\n")

    smtp_host  = os.environ.get('SMTP_HOST')
    smtp_port  = int(os.environ.get('SMTP_PORT', '587')) if os.environ.get('SMTP_PORT') else None
    smtp_user  = os.environ.get('SMTP_USER')
    smtp_pass  = os.environ.get('SMTP_PASS')
    notify_to  = os.environ.get('NOTIFY_EMAIL')
    if smtp_host and smtp_port and notify_to:
        try:
            msg = EmailMessage()
            msg['Subject'] = f"Order paid {order_id}"
            msg['From']    = smtp_user or 'no-reply@example.com'
            msg['To']      = notify_to
            msg.set_content(f"Order {order_id} paid. Payment id: {payment_id}\n{order}")
            with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as s:
                s.starttls()
                if smtp_user and smtp_pass:
                    s.login(smtp_user, smtp_pass)
                s.send_message(msg)
        except Exception as e:
            app.logger.exception('Failed to send notification email: %s', e)

    return jsonify(status='ok', order_id=order_id)


@app.route('/calculate_delivery', methods=['POST'])
def calculate_delivery():
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


@app.route('/confirmation_paid')
def confirmation_paid():
    order_id   = request.args.get('order_id')
    orders_dir = BASE_DIR / 'data' / 'orders'
    order_file = orders_dir / f"{order_id}.json"
    if not order_file.exists():
        flash('Оплаченный заказ не найден', 'error')
        return redirect(url_for('index'))
    with open(order_file, 'r', encoding='utf-8') as f:
        order = json.load(f)
    return render_template('confirmation.html', order=order)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
