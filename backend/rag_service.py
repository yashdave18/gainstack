import os
from google import genai
from dotenv import load_dotenv
from firebase_config import db
from datetime import datetime, timezone
import numpy as np

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 150) -> list[str]:
    """Split text into overlapping chunks by character count."""
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return [c.strip() for c in chunks if c.strip()]

def embed_text(text: str) -> list[float]:
    result = client.models.embed_content(
        model="gemini-embedding-001",
        contents=text,
    )
    return result.embeddings[0].values

def store_pdf_chunks(uid: str, filename: str, text: str):
    chunks = chunk_text(text)
    collection = db.collection("users").document(uid).collection("pdf_chunks")

    for chunk in chunks:
        embedding = embed_text(chunk)
        collection.add({
            "text": chunk,
            "embedding": embedding,
            "source_file": filename,
            "timestamp": datetime.now(timezone.utc),
        })
    return len(chunks)

def cosine_similarity(a: list[float], b: list[float]) -> float:
    a, b = np.array(a), np.array(b)
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

def retrieve_relevant_chunks(uid: str, query: str, top_k: int = 4) -> list[str]:
    query_embedding = embed_text(query)
    collection = db.collection("users").document(uid).collection("pdf_chunks")
    all_chunks = collection.get()

    scored = []
    for doc in all_chunks:
        data = doc.to_dict()
        score = cosine_similarity(query_embedding, data["embedding"])
        scored.append((score, data["text"]))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [text for _, text in scored[:top_k]]