import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

// Reuse a completed real run without modifying its project or durable evidence.
const [source, tarball, project, recordPath, proofDirectory = dirname(fileURLToPath(import.meta.url))] = process.argv.slice(2);
const invoke = (name, args) => spawnSync(process.execPath, [join(proofDirectory, name), ...args], { encoding: "utf8" });
const passes = (result) => assert.equal(result.status, 0, result.stderr);
const rejects = (result, reason) => {
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, reason);
};

test("package proof accepts installed tarball and rejects distribution links or altered bytes", () => {
  passes(invoke("afk-package-proof.mjs", [source, tarball, project]));
  for (const mutation of ["directory-link", "file-link", "altered-file"]) {
    const root = mkdtempSync(join(tmpdir(), "afk-package-control-"));
    try {
      const installed = join(root, "node_modules/@ai-hero/sandcastle");
      cpSync(join(project, "node_modules"), join(root, "node_modules"), { recursive: true });
      cpSync(join(project, "package-lock.json"), join(root, "package-lock.json"));
      const target = join(installed, mutation === "directory-link" ? "dist" : "dist/index.js");
      rmSync(target, { recursive: true });
      if (mutation === "altered-file") writeFileSync(target, "throw new Error('altered distribution');\n");
      else symlinkSync(join(source, mutation === "directory-link" ? "dist" : "dist/index.js"), target);
      rejects(invoke("afk-package-proof.mjs", [source, tarball, root]), /AssertionError/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }
});

test("run proof accepts the real delivery and rejects contradictory identities", () => {
  passes(invoke("afk-real-run-proof.mjs", [project, recordPath]));
  const mutations = {
    source: (r) => { r.iterations[0].sourceBranch = "sandcastle/wrong-source"; },
    target: (r) => { r.iterations[0].verificationContext.targetBranch = "wrong-target"; },
    preparation: (r) => { r.preparations[0].decision.metadata.ticketId = "TASK-999"; },
    outcome: (r) => { r.iterations[0].verification.outcome.attemptId = "wrong-attempt"; },
    raw: (r, root) => {
      const raw = JSON.parse(readFileSync(r.iterations[0].rawResultPath));
      raw.sourceBranch = "sandcastle/wrong-raw-source";
      r.iterations[0].rawResultPath = join(root, "raw.json");
      writeFileSync(r.iterations[0].rawResultPath, JSON.stringify(raw));
    },
    result: (r, root) => {
      const result = JSON.parse(readFileSync(r.iterations[0].resultPath));
      result.targetCommit = "0".repeat(40);
      r.iterations[0].resultPath = join(root, "result.json");
      r.iterations[0].verificationContext.resultPath = r.iterations[0].resultPath;
      writeFileSync(r.iterations[0].resultPath, JSON.stringify(result));
    },
  };
  for (const mutate of Object.values(mutations)) {
    const root = mkdtempSync(join(tmpdir(), "afk-run-control-"));
    try {
      const record = JSON.parse(readFileSync(recordPath));
      mutate(record, root);
      const altered = join(root, "run.json");
      writeFileSync(altered, JSON.stringify(record));
      rejects(invoke("afk-real-run-proof.mjs", [project, altered]), /AssertionError/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }
});
