# import os
# import requests
# from dotenv import load_dotenv

# load_dotenv()
# API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")

# PLACES_URL = "https://places.googleapis.com/v1/places:searchNearby"

# def find_nearby_gyms(lat: float, lng: float, radius_m: int = 5000) -> list[dict]:
#     headers = {
#         "Content-Type": "application/json",
#         "X-Goog-Api-Key": API_KEY,
#         "X-Goog-FieldMask": (
#             "places.id,places.displayName,places.formattedAddress,"
#             "places.location,places.rating,places.userRatingCount,"
#             "places.photos"
#         ),
#     }
#     body = {
#         "includedTypes": ["gym"],
#         "maxResultCount": 15,
#         "locationRestriction": {
#             "circle": {
#                 "center": {"latitude": lat, "longitude": lng},
#                 "radius": radius_m,
#             }
#         },
#     }

#     response = requests.post(PLACES_URL, headers=headers, json=body)
#     response.raise_for_status()
#     data = response.json()
    
#     gyms = []
#     for place in data.get("places", []):
#         gyms.append({
#             "id": place.get("id"),
#             "name": place.get("displayName", {}).get("text", "Unknown"),
#             "address": place.get("formattedAddress", ""),
#             "lat": place.get("location", {}).get("latitude"),
#             "lng": place.get("location", {}).get("longitude"),
#             "rating": place.get("rating"),
#             "ratingCount": place.get("userRatingCount"),
#         })
#     return gyms
import os
import requests
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")

PLACES_URL = "https://places.googleapis.com/v1/places:searchNearby"

def find_nearby_gyms(lat: float, lng: float, radius_m: int = 5000) -> list[dict]:
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": API_KEY,
        "X-Goog-FieldMask": (
            "places.id,places.displayName,places.formattedAddress,"
            "places.location,places.rating,places.userRatingCount,"
            "places.photos"
        ),
    }
    body = {
        "includedTypes": ["gym"],
        "maxResultCount": 15,
        "locationRestriction": {
            "circle": {
                "center": {"latitude": lat, "longitude": lng},
                "radius": radius_m,
            }
        },
    }

    response = requests.post(PLACES_URL, headers=headers, json=body)
    if not response.ok:
        print("Google API error response:", response.text)
    response.raise_for_status()
    data = response.json()

    gyms = []
    for place in data.get("places", []):
        gyms.append({
            "id": place.get("id"),
            "name": place.get("displayName", {}).get("text", "Unknown"),
            "address": place.get("formattedAddress", ""),
            "lat": place.get("location", {}).get("latitude"),
            "lng": place.get("location", {}).get("longitude"),
            "rating": place.get("rating"),
            "ratingCount": place.get("userRatingCount"),
        })
    return gyms