import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SPEC_FILENAME } from "../constants.js";
import { findPackageRoot } from "../utils.js";

export function runSpec(): void {
  const thisFile = fileURLToPath(import.meta.url);
  const startDir = path.dirname(thisFile);
  const packageRoot = findPackageRoot(startDir);
  if (!packageRoot) {
    process.stderr.write("statecraft spec: could not find package root\n");
    process.exitCode = 1;
    return;
  }
  const specPath = path.join(packageRoot, SPEC_FILENAME);
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
