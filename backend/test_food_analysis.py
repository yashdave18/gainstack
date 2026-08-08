from food_analysis_service import analyze_food_photo

with open("../images/egg.jpg", "rb") as f:  # a real food photo
    result = analyze_food_photo(f.read())

import json
print(json.dumps(result, indent=2))