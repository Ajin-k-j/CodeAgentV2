import firebase_admin
from firebase_admin import credentials, firestore
import os
from typing import List, Dict, Any, Optional
from app.core.config import get_settings

class FirebaseClient:
    def __init__(self):
        settings = get_settings()
        # Check if initialized
    def __init__(self):
        settings = get_settings()
        # Check if initialized
        if not firebase_admin._apps:
            try:
                # 1. Try loading from JSON string (Env Var)
                if settings.FIREBASE_CREDENTIALS_JSON:
                    import json
                    cred_dict = json.loads(settings.FIREBASE_CREDENTIALS_JSON)
                    cred = credentials.Certificate(cred_dict)
                    firebase_admin.initialize_app(cred)
                    print("Firebase initialized with credentials from Environment Variable.")
                
                # 2. Try loading from File Path
                elif os.path.exists(settings.FIREBASE_SERVICE_ACCOUNT_PATH):
                    cred = credentials.Certificate(settings.FIREBASE_SERVICE_ACCOUNT_PATH)
                    firebase_admin.initialize_app(cred)
                    print(f"Firebase initialized with {settings.FIREBASE_SERVICE_ACCOUNT_PATH}")
                
                else:
                    print(f"Warning: neither FIREBASE_CREDENTIALS_JSON env var nor {settings.FIREBASE_SERVICE_ACCOUNT_PATH} found. Firebase not initialized.")
                    self.db = None
                    return
            except Exception as e:
                print(f"Error initializing Firebase: {e}")
                self.db = None
                return

        try:
            self.db = firestore.client()
            self.collection_name = "knowledge_base"
        except Exception as e:
            print(f"Error getting Firestore client: {e}")
            self.db = None

    def fetch_index(self) -> List[Dict[str, Any]]:
        """Fetches ID, title, tags, and summary for all documents to aid matching."""
        if not self.db: return []
        docs = self.db.collection(self.collection_name).stream()
        index = []
        for doc in docs:
            data = doc.to_dict()
            index.append({
                "id": doc.id,
                "title": data.get("title", "Untitled"),
                "tags": data.get("tags", []),
                "summary": data.get("summary", ""),
                "status": data.get("status", "verified"),
                "ai_created": data.get("ai_created", False)
            })
        return index

    def fetch_documents(self, doc_ids: List[str]) -> List[Dict[str, Any]]:
        """Fetches full content for specific document IDs."""
        if not self.db: return []
        documents = []
        for doc_id in doc_ids:
            doc_ref = self.db.collection(self.collection_name).document(doc_id)
            doc = doc_ref.get()
            if doc.exists:
                data = doc.to_dict()
                data['id'] = doc.id
                documents.append(data)
        return documents

    def add_document(self, data: Dict[str, Any]) -> str:
        """Adds a new document to the KB."""
        if not self.db: return ""
        # Ensure status is set
        if "status" not in data:
            data["status"] = "unverified"
        
        update_time, doc_ref = self.db.collection(self.collection_name).add(data)
        return doc_ref.id

    def update_document(self, doc_id: str, data: Dict[str, Any]):
        """Updates an existing document."""
        if not self.db: return
        doc_ref = self.db.collection(self.collection_name).document(doc_id)
        doc_ref.update(data)

    def delete_document(self, doc_id: str):
        if not self.db: return
        self.db.collection(self.collection_name).document(doc_id).delete()

# Global instance
firebase_client = FirebaseClient()
