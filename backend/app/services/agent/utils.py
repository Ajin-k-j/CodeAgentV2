from langchain_google_genai import ChatGoogleGenerativeAI
from app.core.config import get_settings

def get_llm():
    settings = get_settings()
    return ChatGoogleGenerativeAI(
        model="gemini-2.0-flash-exp", 
        temperature=0,
        google_api_key=settings.GEMINI_API_KEY
    )
