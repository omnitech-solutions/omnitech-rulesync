import fs from "node:fs/promises";
import path from "node:path";
import fg from "fast-glob";
import type { Profile } from "./schemas";
export type Evidence = { profile: string; score: number; reason: string };
export type Inspection = {
  root: string;
  packageManager?: string;
  packageDependencies: string[];
  gems: string[];
  evidence: Evidence[];
  selectedProfiles: string[];
  suggestedProfiles: string[];
};
async function json(file: string): Promise<Record<string, unknown> | undefined> {
  return fs
    .readFile(file, "utf8")
    .then((t) => JSON.parse(t) as Record<string, unknown>)
    .catch(() => undefined);
}
export async function inspectRepository(root: string, profiles: Profile[]): Promise<Inspection> {
  const pkg = await json(path.join(root, "package.json"));
  const deps = new Set<string>();
  for (const group of ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"]) {
    const value = pkg?.[group];
    if (value && typeof value === "object") {
      for (const name of Object.keys(value)) deps.add(name);
    }
  }
  const gemfile = await fs.readFile(path.join(root, "Gemfile"), "utf8").catch(() => "");
  const gems = [...gemfile.matchAll(/^\s*gem\s+["']([^"']+)["']/gmu)]
    .flatMap((match) => (match[1] ? [match[1]] : []))
    .sort();
  const evidence: Evidence[] = [];
  for (const profile of profiles)
    for (const d of profile.detect) {
      if (d.kind === "packageDependency" && deps.has(d.name))
        evidence.push({ profile: profile.id, score: d.score, reason: `package dependency ${d.name}` });
      else if (d.kind === "gem" && gems.includes(d.name))
        evidence.push({ profile: profile.id, score: d.score, reason: `Gemfile gem ${d.name}` });
      else if (d.kind === "file") {
        const matches = await fg(d.pattern, {
          cwd: root,
          dot: true,
          onlyFiles: true,
          ignore: ["node_modules/**", ".git/**"],
        });
        if (matches[0]) evidence.push({ profile: profile.id, score: d.score, reason: `file ${matches[0]}` });
      }
    }
  const scores = new Map<string, number>();
  for (const e of evidence) scores.set(e.profile, Math.max(scores.get(e.profile) ?? 0, e.score));
  const selectedProfiles = profiles.filter((p) => (scores.get(p.id) ?? 0) >= p.autoSelectScore).map((p) => p.id);
  const suggestedProfiles = profiles
    .filter((p) => {
      const s = scores.get(p.id) ?? 0;
      return s > 0 && s < p.autoSelectScore;
    })
    .map((p) => p.id);
  let packageManager: string | undefined;
  for (const [file, manager] of [
    ["pnpm-lock.yaml", "pnpm"],
    ["yarn.lock", "yarn"],
    ["package-lock.json", "npm"],
    ["bun.lock", "bun"],
  ] as const)
    if (
      await fs.access(path.join(root, file)).then(
        () => true,
        () => false,
      )
    ) {
      packageManager = manager;
      break;
    }
  return {
    root: path.resolve(root),
    packageManager,
    packageDependencies: [...deps].sort(),
    gems,
    evidence,
    selectedProfiles,
    suggestedProfiles,
  };
}
