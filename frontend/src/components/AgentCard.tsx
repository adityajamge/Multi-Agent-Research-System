import { AgentMeta, StageState } from "@/lib/types";
import { STAGE_ICONS, CheckIcon } from "./icons";

function metaSummary(id: AgentMeta["id"], s: StageState): string {
  switch (id) {
    case "search":
      return s.sourceCount != null ? `${s.sourceCount} sources selected` : "Web discovery";
    case "read":
      return s.scrapedChars != null
        ? `~${s.scrapedChars.toLocaleString()} chars read`
        : "Content extraction";
    case "write":
      return s.wordCount != null
        ? `${s.wordCount.toLocaleString()} words${s.revision ? ` · rev ${s.revision}` : ""}`
        : "Report synthesis";
    case "critic":
      return s.runs ? `${s.runs} review${s.runs === 1 ? "" : "s"}` : "Editorial review";
  }
}

export function AgentCard({
  agent,
  stage,
  index,
}: {
  agent: AgentMeta;
  stage: StageState;
  index: number;
}) {
  const Icon = STAGE_ICONS[agent.id];
  const running = stage.status === "running";
  const done = stage.status === "done";

  return (
    <div
      className={[
        "relative flex flex-col gap-3 rounded-xl bg-canvas p-4 transition-all duration-500",
        running ? "shadow-e4 -translate-y-0.5" : "shadow-e2",
      ].join(" ")}
      style={{ animation: `fade-up 0.5s ${index * 80}ms cubic-bezier(0.22,1,0.36,1) both` }}
    >
      {/* active accent bar */}
      <span
        className={[
          "absolute inset-x-0 top-0 h-[2px] rounded-t-xl transition-opacity duration-500",
          running ? "opacity-100" : "opacity-0",
        ].join(" ")}
        style={{
          background:
            "linear-gradient(90deg, var(--g-develop-start), var(--g-preview-start), var(--g-preview-end))",
        }}
      />

      <div className="flex items-start justify-between">
        <div
          className={[
            "flex h-10 w-10 items-center justify-center rounded-lg transition-colors duration-500",
            done
              ? "bg-ink text-on-primary"
              : running
              ? "bg-canvas text-ink ring-1 ring-link/40 animate-pulse-ring"
              : "bg-canvas-soft-2 text-mute",
          ].join(" ")}
        >
          {done ? <CheckIcon width={18} height={18} /> : <Icon width={18} height={18} />}
        </div>
        <StatusPill status={stage.status} />
      </div>

      <div className="space-y-0.5">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[11px] text-mute">0{index + 1}</span>
          <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">{agent.name}</h3>
        </div>
        <p className="text-[13px] leading-snug text-body">{agent.blurb}</p>
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-hairline pt-3">
        <span className="font-mono text-[11px] text-mute">{agent.tool}</span>
        <span
          className={[
            "text-[12px] font-medium transition-colors",
            done ? "text-ink" : running ? "text-link" : "text-mute",
          ].join(" ")}
        >
          {metaSummary(agent.id, stage)}
        </span>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: StageState["status"] }) {
  if (status === "done") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-canvas-soft px-2 py-0.5 text-[11px] font-medium text-ink">
        <span className="h-1.5 w-1.5 rounded-full bg-ink" />
        Done
      </span>
    );
  }
  if (status === "running") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium text-link" style={{ background: "var(--link-bg-soft)" }}>
        <span className="loading-dots inline-flex items-center">
          <span /><span /><span />
        </span>
        Working
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-canvas-soft px-2 py-0.5 text-[11px] font-medium text-mute">
      Queued
    </span>
  );
}
