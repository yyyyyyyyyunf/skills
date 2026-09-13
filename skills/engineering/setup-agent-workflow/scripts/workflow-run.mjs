import { existsSync, lstatSync, readdirSync, realpathSync } from "node:fs";
import { basename, dirname, extname, isAbsolute, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadConfig } from "./workflow-config.mjs";
import {
  check,
  clean,
  committedFile,
  git,
  regularFile,
  relativePath,
} from "./workflow-io.mjs";
import { workflowOutputSchema } from "./workflow-output.mjs";

const scripts = dirname(fileURLToPath(import.meta.url));
const requiredSkills = [
  "implement",
  "acceptance-plan",
  "acceptance",
  "code-review",
  "tdd",
  "codebase-design",
];

// Installed instructions use relative inline Markdown links for local resources.
// Follow those links across skill boundaries, with cycles visited only once.
function checkSkillResources(file, visited = new Set()) {
  const resolved = realpathSync(file);
  if (visited.has(resolved)) return;
  visited.add(resolved);
  const content = regularFile(dirname(resolved), basename(resolved));
  if (extname(resolved) !== ".md") return;
  for (const match of content
    .toString("utf8")
    .matchAll(/\[[^\]\n]*\]\(([^)\n]+)\)/g)) {
    const target = match[1].split("#")[0];
    if (!target) continue;
    const url = new URL(target, pathToFileURL(resolved));
    if (url.protocol === "file:")
      checkSkillResources(fileURLToPath(url), visited);
  }
}

/** Prepare native run options only. Sandcastle owns execution and progression. */
export function workflowRunOptions({ sandcastle, sandbox, cwd, configPath }) {
  check(
    sandcastle?.WORKFLOW_PROTOCOL_VERSION === 1 &&
      typeof sandcastle.Output?.object === "function",
    "Upgrade Sandcastle: native workflow protocol 1 with iterationOutput is required",
  );
  check(
    sandbox?.tag === "none",
    "This shared startup configuration requires the verified host noSandbox environment",
  );
  const hostRepoDir = realpathSync(cwd);
  clean(hostRepoDir);
  const worktreesRoot = join(hostRepoDir, ".sandcastle/worktrees");
  if (existsSync(worktreesRoot)) {
    check(
      lstatSync(worktreesRoot).isDirectory() &&
        !lstatSync(worktreesRoot).isSymbolicLink(),
      "Inspect the non-directory or symlink Sandcastle worktree root before running",
    );
    const retained = readdirSync(worktreesRoot);
    check(
      retained.length === 0,
      `Inspect retained or orphaned Sandcastle worktrees before running: ${retained.map((name) => join(worktreesRoot, name)).join(", ")}`,
    );
  }
  const targetCommit = git(hostRepoDir, "rev-parse", "HEAD");
  const config = loadConfig(
    { version: 1, iterationId: "setup-preflight", hostRepoDir, targetCommit },
    configPath,
  );
  const runner = config.runner;
  check(
    runner?.branchStrategy === "merge-to-head",
    "runner.branchStrategy must explicitly select merge-to-head",
  );
  check(
    Number.isSafeInteger(runner.maxIterations) && runner.maxIterations > 0,
    "runner.maxIterations must be a positive integer",
  );
  for (const key of [
    "executionTimeoutSeconds",
    "completionTimeoutSeconds",
    "commandTimeoutSeconds",
  ])
    check(
      Number.isFinite(runner[key]) &&
        runner[key] > 0 &&
        runner[key] <= 2147483.647,
      `runner.${key} must be finite positive seconds`,
    );
  check(
    runner.idleTimeoutSeconds === false ||
      (Number.isFinite(runner.idleTimeoutSeconds) &&
        runner.idleTimeoutSeconds > 0 &&
        runner.idleTimeoutSeconds <= 2147483.647),
    "runner.idleTimeoutSeconds must be false or finite positive seconds",
  );
  relativePath(runner.promptFile);
  check(
    committedFile(hostRepoDir, targetCommit, runner.promptFile).equals(
      regularFile(hostRepoDir, runner.promptFile),
    ),
    "Prompt must match its committed version",
  );
  check(
    config.contractPaths.includes(runner.promptFile),
    "contractPaths must freeze the actual runner promptFile",
  );
  check(
    typeof runner.skillsRoot === "string" && isAbsolute(runner.skillsRoot),
    "runner.skillsRoot must be an absolute installed skills directory",
  );
  const skillsRoot = realpathSync(runner.skillsRoot);
  const checkedResources = new Set();
  const skillFiles = new Map(
    requiredSkills.map((name) => {
      const directory = realpathSync(join(skillsRoot, name));
      checkSkillResources(join(directory, "SKILL.md"), checkedResources);
      return [name, join(directory, "SKILL.md")];
    }),
  );
  for (const file of [
    "workflow.mjs",
    "workflow-backlog.mjs",
    "workflow-config.mjs",
    "workflow-io.mjs",
    "workflow-verify.mjs",
    "workflow-output.mjs",
  ])
    regularFile(scripts, file);
  const artifactRoot = join(hostRepoDir, relativePath(runner.artifactRoot));
  for (const directory of [
    runner.artifactRoot,
    ".sandcastle/logs",
    ".sandcastle/worktrees",
    ...config.evidenceRoots,
  ]) {
    try {
      git(
        hostRepoDir,
        "--no-literal-pathspecs",
        "check-ignore",
        "--",
        `${directory}/.workflow-ignore-probe`,
      );
    } catch (cause) {
      throw new Error(
        `Runtime output directory must be gitignored: ${directory}`,
        { cause },
      );
    }
  }
  const command = (operation) => ({
    command: [
      process.execPath,
      join(scripts, "workflow.mjs"),
      operation,
      "--config",
      configPath,
    ],
    timeoutSeconds: runner.commandTimeoutSeconds,
  });
  return {
    cwd: hostRepoDir,
    sandbox,
    promptFile: join(hostRepoDir, runner.promptFile),
    promptArgs: { IMPLEMENT_SKILL: skillFiles.get("implement") },
    branchStrategy: { type: "merge-to-head" },
    maxIterations: runner.maxIterations,
    idleTimeoutSeconds: runner.idleTimeoutSeconds,
    executionTimeoutSeconds: runner.executionTimeoutSeconds,
    completionTimeoutSeconds: runner.completionTimeoutSeconds,
    artifacts: { root: artifactRoot, paths: config.evidenceRoots },
    preparation: command("prepare"),
    verification: command("verify"),
    iterationOutput: sandcastle.Output.object({
      tag: "workflow-result",
      schema: workflowOutputSchema,
      maxRetries: 0,
    }),
  };
}
