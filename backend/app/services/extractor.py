import os
import google.generativeai as genai
from app.models.schemas import ExtractResponse
import json
from app.core.config import get_settings

class AIExtractor:
    def __init__(self):
        api_key = get_settings().GEMINI_API_KEY
        if api_key:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-2.0-flash-exp')
        else:
            self.model = None
            print("Warning: GEMINI_API_KEY not found.")

    async def extract_metadata(self, text: str) -> ExtractResponse:
        if not self.model:
            return ExtractResponse(title="Error", tags=["No API Key"], summary="Backend not configured")

        prompt = f"""
        Analyze the following Hybris/SAP Commerce code snippet or text. 
        
        1. Provide a short, descriptive Title (5-10 words).
        2. Generate a list of relevant Tags as plain keywords (NO # symbols):
           - Include item type names (e.g., Product, Order, Customer)
           - Include attribute/column names mentioned
           - Include query type (flexsearch, groovy, impex, beanshell, etc.)
           - Include domain concepts (price, stock, checkout, etc.)
           - Maximum 8 tags, most specific and relevant
        3. Provide a brief Summary (1-2 sentences) of what it does.
        
        Input Text:
        {text}
        
        Output JSON format (return ONLY valid JSON, no markdown):
        {{
            "title": "...",
            "tags": ["tag1", "tag2", "tag3"],
            "summary": "..."
        }}
        """
        
        try:
            response = self.model.generate_content(prompt)
            # Basic cleanup if the model returns markdown code blocks
            content = response.text.replace("```json", "").replace("```", "").strip()
            data = json.loads(content)
            
            # Clean up tags - remove # prefix if present
            if "tags" in data and isinstance(data["tags"], list):
                data["tags"] = [tag.lstrip('#').strip() for tag in data["tags"]]
            
            return ExtractResponse(**data)
        except Exception as e:
            print(f"Extraction error: {e}")
            return ExtractResponse(title="Error", tags=[], summary=str(e))

    async def clean_kb_content(self, text: str) -> str:
        """Clean conversational text to extract knowledge-base ready content."""
        if not self.model:
            return text

        prompt = f"""
        You are a Knowledge Base Cleaner. Your task is to extract the PURE KNOWLEDGE from a chat response.
        
        Input Text:
        {text}
        
        Instructions:
        1. REMOVE conversational filler (e.g., "Here is the code", "Sure", "You can use this", "Hope this helps").
        2. REMOVE "Copy" button artifacts.
        3. IF CODE EXISTS: Return ONLY the code block(s). Preserve comments inside the code.
        4. IF NO CODE: Return the factual information as a professional, neutral statement.
        5. REMOVE any "General Knowledge" warnings.
        6. Do NOT markdown-fence the output unless necessary for structure within the content. Return the raw content that belongs in the file.
        
        Output:
        """
        
        try:
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            print(f"Cleaning error: {e}")
            return text

extractor = AIExtractor()
