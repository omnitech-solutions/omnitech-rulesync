import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadProfiles, loadWorkflows } from "../src/core/catalog";
import { inspectRepository } from "../src/core/inspect";
import { checkOwnedFiles, installPlan, resolveRulesyncCli } from "../src/core/install";
import { buildPlan } from "../src/core/plan";
import { resolveSelection } from "../src/core/resolve";
import { routePrompt } from "../src/core/router";
import { manifestSchema } from "../src/core/schemas";

const temps: string[] = [];
afterEach(async () => Promise.all(temps.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true }))));
async function temp() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "omnitech-rulesync-"));
  temps.push(dir);
  return dir;
}

describe("repository inspection", () => {
  it("detects Next.js, TypeScript, Tailwind, Prisma, and LangGraph", async () => {
    const root = await temp();
    await fs.writeFile(
      path.join(root, "package.json"),
      JSON.stringify({
        dependencies: { next: "16", typescript: "5", tailwindcss: "4", prisma: "7", "@langchain/langgraph": "1" },
      }),
    );
    await fs.writeFile(path.join(root, "tsconfig.json"), "{}");
    const result = await inspectRepository(root, await loadProfiles());
    expect(result.selectedProfiles).toEqual(
      expect.arrayContaining(["nextjs", "typescript", "tailwind", "prisma", "langgraph"]),
    );
  });
  it("detects Rails from Gemfile", async () => {
    const root = await temp();
    await fs.writeFile(path.join(root, "Gemfile"), `gem "rails", "~> 8.0"\n`);
    expect((await inspectRepository(root, await loadProfiles())).selectedProfiles).toContain("rails");
  });
});

describe("routing", () => {
  it("prioritizes security and routes bugs", async () => {
    const workflows = await loadWorkflows();
    expect(routePrompt("fix this authorization vulnerability", workflows).workflow.id).toBe("security");
    expect(routePrompt("the image generation failed unexpectedly", workflows).workflow.id).toBe("bug");
  });
});

describe("installation", () => {
  it("resolves the installed Rulesync executable", async () => {
    expect(path.basename(resolveRulesyncCli())).toBe("index.js");
    await expect(fs.access(resolveRulesyncCli())).resolves.toBeUndefined();
  });

  it("materializes owned sources idempotently and detects drift", async () => {
    const root = await temp();
    await fs.writeFile(path.join(root, "package.json"), JSON.stringify({ devDependencies: { typescript: "5" } }));
    const profiles = await loadProfiles();
    const workflows = await loadWorkflows();
    const manifest = manifestSchema.parse({ targets: ["claudecode", "codexcli", "cursor", "windsurf", "copilot"] });
    const inspection = await inspectRepository(root, profiles);
    const plan = buildPlan(inspection, manifest, resolveSelection(inspection, manifest, profiles, workflows));
    expect(plan.sources).toContainEqual(
      expect.objectContaining({
        source: "jeffallan/claude-skills",
        skills: expect.arrayContaining(["typescript-pro", "debugging-wizard", "test-master"]),
      }),
    );
    await installPlan(plan, manifest, workflows, { generate: false });
    expect(await checkOwnedFiles(root)).toEqual([]);
    const rulesyncConfig = JSON.parse(await fs.readFile(path.join(root, "rulesync.jsonc"), "utf8"));
    expect(rulesyncConfig.sources).toContainEqual(
      expect.objectContaining({
        source: "jeffallan/claude-skills",
        skills: expect.arrayContaining(["typescript-pro"]),
      }),
    );
    const bugCommand = await fs.readFile(path.join(root, ".rulesync/commands/bug.md"), "utf8");
    expect(bugCommand).toContain("`debugging-wizard`");
    await installPlan(plan, manifest, workflows, { generate: false });
    await fs.appendFile(path.join(root, ".rulesync/rules/base.md"), "changed");
    expect(await checkOwnedFiles(root)).toContain("Modified owned file: .rulesync/rules/base.md");
  });
  it("refuses unmanaged collisions", async () => {
    const root = await temp();
    await fs.writeFile(path.join(root, "package.json"), "{}");
    await fs.writeFile(path.join(root, "rulesync.jsonc"), "{}");
    const profiles = await loadProfiles();
    const workflows = await loadWorkflows();
    const manifest = manifestSchema.parse({});
    const inspection = await inspectRepository(root, profiles);
    const plan = buildPlan(inspection, manifest, resolveSelection(inspection, manifest, profiles, workflows));
    await expect(installPlan(plan, manifest, workflows, { generate: false })).rejects.toThrow("unmanaged file");
  });
});
