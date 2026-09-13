import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync, realpathSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";

const [projectArg, recordPath] = process.argv.slice(2);
const project = realpathSync(projectArg);
const record = JSON.parse(readFileSync(recordPath));
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const command = (file, args) =>
  execFileSync(file, args, {
    cwd: project,
    env: { ...process.env, BACKLOG_CWD: project },
    encoding: "utf8",
    stdio: "pipe",
  }).trim();
const git = (...args) => command("git", args);
assert.equal(record.status, "completed");
assert.equal(record.stopReason, "no-work");
assert.deepEqual(record.preservedWorktreePaths, []);
assert.equal(record.iterations.length, 2);
assert.deepEqual(
  record.preparations.map((p) => p.decision.decision),
  ["run", "run", "no-work"],
);
assert.deepEqual(
  record.iterations.map((i) => i.output.ticketId),
  ["TASK-1", "TASK-2"],
);
assert.equal(new Set(record.iterations.map((i) => i.iterationId)).size, 2);
const observed = [];
for (let index = 0; index < record.iterations.length; index++) {
  const i = record.iterations[index];
  const preparation = record.preparations[index];
  assert.equal(i.output.attemptId, i.iterationId);
  assert.equal(i.metadata.ticketId, i.output.ticketId);
  assert.equal(preparation.context.iterationId, i.iterationId);
  assert.equal(preparation.context.targetCommit, i.targetCommit);
  assert.equal(preparation.context.hostRepoDir, project);
  assert.equal(preparation.context.targetBranch, i.targetBranch);
  assert.deepEqual(preparation.decision.metadata, i.metadata);
  assert.equal(i.hostRepoDir, project);
  assert.equal(i.targetBranch, git("symbolic-ref", "--short", "HEAD"));
  assert.match(i.sourceBranch, /^sandcastle\//);
  assert.notEqual(i.sourceBranch, i.targetBranch);
  assert.equal(i.verification.decision, "accept");
  assert.equal(i.output.outcome, "completed");
  assert.equal(i.verification.outcome.status, "completed");
  assert.equal(i.candidateCommit, i.mergedCommit);
  assert.equal(i.cleanup, "removed");
  assert.equal(existsSync(i.worktreePath), false);
  assert.equal(
    git("merge-base", i.targetCommit, i.candidateCommit),
    i.targetCommit,
  );
  const raw = JSON.parse(readFileSync(i.rawResultPath));
  const result = JSON.parse(readFileSync(i.resultPath));
  for (const other of [raw, result, i.verificationContext]) {
    for (const key of ["iterationId", "hostRepoDir", "worktreePath", "sourceBranch", "targetBranch", "targetCommit", "candidateCommit", "metadata"])
      assert.deepEqual(other[key], i[key], `Iteration identity mismatch: ${key}`);
  }
  assert.equal(i.verificationContext.artifactRoot, i.artifactRoot);
  assert.equal(i.verificationContext.resultPath, i.resultPath);
  assert.ok(raw.stdout.length > 0);
  assert.match(raw.sessionId, /^session_[0-9a-f-]+$/);
  assert.deepEqual(result, { ...raw, output: i.output });
  const receipt = JSON.parse(
    command("git", ["show", `${i.candidateCommit}:${i.output.receiptPath}`]),
  );
  assert.equal(receipt.attemptId, i.iterationId);
  assert.equal(receipt.ticketId, i.output.ticketId);
  assert.equal(receipt.verdict, "passed");
  assert.deepEqual(i.verification.outcome, {
    status: "completed",
    ticketId: receipt.ticketId,
    attemptId: receipt.attemptId,
    implementationRevision: receipt.implementationRevision,
    receiptPath: i.output.receiptPath,
    reportPath: receipt.report.path,
    artifacts: receipt.artifacts,
  });
  const report = execFileSync(
    "git",
    ["show", `${i.candidateCommit}:${receipt.report.path}`],
    { cwd: project },
  );
  assert.equal(hash(report), receipt.report.sha256);
  assert.ok(
    report.toString().includes(`code state: ${receipt.implementationRevision}`),
  );
  assert.equal(
    git("merge-base", receipt.implementationRevision, i.candidateCommit),
    receipt.implementationRevision,
  );
  assert.ok(receipt.artifacts.length > 0);
  for (const artifact of receipt.artifacts)
    assert.equal(
      hash(readFileSync(join(i.artifactRoot, artifact.path))),
      artifact.sha256,
    );
  const task = JSON.parse(
    command("backlog", ["task", "view", i.output.ticketId, "--json"]),
  ).task;
  assert.equal(task.status, "Done");
  assert.equal(task.acceptanceCriteria.length, 3);
  assert.ok(task.acceptanceCriteria.every((ac) => ac.checked));
  assert.ok(
    task.path.startsWith("backlog/tasks/"),
    "Completion must not require per-task collection",
  );
  if (index === 1) {
    assert.equal(i.targetCommit, record.iterations[0].mergedCommit);
    assert.deepEqual(task.dependencies, ["TASK-1"]);
    assert.deepEqual(
      i.metadata.dependencyContracts.map((d) => d.ticketId),
      ["TASK-1"],
    );
  }
  observed.push({
    ticketId: task.id,
    attemptId: i.iterationId,
    sourceBranch: i.sourceBranch,
    targetCommit: i.targetCommit,
    candidateCommit: i.candidateCommit,
    mergedCommit: i.mergedCommit,
    implementationRevision: receipt.implementationRevision,
    report: receipt.report,
    receiptPath: i.output.receiptPath,
    artifactRoot: i.artifactRoot,
    artifacts: receipt.artifacts,
    sessionId: raw.sessionId,
  });
}
const finalCommit = record.iterations.at(-1).mergedCommit;
assert.equal(git("rev-parse", "HEAD"), finalCommit);
assert.equal(record.preparations.at(-1).context.targetCommit, finalCommit);
assert.equal(git("status", "--porcelain"), "");
assert.equal(
  command("git", ["worktree", "list", "--porcelain"])
    .split("\n")
    .filter((line) => line.startsWith("worktree ")).length,
  1,
);
console.log(
  JSON.stringify(
    {
      project,
      recordPath,
      startedAt: record.startedAt,
      finishedAt: record.finishedAt,
      elapsedSeconds:
        (Date.parse(record.finishedAt) - Date.parse(record.startedAt)) / 1000,
      stopReason: record.stopReason,
      preparations: 3,
      acceptedTasks: observed,
      finalCommit,
      clean: true,
      preservedWorktrees: 0,
    },
    null,
    2,
  ),
);
