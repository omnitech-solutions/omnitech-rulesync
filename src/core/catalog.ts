import fs from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";
import { projectRoot } from "./paths";
import { type Profile, profileSchema, type Workflow, workflowSchema } from "./schemas";

async function loadDir<T>(dir: string, parse: (value: unknown) => T): Promise<T[]> {
  const names = (await fs.readdir(dir)).filter((n) => /\.ya?ml$/u.test(n)).sort();
  return Promise.all(names.map(async (n) => parse(YAML.parse(await fs.readFile(path.join(dir, n), "utf8")))));
}
export const loadProfiles = (): Promise<Profile[]> =>
  loadDir(path.join(projectRoot(), "catalog/profiles"), (v) => profileSchema.parse(v));
export const loadWorkflows = (): Promise<Workflow[]> =>
  loadDir(path.join(projectRoot(), "catalog/workflows"), (v) => workflowSchema.parse(v));
