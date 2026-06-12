"use client";

import { useEffect, useRef, useState } from "react";
import { useResearch } from "@/lib/useResearch";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { Hero } from "./Hero";
import { Pipeline } from "./Pipeline";
import { EventStream } from "./EventStream";
import { SourceList } from "./SourceList";
import { ReportView, ReportSkeleton } from "./ReportView";
import { XIcon, RefreshIcon, SearchIcon } from "./icons";

export function ResearchApp() {
  const { state, start, reset } = useResearch();
  const isLanding = state.status === "idle";

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        mode={state.mode}
        onReset={reset}
        showReset={!isLanding}
      />

      {isLanding ? (
        <main className="flex-1">
          <Hero onSubmit={start} />
          <Footer />
        </main>
      ) : (
        <Workspace state={state} onReset={reset} />
      )}
    </div>
  );
}

function useElapsed(startedAt: number | null, finishedAt: number | null, running: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [running]);
  if (!startedAt) return 0;
  return (finishedAt ?? (running ? now : startedAt)) - startedAt;
}

function Workspace({
  state,
  onReset,
}: {
  state: ReturnType<typeof useResearch>["state"];
  onReset: () => void;
}) {
  const running = state.status === "running";
  const elapsed = useElapsed(state.startedAt, state.finishedAt, running);

  const writerEngaged =
    state.stages.write.status !== "idle" || state.stages.critic.status !== "idle";
  const showReport = state.status === "complete" && state.report;
  const showSkeleton = running && writerEngaged;

  // keep the report in view when it lands
  const reportRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (showReport) reportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [showReport]);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 sm:px-6 sm:py-10">
      {/* query banner */}
      <div className="mb-8 animate-fade-up">
        <div className="flex items-center gap-2">
          <p className="eyebrow">{running ? "Researching" : state.status === "error" ? "Failed" : "Research complete"}</p>
          <span className="font-mono text-[11px] text-mute">· {(elapsed / 1000).toFixed(1)}s</span>
        </div>
        <h1 className="display-lg mt-2 max-w-3xl text-ink">{state.query}</h1>
      </div>

      <Pipeline state={state} />

      {state.status === "error" && (
        <div className="mt-8 flex flex-col items-start gap-3 rounded-xl border border-hairline bg-canvas p-5 shadow-e2">
          <span className="inline-flex items-center gap-2 text-[14px] font-medium" style={{ color: "var(--error-deep)" }}>
            <XIcon width={16} height={16} />
            The pipeline hit an error
          </span>
          <p className="text-[14px] text-body">{state.error}</p>
          <button
            onClick={onReset}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-ink px-4 text-[14px] font-medium text-on-primary transition-opacity hover:opacity-90"
          >
            <RefreshIcon width={15} height={15} />
            Try again
          </button>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* main column */}
        <div ref={reportRef} className="lg:col-span-2 lg:scroll-mt-24">
          {showReport ? (
            <ReportView
              report={state.report}
              query={state.query}
              revisions={state.revisions}
              critiques={state.critiques}
              durationMs={state.finishedAt && state.startedAt ? state.finishedAt - state.startedAt : null}
            />
          ) : showSkeleton ? (
            <ReportSkeleton />
          ) : state.status !== "error" ? (
            <EvidencePanel />
          ) : null}
        </div>

        {/* rail */}
        <div className="space-y-5 lg:col-span-1">
          <SourceList sources={state.sources} scraped={state.scrapedSources} />
          {state.events.length > 0 && (
            <EventStream events={state.events} baseTs={state.startedAt ?? Date.now()} running={running} />
          )}
        </div>
      </div>
    </main>
  );
}

function EvidencePanel() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-hairline-strong/40 bg-canvas px-6 py-16 text-center shadow-e1">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-canvas-soft-2 text-ink">
        <SearchIcon width={20} height={20} />
      </span>
      <p className="text-[15px] font-semibold text-ink">Gathering evidence</p>
      <p className="mt-1.5 max-w-xs text-[13px] leading-snug text-body">
        The Search and Reader agents are collecting and distilling sources. The report
        will be drafted once the evidence is in.
      </p>
      <span className="loading-dots mt-5 inline-flex items-center text-link">
        <span /><span /><span />
      </span>
    </div>
  );
}
