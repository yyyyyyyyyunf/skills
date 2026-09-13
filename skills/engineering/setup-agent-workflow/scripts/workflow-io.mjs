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
