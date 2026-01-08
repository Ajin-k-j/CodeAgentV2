from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.models.schemas import ChatRequest
from app.services.agent import app as agent_app
from langchain_core.messages import HumanMessage, AIMessage
import json
import asyncio

router = APIRouter()

from app.services.session import session_manager

@router.post("/chat")
async def chat_endpoint(request: ChatRequest):
    # Update activity timestamp
    session_manager.update_activity(request.session_id)
    
    async def event_generator():
        # Use session_id for thread persistence
        config = {"configurable": {"thread_id": request.session_id}}
        
        # Only send the new message, history is loaded from memory
        inputs = {"messages": [HumanMessage(content=request.message)]}
        
        # Stream events from LangGraph
        try:
            async for event in agent_app.astream(inputs, config=config):
                for node_name, state in event.items():
                    # Determine step messages based on node names
                    if node_name == "classifier":
                        intent = state.get("user_intent", "unknown")
                        if intent == "greeting":
                            yield json.dumps({"type": "step", "content": "Just saying hello..."}) + "\n"
                        elif intent == "general_chat":
                            yield json.dumps({"type": "step", "content": "Reading your message..."}) + "\n"
                        elif intent == "technical":
                            yield json.dumps({"type": "step", "content": "Identifying the technical topic..."}) + "\n"
                            yield json.dumps({"type": "step", "content": "Checking if I have learned this before..."}) + "\n"
                    
                    elif node_name == "retriever":
                        docs = state.get("context_docs", [])
                        if docs:
                            yield json.dumps({"type": "step", "content": "Found some related knowledge in my database..."}) + "\n"
                            yield json.dumps({"type": "info", "content": f"Found {len(docs)} relevant examples."}) + "\n"
                        else:
                            yield json.dumps({"type": "step", "content": "I haven't learned this specific topic yet."}) + "\n"
                            yield json.dumps({"type": "step", "content": "Using my general training to create a solution..."}) + "\n"
                    
                    elif node_name == "generator":
                        yield json.dumps({"type": "step", "content": "Drafting the answer for you..."}) + "\n"
                        answer = state.get("answer", "")
                        if answer:
                            yield json.dumps({"type": "answer", "content": answer}) + "\n"
                    
                    elif node_name == "learner":
                        answer = state.get("answer", "")
                        if answer:
                            yield json.dumps({"type": "step", "content": "Checking if this answer is worth saving..."}) + "\n"
                            yield json.dumps({"type": "answer", "content": answer}) + "\n"
                    
                    elif node_name == "direct_response":
                        answer = state.get("answer", "")
                        if answer:
                            yield json.dumps({"type": "answer", "content": answer}) + "\n"
                            
                    elif node_name == "learner_save":
                        yield json.dumps({"type": "step", "content": "Saving this new knowledge to my permanent memory..."}) + "\n"
                        answer = state.get("answer", "")
                        if answer:
                            yield json.dumps({"type": "answer", "content": answer}) + "\n"
        except Exception as e:
            yield json.dumps({"type": "error", "content": str(e)}) + "\n"

    return StreamingResponse(event_generator(), media_type="application/x-ndjson")

@router.delete("/session/{session_id}")
async def clear_session(session_id: str):
    """Clear server-side memory for a specific session."""
    try:
        # Access the checkpointer (MemorySaver) directly
        # MemorySaver stores data in .storage dictionary
        # We need to find keys related to this thread_id
        
        checkpointer = agent_app.checkpointer
        if hasattr(checkpointer, 'storage'):
            keys_to_delete = []
            for key in checkpointer.storage.keys():
                # Key typically involves thread_id. 
                # LangGraph MemorySaver keys are (thread_id, checkpoint_id) tuples usually?
                # Actually, looking at MemorySaver implementation:
                # storage[thread_id][checkpoint_id] = checkpoint
                
                # Wait, MemorySaver implementation varies.
                # Standard MemorySaver: storage is Dict[str, Dict[str, Checkpoint]] (thread_id -> checkpoint_id -> checkpoint)
                
                if key == session_id:
                    keys_to_delete.append(key)
            
            for key in keys_to_delete:
                del checkpointer.storage[key]
                print(f"Deleted session memory for: {key}")
                
            return {"status": "success", "message": f"Session {session_id} cleared from memory"}
        else:
            return {"status": "error", "message": "Checkpointer storage not accessible"}
            
    except Exception as e:
        print(f"Error clearing session: {e}")
        raise HTTPException(status_code=500, detail=str(e))
