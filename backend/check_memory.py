from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import StateGraph
from typing import TypedDict

# Setup minimal graph
class State(TypedDict):
    msg: str

builder = StateGraph(State)
builder.add_node("node", lambda x: {"msg": "hello"})
builder.set_entry_point("node")
builder.add_edge("node", "__end__")
memory = MemorySaver()
app = builder.compile(checkpointer=memory)

# Run once
config = {"configurable": {"thread_id": "session_1"}}
app.invoke({"msg": "hi"}, config)

# Inspect storage
import json

print(f"Storage type: {type(memory.storage)}")
print(f"Keys: {list(memory.storage.keys())}")

for thread_id, checkpoints in memory.storage.items():
    print(f"Thread ID: {thread_id}")
    for checkpoint_id, checkpoint in checkpoints.items():
        print(f"Content Type: {type(checkpoint)}")
        print(f"Content: {checkpoint}") 
        # Check for timestamp
        if isinstance(checkpoint, dict):
             print(f"Timestamp: {checkpoint.get('ts')}")
        break # Just first one
