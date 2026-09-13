import { execFileSync } from "node:child_process";
import { readFileSync, lstatSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import { createHash } from "node:crypto";

export const check = (condition, message) => {
  if (!condition) throw new Error(message);
};
export const sha256 = (value) =>
  createHash("sha256").update(value).digest("hex");
export function relativePath(path) {
  check(
    typeof path === "string" &&
      path.length > 0 &&
      !isAbsolute(path) &&
      !path.includes("\\") &&
      !path.includes("\0") &&
      path.split("/").every((part) => part && part !== "." && part !== ".."),
    `Invalid relative path: ${path}`,
  );
  return path;
}
export const under = (path, roots) =>
  roots.some((root) => path.startsWith(root + "/"));
export const strings = (value) =>
  Array.isArray(value) &&
  value.length > 0 &&
  value.every(
    (item) =>
      typeof item === "string" && item.length > 0 && !item.includes("\0"),
  );

export function command(cwd, argv) {
  const env = { ...process.env, BACKLOG_CWD: cwd, GIT_LITERAL_PATHSPECS: "1" };
  for (const key of [
    "GIT_DIR",
    "GIT_WORK_TREE",
    "GIT_INDEX_FILE",
    "GIT_COMMON_DIR",
    "GIT_OBJECT_DIRECTORY",
    "GIT_ALTERNATE_OBJECT_DIRECTORIES",
  ])
    delete env[key];
  try {
    return execFileSync(argv[0], argv.slice(1), {
      cwd,
      env,
      timeout: 10_000,
      maxBuffer: 32 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    throw new Error(
      `${argv[0]} ${argv.slice(1, 4).join(" ")} failed: ${String(error.stderr || error.message).slice(0, 8000)}`,
      { cause: error },
    );
  }
}
export const git = (cwd, ...args) =>
  command(cwd, ["git", ...args])
    .toString("utf8")
    .trim();
export function committedFile(cwd, revision, path) {
  relativePath(path);
  check(/^[a-f0-9]{40,64}$/.test(revision), "Expected a full Git revision");
  const entry = command(cwd, [
    "git",
    "ls-tree",
    "-z",
    revision,
    "--",
    path,
  ]).toString("utf8");
  check(
    /^100(?:644|755) blob [a-f0-9]+\t/.test(entry) &&
      entry.endsWith(`\t${path}\0`),
    `Not a committed regular file: ${path}`,
  );
  return command(cwd, ["git", "show", `${revision}:${path}`]);
}
export function regularFile(root, path) {
  relativePath(path);
  let current = root;
  for (const part of path.split("/")) {
    current = join(current, part);
    check(
      !lstatSync(current).isSymbolicLink(),
      `Symlink artifact/reference: ${path}`,
    );
  }
  check(lstatSync(current).isFile(), `Not a regular file: ${path}`);
  return readFileSync(current);
}
export function clean(cwd) {
  check(
    git(cwd, "status", "--porcelain").length === 0,
    "Candidate and tracker must be clean and committed",
  );
}
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
