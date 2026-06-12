// Shared types for the research pipeline + the SSE event protocol that the
// /api/research route (and the FastAPI backend) speak.

export type StageId = "search" | "read" | "write" | "critic";
export type StageStatus = "idle" | "running" | "done";
export type RunStatus = "idle" | "running" | "complete" | "error";

export interface SearchSource {
  title: string;
  url: string;
  snippet: string;
}

export interface ScrapedSource {
  url: string;
  chars: number;
}

export interface Critique {
  decision: "approve" | "revise";
  score?: number | null;
  feedback: string;
  revision: number;
}

export interface StageState {
  status: StageStatus;
  // per-stage metadata, populated as events arrive
  sourceCount?: number;
  scrapedChars?: number;
  wordCount?: number;
  revision?: number;
  runs?: number; // how many times this stage has executed (Writer can repeat)
}

export interface TimelineEvent {
  id: string;
  stage: StageId | "system";
  title: string;
  detail?: string;
  tone?: "default" | "accent" | "warning" | "success";
  ts: number;
}

export interface ResearchState {
  status: RunStatus;
  query: string;
  mode: "live" | "demo" | null;
  stages: Record<StageId, StageState>;
  events: TimelineEvent[];
  sources: SearchSource[];
  scrapedSources: ScrapedSource[];
  critiques: Critique[];
  revisions: number;
  report: string;
  error: string | null;
  startedAt: number | null;
  finishedAt: number | null;
}

// ── SSE event shapes ────────────────────────────────────────────────────────
export type SSEEvent =
  | { type: "start"; query: string; provider?: string; mode?: "live" | "demo" }
  | {
      type: "stage";
      stage: "search";
      status: "done";
      urls: string[];
      sources: SearchSource[];
      sourceCount: number;
    }
  | {
      type: "stage";
      stage: "read";
      status: "done";
      sources: ScrapedSource[];
      scrapedChars: number;
    }
  | {
      type: "stage";
      stage: "write";
      status: "done";
      revision: number;
      wordCount: number;
    }
  | {
      type: "stage";
      stage: "critic";
      status: "done";
      decision: "approve" | "revise";
      score?: number | null;
      feedback: string;
      revision: number;
    }
  | { type: "complete"; report: string; revisions: number }
  | { type: "error"; message: string };

export const STAGE_ORDER: StageId[] = ["search", "read", "write", "critic"];

export interface AgentMeta {
  id: StageId;
  name: string;
  role: string;
  blurb: string;
  tool: string;
}

export const AGENTS: AgentMeta[] = [
  {
    id: "search",
    name: "Search Agent",
    role: "Discovery",
    blurb: "Queries the live web and selects the most relevant sources.",
    tool: "Tavily · advanced search",
  },
  {
    id: "read",
    name: "Reader Agent",
    role: "Extraction",
    blurb: "Fetches each page and distills its meaningful content.",
    tool: "BeautifulSoup · scraper",
  },
  {
    id: "write",
    name: "Writer Agent",
    role: "Synthesis",
    blurb: "Composes a structured, grounded report from the evidence.",
    tool: "Groq · llama-3.3-70b",
  },
  {
    id: "critic",
    name: "Critic Agent",
    role: "Review",
    blurb: "Scores the draft and sends it back until it meets the bar.",
    tool: "Groq · editorial pass",
  },
];
