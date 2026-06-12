"""
FastAPI streaming bridge for the multi-agent research system.

Exposes the LangGraph pipeline over HTTP as a Server-Sent Events (SSE) stream so
a frontend can visualise each agent in real time. Run with:

    uvicorn api:app --reload --port 8000

(from inside the Backend/ directory, with the project's .venv active).
"""

import os
import re
import sys
import json
import asyncio
from typing import AsyncGenerator

sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel

from graph import run_research_stream

app = FastAPI(title="Multi-Agent Research System", version="1.0.0")

# The Next.js dev server (and any other origin) needs to read the SSE stream.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ResearchRequest(BaseModel):
    query: str
    provider: str = "groq"


# ── parsing helpers ─────────────────────────────────────────────────────────

def _parse_search_sources(search_results: str) -> list[dict]:
    """Turn Tavily's formatted output into structured source cards."""
    sources: list[dict] = []
    for block in search_results.split("\n---\n"):
        title = re.search(r"Title:\s*(.+)", block)
        url = re.search(r"URL:\s*(https?://\S+)", block)
        content = re.search(r"Content:\s*(.+)", block, re.DOTALL)
        if url:
            sources.append({
                "title": title.group(1).strip() if title else url.group(1).strip(),
                "url": url.group(1).strip(),
                "snippet": (content.group(1).strip()[:200] if content else ""),
            })
    return sources


def _parse_scraped_sources(scraped_content: str) -> list[dict]:
    """Pull per-URL stats out of the Reader agent's consolidated output."""
    sources: list[dict] = []
    for match in re.finditer(
        r"--- Source \d+:\s*(https?://\S+?)\s*---\n(.*?)(?=\n\n--- Source|\Z)",
        scraped_content,
        re.DOTALL,
    ):
        url, body = match.group(1), match.group(2)
        sources.append({"url": url.strip(), "chars": len(body.strip())})
    return sources


def _word_count(text: str) -> int:
    return len(re.findall(r"\b\w+\b", text or ""))


def _sse(payload: dict) -> str:
    return f"data: {json.dumps(payload)}\n\n"


# ── event mapping ───────────────────────────────────────────────────────────

def _map_node_event(node: str, data: dict, state: dict) -> dict | None:
    """Translate a raw graph node update into a frontend-facing SSE event."""
    if node == "search_agent":
        sources = _parse_search_sources(state.get("search_results", ""))
        return {
            "type": "stage",
            "stage": "search",
            "status": "done",
            "urls": state.get("urls", []),
            "sources": sources,
            "sourceCount": len(state.get("urls", [])),
        }

    if node == "reader_agent":
        return {
            "type": "stage",
            "stage": "read",
            "status": "done",
            "sources": _parse_scraped_sources(state.get("scraped_content", "")),
            "scrapedChars": len(state.get("scraped_content", "")),
        }

    if node == "writer_agent":
        report = state.get("report", "")
        return {
            "type": "stage",
            "stage": "write",
            "status": "done",
            "revision": state.get("revision_count", 0),
            "wordCount": _word_count(report),
        }

    if node == "critic_agent":
        approved = bool(data.get("final_report"))
        return {
            "type": "stage",
            "stage": "critic",
            "status": "done",
            "decision": "approve" if approved else "revise",
            "score": state.get("score"),
            "feedback": state.get("critique", ""),
            "revision": state.get("revision_count", 0),
        }

    if node == "complete":
        return {
            "type": "complete",
            "report": data.get("final_report", ""),
            "revisions": data.get("revision_count", 0),
        }

    return None


async def _event_stream(query: str, provider: str) -> AsyncGenerator[str, None]:
    """Drive the (synchronous) graph in a worker thread, yielding SSE strings."""
    yield _sse({"type": "start", "query": query, "provider": provider})

    loop = asyncio.get_event_loop()
    queue: asyncio.Queue = asyncio.Queue()
    state: dict = {}

    def producer():
        try:
            for event in run_research_stream(query, llm_provider=provider):
                node = event["node"]
                data = event.get("data") or {}
                if isinstance(data, dict):
                    state.update(data)
                mapped = _map_node_event(node, data, state)
                if mapped:
                    loop.call_soon_threadsafe(queue.put_nowait, mapped)
        except Exception as exc:  # surface failures to the client instead of hanging
            loop.call_soon_threadsafe(
                queue.put_nowait, {"type": "error", "message": str(exc)}
            )
        finally:
            loop.call_soon_threadsafe(queue.put_nowait, {"type": "__end__"})

    loop.run_in_executor(None, producer)

    while True:
        event = await queue.get()
        if event.get("type") == "__end__":
            break
        yield _sse(event)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/api/research")
async def research(req: ResearchRequest):
    query = (req.query or "").strip()
    if not query:
        return JSONResponse({"error": "query is required"}, status_code=400)

    return StreamingResponse(
        _event_stream(query, req.provider),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
