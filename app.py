from pathlib import Path
from flask import Flask, render_template, request, redirect, url_for, flash

from offers import load_offers, analyze_offers, find_offer
import json
import uuid
import smtplib
import os
from email.message import EmailMessage
from datetime import datetime
from flask import jsonify

BASE_DIR = Path(__file__).resolve().parent
DATA_FILE = BASE_DIR / "data" / "az_offers.json"

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev-secret-change-in-prod")

OCCASIONS = [
    {"key": "all",        "label": "Все"},
    {"key": "romance",    "label": "Свидание"},
    {"key": "birthday",   "label": "День рождения"},
    {"key": "wedding",    "label": "Свадьба"},
    {"key": "graduation", "label": "Выпускной"},
    {"key": "anniversary","label": "Юбилей"},
    {"key": "corporate",  "label": "Корпоратив"},
    {"key": "just_because","label": "Просто так"},
]

@app.context_processor
def inject_now():
    return {'now': datetime.now()}


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

def is_flower_offer(offer):
    text = ' '.join([
        offer.get('title', ''),
        offer.get('description', ''),
        offer.get('category', ''),
        ' '.join(offer.get('composition', [])),
    ]).lower()
    return any(kw in text for kw in FLOWER_KEYWORDS)


_raw_offers = load_offers(DATA_FILE)
offers = [o for o in _raw_offers if is_flower_offer(o)]
analysis = analyze_offers(offers)


@app.route("/")
def index():
    fresh = [o for o in load_offers(DATA_FILE) if is_flower_offer(o)]
    selected = request.args.get("occasion", "all")
    if selected and selected != "all":
        filtered = [o for o in fresh if selected in o.get("occasion", [])]
    else:
        filtered = fresh
    return render_template(
        "index.html",
        offers=filtered,
        all_offers_json=json.dumps(fresh, ensure_ascii=False),
        analysis=analyze_offers(fresh),
        occasions=OCCASIONS,
        selected_occasion=selected,
    )


@app.route("/recommend", methods=["POST"])
def recommend():
    data = request.get_json(force=True)
    occasion  = data.get("occasion", "")
    for_whom  = data.get("for_whom", "")
    age_range = data.get("age_range", "")
    budget    = int(data.get("budget", 9999))
    flowers   = data.get("flowers", "")
    color     = data.get("color", "")

    fresh = [o for o in load_offers(DATA_FILE) if is_flower_offer(o)]

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
        if flowers and flowers != "any":
            comp = " ".join(offer.get("composition", [])).lower()
            if flowers.lower() in comp:
                s += 15
        if color and color in offer.get("colors", []):
            s += 10
        return s

    scored = sorted(fresh, key=score, reverse=True)
    top3 = scored[:3]
    return jsonify([{
        "id": o["id"],
        "title": o["title"],
        "price": o["price"],
        "photo": o.get("photo", ""),
        "shop": o.get("shop", ""),
        "description": o.get("description", ""),
        "delivery_time": o.get("delivery_time", ""),
        "score": score(o),
    } for o in top3])


@app.route("/order/<offer_id>", methods=["GET", "POST"])
def order(offer_id):
    fresh = [o for o in load_offers(DATA_FILE) if is_flower_offer(o)]
    offer = find_offer(fresh, offer_id)
    if offer is None:
        flash("Выбранное предложение не найдено.", "error")
        return redirect(url_for("index"))

    if request.method == "POST":
        name     = request.form.get("name", "").strip()
        phone    = request.form.get("phone", "").strip()
        address  = request.form.get("address", "").strip()
        quantity = request.form.get("quantity", "1").strip()

        if not name or not phone or not address:
            flash("Пожалуйста, заполните все поля заказа.", "error")
            return render_template("order.html", offer=offer)

        order_id   = str(uuid.uuid4())
        order_data = {
            "order_id": order_id,
            "customer_name": name,
            "phone": phone,
            "address": address,
            "quantity": int(quantity) if quantity.isdigit() else 1,
            "offer": offer,
            "created": datetime.utcnow().isoformat(),
        }
        orders_dir = BASE_DIR / 'data' / 'orders'
        orders_dir.mkdir(parents=True, exist_ok=True)
        with open(orders_dir / f"{order_id}.json", 'w', encoding='utf-8') as f:
            json.dump(order_data, f, ensure_ascii=False, indent=2)

        return render_template("confirmation.html", order=order_data)

    return render_template("order.html", offer=offer)


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
    notif_file.write_text(
        f"{datetime.utcnow().isoformat()} ORDER_PAID {order_id} {payment_id}\n",
        encoding='utf-8'
    )

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
