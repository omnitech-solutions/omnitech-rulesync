import fs from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";
import { type Lockfile, lockSchema, type Manifest, manifestSchema } from "./schemas";
export const MANIFEST_FILE = "omnitech-rulesync.yaml";
export const LOCK_FILE = "omnitech-rulesync.lock.yaml";
export async function readManifest(root: string): Promise<Manifest> {
  const text = await fs.readFile(path.join(root, MANIFEST_FILE), "utf8").catch(() => "{}");
  return manifestSchema.parse(YAML.parse(text) ?? {});
}
export async function readLock(root: string): Promise<Lockfile | undefined> {
  const text = await fs.readFile(path.join(root, LOCK_FILE), "utf8").catch(() => undefined);
  return text ? lockSchema.parse(YAML.parse(text)) : undefined;
}
export const renderManifest = (value: Manifest) => YAML.stringify(value, { lineWidth: 120 });
export const renderLock = (value: Lockfile) => YAML.stringify(value, { lineWidth: 160 });
