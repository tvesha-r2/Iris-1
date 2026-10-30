"""
backend/scripts/download_transalnet.py
Downloads TranSalNet_Res.pth from the official TranSalNet Google Drive repository link
documented in backend/models/transalnet/README.md.
"""

import sys
import re
import requests
from pathlib import Path

FILE_ID = "14czAAQQcRLGeiddPOM6AaTJTieu6QiHy"
DEST_DIR = Path(__file__).resolve().parent.parent / "models" / "transalnet" / "pretrained_models"
DEST_FILE = DEST_DIR / "TranSalNet_Res.pth"

def download_file_from_google_drive(file_id: str, destination: Path):
    destination.parent.mkdir(parents=True, exist_ok=True)
    if destination.exists() and destination.stat().st_size > 10_000_000:
        print(f"[INFO] {destination.name} already exists ({destination.stat().st_size:,} bytes). Skipping.")
        return True

    print(f"[INFO] Initiating download of {destination.name} (File ID: {file_id})...")
    session = requests.Session()
    url = "https://drive.google.com/uc?export=download"
    response = session.get(url, params={"id": file_id})

    # Parse download form on Google Drive virus warning page
    form_action = None
    form_match = re.search(r'action="([^"]+)"', response.text)
    if form_match:
        form_action = form_match.group(1)

    inputs = dict(re.findall(r'<input[^>]+name="([^"]+)"[^>]+value="([^"]*)"', response.text))

    if form_action and "id" in inputs:
        print("[INFO] Submitting confirmation form to Google Drive...")
        dl_response = session.post(form_action, data=inputs, stream=True)
    else:
        # Fallback to direct confirm token
        token = None
        for k, v in response.cookies.items():
            if k.startswith("download_warning"):
                token = v
                break
        dl_response = session.get(url, params={"id": file_id, "confirm": token or "t"}, stream=True)

    content_type = dl_response.headers.get("Content-Type", "")
    if "text/html" in content_type:
        print("[FAIL] Received HTML page instead of binary weights. Download confirmation may have failed.")
        return False

    print("[INFO] Streaming download to disk...")
    total_downloaded = 0
    with open(destination, "wb") as f:
        for chunk in dl_response.iter_content(chunk_size=1024 * 1024):
            if chunk:
                f.write(chunk)
                total_downloaded += len(chunk)
                if total_downloaded % (10 * 1024 * 1024) < 1024 * 1024:
                    print(f"  Downloaded: {total_downloaded / (1024*1024):.1f} MB...")

    print(f"[PASS] Successfully downloaded {destination.name} ({destination.stat().st_size:,} bytes).")
    return True

if __name__ == "__main__":
    success = download_file_from_google_drive(FILE_ID, DEST_FILE)
    sys.exit(0 if success else 1)

