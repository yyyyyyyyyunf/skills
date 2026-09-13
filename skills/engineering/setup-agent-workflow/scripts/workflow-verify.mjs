import { readFileSync } from "node:fs";
import { isDeepStrictEqual } from "node:util";
import {
  check,
  clean,
  command,
  committedFile,
  git,
  regularFile,
  relativePath,
  sha256,
  under,
} from "./workflow-io.mjs";
import { backlogReader, taskContract } from "./workflow-backlog.mjs";
import { workflowOutputSchema } from "./workflow-output.mjs";

export function verify(ctx, config) {
  const output = JSON.parse(readFileSync(ctx.resultPath, "utf8")).output;
  const validation = workflowOutputSchema["~standard"].validate(output);
  check(
    !validation.issues,
    validation.issues?.map((issue) => issue.message).join("; "),
  );
  check(
    typeof ctx.metadata?.ticketId === "string" &&
      ctx.metadata.ticketId.length > 0,
    "Missing host ticket identity",
  );
  check(
    output.attemptId === ctx.iterationId,
    "Result attempt identity mismatch",
  );
  check(
    output.ticketId === ctx.metadata?.ticketId,
    "Result ticket identity mismatch",
  );
  if (output.outcome !== "completed")
    return {
      version: 1,
      decision: "retain",
      outcome: {
        status: output.outcome,
        ticketId: output.ticketId,
        attemptId: output.attemptId,
        unresolved: output.unresolved ?? [],
      },
    };
  relativePath(output.receiptPath);
  check(
    under(output.receiptPath, [config.reportRoot]),
    "Receipt path must be under reportRoot",
  );
  clean(ctx.worktreePath);
  check(
    git(ctx.worktreePath, "rev-parse", "HEAD") === ctx.candidateCommit,
    "Candidate revision changed",
  );
  for (const file of ctx.metadata.contractFiles ?? [])
    check(
      sha256(
        committedFile(ctx.worktreePath, ctx.candidateCommit, file.path),
      ) === file.sha256,
      `Approved contract changed: ${file.path}`,
    );
  check(
    ctx.metadata.contractFiles?.length > 0,
    "Missing frozen contract files",
  );
  const reader = backlogReader(ctx.worktreePath, config);
  const task = reader.detail(output.ticketId);
  check(
    config.queue.doneStatuses.includes(task.status),
    `Tracker is not terminal: ${task.status}`,
  );
  check(
    taskContract(task) === ctx.metadata.taskContract,
    "Ticket acceptance contract changed",
  );
  for (const parent of ctx.metadata.parentContracts ?? [])
    check(
      taskContract(reader.detail(parent.ticketId)) === parent.sha256,
      `Parent contract changed: ${parent.ticketId}`,
    );
  check(
    task.acceptanceCriteria.length > 0 &&
      task.acceptanceCriteria.every((item) => item.checked === true) &&
      task.definitionOfDone.every((item) => item.checked === true),
    "Tracker acceptance/definition-of-done items are not complete",
  );
  const receipt = JSON.parse(
    committedFile(ctx.worktreePath, ctx.candidateCommit, output.receiptPath),
  );
  check(
    receipt.version === 1 && receipt.attemptId === ctx.iterationId,
    "Receipt attempt identity mismatch",
  );
  check(receipt.ticketId === task.id, "Receipt ticket identity mismatch");
  check(receipt.verdict === "passed", "Receipt verdict is not passed");
  check(
    /^[a-f0-9]{40,64}$/.test(receipt.implementationRevision),
    "Invalid implementation revision",
  );
  try {
    git(
      ctx.worktreePath,
      "merge-base",
      "--is-ancestor",
      receipt.implementationRevision,
      ctx.candidateCommit,
    );
  } catch (cause) {
    throw new Error("Implementation revision is not an ancestor of candidate", {
      cause,
    });
  }
  check(
    receipt.report &&
      under(relativePath(receipt.report.path), [config.reportRoot]) &&
      receipt.report.path !== output.receiptPath,
    "Invalid report path",
  );
  const reportBytes = committedFile(
    ctx.worktreePath,
    ctx.candidateCommit,
    receipt.report.path,
  );
  check(sha256(reportBytes) === receipt.report.sha256, "Report hash mismatch");
  const report = reportBytes.toString("utf8");
  const verdicts = [...report.matchAll(/^verdict:\s*(passed|held)\s*$/gm)];
  check(
    verdicts.length === 1 && verdicts[0][1] === receipt.verdict,
    "Report verdict contradicts receipt",
  );
  const accounting = [
    ...report.matchAll(
      /^required criteria:\s*(\d+)\/(\d+)\s*·\s*required gates:\s*(\d+)\/(\d+)\s*$/gm,
    ),
  ];
  check(
    accounting.length === 1,
    "Report is missing unambiguous required accounting",
  );
  const [, criteriaPassed, criteriaTotal, gatesPassed, gatesTotal] =
    accounting[0].map(Number);
  check(
    [criteriaPassed, criteriaTotal, gatesPassed, gatesTotal].every(
      Number.isSafeInteger,
    ) &&
      criteriaTotal > 0 &&
      criteriaPassed === criteriaTotal &&
      gatesPassed === gatesTotal,
    "Report required accounting contradicts passed verdict",
  );
  const bindings = [
    ...report.matchAll(/^```afk-acceptance\r?\n([\s\S]*?)^```\s*$/gm),
  ];
  check(bindings.length === 1, "Expected one afk-acceptance report binding");
  const { report: ignored, ...binding } = receipt;
  const actual = JSON.parse(bindings[0][1]);
  check(
    isDeepStrictEqual(actual, binding),
    "Report binding contradicts receipt",
  );
  check(
    Array.isArray(receipt.artifacts) && receipt.artifacts.length > 0,
    "Required artifact collection is empty",
  );
  const seen = new Set();
  for (const artifact of receipt.artifacts) {
    relativePath(artifact.path);
    check(
      under(artifact.path, config.evidenceRoots) && !seen.has(artifact.path),
      "Invalid or duplicate artifact path",
    );
    seen.add(artifact.path);
    check(/^[a-f0-9]{64}$/.test(artifact.sha256), "Invalid artifact hash");
    check(
      sha256(regularFile(ctx.artifactRoot, artifact.path)) === artifact.sha256,
      `Artifact hash mismatch: ${artifact.path}`,
    );
  }
  const allowed = new Set([
    ctx.metadata.taskPath,
    task.path,
    output.receiptPath,
    receipt.report.path,
  ]);
  const changed = command(ctx.worktreePath, [
    "git",
    "diff",
    "--name-only",
    "--no-renames",
    "-z",
    receipt.implementationRevision,
    ctx.candidateCommit,
  ])
    .toString("utf8")
    .split("\0")
    .filter(Boolean);
  for (const path of changed)
    check(
      allowed.has(path),
      `Implementation changed after acceptance; not a finalization file: ${path}`,
    );
  return {
    version: 1,
    decision: "accept",
    outcome: {
      status: "completed",
      ticketId: task.id,
      attemptId: ctx.iterationId,
      implementationRevision: receipt.implementationRevision,
      receiptPath: output.receiptPath,
      reportPath: receipt.report.path,
      artifacts: receipt.artifacts,
    },
  };
}
