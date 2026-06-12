import { AtlasMark } from "./icons";

export function Header({
  mode,
  onReset,
  showReset,
}: {
  mode?: "live" | "demo" | null;
  onReset?: () => void;
  showReset?: boolean;
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-canvas/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-6">
        <button
          onClick={onReset}
          className="flex items-center gap-2.5 text-ink transition-opacity hover:opacity-80"
        >
          <AtlasMark width={22} height={22} />
          <span className="text-[15px] font-semibold tracking-[-0.02em]">Atlas</span>
          <span className="hidden font-mono text-[11px] text-mute sm:inline">/ research</span>
        </button>

        <div className="flex items-center gap-3">
          {mode && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-canvas px-2.5 py-1 font-mono text-[11px] text-body"
              title={mode === "live" ? "Connected to the Python backend" : "Backend offline — running a faithful simulation"}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: mode === "live" ? "var(--success)" : "var(--warning)" }}
              />
              {mode === "live" ? "live backend" : "demo mode"}
            </span>
          )}
          {showReset && (
            <button
              onClick={onReset}
              className="inline-flex h-8 items-center rounded-md border border-hairline bg-canvas px-3 text-[13px] font-medium text-ink transition-colors hover:bg-canvas-soft"
            >
              New research
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
