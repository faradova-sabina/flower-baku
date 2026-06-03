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
DATA_FILE = BASE_DIR / "data" / "az_offers.json"  # Changed to Azerbaijan offers

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev-secret-change-in-prod")

# Add datetime.now to template context
@app.context_processor
def inject_now():
    return {'now': datetime.now()}

FLOWER_KEYWORDS = {
    'rose', 'roses', 'peony', 'peonies', 'tulip', 'tulips', 'lily', 'lilies',
    'orchid', 'orchids', 'gerbera', 'sunflower', 'gypsophila', 'chrysanthemum',
    'anthurium', 'ranunculus', 'lisianthus', 'eustoma', 'lavender', 'carnation',
    'aster', 'daisy', 'iris', 'freesia', 'hyacinth', 'amaranthus', 'statice',
    'heliconia', 'celosia', 'lagurus', 'eucalyptus', 'greenery', 'букет',
    'bouquet', 'floral', 'flower', 'bloom', 'blossom', 'petal',
    'красная роза', 'белая роза', 'гипсофила', 'пион', 'тюльпан',
    'герберы', 'лилии', 'орхидеи', 'хризантема', 'подсолнух', 'dried',
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
    return render_template("index.html", offers=fresh, analysis=analyze_offers(fresh))


@app.route("/order/<offer_id>", methods=["GET", "POST"])
def order(offer_id):
    offer = find_offer(offers, offer_id)
    if offer is None:
        flash("Выбранное предложение не найдено.", "error")
        return redirect(url_for("index"))

    if request.method == "POST":
        name = request.form.get("name", "").strip()
        phone = request.form.get("phone", "").strip()
        address = request.form.get("address", "").strip()
        quantity = request.form.get("quantity", "1").strip()

        if not name or not phone or not address:
            flash("Пожалуйста, заполните все поля заказа.", "error")
            return render_template("order.html", offer=offer)

        order_id = str(uuid.uuid4())
        order_data = {
            "order_id": order_id,
            "customer_name": name,
            "phone": phone,
            "address": address,
            "quantity": int(quantity) if quantity.isdigit() else 1,
            "offer": offer,
            "created": datetime.utcnow().isoformat(),
        }
        # store temporary order snapshot
        orders_dir = BASE_DIR / 'data' / 'orders'
        orders_dir.mkdir(parents=True, exist_ok=True)
        with open(orders_dir / f"{order_id}.json", 'w', encoding='utf-8') as f:
            json.dump(order_data, f, ensure_ascii=False, indent=2)

        return render_template("confirmation.html", order=order_data)

    return render_template("order.html", offer=offer)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)


@app.route('/pay_sandbox', methods=['POST'])
def pay_sandbox():
    """Simulate a payment gateway sandbox. Accepts JSON order and returns a status."""
    data = request.get_json()
    if not data or 'order_id' not in data:
        return jsonify(status='error', error='invalid_order'), 400

    order_id = data['order_id']
    orders_dir = BASE_DIR / 'data' / 'orders'
    order_file = orders_dir / f"{order_id}.json"
    if not order_file.exists():
        return jsonify(status='error', error='order_not_found'), 404

    with open(order_file, 'r', encoding='utf-8') as f:
        order = json.load(f)

    # simulate payment success
    payment_id = 'PS-' + uuid.uuid4().hex[:10]
    order['payment'] = {'id': payment_id, 'status': 'paid', 'ts': datetime.utcnow().isoformat()}
    with open(order_file, 'w', encoding='utf-8') as f:
        json.dump(order, f, ensure_ascii=False, indent=2)

    # notification: write to notifications log
    notif_file = BASE_DIR / 'data' / 'notifications.log'
    notif_file.parent.mkdir(parents=True, exist_ok=True)
    notif_file.write_text(f"{datetime.utcnow().isoformat()} ORDER_PAID {order_id} {payment_id}\n", encoding='utf-8')

    # optionally send email if SMTP configured
    smtp_host = os.environ.get('SMTP_HOST')
    smtp_port = int(os.environ.get('SMTP_PORT', '587')) if os.environ.get('SMTP_PORT') else None
    smtp_user = os.environ.get('SMTP_USER')
    smtp_pass = os.environ.get('SMTP_PASS')
    notify_to = os.environ.get('NOTIFY_EMAIL')
    if smtp_host and smtp_port and notify_to:
        try:
            msg = EmailMessage()
            msg['Subject'] = f"Order paid {order_id}"
            msg['From'] = smtp_user or 'no-reply@example.com'
            msg['To'] = notify_to
            msg.set_content(f"Order {order_id} has been paid. Payment id: {payment_id}\nOrder: {order}")
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
    order_id = request.args.get('order_id')
    orders_dir = BASE_DIR / 'data' / 'orders'
    order_file = orders_dir / f"{order_id}.json"
    if not order_file.exists():
        flash('Оплаченный заказ не найден', 'error')
        return redirect(url_for('index'))
    with open(order_file, 'r', encoding='utf-8') as f:
        order = json.load(f)
    return render_template('confirmation.html', order=order)
