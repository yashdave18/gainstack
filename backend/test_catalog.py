from catalog_service import get_catalog
import time

start = time.time()
catalog = get_catalog(force_refresh=True)
elapsed = time.time() - start

for category, products in catalog.items():
    print(f"{category}: {len(products)} products")

print(f"\nTook {elapsed:.2f}s")