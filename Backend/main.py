import sys
import os

# Make sure all Backend sub-packages resolve correctly
sys.path.insert(0, os.path.dirname(__file__))

from graph import run_research

if __name__ == "__main__":
    query = input("Enter research query: ").strip()
    if not query:
        print("No query provided. Exiting.")
        sys.exit(1)

    print("\n" + "=" * 60)
    print("MULTI-AGENT RESEARCH SYSTEM")
    print("=" * 60)
    print(f"Query   : {query}")
    print(f"Provider: groq")
    print("=" * 60 + "\n")

    report = run_research(query, llm_provider="groq")

    print("\n" + "=" * 60)
    print("FINAL REPORT")
    print("=" * 60)
    print(report)
