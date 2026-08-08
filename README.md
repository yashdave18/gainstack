# GainStack

An AI-powered fitness platform combining a Gemini-based chatbot, a custom-trained food classification CNN, agentic supplement recommendations, browser-native motion tracking, and more, built with a React frontend and a Python/FastAPI backend.

## Features

### Authentication
- Google-only sign-in via Firebase Auth
- Backend independently verifies Firebase ID tokens on every request (no trust placed in client-sent data alone)

### Onboarding
- Collects gender, age, multi-select fitness goals, activity level, weight, and height
- Gates access to the rest of the app until complete

### AI Fitness Chatbot
- Persistent conversation memory (Firestore-backed)
- Profile-aware responses (uses onboarding data as context)
- Food photo upload → Gemini-powered macro breakdown with suggestions
- PDF upload with Retrieval-Augmented Generation (RAG): chunking, embeddings, cosine-similarity retrieval, and grounded answers

### Workout Logging
- Log exercises with sets, reps, and weight
- Full history view, stored per-user in Firestore

### Gym Finder
- Google Places API integration
- Requests browser geolocation and returns nearby gyms with ratings and addresses

### Motion Tracker (no wearables required)
- **Step counting**: real-time peak detection on `DeviceMotionEvent` accelerometer data
- **Calorie estimation**: MET-based formulas using step count and logged workouts
- **Heart rate**: camera-based photoplethysmography (PPG): samples the phone camera's red channel over 15 seconds, detrends the signal, and estimates BPM via frequency-domain analysis

### Supplement Recommendation Agent
- Web scraper (BeautifulSoup) pulling live product data across 7 supplement categories from a real retailer
- Firestore-based caching layer (12-hour refresh) to minimize scraping load
- Gemini-powered, profile-aware recommendations grounded strictly in the scraped catalog (no hallucinated products)
- Redirects to the retailer's real product page for checkout — no payment handling or stored user financial data

### Food Analyzer (custom ML pipeline)
- **Custom-trained CNN**: EfficientNetB0, transfer learning + fine-tuning on the full 101-class Food-101 dataset, ~75.7% validation accuracy
- **BLIP** (pretrained image captioning model) generates a descriptive caption for additional context
- **Gemini** fuses the CNN's classification (when confident), BLIP's caption, and direct image analysis to produce final macro estimates
- Confidence-based routing: low-confidence CNN predictions are flagged and de-prioritized in favor of Gemini's own visual reasoning

## Tech Stack

**Frontend:** React (Vite), Tailwind CSS, React Router
**Backend:** Python, FastAPI
**Database & Auth:** Firebase (Authentication, Firestore)
**AI/ML:**
- Google Gemini API (`google-genai`) : chat, vision, structured JSON generation
- TensorFlow / Keras : custom CNN training (EfficientNetB0, transfer learning)
- Hugging Face Transformers : BLIP image captioning
- Google Places API : gym search

**Other:** BeautifulSoup4 (web scraping), pypdf (PDF text extraction), NumPy

## Project Structure

```
gainstack/
├── backend/
│   ├── main.py                    # FastAPI app, all API routes
│   ├── firebase_config.py         # Firebase Admin SDK init
│   ├── dependencies.py            # Auth token verification
│   ├── gemini_service.py          # Chatbot logic, memory, RAG-aware responses
│   ├── rag_service.py             # PDF chunking, embeddings, retrieval
│   ├── food_classifier_service.py # Custom CNN inference
│   ├── food_analysis_service.py   # CNN + BLIP + Gemini fusion pipeline
│   ├── maps_service.py            # Google Places integration
│   ├── scraper_service.py         # Supplement catalog scraper
│   ├── catalog_service.py         # Firestore caching layer for scraped data
│   ├── supplement_agent.py        # Gemini-based recommendation logic
│   └── models/                    # Trained CNN weights + class labels
├── frontend/
│   └── src/
│       ├── pages/                 # One component per feature/route
│       ├── context/                # Firebase auth context
│       ├── hooks/                 # useMotionSensors, useCameraPPG
│       └── services/               # API client, Firebase config
└── images/                        # Test images used during development
```

## Setup

### Prerequisites
- Node.js and npm
- Python 3.10+
- A Firebase project (Auth + Firestore enabled)
- A Google Gemini API key
- A Google Cloud Places API key

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate   # or source venv/bin/activate on Mac/Linux
pip install -r requirements.txt
```

Create `backend/.env`:
```
GEMINI_API_KEY=your_key_here
GOOGLE_MAPS_API_KEY=your_key_here
```

Add your Firebase service account key as `backend/firebase-service-account.json` (from Firebase Console → Project Settings → Service Accounts).

Run:
```bash
python -m uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
```

Create `frontend/.env.local` with your Firebase web config:
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Run:
```bash
npm run dev
```

## Model Training

The food classifier was trained via transfer learning (EfficientNetB0, ImageNet-pretrained) on the full Food-101 dataset (101 classes, ~75,750 training images), using a two-phase approach: frozen-base training followed by fine-tuning the top 30 layers at a reduced learning rate. Training used `ReduceLROnPlateau` and `EarlyStopping` callbacks, trained on a Kaggle GPU notebook.

Final validation accuracy: **~75.7%**

## Scope of Improvement

- Allow users to update their profile details after onboarding (currently a one-time form with no edit flow)
- Add full chat history browsing/search to the chatbot (currently limited to the most recent messages used as context)
- More efficient caching in the web scraper (smarter invalidation, incremental updates instead of full re-scrapes)
- Various backend changes (tightened error handling, rate-limiting per user, migrating dev-only workarounds to production-ready equivalents)

## Notes

- Motion tracking (steps, heart rate) requires a mobile device with real sensors — desktop browsers won't produce data.
- Camera-based heart rate measurement and browser motion sensors require a secure (HTTPS) context; local development over plain HTTP will not work for these features on most devices.
- The supplement scraper respects the target site's `robots.txt` and paces requests to avoid excessive load.
