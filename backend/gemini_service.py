import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def get_simple_response(message: str) -> str:
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=message,
    )
    return response.text

def build_system_context(profile: dict) -> str:
    goals = ", ".join(profile.get("goals", [])) or "not specified"
    return (
        "You are a knowledgeable, encouraging fitness and nutrition assistant. "
        f"The user is {profile.get('age', 'unknown')} years old, gender: {profile.get('gender', 'unspecified')}, "
        f"activity level: {profile.get('activityLevel', 'unspecified')}, "
        f"weight: {profile.get('weight', 'unknown')}kg, height: {profile.get('height', 'unknown')}cm, "
        f"goals: {goals}. "
        "Tailor your advice to these details. Keep responses practical and concise unless the user asks for depth."
    )

def get_chat_response(message: str, profile: dict, history: list, pdf_context: str = None) -> str:
    system_context = build_system_context(profile)
    if pdf_context:
        system_context += (
            "\n\nThe user has uploaded document(s). Here are the most relevant excerpts "
            "for their current question:\n" + pdf_context +
            "\n\nUse this information to answer if relevant. If the excerpts don't contain "
            "the answer, say so rather than guessing."
        )

    contents = []
    for msg in history:
        role = "user" if msg["role"] == "user" else "model"
        contents.append(types.Content(role=role, parts=[types.Part(text=msg["text"])]))
    contents.append(types.Content(role="user", parts=[types.Part(text=message)]))

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=contents,
        config=types.GenerateContentConfig(system_instruction=system_context),
    )
    return response.text

def analyze_food_image(image_bytes: bytes, mime_type: str) -> str:
    prompt = (
        "You are a nutrition analysis assistant. Look at this food image and identify "
        "what food(s) are shown. Estimate the portion size as best you can from visual cues. "
        "Respond ONLY with valid JSON in this exact structure, no markdown formatting, no extra text:\n"
        "{\n"
        '  "food_name": string,\n'
        '  "estimated_portion": string,\n'
        '  "calories": number,\n'
        '  "protein_g": number,\n'
        '  "carbs_g": number,\n'
        '  "fat_g": number,\n'
        '  "confidence_note": string (a short note on estimation accuracy/limitations),\n'
        '  "suggestions": string (a short nutritional suggestion relevant to typical fitness goals)\n'
        "}"
    )

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[
            prompt,
            types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
        ],
        config=types.GenerateContentConfig(response_mime_type="application/json"),
    )
    return response.text