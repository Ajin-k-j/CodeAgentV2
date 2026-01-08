from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

from app.services.agent.state import AgentState
from app.services.agent.nodes.classifier import classify_intent_node
from app.services.agent.nodes.retriever import retrieve_node
from app.services.agent.nodes.generator import generate_node, direct_response_node
from app.services.agent.nodes.learner import learner_node, learner_save_node

# --- Graph Construction ---

workflow = StateGraph(AgentState)

workflow.add_node("classifier", classify_intent_node)
workflow.add_node("retriever", retrieve_node)
workflow.add_node("generator", generate_node)
workflow.add_node("direct_response", direct_response_node)
workflow.add_node("learner", learner_node)
workflow.add_node("learner_save", learner_save_node)

def should_retrieve(state: AgentState):
    """Route based on intent."""
    intent = state.get("user_intent", "technical")
    if intent == "learner_confirmation":
        return "learner_save"
    elif intent == "technical":
        return "retriever"
    elif intent == "correction":
        # Modifications: Route correction to generator (to acknowledge) then learner
        return "generator"
    elif intent == "clarification":
        return "generator"
    else:
        return "direct_response"

workflow.set_entry_point("classifier")
workflow.add_conditional_edges(
    "classifier",
    should_retrieve,
    {
        "retriever": "retriever",
        "direct_response": "direct_response",
        "learner_save": "learner_save",
        "generator": "generator"
    }
)
workflow.add_edge("retriever", "generator")
workflow.add_edge("generator", "learner")
workflow.add_edge("learner", END)
workflow.add_edge("learner_save", END)
workflow.add_edge("direct_response", END)

# Add Persistence
memory = MemorySaver()
app = workflow.compile(checkpointer=memory)
