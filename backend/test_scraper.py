from scraper_service import scrape_category

url = "https://www.healthkart.com/whey-protein?navKey=SCT-snt-pt-wp&cache=1"
products = scrape_category(url)

print(f"Found {len(products)} products\n")
for p in products:
    print(p)
    print()