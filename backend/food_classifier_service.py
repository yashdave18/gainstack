import json
import numpy as np
from tensorflow import keras
from PIL import Image
import io

MODEL_PATH = "models/food_classifier.h5"
CLASS_NAMES_PATH = "models/class_names.json"
IMG_SIZE = 224
CONFIDENCE_THRESHOLD = 0.80  # below this, don't trust the CNN's label

model = keras.models.load_model(MODEL_PATH)

with open(CLASS_NAMES_PATH) as f:
    class_names = json.load(f)

def predict_food(image_bytes: bytes) -> dict:
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image = image.resize((IMG_SIZE, IMG_SIZE))
    arr = np.array(image, dtype=np.float32)
    arr = keras.applications.efficientnet.preprocess_input(arr)
    arr = np.expand_dims(arr, axis=0)

    predictions = model.predict(arr, verbose=0)[0]
    top_idx = np.argmax(predictions)
    confidence = float(predictions[top_idx])
    predicted_class = class_names[top_idx].replace("_", " ")

    return {
        "food_name": predicted_class,
        "confidence": round(confidence, 4),
        "is_confident": confidence >= CONFIDENCE_THRESHOLD,
    }