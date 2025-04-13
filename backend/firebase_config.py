import firebase_admin
from firebase_admin import credentials, firestore
import os
from dotenv import load_dotenv

load_dotenv()

def initialize_firebase():
    if not firebase_admin._apps:
        cred = credentials.Certificate("firebase-creds.json")
        firebase_admin.initialize_app(cred)
    
    return firestore.client()