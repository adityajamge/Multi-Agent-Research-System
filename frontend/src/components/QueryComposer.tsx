"use client";

import { useState } from "react";
import { ArrowUp, Sparkle } from "./icons";

const EXAMPLES = [
  "How does retrieval-augmented generation reduce hallucination?",
  "The state of solid-state batteries in 2026",
  "Trade-offs between SSR and static generation",
  "What is the evidence for time-restricted eating?",
];

export function QueryComposer({
  onSubmit,
  disabled,
  autoFocus,
}: {
  onSubmit: (q: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}) {
  const [value, setValue] = useState("");

  const submit = () => {
    const q = value.trim();
    if (!q || disabled) return;
    onSubmit(q);
  };

  return (
    <div className="w-full">
      <div
        className={[
          "group relative flex flex-col gap-3 rounded-2xl bg-canvas p-3 transition-shadow",
          "shadow-e3 focus-within:shadow-e4",
        ].join(" ")}
      >
        <div className="flex items-start gap-3 px-2 pt-2">
          <Sparkle width={18} height={18} className="mt-1 shrink-0 text-mute" />
          <textarea
            autoFocus={autoFocus}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey || !e.shiftKey)) {
                e.preventDefault();
                submit();
              }
            }}
            rows={2}
            placeholder="Ask anything — the agents will search, read, write, and review."
            className="min-h-[3rem] w-full resize-none bg-transparent text-[16px] leading-7 text-ink outline-none placeholder:text-mute"
          />
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-hairline px-2 pb-1 pt-3">
          <span className="font-mono text-[11px] text-mute">
            Tavily → BeautifulSoup → llama-3.3-70b → critic
          </span>
          <button
            onClick={submit}
            disabled={disabled || !value.trim()}
            className={[
              "inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-[14px] font-medium transition-all",
              "bg-ink text-on-primary hover:opacity-90 active:scale-[0.98]",
              "disabled:cursor-not-allowed disabled:opacity-30",
            ].join(" ")}
          >
            Research
            <ArrowUp width={15} height={15} />
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => {
              setValue(ex);
              if (!disabled) onSubmit(ex);
            }}
            disabled={disabled}
            className="rounded-full border border-hairline bg-canvas px-3 py-1.5 text-[13px] text-body transition-colors hover:border-hairline-strong hover:text-ink disabled:opacity-40"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}
