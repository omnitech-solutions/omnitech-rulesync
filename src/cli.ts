#!/usr/bin/env node
import path from "node:path";
import process from "node:process";
import { Command } from "commander";
import pc from "picocolors";
import { loadProfiles, loadWorkflows } from "./core/catalog";
import { inspectRepository } from "./core/inspect";
import { checkGeneratedFiles, checkOwnedFiles, installPlan } from "./core/install";
import { readManifest } from "./core/manifest";
import { buildPlan } from "./core/plan";
import { resolveSelection } from "./core/resolve";
import { routePrompt } from "./core/router";

const app = new Command()
  .name("omnitech-rulesync")
  .description("Repository-aware cross-agent Rulesync installer")
  .version("0.1.2");
async function createPlan(root: string) {
  const [profiles, workflows, manifest] = await Promise.all([loadProfiles(), loadWorkflows(), readManifest(root)]);
  const inspection = await inspectRepository(root, profiles);
  return buildPlan(inspection, manifest, resolveSelection(inspection, manifest, profiles, workflows));
}
app
  .command("inspect")
  .argument("[target]", "repository root", ".")
  .option("--json")
  .action(async (target) =>
    console.log(JSON.stringify(await inspectRepository(path.resolve(target), await loadProfiles()), null, 2)),
  );
app
  .command("plan")
  .argument("[target]", "repository root", ".")
  .option("--json")
  .action(async (target) => console.log(JSON.stringify(await createPlan(path.resolve(target)), null, 2)));
app
  .command("install")
  .argument("[target]", "repository root", ".")
  .option("-y, --yes")
  .option("--force")
  .option("--no-generate")
  .action(async (target, options) => {
    const root = path.resolve(target);
    const plan = await createPlan(root);
    printPlan(plan);
    if (!options.yes) throw new Error("Preview complete. Re-run with --yes to approve this installation.");
    await installPlan(plan, await readManifest(root), await loadWorkflows(), {
      force: options.force,
      generate: options.generate,
    });
    console.log(pc.green("Installation completed."));
  });
app
  .command("update")
  .argument("[target]", "repository root", ".")
  .option("-y, --yes")
  .action(async (target, options) => {
    const root = path.resolve(target);
    const plan = await createPlan(root);
    printPlan(plan);
    if (!options.yes) throw new Error("Update preview complete. Re-run with --yes to approve.");
    await installPlan(plan, await readManifest(root), await loadWorkflows());
    console.log(pc.green("Update completed."));
  });
app
  .command("check")
  .argument("[target]", "repository root", ".")
  .action(async (target) => {
    const root = path.resolve(target);
    const errors = await checkOwnedFiles(root);
    if (!errors.length) {
      const generated = checkGeneratedFiles(root);
      if (generated) errors.push(generated);
    }
    if (errors.length) {
      for (const error of errors) console.error(pc.red(error));
      process.exitCode = 1;
    } else console.log(pc.green("Sources and generated outputs are current."));
  });
app
  .command("route")
  .argument("<prompt>")
  .option("--json")
  .action(async (prompt) => {
    const match = routePrompt(prompt, await loadWorkflows());
    console.log(
      JSON.stringify(
        {
          workflow: match.workflow.id,
          score: match.score,
          matchedSignals: match.matchedSignals,
          stages: match.workflow.stages,
        },
        null,
        2,
      ),
    );
  });
app
  .command("migrate")
  .requiredOption("--from <source>")
  .argument("[target]", "repository root", ".")
  .action(async (target, options) => {
    if (!["rulesync-bonsai", "omnitech-shared"].includes(options.from))
      throw new Error(`Unsupported migration source: ${options.from}`);
    const plan = await createPlan(path.resolve(target));
    console.log(
      JSON.stringify(
        {
          mode: "dry-run",
          source: options.from,
          target: plan.targetRoot,
          recommendedProfiles: plan.profiles,
          note: "Predecessor repositories remain unchanged.",
        },
        null,
        2,
      ),
    );
  });
function printPlan(plan: Awaited<ReturnType<typeof createPlan>>) {
  console.log(
    [
      pc.bold("Installation plan"),
      `Target: ${plan.targetRoot}`,
      `Profiles: ${plan.profiles.join(", ")}`,
      `Workflows: ${plan.workflows.join(", ")}`,
      `Agents: ${plan.targets.join(", ")}`,
      `Files: ${plan.files.length}`,
    ].join("\n"),
  );
}
app.parseAsync().catch((error: unknown) => {
  console.error(pc.red(error instanceof Error ? error.message : String(error)));
  process.exitCode = 1;
});
