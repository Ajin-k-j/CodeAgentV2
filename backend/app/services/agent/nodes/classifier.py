from langchain_core.messages import HumanMessage, AIMessage
from app.services.agent.state import AgentState
from app.services.agent.utils import get_llm
from app.services.agent.prompts import CORRECTION_PROMPT, CONFIRMATION_PROMPT, INTENT_CLASSIFICATION_PROMPT

def classify_intent_node(state: AgentState):
    """Classify user intent and detect learner confirmations."""
    query = state["messages"][-1].content
    messages = state["messages"]
    llm = get_llm()
    
    print(f"\n=== CLASSIFIER DEBUG ===")
    print(f"Current query: {query}")
    print(f"Total messages in history: {len(messages)}")
    
    # 1. Check for correction/improvement intent (Global check)
    try:
        resp = llm.invoke(CORRECTION_PROMPT.format(query=query))
        is_correction = resp.content.strip().lower() in ['yes', 'y']
        if is_correction:
            print(f"Correction/Improvement detected from user.")
            return {"user_intent": "correction"}
    except Exception as e:
        print(f"Correction detection error: {e}")
        pass

    # 2. Check for Confirmation (Did the answer work?)
    if len(messages) >= 2:
        last_ai_msg = messages[-2]
        if isinstance(last_ai_msg, AIMessage):
            has_learner_prompt = "💡 Learner Agent" in last_ai_msg.content
            if has_learner_prompt:
                # Add history context for better confirmation detection if available
                history_context = ""
                start_idx = max(0, len(messages) - 5)
                for i, msg in enumerate(messages[start_idx:-1]):
                    role = "User" if isinstance(msg, HumanMessage) else "Assistant"
                    history_context += f"{role}: {msg.content}\n"
                    
                prompt_with_history = f"""
Recent Conversation History:
{history_context}

{CONFIRMATION_PROMPT.format(query=query)}
"""
                try:
                    response = llm.invoke(prompt_with_history)
                    is_confirmation = response.content.strip().lower() in ['yes', 'y']
                    print(f"LLM confirmation check result: {response.content.strip().lower()}")
                    print(f"Is confirmation: {is_confirmation}")
                    
                    if is_confirmation:
                        # Extract previous query and answer from history
                        if len(messages) >= 3:
                            ai_msg_with_learner = last_ai_msg.content
                            
                            # Split at the learner separator
                            if "\n---\n" in ai_msg_with_learner:
                                actual_answer = ai_msg_with_learner.split("\n---\n")[0].strip()
                            elif "---" in ai_msg_with_learner and "💡 Learner Agent" in ai_msg_with_learner:
                                actual_answer = ai_msg_with_learner.split("---")[0].strip()
                            else:
                                learner_start = ai_msg_with_learner.find("💡 Learner Agent")
                                if learner_start > 0:
                                    actual_answer = ai_msg_with_learner[:learner_start].strip()
                                else:
                                    actual_answer = ai_msg_with_learner
                            
                            original_query = messages[-3].content if len(messages) >= 3 else ""
                            
                            print(f"Extracted original query: {original_query[:50]}...")
                            print(f"Extracted answer: {actual_answer[:50]}...")
                            
                            return {
                                "user_intent": "learner_confirmation",
                                "previous_query": original_query,
                                "previous_answer": actual_answer
                            }
                except Exception as e:
                    print(f"Error in confirmation detection: {e}")
                    pass
    
    # Normal intent classification
    try:
        response = llm.invoke(INTENT_CLASSIFICATION_PROMPT.format(query=query))
        intent = response.content.strip().lower()
        if intent not in ['greeting', 'general_chat', 'clarification', 'correction', 'technical']:
            intent = 'technical'
    except:
        intent = 'technical'
    
    print(f"Final intent: {intent}\n")
    return {"user_intent": intent}
