# ThumbHeap ML Inference API

## New Endpoint

### `POST /api/analyze`

Runs the complete 8-channel saliency fusion pipeline on a thumbnail already
stored by `POST /api/upload` and returns Cloudinary URLs for the original image
and generated attention heatmap overlay.

**Authentication**: Bearer JWT (same token issued by `/auth/login`).

---

## Request

```
POST /api/analyze
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data

thumbnail_id=<MongoDB id>  # returned by POST /api/upload
```

For compatibility, the endpoint still accepts `file=<image file>` instead.
That path stores the original before running inference. Provide exactly one of
`thumbnail_id` or `file`.

### Persist the image

`POST /api/upload` accepts `file=<image file>` and returns the stored MongoDB
ID and Cloudinary URL:

```json
{
  "id": "mongo_document_id",
  "url": "https://res.cloudinary.com/.../Thumbheat/image.jpg"
}
```

### Restore saved images

`GET /api/thumbnails` returns the authenticated user's stored thumbnails,
including the persistent `url`, `cloudinary_url`, `overlay_url`, and analysis
metadata. The Analyze page uses this endpoint to restore the most recent image
after a refresh.

---

## Response

```json
{
  "id":          "mongo_document_id",
  "url":         "https://res.cloudinary.com/.../Thumbheat/original.jpg",
  "overlay_url": "https://res.cloudinary.com/.../Thumbheat/overlays/overlay.png",
  "detections": {
    "texts":   3,
    "faces":   1,
    "objects": 5
  }
}
```

| Field | Type | Description |
|---|---|---|
| `id` | string | MongoDB document `_id` (hex) |
| `url` | string | Cloudinary secure URL of the uploaded original thumbnail |
| `overlay_url` | string | Cloudinary secure URL of the attention heatmap overlaid on the thumbnail |
| `detections.texts` | int | Number of text regions detected by PaddleOCR |
| `detections.faces` | int | Number of faces detected by YuNet |
| `detections.objects` | int | Number of objects detected by YOLO-World-S |

---

## Error Responses

| HTTP Code | Reason |
|---|---|
| 400 | Empty file |
| 401 | Missing or invalid JWT |
| 422 | Invalid / corrupt image |
| 502 | Cloudinary upload or stored-image retrieval failure |
| 503 | Cloudinary configuration missing/placeholder or ML models unavailable |
| 500 | Internal inference or storage failure |

All error bodies: `{ "detail": "human-readable description" }`. No stack traces or secrets are exposed. Configure `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in `backend/.env` with the values from the Cloudinary dashboard; placeholder values are rejected before uploading.

---

## Inference Pipeline

```
Load saved image by thumbnail_id
    │
    ├─[ch 0] TranSalNet-Res ──────────────────────────────────── base_heatmap
    ├─[ch 1] PaddleOCR + text_map.py ────────────────────────── text_map
    ├─[ch 2] YuNet + face_map.py ────────────────────────────── face_map
    ├─[ch 3] YOLO-World-S + object_map.py ───────────────────── object_map
    ├─[ch 4] OpenCV HSV-V ───────────────────────────────────── brightness_map
    ├─[ch 5] OpenCV local std dev ───────────────────────────── contrast_map
    ├─[ch 6] OpenCV HSV-S ───────────────────────────────────── saturation_map
    └─[ch 7] OpenCV Sobel ───────────────────────────────────── edge_map
                    │
                    ▼  shape (1,8,288,384) float32 [0,1]
             FusionNetwork
                    │
                    ▼  shape (1,1,288,384) clamped [0,1]
           heatmap (288×384)
                    │
          ┌─────────┴──────────┐
          ▼                    ▼
    Cloudinary             MongoDB
    overlay_url         doc with ai_scores
```

---

## Frozen 8-Channel Order

| Index | Channel | Source |
|---|---|---|
| 0 | `base_heatmap` | TranSalNet-Res pretrained weights |
| 1 | `text_map` | PaddleOCR 3.0 → `text_map.py` |
| 2 | `face_map` | YuNet ONNX → `face_map.py` |
| 3 | `object_map` | YOLO-World-S → `object_map.py` |
| 4 | `brightness_map` | OpenCV HSV V-channel |
| 5 | `contrast_map` | OpenCV local standard deviation |
| 6 | `saturation_map` | OpenCV HSV S-channel |
| 7 | `edge_map` | OpenCV Sobel gradient magnitude |

> **This order is frozen by the trained checkpoint and must not be changed.**

---

## Fusion Checkpoint

```
backend/fusion/checkpoints/best_fusion.pth
```

Override location via environment variable:

```
FUSION_CHECKPOINT=/absolute/path/to/best_fusion.pth
```

---

## TranSalNet Weights

```
backend/models/transalnet/pretrained_models/TranSalNet_Res.pth
```

Override:

```
TRANSALNET_WEIGHTS=/absolute/path/to/TranSalNet_Res.pth
```

> The `.pth` files are gitignored. Each developer downloads them manually.

---

## Required Environment Variables

| Variable | Example | Notes |
|---|---|---|
| `MONGO_URI` | `mongodb+srv://user:pass@cluster/db` | Existing MongoDB connection string |
| `JWT_SECRET` | `your-super-secret` | Existing JWT signing key |
| `CLOUDINARY_CLOUD_NAME` | `ikna83ot` | Existing Cloudinary config |
| `CLOUDINARY_API_KEY` | `279535863546579` | Existing Cloudinary config |
| `CLOUDINARY_API_SECRET` | `...` | Existing Cloudinary config |
| `FUSION_CHECKPOINT` | *(optional)* | Override checkpoint path |
| `TRANSALNET_WEIGHTS` | *(optional)* | Override TranSalNet weights path |

All variables are loaded from `backend/.env` via `python-dotenv`.

---

## MongoDB Schema (thumbnails collection)

Documents written by `/api/analyze` extend the existing schema with:

```json
{
  "user_id":        "string",
  "filename":       "string",
  "cloudinary_url": "https://...",
  "overlay_url":    "https://...",
  "created_at":     "ISODate",
  "ai_scores": {
    "texts_detected":   0,
    "faces_detected":   0,
    "objects_detected": 0
  }
}
```

`overlay_url` is `null` if the Cloudinary overlay upload fails (non-fatal).

---

## Frontend Integration

```typescript
// Send thumbnail for ML analysis
const formData = new FormData();
formData.append("file", thumbnailFile);

const response = await fetch("/api/analyze", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: formData,
});

const data = await response.json();
// data.url         → original thumbnail Cloudinary URL
// data.overlay_url → heatmap overlay Cloudinary URL (display in UI)
// data.detections  → { texts, faces, objects }
```

---

## Starting the Server

```bash
# Activate the inference environment
.venv-fusion\Scripts\activate

# Start FastAPI from the backend directory
cd backend
python -m uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

All five ML models (TranSalNet, FusionNetwork, PaddleOCR, YuNet, YOLO-World-S)
are loaded **once** at startup via the FastAPI `lifespan` handler and shared
across all requests with no per-request re-loading.
