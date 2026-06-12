import os
import re
import requests
from bs4 import BeautifulSoup
from langchain_core.tools import tool
from dotenv import load_dotenv

load_dotenv()

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate",
    "Connection": "keep-alive",
}

_REQUEST_TIMEOUT = 10  # seconds
_MAX_TEXT_LENGTH = 4000  # chars returned to the agent


def _clean_text(text: str) -> str:
    """Collapse whitespace and remove blank lines."""
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _extract_page_content(html: str, url: str) -> dict:
    """Parse HTML and return a structured dict of the page's meaningful content."""
    soup = BeautifulSoup(html, "lxml")

    # Remove noise: scripts, styles, nav, footer, ads
    for tag in soup(["script", "style", "noscript", "nav", "footer",
                     "aside", "header", "form", "iframe", "svg"]):
        tag.decompose()

    # Title
    title = ""
    if soup.title and soup.title.string:
        title = soup.title.string.strip()

    # Meta description
    meta_desc = ""
    meta_tag = soup.find("meta", attrs={"name": "description"})
    if meta_tag and meta_tag.get("content"):
        meta_desc = meta_tag["content"].strip()

    # Headings (h1–h3) give structure context
    headings = []
    for h in soup.find_all(["h1", "h2", "h3"]):
        text = h.get_text(separator=" ", strip=True)
        if text:
            headings.append(f"[{h.name.upper()}] {text}")

    # Main body text — prefer <main> / <article> if present, else <body>
    main_content = (
        soup.find("main")
        or soup.find("article")
        or soup.find(id=re.compile(r"content|main|article", re.I))
        or soup.find(class_=re.compile(r"content|main|article|post|entry", re.I))
        or soup.body
    )

    body_text = ""
    if main_content:
        paragraphs = main_content.find_all(["p", "li", "td", "blockquote"])
        body_text = "\n".join(
            p.get_text(separator=" ", strip=True)
            for p in paragraphs
            if p.get_text(strip=True)
        )

    return {
        "title": title,
        "meta_description": meta_desc,
        "headings": headings,
        "body_text": _clean_text(body_text),
        "url": url,
    }


def _format_scraped_result(data: dict) -> str:
    """Format the extracted page data into a readable string for the agent."""
    sections = []

    if data["title"]:
        sections.append(f"PAGE TITLE: {data['title']}")

    if data["meta_description"]:
        sections.append(f"DESCRIPTION: {data['meta_description']}")

    if data["headings"]:
        sections.append("HEADINGS:\n" + "\n".join(data["headings"][:10]))

    if data["body_text"]:
        body = data["body_text"][:_MAX_TEXT_LENGTH]
        if len(data["body_text"]) > _MAX_TEXT_LENGTH:
            body += "\n... [content truncated]"
        sections.append(f"CONTENT:\n{body}")

    sections.append(f"SOURCE: {data['url']}")
    return "\n\n".join(sections)


@tool
def web_scraper_tool(url: str) -> str:
    """
    Scrape a webpage URL and return its title, headings, and main body text.
    Use this after web_search_tool to extract detailed content from specific URLs
    returned by Tavily. Handles timeouts, HTTP errors, and encoding issues gracefully.
    """
    try:
        response = requests.get(
            url,
            headers=_HEADERS,
            timeout=_REQUEST_TIMEOUT,
            allow_redirects=True,
        )
        response.raise_for_status()
    except requests.exceptions.Timeout:
        return f"Error: Request to {url} timed out after {_REQUEST_TIMEOUT}s."
    except requests.exceptions.TooManyRedirects:
        return f"Error: Too many redirects when fetching {url}."
    except requests.exceptions.HTTPError as e:
        return f"Error: HTTP {e.response.status_code} when fetching {url}."
    except requests.exceptions.ConnectionError:
        return f"Error: Could not connect to {url}. The site may be down or blocking requests."
    except requests.exceptions.RequestException as e:
        return f"Error fetching {url}: {str(e)}"

    content_type = response.headers.get("Content-Type", "")
    if "text/html" not in content_type and "application/xhtml" not in content_type:
        return f"Skipped: {url} returned non-HTML content ({content_type})."

    data = _extract_page_content(response.text, url)

    if not data["body_text"] and not data["title"]:
        return f"Warning: No readable content extracted from {url}."

    return _format_scraped_result(data)
