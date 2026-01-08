const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const api = {
    async clearSession(sessionId) {
        const response = await fetch(`${API_BASE_URL}/api/session/${sessionId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to clear session');
        return response.json();
    },

    async chat(message, sessionId) {
        const response = await fetch(`${API_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, session_id: sessionId })
        });
        if (!response.ok) throw new Error('Failed to send message');
        // Return raw response for streaming handling in component
        return response;
    },

    async extractMetadata(text) {
        const response = await fetch(`${API_BASE_URL}/api/extract`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        if (!response.ok) throw new Error('Failed to extract metadata');
        return response.json();
    },

    async extractAndSave(text, type = 'code') {
        const response = await fetch(`${API_BASE_URL}/api/extract/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, type })
        });
        if (!response.ok) throw new Error('Failed to save to KB');
        return response.json();
    },

    async fetchKbIndex() {
        const response = await fetch(`${API_BASE_URL}/api/kb`);
        if (!response.ok) throw new Error('Failed to fetch KB index');
        return response.json();
    },

    async fetchKbDocument(id) {
        const response = await fetch(`${API_BASE_URL}/api/kb/${id}`);
        if (!response.ok) throw new Error('Failed to fetch document');
        return response.json();
    },

    async updateKbDocument(id, data) {
        const response = await fetch(`${API_BASE_URL}/api/kb/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to update document');
        return response.json();
    },

    async deleteKbDocument(id) {
        const response = await fetch(`${API_BASE_URL}/api/kb/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete document');
        return response.json();
    }
};
