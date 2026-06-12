import re
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from tools import web_search_tool
from agents.state import ResearchState


def search_agent_node(state: ResearchState) -> dict:
    """Search the web using Tavily and extract top URLs from results."""
    query = state["query"]
    print(f"[Search Agent] Searching: {query}")

    results = web_search_tool.invoke(query)

    # Pull every URL that Tavily surfaces in the formatted output
    urls = re.findall(r"URL:\s*(https?://[^\s\n]+)", results)
    unique_urls = list(dict.fromkeys(urls))[:3]  # deduplicate, keep top 3

    print(f"[Search Agent] Found {len(unique_urls)} URLs")
    return {
        "search_results": results,
        "urls": unique_urls,
    }
