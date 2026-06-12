from typing import TypedDict


class ResearchState(TypedDict):
    query: str            # original user question
    search_results: str   # raw Tavily output
    urls: list            # URLs extracted from search results
    scraped_content: str  # BeautifulSoup output from each URL
    report: str           # current draft from Writer
    critique: str         # feedback from Critic
    revision_count: int   # tracks Writer→Critic loop iterations
    final_report: str     # approved output
