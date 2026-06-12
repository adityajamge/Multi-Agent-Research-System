"use client";

import { useCallback, useReducer, useRef } from "react";
import {
  AGENTS,
  ResearchState,
  SSEEvent,
  StageId,
  StageState,
  TimelineEvent,
} from "./types";

const idleStage = (): StageState => ({ status: "idle", runs: 0 });

function freshState(): ResearchState {
  return {
    status: "idle",
    query: "",
    mode: null,
    stages: {
      search: idleStage(),
      read: idleStage(),
      write: idleStage(),
      critic: idleStage(),
    },
    events: [],
    sources: [],
    scrapedSources: [],
    critiques: [],
    revisions: 0,
    report: "",
    error: null,
    startedAt: null,
    finishedAt: null,
  };
}

const NEXT_STAGE: Record<StageId, StageId | null> = {
  search: "read",
  read: "write",
  write: "critic",
  critic: null,
};

const evt = (
  stage: TimelineEvent["stage"],
  title: string,
  detail?: string,
  tone: TimelineEvent["tone"] = "default"
): TimelineEvent => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  stage,
  title,
  detail,
  tone,
  ts: Date.now(),
});

const host = (u: string) => {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return u;
  }
};

type Action =
  | { kind: "reset" }
  | { kind: "begin"; query: string }
  | { kind: "sse"; event: SSEEvent }
  | { kind: "fail"; message: string };

function reducer(state: ResearchState, action: Action): ResearchState {
  switch (action.kind) {
    case "reset":
      return freshState();

    case "begin": {
      const next = freshState();
      next.status = "running";
      next.query = action.query;
      next.startedAt = Date.now();
      next.stages.search = { status: "running", runs: 0 };
      next.events = [evt("system", "Research initiated", action.query, "accent")];
      return next;
    }

    case "fail":
      return {
        ...state,
        status: "error",
        error: action.message,
        finishedAt: Date.now(),
        events: [...state.events, evt("system", "Pipeline error", action.message, "warning")],
      };

    case "sse":
      return applyEvent(state, action.event);

    default:
      return state;
  }
}

function applyEvent(state: ResearchState, e: SSEEvent): ResearchState {
  const stages = { ...state.stages };
  let events = state.events;

  const activate = (id: StageId | null) => {
    if (id) stages[id] = { ...stages[id], status: "running" };
  };

  switch (e.type) {
    case "start":
      return { ...state, mode: e.mode ?? "live" };

    case "stage": {
      if (e.stage === "search") {
        stages.search = {
          ...stages.search,
          status: "done",
          runs: 1,
          sourceCount: e.sourceCount,
        };
        activate("read");
        const detail = e.sources.map((s) => host(s.url)).join(" · ");
        events = [
          ...events,
          evt("search", `Selected ${e.sourceCount} sources`, detail, "accent"),
        ];
        return { ...state, stages, sources: e.sources, events };
      }

      if (e.stage === "read") {
        stages.read = {
          ...stages.read,
          status: "done",
          runs: 1,
          scrapedChars: e.scrapedChars,
        };
        activate("write");
        events = [
          ...events,
          evt(
            "read",
            `Read ${e.sources.length} ${e.sources.length === 1 ? "page" : "pages"}`,
            `~${e.scrapedChars.toLocaleString()} characters extracted`,
            "accent"
          ),
        ];
        return { ...state, stages, scrapedSources: e.sources, events };
      }

      if (e.stage === "write") {
        stages.write = {
          ...stages.write,
          status: "done",
          runs: (stages.write.runs ?? 0) + 1,
          wordCount: e.wordCount,
          revision: e.revision,
        };
        activate("critic");
        const title = e.revision === 0 ? "First draft composed" : `Revision ${e.revision} composed`;
        events = [
          ...events,
          evt("write", title, `${e.wordCount.toLocaleString()} words`, "accent"),
        ];
        return { ...state, stages, events };
      }

      // critic
      const approved = e.decision === "approve";
      stages.critic = {
        ...stages.critic,
        status: "done",
        runs: (stages.critic.runs ?? 0) + 1,
        revision: e.revision,
      };

      const critiques = [
        ...state.critiques,
        {
          decision: e.decision,
          score: e.score ?? null,
          feedback: e.feedback,
          revision: e.revision,
        },
      ];

      const scoreLabel = e.score != null ? `Score ${e.score}/10` : undefined;

      if (approved) {
        events = [
          ...events,
          evt("critic", "Report approved", scoreLabel, "success"),
        ];
        return { ...state, stages, critiques, events };
      }

      // Revision requested → Writer runs again.
      stages.write = { ...stages.write, status: "running" };
      stages.critic = { ...stages.critic, status: "idle" };
      events = [
        ...events,
        evt(
          "critic",
          "Revision requested",
          [scoreLabel, e.feedback].filter(Boolean).join(" — "),
          "warning"
        ),
      ];
      return {
        ...state,
        stages,
        critiques,
        revisions: Math.max(state.revisions, e.revision),
        events,
      };
    }

    case "complete": {
      for (const a of AGENTS) {
        stages[a.id] = { ...stages[a.id], status: "done" };
      }
      events = [
        ...events,
        evt("system", "Report finalized", `${e.revisions} revision${e.revisions === 1 ? "" : "s"}`, "success"),
      ];
      return {
        ...state,
        status: "complete",
        report: e.report,
        revisions: e.revisions,
        stages,
        events,
        finishedAt: Date.now(),
      };
    }

    case "error":
      return {
        ...state,
        status: "error",
        error: e.message,
        finishedAt: Date.now(),
        events: [...events, evt("system", "Pipeline error", e.message, "warning")],
      };

    default:
      return state;
  }
}

export function useResearch() {
  const [state, dispatch] = useReducer(reducer, undefined, freshState);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    dispatch({ kind: "reset" });
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const start = useCallback(async (query: string, provider = "groq") => {
    const q = query.trim();
    if (!q) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    dispatch({ kind: "begin", query: q });

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, provider }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        dispatch({ kind: "fail", message: `Request failed (${res.status})` });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";

        for (const frame of frames) {
          const line = frame
            .split("\n")
            .find((l) => l.startsWith("data:"));
          if (!line) continue;
          const json = line.slice(5).trim();
          if (!json) continue;
          try {
            const event = JSON.parse(json) as SSEEvent;
            dispatch({ kind: "sse", event });
          } catch {
            /* skip malformed frame */
          }
        }
      }
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return;
      dispatch({ kind: "fail", message: (err as Error)?.message ?? "Unknown error" });
    } finally {
      abortRef.current = null;
    }
  }, []);

  return { state, start, reset, cancel };
}
