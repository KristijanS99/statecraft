/**
 * Optional update check: notify users when a newer version of Statecraft is available.
 * Runs fire-and-forget after commands; uses a cache in the temp directory when writable.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import semver from "semver";

const REGISTRY_URL = "https://registry.npmjs.org/@stcrft/statecraft/latest";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const FETCH_TIMEOUT_MS = 3000;
const CACHE_FILENAME = "statecraft-update-check.json";

interface CacheShape {
  lastCheck: number;
  latestVersion: string;
}

function getCachePath(): string {
  const tmp = os.tmpdir();
  return path.join(tmp, CACHE_FILENAME);
}

function readCache(): CacheShape | null {
  try {
    const p = getCachePath();
    const raw = fs.readFileSync(p, "utf-8");
    const data = JSON.parse(raw) as CacheShape;
    if (typeof data.lastCheck === "number" && typeof data.latestVersion === "string") {
      return data;
    }
  } catch {
    // ignore
  }
  return null;
}

function writeCache(latestVersion: string): void {
  try {
    const p = getCachePath();
    const data: CacheShape = { lastCheck: Date.now(), latestVersion };
    fs.writeFileSync(p, JSON.stringify(data), "utf-8");
  } catch {
    // best-effort: do not fail if temp dir is read-only or other error
  }
}

async function fetchLatestVersion(): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(REGISTRY_URL, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const json = (await res.json()) as { version?: string };
    return typeof json.version === "string" ? json.version : null;
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

function shouldSkip(options: { isLocalDev: boolean }): boolean {
  if (process.env.CI === "true" || process.env.CI === "1") return true;
  if (process.env.STATECRAFT_NO_UPDATE_CHECK === "1" || process.env.STATECRAFT_NO_UPDATE_CHECK === "true") return true;
  if (options.isLocalDev) return true;
  return false;
}

/**
 * Run the update check (fire-and-forget). Call after the command has finished.
 * Skips when CI, STATECRAFT_NO_UPDATE_CHECK, or running from local dev.
 * Uses cache in temp dir when writable; does not fail if cache write fails.
 */
export function runUpdateCheck(currentVersion: string, options: { isLocalDev: boolean }): void {
  if (shouldSkip(options)) return;

  void (async () => {
    let latest: string | null = null;
    const cached = readCache();
    if (cached && Date.now() - cached.lastCheck < CACHE_TTL_MS) {
      latest = cached.latestVersion;
    }
    if (latest === null) {
      latest = await fetchLatestVersion();
      if (latest !== null) writeCache(latest);
    }
    if (latest === null) return;
    try {
      if (semver.gt(latest, currentVersion)) {
        process.stderr.write(
          `A new version of Statecraft is available: ${latest} (you have ${currentVersion}). Upgrade: npm update -g @stcrft/statecraft\n`
        );
      }
    } catch {
      // invalid semver or other compare error: do nothing
    }
  })();
}
