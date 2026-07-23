import type { Workflow } from "./schemas";
export function routePrompt(prompt: string, workflows: Workflow[]) {
  if (workflows.length === 0) throw new Error("Cannot route without configured workflows.");
  const text = prompt.toLowerCase();
  const ranked = workflows
    .map((workflow) => {
      const matchedSignals = workflow.signals.filter((s) => text.includes(s.toLowerCase()));
      return { workflow, score: workflow.priority + matchedSignals.length * 10, matchedSignals };
    })
    .filter((m) => m.matchedSignals.length)
    .sort((a, b) => b.score - a.score || a.workflow.id.localeCompare(b.workflow.id));
  const fallback = workflows.find((workflow) => workflow.id === "discovery") ?? workflows.at(0);
  if (!fallback) throw new Error("Cannot route without configured workflows.");
  return (
    ranked[0] ?? {
      workflow: fallback,
      score: 0,
      matchedSignals: [],
    }
  );
}
