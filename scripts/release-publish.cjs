"use strict";

const path = require("path");
const { execSync } = require("child_process");

const rootDir = path.resolve(__dirname, "..");

/**
 * Semantic-release "publish" plugin: publishes @stcrft/statecraft-core and
 * @stcrft/statecraft (CLI) to npm. Only runs when semantic-release creates a release.
 */
async function publish(pluginConfig, context) {
  const token = process.env.NPM_TOKEN || process.env.NODE_AUTH_TOKEN;
  if (!token || token.length === 0) {
    throw new Error(
      "NPM_TOKEN (or NODE_AUTH_TOKEN) is required for npm publish. " +
        "Add NPM_TOKEN to the repository secrets and ensure the release workflow env passes it."
    );
  }

  const packages = [
    path.join(rootDir, "packages", "core"),
    path.join(rootDir, "packages", "cli"),
  ];

  for (const pkgDir of packages) {
    const name = path.basename(pkgDir);
    context.logger.log("Publishing %s to npm...", name);
    execSync("npm publish --access public --no-git-checks", {
      cwd: pkgDir,
      stdio: "inherit",
      env: {
        ...process.env,
        NODE_AUTH_TOKEN: token,
      },
    });
  }
}

module.exports = { publish };
