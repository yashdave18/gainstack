from supplement_agent import get_recommendations

# fake profile for testing — mimics what would come from Firestore
test_profile = {
    "age": 20,
    "gender": "male",
    "weight": 69,
    "activityLevel": "light",
    "goals": ["muscle_gain", "weight_loss"],
}

result = get_recommendations(test_profile)

print("General note:", result.get("general_note"))
print()
for rec in result.get("recommendations", []):
    print(f"- {rec.get('product_name')} ({rec.get('category')})")
    print(f"  Reason: {rec.get('reason')}")
    print(f"  Price: ₹{rec.get('price')} | Rating: {rec.get('rating')} | URL: {rec.get('url')}")
    print()