from firebase_config import db
from scraper_service import scrape_all_categories
from datetime import datetime, timezone, timedelta

CACHE_MAX_AGE_HOURS = 12

def get_catalog(force_refresh: bool = False) -> dict[str, list[dict]]:
    meta_ref = db.collection("product_catalog").document("_meta")
    meta_doc = meta_ref.get()

    needs_refresh = force_refresh or not meta_doc.exists
    if meta_doc.exists and not force_refresh:
        last_scraped = meta_doc.to_dict().get("lastScraped")
        if last_scraped:
            age = datetime.now(timezone.utc) - last_scraped
            needs_refresh = age > timedelta(hours=CACHE_MAX_AGE_HOURS)

    if needs_refresh:
        fresh_data = scrape_all_categories()
        for category, products in fresh_data.items():
            db.collection("product_catalog").document(category).set({"products": products})
        meta_ref.set({"lastScraped": datetime.now(timezone.utc)})
        return fresh_data

    # serve from cache
    catalog = {}
    for category in ["protein", "protein_foods", "pre_post_workout", "workout_essentials", "mass_gainers", "omega", "multivitamins"]:
        doc = db.collection("product_catalog").document(category).get()
        catalog[category] = doc.to_dict().get("products", []) if doc.exists else []
    return catalog