import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
function findProjectRoot(start: string): string {
  let current = start;
  while (true) {
    const packageFile = path.join(current, "package.json");
    if (fs.existsSync(packageFile)) {
      const pkg = JSON.parse(fs.readFileSync(packageFile, "utf8")) as { name?: string };
      if (pkg.name === "@omnitech/rulesync") return current;
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new Error("Unable to locate the @omnitech/rulesync package root.");
}

export const projectRoot = () => findProjectRoot(moduleDir);
export function containWithin(root: string, candidate: string): string {
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(root, candidate);
  const relative = path.relative(resolvedRoot, resolved);
  if (relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))) return resolved;
  throw new Error(`Path escapes target root: ${candidate}`);
}
