import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { api } from '../services/api';

const ChatContext = createContext();

export function ChatProvider({ children }) {
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [selectedDocId, setSelectedDocId] = useState(null);
    const messagesEndRef = useRef(null);

    // Initialize Session ID with Timeout (5 minutes)
    useEffect(() => {
        let storedSessionId = localStorage.getItem('chat_session_id');
        const lastActive = localStorage.getItem('chat_last_active');
        const now = Date.now();
        const MAX_IDLE_TIME = 5 * 60 * 1000; // 5 minutes

        if (!storedSessionId || (lastActive && now - parseInt(lastActive) > MAX_IDLE_TIME)) {
            // If there was an old session, clear it from server
            if (storedSessionId) {
                api.clearSession(storedSessionId)
                    .catch(err => console.error("Failed to clear old session:", err));
            }

            storedSessionId = crypto.randomUUID();
            localStorage.setItem('chat_session_id', storedSessionId);
            // Clear messages if session expired
            setMessages([]);
        }

        // Update activity timestamp
        localStorage.setItem('chat_last_active', now.toString());
        setSessionId(storedSessionId);
    }, []);

    // Update last active on any message activity
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem('chat_last_active', Date.now().toString());
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const value = {
        messages,
        setMessages,
        isLoading,
        setIsLoading,
        selectedDocId,
        setSelectedDocId,
        sessionId,
        messagesEndRef
    };

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChatContext() {
    return useContext(ChatContext);
}
