"use strict";

module.exports = {
  branches: ["main"],
  plugins: [
    [
      "@semantic-release/commit-analyzer",
      {
        releaseRules: [
          { type: "feat", release: "minor" },
          { type: "fix", release: "patch" },
          { type: "refactor", release: "patch" },
          { type: "perf", release: "patch" },
          { breaking: true, release: "major" },
        ],
      },
    ],
    "@semantic-release/release-notes-generator",
    "./scripts/release-prepare.cjs",
    [
      "@semantic-release/git",
      {
        assets: ["package.json", "packages/core/package.json", "packages/cli/package.json"],
        message: "chore(release): ${nextRelease.version} [skip ci]",
      },
    ],
    [
      "@semantic-release/github",
      {
        // Avoid "Resource not accessible by integration" when fetching associated PRs
        successComment: false,
      },
    ],
    "./scripts/release-publish.cjs",
  ],
};
