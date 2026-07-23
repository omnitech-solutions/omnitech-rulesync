import type { Inspection } from "./inspect";
import type { Manifest, Profile, Workflow } from "./schemas";
export type Resolution = { profiles: Profile[]; workflows: Workflow[]; rules: string[]; skills: string[] };
export function resolveSelection(
  inspection: Inspection,
  manifest: Manifest,
  profiles: Profile[],
  workflows: Workflow[],
): Resolution {
  const byProfile = new Map(profiles.map((p) => [p.id, p]));
  const ids = new Set(["base", ...inspection.selectedProfiles, ...manifest.profiles.include]);
  for (const id of manifest.profiles.exclude) ids.delete(id);
  const selected = [...ids].sort().map((id) => {
    const p = byProfile.get(id);
    if (!p) throw new Error(`Unknown profile: ${id}`);
    return p;
  });
  const rules = new Set<string>();
  const skills = new Set<string>();
  const workflowIds = new Set<string>();
  for (const p of selected) {
    for (const value of p.includes.rules) rules.add(value);
    for (const value of p.includes.skills) skills.add(value);
    for (const value of p.includes.workflows) workflowIds.add(value);
  }
  for (const value of manifest.workflows.include) workflowIds.add(value);
  for (const value of manifest.workflows.exclude) workflowIds.delete(value);
  const byWorkflow = new Map(workflows.map((w) => [w.id, w]));
  const selectedWorkflows = [...workflowIds].sort().map((id) => {
    const w = byWorkflow.get(id);
    if (!w) throw new Error(`Unknown workflow: ${id}`);
    for (const value of w.stages.flatMap((stage) => stage.skills)) skills.add(value);
    return w;
  });
  return { profiles: selected, workflows: selectedWorkflows, rules: [...rules].sort(), skills: [...skills].sort() };
}
