import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.routers import chat, kb, extract
from app.core.config import get_settings

# Ensure Google Auth can find credentials if needed
# Typically handled by Firebase Admin SDK, but if Gemini needs it:
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = get_settings().FIREBASE_SERVICE_ACCOUNT_PATH

app = FastAPI(title="Hybris AI Agent Backend")

# CORS Configuration
origins = [
    "http://localhost:5173",  # Vite default
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Hybris AI Agent Backend is running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

app.include_router(chat.router, prefix="/api")
app.include_router(kb.router, prefix="/api")
app.include_router(extract.router, prefix="/api")

# --- Background Cleanup ---
import asyncio
from app.services.session import session_manager
from app.services.agent import app as agent_app

@app.on_event("startup")
async def start_cleanup_task():
    asyncio.create_task(run_cleanup_loop())

async def run_cleanup_loop():
    print("🧹 Background session cleanup task started.")
    while True:
        try:
            await asyncio.sleep(60) # Check every minute
            
            # Use 5 minutes (300 seconds) timeout
            expired_sessions = session_manager.get_expired_sessions(timeout_seconds=300)
            
            if expired_sessions:
                print(f"🧹 Found {len(expired_sessions)} expired sessions: {expired_sessions}")
                checkpointer = agent_app.checkpointer
                
                if hasattr(checkpointer, 'storage'):
                    for session_id in expired_sessions:
                        if session_id in checkpointer.storage:
                            del checkpointer.storage[session_id]
                            print(f"   - Deleted memory for: {session_id}")
                        session_manager.remove_session(session_id)
                else:
                    print("   - Error: Checkpointer storage not accessible.")
                    
        except Exception as e:
            print(f"Error in cleanup loop: {e}")
            await asyncio.sleep(60) # Backoff

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
