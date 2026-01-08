from fastapi import APIRouter
from app.models.schemas import ExtractRequest, ExtractResponse, ExtractAndSaveRequest
from app.services.extractor import extractor
from app.core.firebase import firebase_client
from datetime import datetime

router = APIRouter()

@router.post("/extract", response_model=ExtractResponse)
async def extract_metadata(request: ExtractRequest):
    """Extract metadata without saving"""
    return await extractor.extract_metadata(request.text)

@router.post("/extract/save")
async def extract_and_save(request: ExtractAndSaveRequest):
    """Extract metadata and save to Firebase KB in one operation"""
    metadata = await extractor.extract_metadata(request.text)
    
    doc_id = firebase_client.add_document({
        "title": metadata.title,
        "content": request.text,
        "tags": metadata.tags,
        "type": request.type,
        "summary": metadata.summary,
        "status": "unverified",
        "ai_created": request.ai_created,
        "created_at": datetime.now().isoformat()
    })
    
    return {
        "id": doc_id,
        "title": metadata.title,
        "tags": metadata.tags,
        "summary": metadata.summary
    }
