import requests
from bs4 import BeautifulSoup
import time
import re

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; FitnessProjectBot/1.0; educational project)"
}

CATEGORY_URLS = {
    "protein": "https://www.healthkart.com/protein-supplement?navKey=SCT-snt-pt&cache=1",
    "protein_foods": "https://www.healthkart.com/protein-bars?navKey=SCT-snt-pt-pb~hfd-pnbut~hfd-brkfst-snks~hfd-brf-oat~hfd-cereals~hfd-pro-shks&cache=1",
    "pre_post_workout": "https://www.healthkart.com/pre-post-workout?navKey=SCT-snt-pw&cache=1",
    "workout_essentials": "https://www.healthkart.com/workout-essentials?navKey=SCT-snt-we~nut-mul&cache=1",
    "mass_gainers": "https://www.healthkart.com/mass-gainers?navKey=SCT-nut-gn-mas~snut-weigain~ayur-hrbl-wgain&cache=1",
    "omega": "https://www.healthkart.com/omega-fatty-acids?navKey=SCT-vns-omega&cache=1",
    "multivitamins": "https://www.healthkart.com/multivitamins?navKey=SCT-vns-Multivit&cache=1",
}

def clean_price(raw: str) -> float | None:
    if not raw:
        return None
    cleaned = re.sub(r"[^\d.]", "", raw)
    try:
        return float(cleaned)
    except ValueError:
        return None

def scrape_category(url: str, max_products: int = 15) -> list[dict]:
    response = requests.get(url, headers=HEADERS, timeout=10)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")

    products = []
    cards = soup.select("div.hk-variants-box-body-vis")

    for card in cards[:max_products]:
        name_el = card.select_one("div.variant-name")
        price_el = card.select_one("span.variant-price")  # exact token — avoids the wrapper collision
        image_el = card.select_one("img.offscreenimage")
        rating_el = card.select_one("div.flexing-rating-child")
        reviews_el = card.select_one("div.flexing-reviews")
        link_el = card.select_one("a.variant-img-container")

        name = name_el.get_text(strip=True) if name_el else None
        price = clean_price(price_el.get_text(strip=True)) if price_el else None
        image_url = image_el.get("data-original") or image_el.get("src") if image_el else None
        rating = rating_el.get_text(strip=True) if rating_el else None
        reviews = reviews_el.get_text(strip=True) if reviews_el else None
        href = link_el.get("href") if link_el else None

        if name and href:
            products.append({
                "name": name,
                "price": price,
                "currency": "INR",
                "rating": rating,
                "reviews": reviews,
                "image": image_url,
                "url": "https://www.healthkart.com" + href,
            })

    return products

def scrape_all_categories() -> dict[str, list[dict]]:
    all_products = {}
    for category, url in CATEGORY_URLS.items():
        try:
            all_products[category] = scrape_category(url)
        except Exception as e:
            print(f"Failed to scrape {category}: {e}")
            all_products[category] = []
        time.sleep(2)
    return all_products