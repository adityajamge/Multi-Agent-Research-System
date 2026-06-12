from langgraph.graph import StateGraph, END

from agents import (
    ResearchState,
    search_agent_node,
    reader_agent_node,
    make_writer_node,
    make_critic_node,
)
from llms import get_llm


def _route_critic(state: ResearchState) -> str:
    """Send to END if report is approved, loop back to Writer otherwise."""
    return "done" if state.get("final_report") else "revise"


def build_graph(llm_provider: str = "groq", **llm_kwargs) -> "CompiledGraph":
    """
    Assemble and compile the research graph.

    Args:
        llm_provider: one of the keys registered in llms/__init__.py
        **llm_kwargs: forwarded to the provider (e.g. model=, temperature=)
    """
    llm = get_llm(llm_provider, **llm_kwargs)

    graph = StateGraph(ResearchState)

    graph.add_node("search_agent", search_agent_node)
    graph.add_node("reader_agent", reader_agent_node)
    graph.add_node("writer_agent", make_writer_node(llm))
    graph.add_node("critic_agent", make_critic_node(llm))

    graph.set_entry_point("search_agent")

    graph.add_edge("search_agent", "reader_agent")
    graph.add_edge("reader_agent", "writer_agent")
    graph.add_edge("writer_agent", "critic_agent")

    graph.add_conditional_edges(
        "critic_agent",
        _route_critic,
        {
            "revise": "writer_agent",
            "done":   END,
        },
    )

    return graph.compile()


def run_research(query: str, llm_provider: str = "groq", **llm_kwargs) -> str:
    """Run the full research pipeline and return the final report."""
    graph = build_graph(llm_provider, **llm_kwargs)

    initial_state: ResearchState = {
        "query":          query,
        "search_results": "",
        "urls":           [],
        "scraped_content":"",
        "report":         "",
        "critique":       "",
        "revision_count": 0,
        "final_report":   "",
    }

    final_state = graph.invoke(initial_state)
    return final_state.get("final_report") or final_state.get("report", "No report generated.")
