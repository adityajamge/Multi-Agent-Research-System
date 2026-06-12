import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from tools import web_scraper_tool
from agents.state import ResearchState

_MAX_CONTENT_PER_URL = 3000  # chars — keeps total context manageable


def reader_agent_node(state: ResearchState) -> dict:
    """Scrape each URL with BeautifulSoup and consolidate the content."""
    urls = state.get("urls", [])

    if not urls:
        print("[Reader Agent] No URLs to scrape.")
        return {"scraped_content": "No URLs were available to scrape."}

    parts = []
    for i, url in enumerate(urls, 1):
        print(f"[Reader Agent] Scraping ({i}/{len(urls)}): {url}")
        raw = web_scraper_tool.invoke(url)
        # Trim per-URL content so the writer's context doesn't explode
        trimmed = raw[:_MAX_CONTENT_PER_URL]
        if len(raw) > _MAX_CONTENT_PER_URL:
            trimmed += "\n... [trimmed]"
        parts.append(f"--- Source {i}: {url} ---\n{trimmed}")

    consolidated = "\n\n".join(parts)
    print(f"[Reader Agent] Scraped {len(parts)} sources.")
    return {"scraped_content": consolidated}
