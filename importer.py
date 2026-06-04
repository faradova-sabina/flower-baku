"""Simple importer to add local offers from JSON or CSV placed in website/local_sources/"""
import json
from pathlib import Path
import csv

ROOT = Path(__file__).parent
DATA_FILE = ROOT / 'data' / 'local_offers.json'
SOURCES = ROOT / 'local_sources'


def import_sources():
    offers = []
    if DATA_FILE.exists():
        offers = json.loads(DATA_FILE.read_text(encoding='utf-8'))

    # scan for .json files
    for p in SOURCES.glob('*.json'):
        try:
            data = json.loads(p.read_text(encoding='utf-8'))
            if isinstance(data, list):
                offers.extend(data)
            elif isinstance(data, dict):
                offers.append(data)
            print('Imported', p.name)
        except Exception as e:
            print('Failed', p.name, e)

    # scan for CSV
    for p in SOURCES.glob('*.csv'):
        try:
            with p.open('r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    # expect columns: id,title,category,composition,price,description,delivery_time
                    comp = [x.strip() for x in row.get('composition','').split('|') if x.strip()]
                    offer = {
                        'id': int(row.get('id') or 0),
                        'title': row.get('title',''),
                        'category': row.get('category',''),
                        'composition': comp,
                        'price': int(row.get('price') or 0),
                        'description': row.get('description',''),
                        'delivery_time': row.get('delivery_time','')
                    }
                    offers.append(offer)
            print('Imported', p.name)
        except Exception as e:
            print('Failed', p.name, e)

    # dedupe by title+price
    uniq = {}
    for off in offers:
        key = (off.get('title'), off.get('price'))
        if key not in uniq:
            uniq[key] = off
    result = list(uniq.values())
    DATA_FILE.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
    print('Saved', DATA_FILE)


if __name__ == '__main__':
    import_sources()
    print('Done')
