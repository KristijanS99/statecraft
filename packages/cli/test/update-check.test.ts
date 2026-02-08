import { describe, expect, it } from "vitest";
import { runUpdateCheck } from "../src/update-check.js";

describe("runUpdateCheck", () => {
  it("does not throw when isLocalDev is true", () => {
    expect(() => runUpdateCheck("1.0.0", { isLocalDev: true })).not.toThrow();
  });

  it("does not throw when STATECRAFT_NO_UPDATE_CHECK is set", () => {
    const prev = process.env.STATECRAFT_NO_UPDATE_CHECK;
    try {
      process.env.STATECRAFT_NO_UPDATE_CHECK = "1";
      expect(() => runUpdateCheck("1.0.0", { isLocalDev: false })).not.toThrow();
    } finally {
      if (prev !== undefined) process.env.STATECRAFT_NO_UPDATE_CHECK = prev;
      else delete process.env.STATECRAFT_NO_UPDATE_CHECK;
    }
  });
});
