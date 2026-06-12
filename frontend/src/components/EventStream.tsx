"use client";

import { useEffect, useRef } from "react";
import { TimelineEvent } from "@/lib/types";

const toneColor: Record<NonNullable<TimelineEvent["tone"]>, string> = {
  default: "var(--hairline-strong)",
  accent: "var(--link)",
  warning: "var(--warning)",
  success: "var(--success)",
};

function relTime(ts: number, base: number) {
  const s = Math.max(0, Math.round((ts - base) / 1000));
  return `+${s}s`;
}

export function EventStream({
  events,
  baseTs,
  running,
}: {
  events: TimelineEvent[];
  baseTs: number;
  running: boolean;
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [events.length]);

  return (
    <div className="rounded-xl bg-canvas shadow-e2">
      <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
        <p className="eyebrow">Activity</p>
        {running && (
          <span className="loading-dots inline-flex items-center text-link">
            <span /><span /><span />
          </span>
        )}
      </div>

      <div className="scroll-quiet max-h-[20rem] overflow-y-auto px-4 py-3">
        <ol className="relative space-y-4">
          <span className="absolute bottom-1 left-[5px] top-1 w-px bg-hairline" aria-hidden />
          {events.map((e) => (
            <li key={e.id} className="relative pl-6 animate-fade-up">
              <span
                className="absolute left-0 top-[5px] h-[11px] w-[11px] rounded-full border-2 border-canvas"
                style={{ background: toneColor[e.tone ?? "default"], boxShadow: "0 0 0 1px var(--hairline)" }}
              />
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[13px] font-medium text-ink">{e.title}</p>
                <span className="shrink-0 font-mono text-[10px] text-mute">{relTime(e.ts, baseTs)}</span>
              </div>
              {e.detail && (
                <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-body">{e.detail}</p>
              )}
            </li>
          ))}
          <div ref={endRef} />
        </ol>
      </div>
    </div>
  );
}
