import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { containWithin } from "./paths";
export const sha256 = async (content: string | Buffer) => crypto.createHash("sha256").update(content).digest("hex");
export async function writeOwnedFile(
  root: string,
  relative: string,
  content: string,
  previous: Record<string, string>,
  force: boolean,
): Promise<string> {
  const dest = containWithin(root, relative);
  const current = await fs.readFile(dest).catch(() => undefined);
  if (current) {
    const hash = await sha256(current);
    if (!force && previous[relative] === undefined)
      throw new Error(`Refusing to overwrite unmanaged file: ${relative}`);
    if (!force && previous[relative] !== hash)
      throw new Error(`Refusing to overwrite locally modified owned file: ${relative}`);
  }
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, content);
  return sha256(content);
}
export async function copyTreeOwned(
  source: string,
  root: string,
  destination: string,
  previous: Record<string, string>,
  force: boolean,
  owned: Record<string, string>,
): Promise<void> {
  for (const entry of await fs.readdir(source, { withFileTypes: true })) {
    const src = path.join(source, entry.name);
    const rel = path.posix.join(destination, entry.name);
    if (entry.isDirectory()) await copyTreeOwned(src, root, rel, previous, force, owned);
    else if (entry.isFile())
      owned[rel] = await writeOwnedFile(root, rel, await fs.readFile(src, "utf8"), previous, force);
  }
}
