import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, realpathSync, lstatSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const [sourceArg, tarballArg, projectArg] = process.argv.slice(2);
const source = realpathSync(sourceArg);
const tarball = realpathSync(tarballArg);
const project = realpathSync(projectArg);
const installed = join(project, "node_modules/@ai-hero/sandcastle");
assert.equal(lstatSync(installed).isSymbolicLink(), false);
const hash = (path) =>
  createHash("sha256").update(readFileSync(path)).digest("hex");
const git = (...args) =>
  execFileSync("git", args, { cwd: source, encoding: "utf8" }).trim();
assert.equal(
  git("status", "--porcelain"),
  "",
  "Sandcastle source must be clean when binding the package",
);
const files = {};
function compare(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) compare(path);
    else {
      assert.equal(entry.isFile(), true);
      const name = relative(source, path);
      assert.equal(hash(join(installed, name)), hash(path), name);
      files[name] = hash(path);
    }
  }
}
compare(join(source, "dist"));
const sourcePackage = JSON.parse(readFileSync(join(source, "package.json")));
const installedPackage = JSON.parse(
  readFileSync(join(installed, "package.json")),
);
assert.deepEqual(installedPackage, sourcePackage);
const publicProbe = JSON.parse(
  execFileSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `import * as s from '@ai-hero/sandcastle'; import { noSandbox } from '@ai-hero/sandcastle/sandboxes/no-sandbox'; console.log(JSON.stringify({ resolved: import.meta.resolve('@ai-hero/sandcastle'), protocol: s.WORKFLOW_PROTOCOL_VERSION, run: typeof s.run, output: typeof s.Output.object, sandboxTag: noSandbox().tag }));`,
    ],
    { cwd: project, encoding: "utf8" },
  ),
);
assert.equal(
  realpathSync(fileURLToPath(publicProbe.resolved)),
  realpathSync(join(installed, "dist/index.js")),
);
assert.deepEqual(
  { ...publicProbe, resolved: undefined },
  {
    resolved: undefined,
    protocol: 1,
    run: "function",
    output: "function",
    sandboxTag: "none",
  },
);
const lock = JSON.parse(readFileSync(join(project, "package-lock.json")));
const locked = lock.packages["node_modules/@ai-hero/sandcastle"];
const sha512 = createHash("sha512")
  .update(readFileSync(tarball))
  .digest("base64");
assert.equal(locked.integrity, `sha512-${sha512}`);
console.log(
  JSON.stringify(
    {
      source,
      sourceRevision: git("rev-parse", "HEAD"),
      sourceClean: true,
      tarball,
      tarballSha256: hash(tarball),
      integrity: locked.integrity,
      project,
      version: installedPackage.version,
      publicProbe,
      distributionFilesCompared: Object.keys(files).length,
      files,
    },
    null,
    2,
  ),
);
