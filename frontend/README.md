# Atlas — Multi-Agent Research System (Frontend)

A premium, research-first interface for the LangGraph multi-agent pipeline. It
visualizes the four agents — **Search → Reader → Writer → Critic** — in real
time over Server-Sent Events, and renders the final report in a rich reading
surface. Design language follows `DESIGN.md` (Vercel-style: ink on near-white
canvas, mesh gradient as the single decoration, Geist + Geist Mono).

## Run the frontend

```bash
npm install
npm run dev          # http://localhost:3000
```

The UI works **with or without the Python backend**:

- **Live backend connected** → real Tavily search, real scraping, real Groq
  report. The header shows a green `live backend` badge.
- **Backend offline** → the `/api/research` route falls back to a faithful
  simulated pipeline (header shows `demo mode`), so the full experience is
  always demonstrable.

## Connect the live backend

From the project's `Backend/` directory (with the venv active and
`TAVILY_API_KEY` / `GROQ_API_KEY` set in `.env`):

```bash
uvicorn api:app --reload --port 8000
```

The frontend proxies to `http://127.0.0.1:8000` by default. Override with an
env var if needed:

```bash
# frontend/.env.local
BACKEND_URL=http://127.0.0.1:8000
```

## Architecture

| Layer | File | Responsibility |
|---|---|---|
| SSE protocol + types | `src/lib/types.ts` | Event shapes, agent metadata |
| State machine | `src/lib/useResearch.ts` | Parses the SSE stream into live agent state |
| Route handler | `src/app/api/research/route.ts` | Proxies the backend; simulated fallback |
| Markdown | `src/lib/markdown.tsx` | Dependency-free report renderer |
| Pipeline UI | `src/components/Pipeline.tsx`, `AgentCard.tsx` | The four agents lighting up in sequence |
| Report | `src/components/ReportView.tsx` | Final report + editorial review trail |

The backend SSE contract is defined once in `types.ts` and spoken by both the
FastAPI bridge (`Backend/api.py`) and the Next.js fallback, so the two are
interchangeable.
