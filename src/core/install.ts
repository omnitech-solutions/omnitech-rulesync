import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { copyTreeOwned, sha256, writeOwnedFile } from "./files";
import { LOCK_FILE, MANIFEST_FILE, readLock, renderLock, renderManifest } from "./manifest";
import { projectRoot } from "./paths";
import type { InstallPlan } from "./plan";
import type { Manifest, Workflow } from "./schemas";
export async function installPlan(
  plan: InstallPlan,
  manifest: Manifest,
  workflows: Workflow[],
  options: { force?: boolean; generate?: boolean } = {},
): Promise<void> {
  const previous = (await readLock(plan.targetRoot))?.ownedFiles ?? {};
  const owned: Record<string, string> = {};
  const force = options.force ?? false;
  const root = projectRoot();
  for (const id of plan.rules)
    owned[`.rulesync/rules/${id}.md`] = await writeOwnedFile(
      plan.targetRoot,
      `.rulesync/rules/${id}.md`,
      await fs.readFile(path.join(root, "content/rules", `${id}.md`), "utf8"),
      previous,
      force,
    );
  for (const id of plan.skills)
    await copyTreeOwned(
      path.join(root, "content/skills", id),
      plan.targetRoot,
      `.rulesync/skills/${id}`,
      previous,
      force,
      owned,
    );
  for (const id of plan.workflows) {
    const workflow = workflows.find((w) => w.id === id);
    if (!workflow) throw new Error(`Unknown workflow at install: ${id}`);
    owned[`.rulesync/commands/${id}.md`] = await writeOwnedFile(
      plan.targetRoot,
      `.rulesync/commands/${id}.md`,
      renderCommand(workflow),
      previous,
      force,
    );
  }
  owned["rulesync.jsonc"] = await writeOwnedFile(
    plan.targetRoot,
    "rulesync.jsonc",
    renderRulesync(manifest, plan.sources),
    previous,
    force,
  );
  owned[MANIFEST_FILE] = await writeOwnedFile(
    plan.targetRoot,
    MANIFEST_FILE,
    renderManifest(manifest),
    previous,
    force,
  );
  await fs.writeFile(
    path.join(plan.targetRoot, LOCK_FILE),
    renderLock({
      schemaVersion: 1,
      generatorVersion: "0.1.1",
      generatedAt: new Date().toISOString(),
      targetRoot: plan.targetRoot,
      profiles: plan.profiles,
      workflows: plan.workflows,
      sources: plan.sources,
      ownedFiles: owned,
    }),
  );
  if (options.generate !== false) runRulesync(plan.targetRoot, plan.sources.length > 0);
}
function renderRulesync(manifest: Manifest, configuredSources = manifest.sources): string {
  const sources = configuredSources.map(({ source, ref, skills }) => ({
    source,
    ...(ref ? { ref } : {}),
    ...(skills.length ? { skills } : {}),
  }));
  return `${JSON.stringify(
    {
      $schema: "https://github.com/dyoshikawa/rulesync/releases/latest/download/config-schema.json",
      targets: manifest.targets,
      features: ["rules", "commands", "skills", "subagents", "checks"],
      sources,
      delete: true,
      simulateCommands: true,
      simulateSkills: true,
      simulateSubagents: true,
      gitignoreTargetsOnly: true,
    },
    null,
    2,
  )}\n`;
}
function renderCommand(workflow: Workflow): string {
  const stages = workflow.stages
    .map((s, i) => {
      const stageSkills = [...s.skills, ...s.sourceSkills];
      return `${i + 1}. **${s.id}**.${stageSkills.length ? ` Activate skills: ${stageSkills.map((v) => `\`${v}\``).join(", ")}.` : ""}${s.gate === "approval" ? " Stop for explicit approval before continuing." : s.gate === "evidence" ? " Record concrete verification evidence before continuing." : ""}`;
    })
    .join("\n");
  return `---\ndescription: ${JSON.stringify(workflow.description)}\ntargets: ["*"]\n---\n\n# ${workflow.id} workflow\n\nFollow applicable stages in order and activate required skills before each stage.\n\n${stages}\n`;
}
export function resolveRulesyncCli() {
  return path.join(projectRoot(), "node_modules/rulesync/dist/cli/index.js");
}
function runRulesync(cwd: string, installSources: boolean) {
  if (installSources) {
    const install = spawnSync(process.execPath, [resolveRulesyncCli(), "install"], { cwd, stdio: "inherit" });
    if (install.status !== 0) throw new Error(`rulesync install failed (${install.status ?? 1})`);
  }
  const result = spawnSync(process.execPath, [resolveRulesyncCli(), "generate"], { cwd, stdio: "inherit" });
  if (result.status !== 0) throw new Error(`rulesync generate failed (${result.status ?? 1})`);
}
export async function checkOwnedFiles(root: string): Promise<string[]> {
  const lock = await readLock(root);
  if (!lock) return [`Missing ${LOCK_FILE}`];
  const errors: string[] = [];
  for (const [rel, expected] of Object.entries(lock.ownedFiles)) {
    const actual = await fs
      .readFile(path.join(root, rel))
      .then((v) => sha256(v))
      .catch(() => undefined);
    if (!actual) errors.push(`Missing owned file: ${rel}`);
    else if (actual !== expected) errors.push(`Modified owned file: ${rel}`);
  }
  return errors;
}
export function checkGeneratedFiles(root: string): string | undefined {
  const result = spawnSync(process.execPath, [resolveRulesyncCli(), "generate", "--check"], {
    cwd: root,
    encoding: "utf8",
  });
  return result.status === 0
    ? undefined
    : (result.stdout + result.stderr).trim() || `Generated output is stale (${result.status ?? 1})`;
}
