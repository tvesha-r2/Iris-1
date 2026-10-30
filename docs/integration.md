# ThumbHeap ML Integration Guide

## Overview

This document covers the complete frontend ↔ backend integration for the ThumbHeap ML thumbnail analysis pipeline.

---

## Frontend Analysis Flow

```
User uploads image (Analyze.tsx)
  │
  ├─ Validate type (PNG/JPG/WEBP) + size (< 20 MB)
  ├─ Show local preview
  ├─ User clicks "Analyse Thumbnail"
  │
  ▼
POST /api/upload  (with JWT)
  │
  ├─ Backend: upload original → Cloudinary
  └─ Backend: save Cloudinary URL → MongoDB; return { id, url }
  │
  ▼
POST /api/analyze with thumbnail_id  (with JWT)
  │
  ├─ Backend: retrieve that user's stored image from Cloudinary
  ├─ Backend: ML pipeline (TranSalNet → PaddleOCR → YuNet → YOLO → Fusion)
  ├─ Backend: upload heatmap overlay → Cloudinary
  └─ Backend: update analysis metadata → MongoDB
  │
  ▼
Response: { id, url, overlay_url, detections, insights }
  │
  ├─ Show original vs heatmap toggle
  ├─ Show detection counts (texts / faces / objects)
  └─ Show AI insights (or "unavailable" message)
```

---

## API Endpoint

```
POST /api/analyze
```

**Authentication:** `Authorization: Bearer <jwt>`

**Request:** `multipart/form-data`  
- `thumbnail_id` — ID returned by `POST /api/upload`
- `file` — image file (PNG, JPG, WEBP); retained for compatibility with existing clients

**Response:**
```json
{
  "id":          "mongo_doc_id",
  "url":         "https://res.cloudinary.com/.../original.jpg",
  "overlay_url": "https://res.cloudinary.com/.../overlay.png",
  "detections": {
    "texts":   2,
    "faces":   1,
    "objects": 3
  },
  "insights": {
    "summary": "...",
    "attention_observations": ["...", "...", "..."],
    "thumbnail_suggestions":  ["...", "...", "..."]
  }
}
```

`insights` is `null` when Groq is unavailable — the ML result is still fully valid.

---

## Authentication

- JWT is stored in `localStorage['auth_token']`
- Read via `useAuth()` from `AuthContext.tsx`
- Login: `POST /auth/login` (OAuth2 form: `username`, `password`)
- Register: `POST /auth/register` (JSON: `email`, `password`)
- Token lifetime: 7 days

---

## Result Display

| Field        | UI Usage                               |
|--------------|----------------------------------------|
| `url`        | "Original" toggle mode                 |
| `overlay_url`| "Attention Heatmap" toggle mode        |
| `detections.texts`   | Text detected count card   |
| `detections.faces`   | Faces detected count card  |
| `detections.objects` | Objects detected count card|
| `insights.summary`               | AI summary text    |
| `insights.attention_observations`| Bullet list        |
| `insights.thumbnail_suggestions` | Numbered list      |

---

## Image storage and refresh

- **Original** is stored in `/api/upload` before analysis starts
- The MongoDB thumbnail record contains the original `cloudinary_url` and is
  returned from `GET /api/thumbnails` as both `url` and `cloudinary_url`
- The Analyze page restores the latest saved image/result from this endpoint
- If analysis fails, the uploaded image remains stored and can be retried by ID
- **Overlay** uploaded after ML inference (non-fatal if fails — `overlay_url` becomes `null`)
- Frontend consumes returned Cloudinary URLs — no direct frontend→Cloudinary upload

---

## MongoDB

Collection: `thumbheap.thumbnails`  
Each document:
```json
{
  "user_id":        "...",
  "filename":       "thumb.jpg",
  "cloudinary_url": "...",
  "overlay_url":    "...",
  "created_at":     "...",
  "ai_scores": {
    "texts_detected":   2,
    "faces_detected":   1,
    "objects_detected": 3
  }
}
```

---

## Groq Integration

- **Location:** `backend/api/groq_insights.py`  
- **Called from:** `backend/api/main.py` inside `/api/analyze` after ML inference  
- **Model:** `llama3-8b-8192`  
- **Key source:** `GROQ_API_KEY` env var — **never exposed to frontend**

Failure behaviour:
- If key missing → `insights: null`
- If API fails / rate-limited → `insights: null`  
- ML analysis result is always returned regardless

---

## Environment Variables

### Backend (`backend/.env`)
```
MONGO_URI=...
JWT_SECRET=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
GROQ_API_KEY=...          ← server-side only, never send to frontend
```

### Frontend (`frontend/.env`)
```
VITE_API_BASE_URL=http://localhost:8000
```

> ⚠️ **GROQ_API_KEY must NEVER appear in `VITE_*` variables or any frontend file.**

---

## Local Development

**Backend:**
```powershell
cd backend
.\.venv-api\Scripts\python.exe -m uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```powershell
cd frontend
npm run dev
```

---

## Failure Behaviour

| Failure | User sees |
|---------|-----------|
| No file selected | Button disabled |
| Invalid file type | Error message below upload zone |
| File too large (> 20 MB) | Error message |
| Unauthenticated | Redirect to `/login` |
| Backend 503 (models loading) | "Pipeline starting up, try again" |
| Cloudinary overlay fails | Heatmap toggle hidden, analysis still shown |
| Groq fails | "AI insights temporarily unavailable" |
| Network timeout | Generic error message |

---

## Security Notes

1. `GROQ_API_KEY` lives only in `backend/.env` and is read by `groq_insights.py`
2. Frontend calls our backend; our backend calls Groq — key never travels to browser
3. `frontend/.env` is gitignored
4. `backend/.env` is gitignored
5. No secrets are logged in responses or error messages
6. JWT expires after 7 days; 401/403 redirects to `/login`
