import os
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv

load_dotenv()

def initialize_firebase():
    try:
        if not firebase_admin._apps:
            print("[INFO] Firebase not initialized. Initializing now...")

            # Load credentials from environment variables
            cred_dict = {
                "type": os.getenv("GOOGLE_TYPE"),
                "project_id": os.getenv("GOOGLE_PROJECT_ID"),
                "private_key_id": os.getenv("GOOGLE_PRIVATE_KEY_ID"),
                "private_key": os.getenv("GOOGLE_PRIVATE_KEY").replace('\\n', '\n'),
                "client_email": os.getenv("GOOGLE_CLIENT_EMAIL"),
                "client_id": os.getenv("GOOGLE_CLIENT_ID"),
                "auth_uri": os.getenv("GOOGLE_AUTH_URI"),
                "token_uri": os.getenv("GOOGLE_TOKEN_URI"),
                "auth_provider_x509_cert_url": os.getenv("GOOGLE_AUTH_PROVIDER_CERT_URL"),
                "client_x509_cert_url": os.getenv("GOOGLE_CLIENT_CERT_URL"),
                "universe_domain": os.getenv("GOOGLE_UNIVERSE_DOMAIN"),
            }

            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred)
            print("[SUCCESS] Firebase initialized successfully.")
        else:
            print("[INFO] Firebase already initialized.")

        db = firestore.client()
        print("[SUCCESS] Firestore client obtained.")
        return db

    except Exception as e:
        print(f"[EXCEPTION] Firebase initialization failed: {e}")
        return None

# Example usage
if __name__ == "__main__":
    db = initialize_firebase()
    if db:
        print("[STATUS] Firestore is ready to use.")
    else:
        print("[STATUS] Failed to initialize Firestore.")
