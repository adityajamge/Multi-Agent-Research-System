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


def _initial_state(query: str) -> ResearchState:
    return {
        "query":          query,
        "search_results": "",
        "urls":           [],
        "scraped_content":"",
        "report":         "",
        "critique":       "",
        "score":          0,
        "revision_count": 0,
        "final_report":   "",
    }


def run_research(query: str, llm_provider: str = "groq", **llm_kwargs) -> str:
    """Run the full research pipeline and return the final report."""
    graph = build_graph(llm_provider, **llm_kwargs)
    final_state = graph.invoke(_initial_state(query))
    return final_state.get("final_report") or final_state.get("report", "No report generated.")


def run_research_stream(query: str, llm_provider: str = "groq", **llm_kwargs):
    """
    Run the pipeline and yield a structured event for every node as it completes.

    Each yielded item is a plain dict the API layer can serialise to SSE:
        {"node": <name>, "data": <state-update emitted by that node>}

    LangGraph's `stream(stream_mode="updates")` emits `{node_name: update}` after
    each node finishes — including each pass of the Writer↔Critic revision loop —
    so the frontend can light up agents in the real order they execute.
    """
    graph = build_graph(llm_provider, **llm_kwargs)

    accumulated: dict = dict(_initial_state(query))

    for chunk in graph.stream(_initial_state(query), stream_mode="updates"):
        # chunk == {node_name: state_update}
        for node_name, update in chunk.items():
            if isinstance(update, dict):
                accumulated.update(update)
            yield {"node": node_name, "data": update if isinstance(update, dict) else {}}

    yield {
        "node": "complete",
        "data": {
            "final_report": accumulated.get("final_report")
            or accumulated.get("report", ""),
            "revision_count": accumulated.get("revision_count", 0),
        },
    }
