from .groq_llm import get_groq_llm

# ── Add new providers here as you onboard them ──────────────────────────────
# from .anthropic_llm import get_anthropic_llm
# from .openai_llm    import get_openai_llm
# from .gemini_llm    import get_gemini_llm
# ────────────────────────────────────────────────────────────────────────────

_PROVIDERS = {
    "groq": get_groq_llm,
    # "anthropic": get_anthropic_llm,
    # "openai":    get_openai_llm,
    # "gemini":    get_gemini_llm,
}


def get_llm(provider: str = "groq", **kwargs):
    """
    Factory that returns a LangChain chat model for the given provider.

    Usage:
        llm = get_llm("groq")
        llm = get_llm("groq", model="llama-3.1-8b-instant", temperature=0.5)
    """
    if provider not in _PROVIDERS:
        available = list(_PROVIDERS.keys())
        raise ValueError(f"Unknown LLM provider '{provider}'. Available: {available}")
    return _PROVIDERS[provider](**kwargs)
