import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

def test_markup_price_rounds_up():
    from app import markup_price
    assert markup_price(100) == 110
    assert markup_price(55) == 61   # math.ceil(55*1.1) = ceil(60.5) = 61
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
