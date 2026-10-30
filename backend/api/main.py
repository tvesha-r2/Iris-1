import os
import io
import logging
import datetime
from typing import List, Optional
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import Request as URLRequest, urlopen
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Request, Form
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from starlette.concurrency import run_in_threadpool
from pymongo import MongoClient
from pymongo.errors import PyMongoError
from bson import ObjectId
import jwt
import cloudinary
import cloudinary.uploader
from pydantic import BaseModel
from dotenv import load_dotenv

# Ensure backend/.env is loaded reliably regardless of current working directory
BACKEND_DIR = Path(__file__).resolve().parent.parent
env_path = BACKEND_DIR / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path, override=True)
else:
    load_dotenv(override=True)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

import api.inference_service as inference_service
from api.gemini_insights import generate_insights

MAX_IMAGE_SIZE = 20 * 1024 * 1024
IMAGE_STORAGE_CONFIG_KEYS = (
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
)


def _is_placeholder(value: Optional[str]) -> bool:
    if not value:
        return True
    normalized = value.strip().strip("\"'").lower()
    return (
        not normalized
        or normalized.startswith(("your_", "your-", "<"))
        or normalized in {"placeholder", "change-me", "changeme"}
    )


def _missing_cloudinary_settings() -> List[str]:
    return [key for key in IMAGE_STORAGE_CONFIG_KEYS if _is_placeholder(os.getenv(key))]


def _redact_cloudinary_credentials(message: str) -> str:
    for key in ("CLOUDINARY_API_SECRET", "CLOUDINARY_API_KEY"):
        value = os.getenv(key)
        if value and not _is_placeholder(value):
            message = message.replace(value, "[REDACTED]")
    return message


def _upload_cloudinary_image(image_bytes: bytes, folder: str, **options) -> dict:
    missing_settings = _missing_cloudinary_settings()
    if missing_settings:
        logger.error(
            "Image storage is not configured; missing or placeholder values for %s.",
            ", ".join(missing_settings),
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Image storage is not configured. Set "
                f"{', '.join(missing_settings)} in backend/.env."
            ),
        )

    try:
        result = cloudinary.uploader.upload(
            io.BytesIO(image_bytes),
            folder=folder,
            **options,
        )
    except Exception as exc:
        logger.error(
            "Cloudinary image upload failed (%s): %s",
            type(exc).__name__,
            _redact_cloudinary_credentials(str(exc)),
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Image storage failed. Check Cloudinary credentials and account setup.",
        ) from exc

    secure_url = result.get("secure_url") if isinstance(result, dict) else None
    if not secure_url or urlsplit(secure_url).scheme != "https":
        logger.error("Cloudinary image upload returned no valid HTTPS secure_url.")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Image storage failed because the provider returned no secure image URL.",
        )
    return result


def _download_stored_cloudinary_image(image_url: str) -> bytes:
    parsed_url = urlsplit(image_url)
    if parsed_url.scheme != "https" or parsed_url.hostname != "res.cloudinary.com":
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The stored image URL is not a valid Cloudinary HTTPS URL.",
        )

    request = URLRequest(image_url, headers={"User-Agent": "Iris-image-analysis"})
    try:
        with urlopen(request, timeout=30) as response:
            image_bytes = response.read(MAX_IMAGE_SIZE + 1)
    except (HTTPError, URLError, TimeoutError) as exc:
        logger.error(
            "Could not retrieve stored Cloudinary image (%s): %s",
            type(exc).__name__,
            _redact_cloudinary_credentials(str(exc)),
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not retrieve the stored image from Cloudinary.",
        ) from exc

    if not image_bytes:
        raise HTTPException(status_code=422, detail="The stored image is empty.")
    if len(image_bytes) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=413, detail="The stored image exceeds the 20 MB limit.")
    return image_bytes


