import time
from typing import Dict, List

class SessionManager:
    def __init__(self):
        self._last_active: Dict[str, float] = {}

    def update_activity(self, session_id: str):
        """Update the last active timestamp for a session."""
        self._last_active[session_id] = time.time()

    def get_expired_sessions(self, timeout_seconds: int = 300) -> List[str]:
        """Return list of session_ids that have been inactive for > timeout."""
        now = time.time()
        expired = []
        for session_id, last_time in self._last_active.items():
            if now - last_time > timeout_seconds:
                expired.append(session_id)
        return expired

    def remove_session(self, session_id: str):
        """Remove a session from tracking."""
        if session_id in self._last_active:
            del self._last_active[session_id]

# Singleton instance
session_manager = SessionManager()
