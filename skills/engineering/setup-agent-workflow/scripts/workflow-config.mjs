import { isAbsolute } from "node:path";
import { check, committedFile, relativePath } from "./workflow-io.mjs";

const strings = (value) =>
  Array.isArray(value) &&
  value.length > 0 &&
  value.every(
    (item) =>
      typeof item === "string" && item.length > 0 && !item.includes("\0"),
  );

export function loadConfig(ctx, path) {
  check(
    ctx?.version === 1 &&
      /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(ctx.iterationId),
    "Invalid host attempt context",
  );
  check(
    typeof ctx.hostRepoDir === "string" && isAbsolute(ctx.hostRepoDir),
    "Expected absolute hostRepoDir",
  );
  const config = JSON.parse(
    committedFile(ctx.hostRepoDir, ctx.targetCommit, path),
  );
  check(
    config.version === 1 && config.tracker?.type === "backlog",
    "Only workflow v1 Backlog automation is supported",
  );
  check(
    strings(config.tracker.command),
    "tracker.command must be a nonempty argv array",
  );
  relativePath(config.tracker.directory);
  const q = config.queue;
  check(
    q &&
      typeof q.actor === "string" &&
      q.actor &&
      typeof q.readyLabel === "string" &&
      q.readyLabel,
    "Queue actor and readyLabel are required",
  );
  for (const field of [
    "conflictingLabels",
    "excludeLabels",
    "readyStatuses",
    "doneStatuses",
  ])
    check(strings(q[field]), `queue.${field} must be nonempty`);
  check(
    !q.conflictingLabels.includes(q.readyLabel),
    "readyLabel cannot also be a conflicting role",
  );
  check(
    q.scope && Object.keys(q.scope).length === 1,
    "Choose one explicit queue scope",
  );
  check(
    strings(q.scope.taskIds) ||
      strings(q.scope.labels) ||
      (typeof q.scope.parentTaskId === "string" && q.scope.parentTaskId),
    "Queue scope must contain taskIds, labels, or parentTaskId",
  );
  if (q.scope.labels)
    check(
      !q.scope.labels.some((label) =>
        [q.readyLabel, ...q.conflictingLabels].includes(label),
      ),
      "Queue scope labels must be independent of triage eligibility",
    );
  check(
    strings(config.contractPaths) && strings(config.evidenceRoots),
    "contractPaths and evidenceRoots must be nonempty",
  );
  for (const value of [
    ...config.contractPaths,
    ...config.evidenceRoots,
    config.reportRoot,
  ])
    relativePath(value);
  return config;
}
