"use client";

import { useState } from "react";
import { Critique } from "@/lib/types";
import { Markdown } from "@/lib/markdown";
import { CopyIcon, CheckIcon, DocIcon, RefreshIcon } from "./icons";

function wordCount(text: string) {
  return (text.match(/\b\w+\b/g) ?? []).length;
}

export function ReportView({
  report,
  query,
  revisions,
  critiques,
  durationMs,
}: {
  report: string;
  query: string;
  revisions: number;
  critiques: Critique[];
  durationMs: number | null;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  const download = () => {
    const blob = new Blob([report], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${query.slice(0, 40).replace(/[^\w]+/g, "-").toLowerCase() || "report"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const finalScore = [...critiques].reverse().find((c) => c.score != null)?.score ?? null;

  return (
    <article className="overflow-hidden rounded-2xl bg-canvas shadow-e4 animate-fade-up">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline bg-canvas-soft px-5 py-3.5 sm:px-7">
        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-mute">
          <span className="inline-flex items-center gap-1.5 text-ink">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--success)" }} />
            Final report
          </span>
          <span aria-hidden>·</span>
          <span>{wordCount(report).toLocaleString()} words</span>
          {finalScore != null && (
            <>
              <span aria-hidden>·</span>
              <span>score {finalScore}/10</span>
            </>
          )}
          {revisions > 0 && (
            <>
              <span aria-hidden>·</span>
              <span>{revisions} revision{revisions === 1 ? "" : "s"}</span>
            </>
          )}
          {durationMs != null && (
            <>
              <span aria-hidden>·</span>
              <span>{(durationMs / 1000).toFixed(1)}s</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copy}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-hairline bg-canvas px-2.5 text-[12px] font-medium text-ink transition-colors hover:bg-canvas-soft-2"
          >
            {copied ? <CheckIcon width={13} height={13} /> : <CopyIcon width={13} height={13} />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            onClick={download}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-hairline bg-canvas px-2.5 text-[12px] font-medium text-ink transition-colors hover:bg-canvas-soft-2"
          >
            <DocIcon width={13} height={13} />
            .md
          </button>
        </div>
      </div>

      <div className="px-5 py-7 sm:px-9 sm:py-9">
        <Markdown text={report} />
      </div>

      {critiques.length > 0 && <ReviewTrail critiques={critiques} />}
    </article>
  );
}

function ReviewTrail({ critiques }: { critiques: Critique[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-hairline bg-canvas-soft px-5 py-4 sm:px-7">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="eyebrow flex items-center gap-2">
          <RefreshIcon width={13} height={13} />
          Editorial review trail ({critiques.length})
        </span>
        <span className="font-mono text-[11px] text-mute">{open ? "hide" : "show"}</span>
      </button>

      {open && (
        <ol className="mt-4 space-y-3">
          {critiques.map((c, i) => (
            <li
              key={i}
              className="rounded-lg border border-hairline bg-canvas p-3 text-[13px] animate-fade-up"
            >
              <div className="mb-1 flex items-center gap-2">
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                  style={
                    c.decision === "approve"
                      ? { background: "var(--link-bg-soft)", color: "var(--link-deep)" }
                      : { background: "var(--warning-soft)", color: "var(--warning-deep)" }
                  }
                >
                  {c.decision === "approve" ? "Approved" : "Revision requested"}
                </span>
                {c.score != null && (
                  <span className="font-mono text-[11px] text-mute">{c.score}/10</span>
                )}
              </div>
              <p className="leading-snug text-body">{c.feedback || "—"}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function ReportSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-canvas shadow-e4">
      <div className="border-b border-hairline bg-canvas-soft px-7 py-3.5">
        <div className="shimmer h-4 w-40 rounded" />
      </div>
      <div className="space-y-4 px-9 py-9">
        <div className="shimmer h-7 w-2/3 rounded" />
        <div className="space-y-2.5">
          <div className="shimmer h-4 w-full rounded" />
          <div className="shimmer h-4 w-[92%] rounded" />
          <div className="shimmer h-4 w-[78%] rounded" />
        </div>
        <div className="shimmer h-5 w-44 rounded" />
        <div className="space-y-2.5">
          <div className="shimmer h-4 w-[88%] rounded" />
          <div className="shimmer h-4 w-full rounded" />
          <div className="shimmer h-4 w-[64%] rounded" />
        </div>
      </div>
    </div>
  );
}
