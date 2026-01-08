Technical Architecture & Developer Guide
1. High-Level Architecture
The project follows a modern, decoupled architecture:

Frontend: React (Vite) + TailwindCSS. Uses a centralized 
api.js
 service to communicate with the backend.
Backend: Python FastAPI. Follows a Layered Architecture (Controller-Service-Repository pattern).
AI Core: Built on LangChain and LangGraph for multi-agent workflows.
Database: Google Firebase Firestore (Vector Search capabilities simulated via semantic retrieval logic).
Backend Directory Structure (app/)
backend/app/
├── core/           # Configuration, Database Clients (Firebase)
├── models/         # Pydantic Schemas (Data Validation)
├── routers/        # API Routes (Controllers)
└── services/       # Business Logic
    ├── agent/      # [CORE] The Multi-Agent System
    ├── extractor.py
    └── session.py
2. Multi-Agent System Explained
The core intelligence engine uses LangGraph to create a stateful, cyclic graph. This allows the AI to "think," routing between different specialized experts rather than being a linear chain.

The Graph Workflow (
app/services/agent/graph.py
)
Start: User sends a message.
Classifier Node: An LLM determines the user's intent.
Technical Question? -> Route to Retriever.
Correction? -> Route to Generator (to acknowledge) then Learner.
Greeting/Chat? -> Route to Direct Response.
Retriever Node: Fetches relevant documents from the Firebase Knowledge Base using semantic analysis.
Generator Node: Synthesizes the answer using:
Conversation History (Short-term context).
Retrieved Documents (Knowledge Base).
LLM General Knowledge (fallback).
Learner Node: A unique self-improvement agent.
If the answer wasn't from the KB, it prompts the user: "Did this work?"
If the user confirms, it triggers the Learner Save Node to automatically save the solution to the KB.
Separation of Concerns
State (
state.py
): Defines the shared memory (messages, context_docs, user_intent) passed between agents.
Nodes (nodes/): Each step (Classify, Retrieve, Generate) is a pure function in its own file.
Prompts (
prompts.py
): All system prompts are centralized for easy tuning.
3. Context Management
Context is maintained at two levels: Short-term Conversation History and Long-term Application State.

A. Conversation History (LangGraph Checkpointer)
We use MemorySaver from LangGraph.
Mechanism: Every turn of the conversation is saved as a "checkpoint" keyed by the session_id.
Flow:
Frontend generates a sessionId (stored in LocalStorage).
Frontend sends sessionId with every request.
Backend loads the graph state for that ID.
The LLM sees the messages list from previous turns.
B. Session Lifecycle (
session_manager.py
)
To prevent memory leaks (unbounded graph growth), we implement a background cleanup service.
Active Tracking: 
SessionManager
 tracks the last activity timestamp of every session.
Cleanup Loop:
Runs every 60 seconds (app/main.py:run_cleanup_loop).
Checks for sessions inactive for > 5 minutes.
Action: Deletes the MemorySaver storage for that ID and removes it from memory.
4. Key Developer Questions & Answers
Q: How do you handle secrets? A: We use pydantic-settings in 
app/core/config.py
. It reads from 
.env
 files locally. For cloud deployment (like Render), we support loading the Firebase credentials via a JSON string environment variable to avoid committing sensitive files.

Q: Strategies to prevent hallucinations? A:

Retrieval-Augmented Generation (RAG): We prefer answers grounded in the KB.
Prompts: The Generator prompt strictly instructs the AI to cite sources ([Source: ID]) and warn if a document is unverified.
Relevance Check: The prompt explicitly asks the model to ignore KB documents if they don't match the specific entity requested (e.g., ignoring "Product" docs if asking about "Orders").
Q: How is the Knowledge Base updated? A: Two ways:

Manual: Using the "AI Extractor" UI to add code snippets.
Autonomous: The "Learner Agent" detects when a general knowledge answer solves a user's problem and offers to auto-save it.