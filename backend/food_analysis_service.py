from transformers import BlipProcessor, BlipForConditionalGeneration
from PIL import Image
import io
from food_classifier_service import predict_food
from gemini_service import client
from google.genai import types
import json

blip_processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
blip_model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base")

def get_caption(image_bytes: bytes) -> str:
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    inputs = blip_processor(image, return_tensors="pt")
    output = blip_model.generate(**inputs, max_new_tokens=30)
    return blip_processor.decode(output[0], skip_special_tokens=True)

MACRO_PROMPT_TEMPLATE = (
    "You are a nutrition analysis assistant. Analyze this food based on the information given "
    "and estimate its nutrition. Respond ONLY with valid JSON, no markdown:\n"
    "{{\n"
    '  "food_name": string,\n'
    '  "estimated_portion": string,\n'
    '  "calories": number,\n'
    '  "protein_g": number,\n'
    '  "carbs_g": number,\n'
    '  "fat_g": number,\n'
    '  "confidence_note": string,\n'
    '  "suggestions": string\n'
    "}}\n\n"
    "Information available:\n{context}"
)

def analyze_food_photo(image_bytes: bytes) -> dict:
    cnn_result = predict_food(image_bytes)
    caption = get_caption(image_bytes)

    if cnn_result["is_confident"]:
        context = (
            f"A trained image classifier identified this as: {cnn_result['food_name']} "
            f"(confidence: {cnn_result['confidence']:.0%}). "
            f"A general image caption of the photo: \"{caption}\""
        )
    else:
        context = (
            f"A trained image classifier was uncertain about this image "
            f"(best guess: {cnn_result['food_name']}, only {cnn_result['confidence']:.0%} confidence — "
            f"treat this as unreliable). "
            f"Rely primarily on this general image caption instead: \"{caption}\""
        )

    prompt = MACRO_PROMPT_TEMPLATE.format(context=context)

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[
            prompt,
            types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
        ],
        config=types.GenerateContentConfig(response_mime_type="application/json"),
    )

    result = json.loads(response.text)
    result["cnn_prediction"] = cnn_result["food_name"]
    result["cnn_confidence"] = cnn_result["confidence"]
    result["cnn_trusted"] = cnn_result["is_confident"]
    result["caption"] = caption
    return result