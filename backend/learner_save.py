from extractor import extractor
from firebase_client import firebase_client
from datetime import datetime

async def learner_save_node(state: AgentState):
    """
    Auto-saves the previous query and answer to KB when user confirms it worked.
    """
    previous_query = state.get("previous_query", "")
    previous_answer = state.get("previous_answer", "")
    
    if not previous_query or not previous_answer:
        return {"answer": "Sorry, I couldn't find the previous conversation to save."}
    
    # Combine query and answer for content
    content = f"**Query:**\n{previous_query}\n\n**Answer:**\n{previous_answer}"
    
    try:
        # Extract metadata using the extractor
        metadata = await extractor.extract_metadata(content)
        
        # Save to Firebase with ai_created flag
        doc_id = firebase_client.add_document({
            "title": metadata.title,
            "content": content,
            "tags": metadata.tags,
            "type": "text",
            "summary": metadata.summary,
            "status": "unverified",
            "ai_created": True,
            "created_at": datetime.now().isoformat()
        })
        
        # Create response with source link and edit instructions
        save_response = f"""
✅ **Great! I've saved this to the Knowledge Base.**

**Document Details:**
- **ID:** {doc_id}
- **Title:** {metadata.title}
- **Tags:** {', '.join(metadata.tags)}
- **Status:** Unverified (you can verify it later)

[Source: {doc_id}]

**To edit or verify this document:**
1. Go to the **Knowledge Base** tab
2. Find the document (it will have a 🤖 "Added by AI" badge)
3. Click **Edit** to modify title, summary, tags, or content
4. Click **Verify** if the content is accurate

This will help improve future responses! 🎉
"""
        
        return {
            "answer": save_response,
            "messages": [AIMessage(content=save_response)],
            "source_ids": [doc_id],
            "learner_asked": False  # Reset the flag
        }
        
    except Exception as e:
        error_msg = f"Sorry, I encountered an error while saving: {str(e)}\nYou can manually save it using the AI Extractor tab."
        return {
            "answer": error_msg,
            "messages": [AIMessage(content=error_msg)],
            "learner_asked": False
        }
