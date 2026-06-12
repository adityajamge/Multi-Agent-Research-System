from functools import partial
from langchain_core.messages import SystemMessage, HumanMessage
from agents.state import ResearchState

_SYSTEM_PROMPT = """You are an expert research writer. Your job is to produce a clear,
well-structured, and comprehensive report based on the research provided.

Structure every report as:
1. Executive Summary (2-3 sentences)
2. Key Findings (bullet points)
3. Detailed Analysis (paragraphs)
4. Conclusion

Rules:
- Be factual. Only use information from the provided sources.
- Be concise but thorough.
- Use professional, neutral language.
- If you are revising, directly address every point in the Critic's feedback."""


def writer_agent_node(state: ResearchState, llm) -> dict:
    """Generate (or revise) the research report using the LLM."""
    query            = state["query"]
    search_results   = state.get("search_results", "")
    scraped_content  = state.get("scraped_content", "")
    previous_report  = state.get("report", "")
    critique         = state.get("critique", "")
    revision_count   = state.get("revision_count", 0)

    if revision_count == 0:
        print("[Writer Agent] Writing first draft...")
        user_message = f"""Research Query: {query}

=== Search Results ===
{search_results}

=== Detailed Source Content ===
{scraped_content}

Write a comprehensive report answering the research query."""
    else:
        print(f"[Writer Agent] Writing revision {revision_count}...")
        user_message = f"""Research Query: {query}

=== Search Results ===
{search_results}

=== Detailed Source Content ===
{scraped_content}

=== Previous Draft ===
{previous_report}

=== Critic's Feedback (you MUST address all points) ===
{critique}

Revise the report to address all feedback above."""

    messages = [
        SystemMessage(content=_SYSTEM_PROMPT),
        HumanMessage(content=user_message),
    ]

    response = llm.invoke(messages)
    print("[Writer Agent] Draft complete.")
    return {"report": response.content}


def make_writer_node(llm):
    """Return a LangGraph-compatible node function with the LLM bound."""
    return partial(writer_agent_node, llm=llm)
