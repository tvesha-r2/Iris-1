"""
backend/scripts/test_mongo.py
==============================
Safe connectivity and authentication test for MongoDB Atlas / PyMongo.

Run with:
    & "backend\\.venv-inference311\\Scripts\\python.exe" backend\\scripts\\test_mongo.py

This script:
- Verifies backend/.env is located and loaded
- Checks MONGO_URI format (e.g. angle brackets, placeholder credentials)
- Attempts a safe ping to MongoDB
- Checks database access without printing passwords or secrets
"""

import os
import sys
import re
from pathlib import Path

# Bootstrap backend path and load backend/.env
BACKEND_DIR = Path(__file__).resolve().parent.parent
env_path = BACKEND_DIR / ".env"

try:
    from dotenv import load_dotenv
    if env_path.exists():
        load_dotenv(dotenv_path=env_path, override=True)
    else:
        load_dotenv(override=True)
except ImportError:
    print("[FAIL] python-dotenv is not installed in this environment.")
    sys.exit(1)

try:
    from pymongo import MongoClient
    from pymongo.errors import (
        PyMongoError,
        OperationFailure,
        ServerSelectionTimeoutError,
        ConfigurationError,
    )
except ImportError:
    print("[FAIL] pymongo is not installed in this environment.")
    sys.exit(1)


def mask_uri(uri: str) -> str:
    """Mask password inside connection URI for safe console display."""
    if not uri:
        return "<EMPTY>"
    # Mask password pattern mongodb://user:pass@host or mongodb+srv://user:pass@host
    return re.sub(r":([^@/:?]+)@", ":****@", uri)


def main():
    print("\n" + "=" * 60)
    print("  Iris MongoDB Connection Diagnostic Test")
    print("=" * 60 + "\n")

    print(f"[INFO] Checking environment file: {env_path}")
    if not env_path.exists():
        print(f"[FAIL] .env file not found at: {env_path}")
        print("       Please copy backend/.env.example to backend/.env and configure it.")
        sys.exit(1)
    print("[PASS] backend/.env file found.")

    mongo_uri = os.getenv("MONGO_URI", "").strip()
    if not mongo_uri:
        print("[FAIL] MONGO_URI is empty or not set in backend/.env")
        sys.exit(1)

    print(f"[INFO] Configured URI format: {mask_uri(mongo_uri)}")

    # Check for placeholder angle brackets
    has_angle_brackets = "<" in mongo_uri or ">" in mongo_uri
    if has_angle_brackets:
        print("\n[WARNING] MONGO_URI contains '<' or '>' angle brackets!")
        print("          In Atlas connection templates, '<password>' is a placeholder.")
        print("          You must remove the '<' and '>' characters around your actual password.")
        print("          Example: user:<my_password> should be user:my_password\n")

    # Check for common placeholder values
    if "<user>" in mongo_uri or "<password>" in mongo_uri:
        print("[FAIL] MONGO_URI contains literal placeholder '<user>' or '<password>'.")
        print("       Please replace placeholders with your actual Atlas database user credentials.")
        sys.exit(1)

    print("[INFO] Attempting connection to MongoDB (timeout: 5 seconds)...")

    # Optional certifi CA bundle support
    tls_kwargs = {}
    try:
        import certifi
        tls_kwargs["tlsCAFile"] = certifi.where()
    except ImportError:
        pass

    try:
        client = MongoClient(
            mongo_uri,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000,
            **tls_kwargs,
        )

        # 1. Ping the server
        client.admin.command("ping")
        print("[PASS] Successfully connected and authenticated with MongoDB!")

        # 2. Verify target database
        db_name = "thumbheap"
        db = client[db_name]
        col_list = db.list_collection_names()
        print(f"[PASS] Successfully accessed database '{db_name}'.")
        print(f"[INFO] Existing collections in '{db_name}': {col_list or '(none yet - will be auto-created)'}")

        print("\n" + "=" * 60)
        print("  DATABASE STATUS: READY")
        print("=" * 60 + "\n")
        return 0

    except OperationFailure as exc:
        print(f"\n[FAIL] Authentication failed (OperationFailure):")
        print(f"       Details: {exc.details if hasattr(exc, 'details') else exc}")
        print("\nTroubleshooting tips:")
        print("  1. Verify the database username and password in backend/.env.")
        print("  2. Ensure angle brackets '<' and '>' are NOT surrounding the password.")
        print("  3. If your password has special characters like @, :, /, ?, #, %, URL-encode them.")
        print("  4. Verify the database user was created in Atlas under 'Database Access'.")
        sys.exit(1)

    except ServerSelectionTimeoutError as exc:
        print(f"\n[FAIL] Server selection timeout (could not reach cluster):")
        err_msg = str(exc)
        if "TLSV1_ALERT_INTERNAL_ERROR" in err_msg or "SSL" in err_msg:
            print("       Details: SSL / TLS Handshake Alert.")
            print("\nTroubleshooting tips:")
            print("  1. This usually indicates your current IP address is NOT whitelisted in Atlas.")
            print("     Go to MongoDB Atlas -> Security -> Network Access -> Add IP Address.")
            print("     Add your current IP address (or 0.0.0.0/0 for development access).")
            print("  2. If you are on a VPN or mobile hotspot, check if your public IP changed.")
        else:
            print(f"       Details: {err_msg[:300]}")
            print("\nTroubleshooting tips:")
            print("  1. Check your internet connection and DNS resolution.")
            print("  2. Verify your Atlas cluster is active and not paused or deleted.")
            print("  3. Ensure your IP address is whitelisted under Network Access in Atlas.")
        sys.exit(1)

    except ConfigurationError as exc:
        print(f"\n[FAIL] Invalid MongoDB URI configuration (ConfigurationError):")
        print(f"       Details: {exc}")
        sys.exit(1)

    except PyMongoError as exc:
        print(f"\n[FAIL] MongoDB connection error ({type(exc).__name__}):")
        print(f"       Details: {exc}")
        sys.exit(1)

    except Exception as exc:
        print(f"\n[FAIL] Unexpected error during connection test ({type(exc).__name__}):")
        print(f"       Details: {exc}")
        sys.exit(1)


if __name__ == "__main__":
    main()

