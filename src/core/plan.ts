import type { Inspection } from "./inspect";
import type { Resolution } from "./resolve";
import type { Manifest } from "./schemas";
export function buildPlan(inspection: Inspection, manifest: Manifest, resolution: Resolution) {
  return {
    targetRoot: inspection.root,
    inspection,
    profiles: resolution.profiles.map((p) => p.id),
    suggestedProfiles: inspection.suggestedProfiles,
    workflows: resolution.workflows.map((w) => w.id),
    rules: resolution.rules,
    skills: resolution.skills,
    targets: manifest.targets,
    sources: manifest.sources,
    files: [
      "omnitech-rulesync.yaml",
      "omnitech-rulesync.lock.yaml",
      "rulesync.jsonc",
      ...resolution.rules.map((id) => `.rulesync/rules/${id}.md`),
      ...resolution.skills.map((id) => `.rulesync/skills/${id}/SKILL.md`),
      ...resolution.workflows.map((w) => `.rulesync/commands/${w.id}.md`),
    ].sort(),
  };
}
export type InstallPlan = ReturnType<typeof buildPlan>;
