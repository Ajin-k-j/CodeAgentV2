from typing import TypedDict, List, Dict, Any, Annotated
from langgraph.graph.message import add_messages
from langchain_core.messages import BaseMessage

class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], add_messages]
    context_docs: List[Dict[str, Any]]
    user_intent: str
    answer: str
    used_kb: bool
    source_ids: List[str]
    needs_learning: bool
    learner_asked: bool
    previous_query: str
    previous_answer: str
