import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function findPackageRoot(startDir: string): string | null {
  let dir = path.resolve(startDir);
  for (;;) {
    const pkgPath = path.join(dir, "package.json");
    if (fs.existsSync(pkgPath)) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

export function runSpec(): void {
  const thisFile = fileURLToPath(import.meta.url);
  const startDir = path.dirname(thisFile);
  const packageRoot = findPackageRoot(startDir);
  if (!packageRoot) {
    process.stderr.write("statecraft spec: could not find package root\n");
    process.exitCode = 1;
    return;
  }
  const specPath = path.join(packageRoot, "spec.md");
  if (!fs.existsSync(specPath)) {
    process.stderr.write(`statecraft spec: spec file not found at ${specPath}\n`);
    process.exitCode = 1;
    return;
  }
  try {
    const content = fs.readFileSync(specPath, "utf-8");
    process.stdout.write(content);
    if (!content.endsWith("\n")) process.stdout.write("\n");
    process.exitCode = 0;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`statecraft spec: ${message}\n`);
    process.exitCode = 1;
  }
}
