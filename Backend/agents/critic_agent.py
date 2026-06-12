import json
import re
from functools import partial
from langchain_core.messages import SystemMessage, HumanMessage
from agents.state import ResearchState

MAX_REVISIONS = 2  # after this, force-approve regardless of score

_SYSTEM_PROMPT = """You are a strict research editor. Review the given report and evaluate it.

Assess these dimensions:
1. Does it fully answer the research query?
2. Is it factually grounded in the provided sources?
3. Is it well-structured and clearly written?
4. Are the key findings complete and accurate?

Respond with ONLY a JSON object — no markdown, no explanation outside the JSON:
{
  "score": <integer 1-10>,
  "decision": "approve" or "revise",
  "feedback": "<specific, actionable feedback — required if decision is revise>"
}

Approve (score >= 7) when the report is solid and complete.
Request revision (score < 7) only when there are meaningful gaps or errors."""


def _parse_llm_json(text: str) -> dict:
    """Extract JSON from LLM response even if it adds prose around it."""
    # Try direct parse first
    try:
        return json.loads(text.strip())
    except json.JSONDecodeError:
        pass
    # Find first {...} block
    match = re.search(r"\{.*?\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass
    return {}


def critic_agent_node(state: ResearchState, llm) -> dict:
    """Review the current draft and decide to approve or request a revision."""
    query          = state["query"]
    report         = state.get("report", "")
    revision_count = state.get("revision_count", 0)

    # Hard stop — avoid infinite Writer↔Critic loops
    if revision_count >= MAX_REVISIONS:
        print(f"[Critic Agent] Max revisions ({MAX_REVISIONS}) reached. Approving.")
        return {
            "critique": "Maximum revisions reached. Report accepted as-is.",
            "score": state.get("score", 7),
            "final_report": report,
        }

    print(f"[Critic Agent] Reviewing draft (revision count: {revision_count})...")

    messages = [
        SystemMessage(content=_SYSTEM_PROMPT),
        HumanMessage(content=f"Research Query: {query}\n\nReport:\n{report}"),
    ]

    response = llm.invoke(messages)
    result   = _parse_llm_json(response.content)

    score    = result.get("score", 8)
    decision = result.get("decision", "approve")
    feedback = result.get("feedback", "")

    print(f"[Critic Agent] Score: {score}/10 | Decision: {decision}")

    if decision == "approve":
        return {
            "critique":     feedback,
            "score":        score,
            "final_report": report,
        }

    # Revise — increment counter so Writer knows which pass this is
    return {
        "critique":      feedback,
        "score":         score,
        "revision_count": revision_count + 1,
    }


def make_critic_node(llm):
    """Return a LangGraph-compatible node function with the LLM bound."""
    return partial(critic_agent_node, llm=llm)
