import os
import json
from google import genai
from google.genai import types
from dotenv import load_dotenv
from catalog_service import get_catalog

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

SYSTEM_PROMPT = (
    "You are a supplement recommendation assistant for a fitness app. "
    "You are given a user's fitness profile and a catalog of available supplement products "
    "(grouped by category, with name, price in INR, rating, and review count). "
    "Recommend 3-6 products from the catalog that best match the user's goals and profile. "
    "Only recommend products that actually appear in the provided catalog — never invent products. "
    "For each recommendation, briefly explain why it fits their goals. "
    "Respond ONLY with valid JSON in this exact structure, no markdown, no extra text:\n"
    "{\n"
    '  "recommendations": [\n'
    "    {\n"
    '      "product_name": string (must exactly match a name from the catalog),\n'
    '      "category": string,\n'
    '      "reason": string (1-2 sentences on why this fits their goals)\n'
    "    }\n"
    "  ],\n"
    '  "general_note": string (brief overall guidance, e.g. reminder that supplements support but don\'t replace a good diet)\n'
    "}"
)

def build_profile_summary(profile: dict) -> str:
    goals = ", ".join(profile.get("goals", [])) or "not specified"
    return (
        f"Age: {profile.get('age', 'unknown')}, Gender: {profile.get('gender', 'unspecified')}, "
        f"Weight: {profile.get('weight', 'unknown')}kg, Activity level: {profile.get('activityLevel', 'unspecified')}, "
        f"Goals: {goals}"
    )

def build_catalog_summary(catalog: dict) -> str:
    lines = []
    for category, products in catalog.items():
        lines.append(f"\n{category}:")
        for p in products:
            lines.append(f"  - {p['name']} | ₹{p['price']} | rating {p['rating']} ({p['reviews']})")
    return "\n".join(lines)

def get_recommendations(profile: dict) -> dict:
    catalog = get_catalog()
    catalog_text = build_catalog_summary(catalog)
    profile_text = build_profile_summary(profile)

    prompt = f"User profile:\n{profile_text}\n\nAvailable catalog:{catalog_text}"

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            response_mime_type="application/json",
        ),
    )

    result = json.loads(response.text)

    # attach full product details (image, url, price) by matching names back to the catalog
    all_products = {p["name"]: p for products in catalog.values() for p in products}
    for rec in result.get("recommendations", []):
        matched = all_products.get(rec["product_name"])
        if matched:
            rec.update(matched)

    return result