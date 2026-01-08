from langchain_core.messages import AIMessage
from datetime import datetime
from app.services.agent.state import AgentState
from app.services.agent.prompts import (
    LEARNER_PROMPT_TEMPLATE, 
    LEARNER_PROMPT_CORRECTION, 
    LEARNER_SAVE_SUCCESS
)
from app.services.extractor import extractor
from app.core.firebase import firebase_client

def learner_node(state: AgentState):
    """Ask user if the general knowledge answer worked."""
    if not state.get("needs_learning", False):
        return {}
    
    learner_prompt = LEARNER_PROMPT_TEMPLATE
    
    # If it's a correction, customize the prompt
    intent = state.get("user_intent", "")
    
    # Check if the answer indicates confusion
    failure_keywords = ["Please specify", "I don't understand", "could you clarify", "not sure which"]
    current_response = state.get("answer", "")
    if any(k.lower() in current_response.lower() for k in failure_keywords):
        return {"answer": current_response, "messages": [AIMessage(content=current_response)]}

    if intent == "correction":
        learner_prompt = LEARNER_PROMPT_CORRECTION

    current_response = state.get("answer", "")
    updated_response = current_response + learner_prompt
    
    return {
        "answer": updated_response,
        "messages": [AIMessage(content=updated_response)],
        "learner_asked": True
    }

async def learner_save_node(state: AgentState):
    """Auto-save confirmed answer to KB."""
    previous_query = state.get("previous_query", "")
    previous_answer = state.get("previous_answer", "")
    
    if not previous_query or not previous_answer:
        return {"answer": "Sorry, I couldn't find the previous conversation to save."}
    
    # Clean the answer
    clean_answer = previous_answer
    
    # Remove Learn Agent prompt
    if "\n---\n" in clean_answer:
        clean_answer = clean_answer.split("\n---\n")[0].strip()
    elif "---" in clean_answer and "💡 Learner Agent" in clean_answer:
        clean_answer = clean_answer.split("---")[0].strip()
        
    # Use AI to intelligently clean the content
    clean_answer = await extractor.clean_kb_content(clean_answer)

    # Extract metadata using BOTH query and answer for context
    extraction_content = f"Query: {previous_query}\nAnswer: {clean_answer}"
    
    # But SAVE only the cleansed answer to keep the KB clean
    content = clean_answer
    
    try:
        metadata = await extractor.extract_metadata(extraction_content)
        
        # Use extracted summary as requested
        summary = metadata.summary
        
        doc_id = firebase_client.add_document({
            "title": metadata.title,
            "content": content,
            "tags": metadata.tags,
            "type": "text",
            "summary": summary,
            "status": "unverified",
            "ai_created": True,
            "created_at": datetime.now().isoformat()
        })
        
        save_response = LEARNER_SAVE_SUCCESS.format(
            doc_id=doc_id,
            title=metadata.title,
            tags=', '.join(metadata.tags)
        )
        
        return {
            "answer": save_response,
            "messages": [AIMessage(content=save_response)],
            "source_ids": [doc_id],
            "learner_asked": False
        }
        
    except Exception as e:
        error_msg = f"Sorry, error while saving: {str(e)}\nYou can manually save using the AI Extractor tab."
        return {"answer": error_msg, "messages": [AIMessage(content=error_msg)], "learner_asked": False}
