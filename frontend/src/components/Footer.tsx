import { AtlasMark } from "./icons";

export function Footer() {
  return (
    <footer className="border-t border-hairline bg-canvas">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm space-y-3">
            <div className="flex items-center gap-2 text-ink">
              <AtlasMark width={20} height={20} />
              <span className="text-[15px] font-semibold tracking-[-0.02em]">Atlas</span>
            </div>
            <p className="text-[14px] leading-relaxed text-body">
              A multi-agent research system. Every report is searched, read, written, and
              reviewed by specialized agents — and shows its work along the way.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10">
            <div>
              <p className="eyebrow mb-3">Pipeline</p>
              <ul className="space-y-2 text-[14px] text-body">
                <li>Search · Tavily</li>
                <li>Reader · BeautifulSoup</li>
                <li>Writer · llama-3.3-70b</li>
                <li>Critic · editorial loop</li>
              </ul>
            </div>
            <div>
              <p className="eyebrow mb-3">Built with</p>
              <ul className="space-y-2 text-[14px] text-body">
                <li>LangGraph</li>
                <li>Groq</li>
                <li>Next.js</li>
                <li>FastAPI · SSE</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-hairline pt-6 font-mono text-[11px] text-mute">
          Multi-Agent Research System — orchestrated with LangGraph.
        </div>
      </div>
    </footer>
  );
}
