from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timezone
from dependencies import get_current_user
from gemini_service import get_simple_response, get_chat_response
from firebase_config import db
from fastapi import UploadFile, File
import json
from gemini_service import analyze_food_image
from pypdf import PdfReader
import io
from rag_service import store_pdf_chunks, retrieve_relevant_chunks
from pydantic import BaseModel
from typing import List, Optional
from maps_service import find_nearby_gyms
from supplement_agent import get_recommendations
from food_analysis_service import analyze_food_photo
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://localhost:5177",
        "http://localhost:5178",
        "http://localhost:5179",
        "http://192.168.1.102:8000",
        "https://curve-bodacious-fabulous.ngrok-free.dev",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "backend is running"}

@app.get("/api/me")
def read_current_user(user: dict = Depends(get_current_user)):
    return {"uid": user["uid"], "email": user.get("email")}

class ChatRequest(BaseModel):
    message: str

@app.post("/api/chat/test")
def chat_test(req: ChatRequest, user: dict = Depends(get_current_user)):
    reply = get_simple_response(req.message)
    return {"reply": reply}

@app.post("/api/chat/message")
def send_chat_message(req: ChatRequest, user: dict = Depends(get_current_user)):
    uid = user["uid"]

    profile_doc = db.collection("users").document(uid).get()
    profile = profile_doc.to_dict() if profile_doc.exists else {}

    messages_ref = (
        db.collection("users").document(uid)
        .collection("chats").document("main")
        .collection("messages")
        .order_by("timestamp")
        .limit_to_last(20)
    )
    history = [doc.to_dict() for doc in messages_ref.get()]

    # NEW: retrieve relevant PDF context, if any PDFs have been uploaded
    relevant_chunks = retrieve_relevant_chunks(uid, req.message)
    pdf_context = "\n\n".join(relevant_chunks) if relevant_chunks else None

    reply = get_chat_response(req.message, profile, history, pdf_context)

    msgs_collection = (
        db.collection("users").document(uid)
        .collection("chats").document("main")
        .collection("messages")
    )
    msgs_collection.add({"role": "user", "text": req.message, "timestamp": datetime.now(timezone.utc)})
    msgs_collection.add({"role": "model", "text": reply, "timestamp": datetime.now(timezone.utc)})

    return {"reply": reply}

@app.get("/api/chat/history")
def get_chat_history(user: dict = Depends(get_current_user)):
    uid = user["uid"]
    messages_ref = (
        db.collection("users").document(uid)
        .collection("chats").document("main")
        .collection("messages")
        .order_by("timestamp")
    )
    messages = [
        {"role": doc.to_dict()["role"], "text": doc.to_dict()["text"]}
        for doc in messages_ref.get()
    ]
    return {"messages": messages}

@app.post("/api/chat/analyze-image")
async def analyze_image(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
):
    uid = user["uid"]
    image_bytes = await file.read()

    raw_result = analyze_food_image(image_bytes, file.content_type)
    macro_data = json.loads(raw_result)

    # save to chat history so it's part of the ongoing conversation memory
    msgs_collection = (
        db.collection("users").document(uid)
        .collection("chats").document("main")
        .collection("messages")
    )
    msgs_collection.add({
        "role": "user",
        "text": f"[Uploaded food image: {file.filename}]",
        "timestamp": datetime.now(timezone.utc),
    })
    msgs_collection.add({
        "role": "model",
        "text": (
            f"{macro_data['food_name']} ({macro_data['estimated_portion']}): "
            f"{macro_data['calories']} kcal — "
            f"P: {macro_data['protein_g']}g, C: {macro_data['carbs_g']}g, F: {macro_data['fat_g']}g. "
            f"{macro_data['suggestions']}"
        ),
        "timestamp": datetime.now(timezone.utc),
    })

    return macro_data

@app.post("/api/chat/upload-pdf")
async def upload_pdf(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
):
    uid = user["uid"]
    pdf_bytes = await file.read()

    reader = PdfReader(io.BytesIO(pdf_bytes))
    text = "\n".join(page.extract_text() or "" for page in reader.pages)

    if not text.strip():
        return {"error": "Couldn't extract any text from this PDF (it may be scanned/image-based)."}

    chunk_count = store_pdf_chunks(uid, file.filename, text)

    return {"filename": file.filename, "chunks_stored": chunk_count}

class Exercise(BaseModel):
    name: str
    sets: int
    reps: int
    weight: float

class WorkoutRequest(BaseModel):
    date: str
    exercises: List[Exercise]
    notes: Optional[str] = ""

@app.post("/api/workouts")
def create_workout(req: WorkoutRequest, user: dict = Depends(get_current_user)):
    uid = user["uid"]
    workout_data = {
        "date": req.date,
        "exercises": [e.model_dump() for e in req.exercises],
        "notes": req.notes,
        "createdAt": datetime.now(timezone.utc),
    }
    doc_ref = db.collection("users").document(uid).collection("workouts").add(workout_data)
    return {"id": doc_ref[1].id, **workout_data}

@app.get("/api/workouts")
def list_workouts(user: dict = Depends(get_current_user)):
    uid = user["uid"]
    workouts_ref = (
        db.collection("users").document(uid)
        .collection("workouts")
        .order_by("createdAt", direction="DESCENDING")
    )
    workouts = []
    for doc in workouts_ref.get():
        data = doc.to_dict()
        data["id"] = doc.id
        workouts.append(data)
    return {"workouts": workouts}

class LocationRequest(BaseModel):
    lat: float
    lng: float

@app.post("/api/gyms/nearby")
def get_nearby_gyms(req: LocationRequest, user: dict = Depends(get_current_user)):
    gyms = find_nearby_gyms(req.lat, req.lng)
    return {"gyms": gyms}

@app.get("/api/supplements/recommendations")
def supplement_recommendations(user: dict = Depends(get_current_user)):
    uid = user["uid"]
    profile_doc = db.collection("users").document(uid).get()
    profile = profile_doc.to_dict() if profile_doc.exists else {}

    result = get_recommendations(profile)
    return result

@app.post("/api/food-analysis/analyze")
async def analyze_food_v2(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
):
    image_bytes = await file.read()
    result = analyze_food_photo(image_bytes)
    return result