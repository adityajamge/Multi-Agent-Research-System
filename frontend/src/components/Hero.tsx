import { AGENTS } from "@/lib/types";
import { STAGE_ICONS, ArrowRight } from "./icons";
import { QueryComposer } from "./QueryComposer";

export function Hero({ onSubmit }: { onSubmit: (q: string) => void }) {
  return (
    <section className="relative overflow-hidden">
      {/* mesh gradient backdrop — the single decorative system, hero scale only */}
      <div className="mesh-gradient pointer-events-none absolute inset-x-0 top-0 h-[420px] opacity-[0.55]" aria-hidden />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px]"
        aria-hidden
        style={{ background: "linear-gradient(180deg, transparent 40%, var(--canvas-soft) 100%)" }}
      />

      <div className="relative mx-auto max-w-3xl px-5 pb-10 pt-16 text-center sm:px-6 sm:pt-24">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-hairline bg-canvas/70 px-3 py-1 backdrop-blur-sm animate-fade-up">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--success)" }} />
          <span className="font-mono text-[12px] text-body">Multi-agent research, in the open</span>
        </div>

        <h1
          className="display-xl text-ink animate-fade-up"
          style={{ animationDelay: "60ms" }}
        >
          Research that <span className="text-mesh">shows its work</span>.
        </h1>

        <p
          className="mx-auto mt-5 max-w-xl text-[18px] leading-7 text-body animate-fade-up"
          style={{ animationDelay: "120ms" }}
        >
          Four specialized agents search the live web, read the sources, write a grounded
          report, and critique it until it holds up — and you watch every step.
        </p>

        <div className="mx-auto mt-9 max-w-2xl text-left animate-fade-up" style={{ animationDelay: "180ms" }}>
          <QueryComposer onSubmit={onSubmit} autoFocus />
        </div>
      </div>

      {/* agent lineup */}
      <div className="relative mx-auto max-w-5xl px-5 pb-20 pt-6 sm:px-6">
        <p className="eyebrow mb-4 text-center">The pipeline</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {AGENTS.map((agent, i) => {
            const Icon = STAGE_ICONS[agent.id];
            return (
              <div
                key={agent.id}
                className="relative flex flex-col gap-3 rounded-xl bg-canvas p-4 shadow-e2 animate-fade-up"
                style={{ animationDelay: `${220 + i * 70}ms` }}
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-canvas-soft-2 text-ink">
                    <Icon width={17} height={17} />
                  </span>
                  <span className="font-mono text-[11px] text-mute">0{i + 1}</span>
                </div>
                <div>
                  <p className="eyebrow mb-1">{agent.role}</p>
                  <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">{agent.name}</h3>
                  <p className="mt-1.5 text-[13px] leading-snug text-body">{agent.blurb}</p>
                </div>
                {i < AGENTS.length - 1 && (
                  <ArrowRight
                    width={16}
                    height={16}
                    className="absolute -right-[18px] top-1/2 z-10 hidden -translate-y-1/2 text-hairline-strong lg:block"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
