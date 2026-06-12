import os
from langchain_groq import ChatGroq
from dotenv import load_dotenv

load_dotenv()

GROQ_DEFAULT_MODEL = "llama-3.3-70b-versatile"

def get_groq_llm(model: str = GROQ_DEFAULT_MODEL, temperature: float = 0.3) -> ChatGroq:
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY not set in environment. Add it to your .env file.")
    return ChatGroq(model=model, temperature=temperature, api_key=api_key)
