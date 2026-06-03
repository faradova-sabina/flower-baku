import json
from pathlib import Path
from collections import Counter


def load_offers(file_path: Path):
    if not file_path.exists():
        return []

    with file_path.open("r", encoding="utf-8") as f:
        return json.load(f)


def analyze_offers(offers):
    summary = {
        "total_offers": len(offers),
        "categories": {},
        "average_price": 0,
        "min_price": None,
        "max_price": None,
        "top_flowers": [],
    }
    if not offers:
        return summary

    prices = [offer["price"] for offer in offers if isinstance(offer.get("price"), (int, float))]
    summary["average_price"] = round(sum(prices) / len(prices), 2) if prices else 0
    summary["min_price"] = min(prices) if prices else 0
    summary["max_price"] = max(prices) if prices else 0

    categories = Counter(offer.get("category", "Другие") for offer in offers)
    summary["categories"] = dict(categories)

    flowers = Counter()
    for offer in offers:
        for flower in offer.get("composition", []):
            flowers[flower] += 1
    summary["top_flowers"] = [flower for flower, _ in flowers.most_common(5)]

    return summary


def find_offer(offers, offer_id):
    return next((offer for offer in offers if str(offer.get("id")) == str(offer_id)), None)
