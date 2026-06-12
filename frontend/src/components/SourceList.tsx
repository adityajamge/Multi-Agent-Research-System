import { ScrapedSource, SearchSource } from "@/lib/types";
import { Globe, LinkIcon } from "./icons";

const host = (u: string) => {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return u;
  }
};

export function SourceList({
  sources,
  scraped,
}: {
  sources: SearchSource[];
  scraped: ScrapedSource[];
}) {
  if (sources.length === 0) return null;
  const charsByUrl = new Map(scraped.map((s) => [s.url, s.chars]));

  return (
    <div className="rounded-xl bg-canvas shadow-e2">
      <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
        <p className="eyebrow">Sources</p>
        <span className="font-mono text-[11px] text-mute">{sources.length}</span>
      </div>
      <ul className="divide-y divide-hairline">
        {sources.map((s, i) => {
          const chars = charsByUrl.get(s.url);
          return (
            <li key={s.url + i} className="group animate-fade-up">
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-3 px-4 py-3 transition-colors hover:bg-canvas-soft"
              >
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-canvas-soft-2 text-mute">
                  <Globe width={15} height={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-mono text-[11px] text-link">{host(s.url)}</span>
                    {chars != null && (
                      <span className="shrink-0 rounded-full bg-canvas-soft px-1.5 py-0.5 font-mono text-[10px] text-mute">
                        {(chars / 1000).toFixed(1)}k chars
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-[13px] font-medium text-ink">{s.title}</p>
                  {s.snippet && (
                    <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-body">{s.snippet}</p>
                  )}
                </div>
                <LinkIcon
                  width={14}
                  height={14}
                  className="mt-1 shrink-0 text-mute opacity-0 transition-opacity group-hover:opacity-100"
                />
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