def _insert_thumbnail(user_id: str, filename: Optional[str], upload_result: dict):
    return thumbnails_col.insert_one({
        "user_id": user_id,
        "filename": filename,
        "cloudinary_url": upload_result["secure_url"],
        "cloudinary_public_id": upload_result.get("public_id"),
        "overlay_url": None,
        "created_at": datetime.datetime.utcnow(),
        "ai_scores": {},
        "analysis_status": "uploaded",
    }).inserted_id

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run startup checks: test MongoDB connection and initialize ML models if present."""
    missing_storage_settings = _missing_cloudinary_settings()
    if missing_storage_settings:
        logger.error(
            "Image storage is not configured; missing or placeholder values for %s.",
            ", ".join(missing_storage_settings),
        )

    # Test MongoDB connection at startup
    try:
        client.admin.command("ping")
        logger.info("MongoDB connected successfully.")
    except Exception as exc:
        logger.warning(
            f"MongoDB connection test failed at startup: {exc}. "
            "Please check MONGO_URI, database user credentials, and Atlas Network Access (IP whitelist)."
        )

    # Attempt to load ML models (lifespan survives if models are not yet placed)
    try:
        inference_service.initialize()
        logger.info("ML models loaded successfully at startup.")
    except Exception as exc:
        logger.warning(
            f"ML model initialisation skipped or failed: {exc}. "
            "Server will start; ML inference endpoints will return 503 until model checkpoints are provided."
        )
    yield

app = FastAPI(lifespan=lifespan)

# CORS Configuration
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
if allowed_origins_env:
    allowed_origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]
else:
    allowed_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(PyMongoError)
async def pymongo_exception_handler(request: Request, exc: PyMongoError):
    logger.error(f"Database error on {request.method} {request.url.path}: {type(exc).__name__}: {exc}")
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={"detail": "Database service unavailable. Please check MongoDB connection and credentials."},
    )

# Config
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
JWT_SECRET = os.getenv("JWT_SECRET", "super-secret-key-change-me")
ALGORITHM = "HS256"

# Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

# DB - Optional certifi CA bundle support for secure Atlas TLS verification
tls_kwargs = {}
try:
    import certifi
    tls_kwargs["tlsCAFile"] = certifi.where()
except ImportError:
    pass

client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000, **tls_kwargs)
db = client.thumbheap
users_col = db.users
thumbnails_col = db.thumbnails
profiles_col = db.creator_profiles

import bcrypt

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

class UserCreate(BaseModel):
    email: str
    password: str

def get_password_hash(password: str):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str):
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + datetime.timedelta(days=7)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        user = users_col.find_one({"_id": ObjectId(user_id)})
        if user is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        return str(user["_id"])
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

@app.post("/auth/register", status_code=status.HTTP_201_CREATED)
def register(user: UserCreate):
    try:
        if users_col.find_one({"email": user.email}):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
        
        user_id = users_col.insert_one({
            "email": user.email,
            "password": get_password_hash(user.password),
            "created_at": datetime.datetime.utcnow()
        }).inserted_id
        
        return {"message": "User created", "user_id": str(user_id)}
    except HTTPException:
        raise
    except PyMongoError as exc:
        logger.error(f"MongoDB error during registration: {exc}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service unavailable. Please check your MongoDB connection and credentials."
        )
    except Exception as exc:
        logger.error(f"Unexpected error during registration: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed due to an internal server error."
        )

@app.post("/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    try:
        user = users_col.find_one({"email": form_data.username})
        if not user or not verify_password(form_data.password, user["password"]):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect email or password")
        
        access_token = create_access_token(data={"sub": str(user["_id"])})
        return {"access_token": access_token, "token_type": "bearer"}
    except HTTPException:
        raise
    except PyMongoError as exc:
        logger.error(f"MongoDB error during login: {exc}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service unavailable. Please check your MongoDB connection and credentials."
        )

@app.post("/api/upload")
async def upload_image(file: UploadFile = File(...), user_id: str = Depends(get_current_user)):
    """Persist an original thumbnail to Cloudinary and its reference to MongoDB."""
    image_bytes = await file.read(MAX_IMAGE_SIZE + 1)
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty file received.")
    if len(image_bytes) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=413, detail="Image exceeds the 20 MB limit.")

    upload_result = await run_in_threadpool(
        _upload_cloudinary_image,
        image_bytes,
        "Thumbheat",
    )
    doc_id = _insert_thumbnail(user_id, file.filename, upload_result)
    logger.info("Stored thumbnail %s for user %s.", doc_id, user_id)
    return {"id": str(doc_id), "url": upload_result["secure_url"]}


@app.post("/api/analyze")
async def analyze_thumbnail(
    thumbnail_id: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    user_id: str = Depends(get_current_user),
):
    """
    Analyze a previously stored thumbnail by ID. The file field remains supported
    for existing clients and is persisted before inference.
    """
    if bool(thumbnail_id) == bool(file):
        raise HTTPException(
            status_code=400,
            detail="Provide exactly one stored thumbnail_id or an image file.",
        )

    if thumbnail_id:
        if not ObjectId.is_valid(thumbnail_id):
            raise HTTPException(status_code=400, detail="Invalid thumbnail ID.")
        stored_doc_id = ObjectId(thumbnail_id)
        stored_doc = thumbnails_col.find_one({
            "_id": stored_doc_id,
            "user_id": user_id,
        })
        if not stored_doc:
            raise HTTPException(status_code=404, detail="Stored thumbnail not found.")
        original_url = stored_doc.get("cloudinary_url")
        if not original_url:
            raise HTTPException(status_code=500, detail="Stored thumbnail has no image URL.")
        image_bytes = await run_in_threadpool(_download_stored_cloudinary_image, original_url)
    else:
        image_bytes = await file.read(MAX_IMAGE_SIZE + 1)
        if not image_bytes:
            raise HTTPException(status_code=400, detail="Empty file received.")
        if len(image_bytes) > MAX_IMAGE_SIZE:
            raise HTTPException(status_code=413, detail="Image exceeds the 20 MB limit.")

        upload_result = await run_in_threadpool(
            _upload_cloudinary_image,
            image_bytes,
            "Thumbheat",
        )
        original_url = upload_result["secure_url"]
        filename = file.filename
        stored_doc_id = _insert_thumbnail(user_id, filename, upload_result)

    # ── Run ML inference ────────────────────────────────────────────────────
    try:
        result = inference_service.run_inference(image_bytes)
    except ValueError as exc:
        thumbnails_col.update_one(
            {"_id": stored_doc_id, "user_id": user_id},
            {"$set": {"analysis_status": "failed"}},
        )
        raise HTTPException(status_code=422, detail=str(exc))
    except RuntimeError as exc:
        logger.error(f"Inference error: {exc}")
        thumbnails_col.update_one(
            {"_id": stored_doc_id, "user_id": user_id},
            {"$set": {"analysis_status": "failed"}},
        )
        raise HTTPException(status_code=503, detail="Inference pipeline unavailable.")
    except Exception as exc:
        logger.error(f"Unexpected inference error: {exc}")
        thumbnails_col.update_one(
            {"_id": stored_doc_id, "user_id": user_id},
            {"$set": {"analysis_status": "failed"}},
        )
        raise HTTPException(status_code=500, detail="Inference failed.")

    # ── Upload heatmap overlay ───────────────────────────────────────────────
    try:
        overlay_result = await run_in_threadpool(
            _upload_cloudinary_image,
            result["overlay_png"],
            "Thumbheat/overlays",
            format="png",
        )
        overlay_url = overlay_result.get("secure_url")
    except Exception as exc:
        logger.error(
            "Cloudinary overlay upload failed (%s): %s",
            type(exc).__name__,
            _redact_cloudinary_credentials(str(exc)),
        )
        overlay_url = None   # Non-fatal; numeric result is still valid

    # ── Calculate Real Heatmap Stats ─────────────────────────────────────────
    heatmap = result.get("heatmap_array")
    attn_mean = 0.0
    attn_concentration = 0.0
    attn_peak = 0.0
    if heatmap is not None:
        try:
            import numpy as np
            attn_mean = float(np.mean(heatmap))
            attn_concentration = float(np.mean(heatmap > 0.4))
            attn_peak = float(np.max(heatmap))
        except Exception:
            pass

    # ── Persist metadata on the already-stored thumbnail ────────────────────
    detections = result["detections"]
    update_result = thumbnails_col.update_one(
        {"_id": stored_doc_id, "user_id": user_id},
        {"$set": {
            "overlay_url":      overlay_url,
            "ai_scores": {
                "texts_detected":   detections["texts"],
                "faces_detected":   detections["faces"],
                "objects_detected": detections["objects"],
            },
            "attention_stats": {
                "mean": attn_mean,
                "concentration": attn_concentration,
                "peak": attn_peak,
            },
            "analysis_status": "completed",
        }},
    )
    if update_result.matched_count != 1:
        logger.error("Analysis result could not be saved for thumbnail %s.", stored_doc_id)
        raise HTTPException(status_code=500, detail="Analysis result could not be saved.")

    # AI insights are triggered on-demand via a separate endpoint.
    insights = None

    return {
        "id":          str(stored_doc_id),
        "url":         original_url,
        "overlay_url": overlay_url,
        "detections":  detections,
        "insights":    insights,
    }

@app.get("/api/thumbnails")
def get_thumbnails(user_id: str = Depends(get_current_user)):
    docs = list(thumbnails_col.find({"user_id": user_id}).sort("created_at", -1))
    for doc in docs:
        doc_id = str(doc["_id"])
        doc["_id"] = doc_id
        doc["id"] = doc_id
        doc["url"] = doc.get("cloudinary_url")
    return {"thumbnails": docs}

@app.post("/api/insights/{thumbnail_id}")
def generate_insights_for_thumbnail(thumbnail_id: str, user_id: str = Depends(get_current_user)):
    from bson import ObjectId
    try:
        doc = thumbnails_col.find_one({"_id": ObjectId(thumbnail_id), "user_id": user_id})
        if not doc:
            raise HTTPException(status_code=404, detail="Thumbnail not found")
            
        detections = {
            "texts": doc.get("ai_scores", {}).get("texts_detected", 0),
            "faces": doc.get("ai_scores", {}).get("faces_detected", 0),
            "objects": doc.get("ai_scores", {}).get("objects_detected", 0),
        }
        
        insights = generate_insights(
            detections=detections,
            original_url=doc.get("cloudinary_url"),
            overlay_url=doc.get("overlay_url"),
            stats=doc.get("attention_stats", {})
        )
        
        if insights:
            thumbnails_col.update_one({"_id": ObjectId(thumbnail_id)}, {"$set": {"insights": insights}})
            return {"insights": insights}
        else:
            raise HTTPException(status_code=500, detail="Failed to generate AI insights")
            
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Error generating insights: {exc}")
        raise HTTPException(status_code=500, detail="Failed to generate insights")


# ── Creator Profile ──────────────────────────────────────────────────────────

class CreatorProfile(BaseModel):
    channel_name: Optional[str] = None
    channel_url: Optional[str] = None

    video_category: Optional[str] = None
    video_types: Optional[List[str]] = []
    niche_description: Optional[str] = None

    target_age_groups: Optional[List[str]] = []
    target_genders: Optional[List[str]] = []
    audience_regions: Optional[List[str]] = []

    channel_size: Optional[str] = None
    upload_frequency: Optional[str] = None
    avg_video_length: Optional[str] = None

    primary_goal: Optional[str] = None
    biggest_challenge: Optional[str] = None

    thumbnail_style: Optional[List[str]] = []
    color_preference: Optional[str] = None


@app.get("/api/profile")
def get_profile(user_id: str = Depends(get_current_user)):
    """Return the creator profile for the authenticated user."""
    profile = profiles_col.find_one({"user_id": user_id})
    if not profile:
        return {"profile": None}
    profile["_id"] = str(profile["_id"])
    return {"profile": profile}


@app.put("/api/profile")
def upsert_profile(data: CreatorProfile, user_id: str = Depends(get_current_user)):
    """Create or update the creator profile for the authenticated user."""
    payload = data.dict()
    payload["user_id"] = user_id
    payload["updated_at"] = datetime.datetime.utcnow()

    profiles_col.update_one(
        {"user_id": user_id},
        {"$set": payload},
        upsert=True
    )
    return {"message": "Profile saved successfully"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
