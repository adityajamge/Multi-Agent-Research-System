import type { NextRequest } from "next/server";

// The research pipeline is long-running and streamed — never cache, never prerender.
export const dynamic = "force-dynamic";
// Allow the streamed proxy to run as long as the pipeline needs (seconds).
// Raise this on hosts/plans that permit longer serverless execution.
export const maxDuration = 300;

const BACKEND_URL = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

const encoder = new TextEncoder();
const sse = (obj: unknown) => encoder.encode(`data: ${JSON.stringify(obj)}\n\n`);
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(request: NextRequest) {
  let query = "";
  let provider = "groq";
  try {
    const body = await request.json();
    query = (body?.query ?? "").toString().trim();
    provider = (body?.provider ?? "groq").toString();
  } catch {
    /* ignore — handled below */
  }

  if (!query) {
    return Response.json({ error: "query is required" }, { status: 400 });
  }

  // 1) Try the real FastAPI backend first.
  //    The timeout must only guard the *connection* (until headers arrive) —
  //    once the stream is open it can run as long as the pipeline needs, so we
  //    clear the timer as soon as fetch resolves. Client disconnects are
  //    forwarded upstream so cancelling a run actually stops the backend.
  try {
    const controller = new AbortController();
    const onClientAbort = () => controller.abort();
    request.signal.addEventListener("abort", onClientAbort);
    const connectTimer = setTimeout(() => controller.abort(), 6000);

    const upstream = await fetch(`${BACKEND_URL}/api/research`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, provider }),
      signal: controller.signal,
    });
    clearTimeout(connectTimer); // headers received — let the body stream freely

    if (upstream.ok && upstream.body) {
      return new Response(upstream.body, { headers: streamHeaders() });
    }
    request.signal.removeEventListener("abort", onClientAbort);
  } catch {
    /* backend unavailable — fall through to the simulated pipeline */
  }

  // 2) Fallback: a faithful simulation of the four-agent pipeline so the
  //    experience is fully demonstrable without the Python backend running.
  return new Response(simulatedPipeline(query, provider), {
    headers: streamHeaders(),
  });
}

function streamHeaders() {
  return {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  };
}

function simulatedPipeline(query: string, provider: string): ReadableStream {
  const host = (u: string) => {
    try {
      return new URL(u).hostname.replace(/^www\./, "");
    } catch {
      return u;
    }
  };

  const sources = [
    {
      title: `${capitalize(query)} — a structured overview`,
      url: "https://en.wikipedia.org/wiki/" + encodeURIComponent(query.replace(/\s+/g, "_")),
      snippet:
        "A broad, well-cited reference establishing definitions, history, and the current state of the topic with links to primary literature.",
    },
    {
      title: `The state of ${query} in 2026`,
      url: "https://arxiv.org/abs/2403." + (1000 + Math.floor(Math.random() * 8999)),
      snippet:
        "A recent survey paper consolidating methods, benchmarks, and open problems, with quantitative comparisons across approaches.",
    },
    {
      title: `${capitalize(query)}: practical guide`,
      url: "https://www.nature.com/articles/s41586-024-" + (10000 + Math.floor(Math.random() * 89999)),
      snippet:
        "An applied, peer-reviewed perspective covering real-world deployments, trade-offs, and measured outcomes.",
    },
  ];

  return new ReadableStream({
    async start(controller) {
      const emit = (o: unknown) => controller.enqueue(sse(o));

      emit({ type: "start", query, provider, mode: "demo" });
      await wait(650);

      // Search agent
      emit({
        type: "stage",
        stage: "search",
        status: "done",
        urls: sources.map((s) => s.url),
        sources,
        sourceCount: sources.length,
      });
      await wait(1100);

      // Reader agent
      emit({
        type: "stage",
        stage: "read",
        status: "done",
        sources: sources.map((s) => ({ url: s.url, chars: 1800 + Math.floor(Math.random() * 1200) })),
        scrapedChars: sources.length * 2600,
      });
      await wait(1300);

      // Writer — first draft
      emit({ type: "stage", stage: "write", status: "done", revision: 0, wordCount: 540 });
      await wait(1000);

      // Critic — requests a revision
      emit({
        type: "stage",
        stage: "critic",
        status: "done",
        decision: "revise",
        score: 6,
        feedback:
          "Strong structure, but the Key Findings omit quantitative detail from Source 2 and the Conclusion overstates certainty. Add figures and hedge appropriately.",
        revision: 1,
      });
      await wait(1100);

      // Writer — revision
      emit({ type: "stage", stage: "write", status: "done", revision: 1, wordCount: 690 });
      await wait(1000);

      // Critic — approves
      emit({
        type: "stage",
        stage: "critic",
        status: "done",
        decision: "approve",
        score: 9,
        feedback: "Revisions fully address prior feedback. Findings are grounded and the analysis is balanced.",
        revision: 1,
      });
      await wait(700);

      emit({ type: "complete", report: demoReport(query, sources.map((s) => host(s.url))), revisions: 1 });
      controller.close();
    },
  });
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function demoReport(query: string, hosts: string[]): string {
  const t = capitalize(query);
  return `# ${t}

## Executive Summary

This report synthesizes findings on **${query}** drawn from three independent sources. Across them, a consistent picture emerges: the field has matured rapidly, but meaningful open questions remain around reliability, evaluation, and real-world deployment. The strongest, most reproducible results cluster around a small set of established methods, while newer approaches show promise but lack independent replication.

## Key Findings

- The literature converges on a shared set of **core definitions and methods**, reducing earlier fragmentation in the field (${hosts[0] ?? "source 1"}).
- Recent surveys report **measurable improvements** on standard benchmarks, though gains are uneven and sensitive to evaluation setup (${hosts[1] ?? "source 2"}).
- Applied, peer-reviewed work shows that **real-world outcomes lag benchmark results**, with deployment introducing constraints not captured in controlled studies (${hosts[2] ?? "source 3"}).
- Sources disagree on the **degree of certainty** appropriate when extrapolating current results forward.

## Detailed Analysis

The reference material establishes a stable conceptual foundation for ${query}, and the more recent survey extends it with a quantitative comparison of competing approaches. Where the two agree, confidence is high; where the applied source diverges, it does so by emphasizing the gap between laboratory metrics and operational performance.

A recurring theme is **evaluation fragility** — small changes in methodology produce disproportionate swings in reported results. This suggests that headline numbers should be read alongside their experimental conditions rather than in isolation. The applied perspective reinforces this, documenting cases where strong benchmark performance did not translate into reliable deployed behavior.

Taken together, the evidence supports cautious optimism: the direction of travel is positive and well-documented, but the strongest claims in the field are not yet independently settled.

## Conclusion

${t} is an active, fast-moving area with a solid and converging foundation. The most reliable conclusions are the conservative ones; the most exciting are the least replicated. A reader should treat the consensus findings as actionable and the frontier claims as provisional, pending independent confirmation.

---

*Generated by the multi-agent research pipeline — Search → Reader → Writer → Critic, with one revision pass.*`;
}
