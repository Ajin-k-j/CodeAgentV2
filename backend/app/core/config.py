from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Hybris AI Agent"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Google Gemini & Firebase
    GEMINI_API_KEY: str
    FIREBASE_SERVICE_ACCOUNT_PATH: str = "service_account.json"
    FIREBASE_CREDENTIALS_JSON: Optional[str] = None
    
    class Config:
        env_file = ".env"
        extra = "ignore"

@lru_cache()
def get_settings():
    return Settings()
