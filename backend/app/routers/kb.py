from fastapi import APIRouter, HTTPException
from app.models.schemas import KBEntry
from app.core.firebase import firebase_client

router = APIRouter()

@router.get("/kb")
def get_kb_index():
    return firebase_client.fetch_index()

@router.get("/kb/{doc_id}")
def get_kb_document(doc_id: str):
    docs = firebase_client.fetch_documents([doc_id])
    if not docs:
        raise HTTPException(status_code=404, detail="Document not found")
    return docs[0]

@router.post("/kb")
def add_kb_document(entry: KBEntry):
    doc_id = firebase_client.add_document(entry.dict())
    return {"id": doc_id, "message": "Document added successfully"}

from app.models.schemas import KBEntry, KBUpdateEntry

@router.put("/kb/{doc_id}")
def update_kb_document(doc_id: str, entry: KBUpdateEntry):
    firebase_client.update_document(doc_id, entry.dict(exclude_unset=True))
    return {"message": "Document updated successfully"}

@router.delete("/kb/{doc_id}")
def delete_kb_document(doc_id: str):
    firebase_client.delete_document(doc_id)
    return {"message": "Document deleted successfully"}
