"use strict";

const path = require("path");
const fs = require("fs");

/**
 * Semantic-release "prepare" plugin: writes the next release version to
 * root, packages/core, and packages/cli package.json so all stay in sync.
 */
function prepare(pluginConfig, context) {
  const version = context.nextRelease.version;
  const rootDir = path.resolve(__dirname, "..");

  const files = [
    path.join(rootDir, "package.json"),
    path.join(rootDir, "packages", "core", "package.json"),
    path.join(rootDir, "packages", "cli", "package.json"),
  ];

  for (const file of files) {
    const pkgPath = path.relative(rootDir, file);
    const pkg = JSON.parse(fs.readFileSync(file, "utf8"));
    pkg.version = version;
    fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + "\n", "utf8");
    context.logger.log("Updated %s to version %s", pkgPath, version);
  }
}

module.exports = { prepare };
