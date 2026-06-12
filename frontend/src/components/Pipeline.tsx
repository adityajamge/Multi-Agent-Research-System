import { AGENTS, ResearchState, STAGE_ORDER } from "@/lib/types";
import { AgentCard } from "./AgentCard";
import { RefreshIcon } from "./icons";

export function Pipeline({ state }: { state: ResearchState }) {
  const doneCount = STAGE_ORDER.filter((s) => state.stages[s].status === "done").length;
  const runningCount = STAGE_ORDER.filter((s) => state.stages[s].status === "running").length;
  const progress = Math.min(100, ((doneCount + runningCount * 0.5) / STAGE_ORDER.length) * 100);

  const activeIndex = STAGE_ORDER.findIndex((s) => state.stages[s].status === "running");
  const stageLabel =
    state.status === "complete"
      ? "Complete"
      : activeIndex >= 0
      ? `Stage ${activeIndex + 1} of ${STAGE_ORDER.length}`
      : `${doneCount} of ${STAGE_ORDER.length} complete`;

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Research pipeline</p>
          <h2 className="display-sm mt-1 text-ink">Four agents, one chain of reasoning</h2>
        </div>
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          {state.revisions > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-canvas px-2.5 py-1 text-[12px] font-medium text-warning-deep shadow-e1" style={{ color: "var(--warning-deep)" }}>
              <RefreshIcon width={13} height={13} />
              {state.revisions} revision{state.revisions === 1 ? "" : "s"}
            </span>
          )}
          <span className="rounded-full bg-canvas px-2.5 py-1 font-mono text-[12px] text-body shadow-e1">
            {stageLabel}
          </span>
        </div>
      </div>

      {/* overall progress rail */}
      <div className="h-1 w-full overflow-hidden rounded-full bg-canvas-soft-2">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${progress}%`,
            background:
              state.status === "complete"
                ? "var(--ink)"
                : "linear-gradient(90deg, var(--g-develop-start), var(--g-preview-start), var(--g-preview-end))",
          }}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {AGENTS.map((agent, i) => (
          <AgentCard key={agent.id} agent={agent} stage={state.stages[agent.id]} index={i} />
        ))}
      </div>
    </section>
  );
}
