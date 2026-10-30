import os
from datetime import datetime
from types import SimpleNamespace
import unittest
from unittest.mock import patch

from bson import ObjectId
from fastapi.testclient import TestClient

from api import main


class FakeCursor:
    def __init__(self, documents):
        self.documents = documents

    def sort(self, key, direction):
        self.documents.sort(
            key=lambda document: document.get(key, datetime.min),
            reverse=direction < 0,
        )
        return self

    def __iter__(self):
        return iter(self.documents)


class FakeThumbnailCollection:
    def __init__(self):
        self.documents = {}

    def insert_one(self, document):
        document_id = ObjectId()
        self.documents[document_id] = {**document, "_id": document_id}
        return SimpleNamespace(inserted_id=document_id)

    def find_one(self, query):
        document = self.documents.get(query["_id"])
        if document and document.get("user_id") == query.get("user_id"):
            return document
        return None

    def update_one(self, query, update):
        document = self.find_one(query)
        if not document:
            return SimpleNamespace(matched_count=0)
        document.update(update["$set"])
        return SimpleNamespace(matched_count=1)

    def find(self, query):
        documents = [
            document.copy()
            for document in self.documents.values()
            if document.get("user_id") == query.get("user_id")
        ]
        return FakeCursor(documents)


class ImageStorageWorkflowTests(unittest.TestCase):
    def setUp(self):
        test_settings = {
            key: f"test-{key.lower()}"
            for key in main.IMAGE_STORAGE_CONFIG_KEYS
        }
        self.environment = patch.dict(os.environ, test_settings)
        self.environment.start()
        self.collection = FakeThumbnailCollection()
        self.collection_patch = patch.object(main, "thumbnails_col", self.collection)
        self.collection_patch.start()
        main.app.dependency_overrides[main.get_current_user] = lambda: "test-user"
        self.client = TestClient(main.app)

    def tearDown(self):
        main.app.dependency_overrides.pop(main.get_current_user, None)
        self.collection_patch.stop()
        self.environment.stop()

    def test_upload_analyze_and_retrieve_persisted_image(self):
        original_url = "https://res.cloudinary.com/test-cloud/image/upload/original.png"
        overlay_url = "https://res.cloudinary.com/test-cloud/image/upload/overlay.png"
        uploaded_folders = []

        def upload_to_cloudinary(file, folder, **options):
            uploaded_folders.append(folder)
            url = overlay_url if folder == "Thumbheat/overlays" else original_url
            return {"secure_url": url, "public_id": f"{folder}/test"}

        with patch.object(
            main.cloudinary.uploader,
            "upload",
            side_effect=upload_to_cloudinary,
        ):
            upload_response = self.client.post(
                "/api/upload",
                files={"file": ("thumbnail.png", b"stored image bytes", "image/png")},
            )
        self.assertEqual(upload_response.status_code, 200)
        stored_image = upload_response.json()
        self.assertEqual(stored_image["url"], original_url)
        stored_document = self.collection.find_one({
            "_id": ObjectId(stored_image["id"]),
            "user_id": "test-user",
        })
        self.assertEqual(stored_document["cloudinary_url"], original_url)

        downloaded_urls = []
        inference_inputs = []
        inference_result = {
            "overlay_png": b"overlay bytes",
            "heatmap_array": None,
            "detections": {"texts": 2, "faces": 1, "objects": 3},
        }
        with (
            patch.object(
                main,
                "_download_stored_cloudinary_image",
                side_effect=lambda url: downloaded_urls.append(url) or b"stored image bytes",
            ),
            patch.object(
                main.inference_service,
                "run_inference",
                side_effect=lambda image_bytes: inference_inputs.append(image_bytes) or inference_result,
            ),
            patch.object(
                main.cloudinary.uploader,
                "upload",
                side_effect=upload_to_cloudinary,
            ),
        ):
            analysis_response = self.client.post(
                "/api/analyze",
                data={"thumbnail_id": stored_image["id"]},
            )
        self.assertEqual(analysis_response.status_code, 200)
        result = analysis_response.json()
        self.assertEqual(result["id"], stored_image["id"])
        self.assertEqual(result["url"], original_url)
        self.assertEqual(result["overlay_url"], overlay_url)
        self.assertEqual(downloaded_urls, [original_url])
        self.assertEqual(inference_inputs, [b"stored image bytes"])
        self.assertEqual(uploaded_folders, ["Thumbheat", "Thumbheat/overlays"])

        history_response = self.client.get("/api/thumbnails")
        self.assertEqual(history_response.status_code, 200)
        saved_thumbnail = history_response.json()["thumbnails"][0]
        self.assertEqual(saved_thumbnail["id"], stored_image["id"])
        self.assertEqual(saved_thumbnail["url"], original_url)
        self.assertEqual(saved_thumbnail["analysis_status"], "completed")
        self.assertEqual(saved_thumbnail["ai_scores"]["texts_detected"], 2)

    def test_analyze_rejects_placeholder_cloudinary_credentials(self):
        placeholder_settings = {
            key: f"your_{key.lower()}"
            for key in main.IMAGE_STORAGE_CONFIG_KEYS
        }
        with patch.dict(os.environ, placeholder_settings):
            response = self.client.post(
                "/api/analyze",
                files={"file": ("thumbnail.png", b"image bytes", "image/png")},
            )
        self.assertEqual(response.status_code, 503)
        self.assertIn("CLOUDINARY_CLOUD_NAME", response.json()["detail"])
        self.assertEqual(self.collection.documents, {})


if __name__ == "__main__":
    unittest.main()
