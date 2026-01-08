from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class ChatRequest(BaseModel):
    message: str
    session_id: str

class KBEntry(BaseModel):
    title: str
    content: str
    tags: List[str]
    type: str
    status: str = "unverified"
    summary: Optional[str] = None
    ai_created: bool = False
    metadata: Optional[Dict[str, Any]] = {}

class KBUpdateEntry(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[List[str]] = None
    type: Optional[str] = None
    status: Optional[str] = None
    summary: Optional[str] = None
    ai_created: Optional[bool] = None
    metadata: Optional[Dict[str, Any]] = None

class ExtractRequest(BaseModel):
    text: str

class ExtractResponse(BaseModel):
    title: str
    tags: List[str]
    summary: str

class ExtractAndSaveRequest(BaseModel):
    text: str
    type: str = "code"
    ai_created: bool = False
