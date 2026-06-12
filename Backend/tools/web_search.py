import os
from tavily import TavilyClient
from langchain_core.tools import tool
from dotenv import load_dotenv
from rich import print
load_dotenv() 
@tool
def web_search_tool(query: str) -> str:
    """Search the web for a given query and return summarized results."""
    client = TavilyClient(api_key=os.environ["TAVILY_API_KEY"])
    response = client.search(query, search_depth="advanced", max_results=5)

    results = response.get("results", [])
    if not results:
        return "No results found."

    output = []
    for r in results:
        output.append(f"Title: {r['title']}\nURL: {r['url']}\nContent: {r['content'][:300]}\n")

    return "\n---\n".join(output)

if __name__ == "__main__":
    print(web_search_tool.invoke("Acharya Prashant?"))