import json
from app.services.agent.state import AgentState
from app.services.agent.utils import get_llm
from app.services.agent.prompts import RETRIEVAL_PROMPT
from app.core.firebase import firebase_client

def retrieve_node(state: AgentState):
    """Fetch KB documents using semantic matching."""
    query = state["messages"][-1].content
    index = firebase_client.fetch_index()
    llm = get_llm()
    
    if not index:
        return {"context_docs": []}

    index_str = "\n".join([
        f"ID: {item['id']}\nTitle: {item['title']}\nTags: {', '.join(item['tags']) if item['tags'] else 'none'}\nSummary: {item.get('summary', 'N/A')}\n"
        for item in index
    ])
    
    try:
        response = llm.invoke(RETRIEVAL_PROMPT.format(query=query, index_str=index_str))
        content = response.content.replace("```json", "").replace("```", "").strip()
        selected_ids = json.loads(content)
        if not isinstance(selected_ids, list):
            selected_ids = []
    except Exception as e:
        print(f"Retrieval error: {e}")
        selected_ids = []
        
    full_docs = firebase_client.fetch_documents(selected_ids)
    return {"context_docs": full_docs}
