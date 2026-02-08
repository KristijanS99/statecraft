/**
 * Shared CLI utilities (path resolution, etc.).
 */
import fs from "node:fs";
import path from "node:path";

/**
 * Walk up from startDir until a directory containing package.json is found.
 * @returns Absolute path to package root, or null if not found.
 */
export function findPackageRoot(startDir: string): string | null {
  let dir = path.resolve(startDir);
  for (;;) {
    const pkgPath = path.join(dir, "package.json");
    if (fs.existsSync(pkgPath)) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}
