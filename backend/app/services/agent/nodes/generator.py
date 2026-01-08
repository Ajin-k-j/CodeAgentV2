from langchain_core.messages import HumanMessage, AIMessage
from app.services.agent.state import AgentState
from app.services.agent.utils import get_llm
from app.services.agent.prompts import (
    GENERATION_PROMPT_KB, 
    GENERATION_PROMPT_GENERAL, 
    GREETING_PROMPT, 
    GENERAL_CHAT_PROMPT
)

def generate_node(state: AgentState):
    """Generate response using KB or general knowledge."""
    query = state["messages"][-1].content
    docs = state.get("context_docs", [])
    llm = get_llm()
    
    context_str = ""
    source_ids = []
    
    if docs:
        for doc in docs:
            source_ids.append(doc['id'])
            context_str += f"\n--- Document (ID: {doc['id']}, Status: {doc.get('status', 'unverified')}) ---\n"
            context_str += f"Title: {doc['title']}\nContent:\n{doc.get('content', '')}\n"
            if doc.get('status') == 'unverified':
                context_str += "⚠️ WARNING: THIS DOCUMENT IS UNVERIFIED.\n"
    
    has_kb_context = len(docs) > 0
    
    # Build conversation history context
    history_context = ""
    start_idx = max(0, len(state["messages"]) - 6)
    for msg in state["messages"][start_idx:-1]:
        role = "User" if isinstance(msg, HumanMessage) else "Assistant"
        history_context += f"{role}: {msg.content}\n"

    if has_kb_context:
        prompt = GENERATION_PROMPT_KB.format(
            history_context=history_context, 
            query=query, 
            context_str=context_str
        )
    else:
        prompt = GENERATION_PROMPT_GENERAL.format(
            history_context=history_context, 
            query=query
        )
    
    response = llm.invoke(prompt)
    answer_content = response.content
    
    return {
        "answer": answer_content,
        "messages": [AIMessage(content=answer_content)],
        "used_kb": has_kb_context,
        "source_ids": source_ids,
        "needs_learning": not has_kb_context or state.get("user_intent") == "correction",
        "previous_query": query,
        "previous_answer": answer_content
    }

def direct_response_node(state: AgentState):
    """Handle greetings and general conversation."""
    query = state["messages"][-1].content
    intent = state.get("user_intent", "general_chat")
    llm = get_llm()
    
    if intent == "greeting":
        prompt = GREETING_PROMPT.format(query=query)
    else:
        prompt = GENERAL_CHAT_PROMPT.format(query=query)
    
    response = llm.invoke(prompt)
    return {"answer": response.content, "messages": [AIMessage(content=response.content)]}
