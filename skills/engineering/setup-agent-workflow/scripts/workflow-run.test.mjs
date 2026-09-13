import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  rmSync,
  realpathSync,
  readFileSync,
  cpSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { workflowRunOptions } from "./workflow-run.mjs";

const scripts = dirname(fileURLToPath(import.meta.url));

function fixture(t) {
  const root = mkdtempSync(join(realpathSync(tmpdir()), "workflow-setup-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const cwd = join(root, "repo");
  mkdirSync(cwd);
  const git = (...args) =>
    execFileSync("git", args, { cwd, encoding: "utf8", stdio: "pipe" }).trim();
  const write = (path, content) => {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
  };
  const skillsRoot = join(root, "skills");
  for (const name of [
    "implement",
    "acceptance-plan",
    "acceptance",
    "code-review",
    "tdd",
    "codebase-design",
    "setup-agent-workflow",
  ])
    cpSync(join(dirname(dirname(scripts)), name), join(skillsRoot, name), {
      recursive: true,
    });
  git("init", "-b", "main");
  git("config", "user.name", "Workflow fixture");
  git("config", "user.email", "workflow@example.invalid");
  write(
    join(cwd, ".gitignore"),
    ".sandcastle/evidence/\n.sandcastle/logs/\n.sandcastle/worktrees/\nacceptance/runs/\n",
  );
  write(
    join(cwd, "docs/agents/acceptance.md"),
    "Run the agreed checks and retain proof.\n",
  );
  write(
    join(cwd, ".sandcastle/prompt.md"),
    "Read {{IMPLEMENT_SKILL}} and follow the host handoff.\n",
  );
  const config = {
    version: 1,
    tracker: { type: "backlog", command: ["backlog"], directory: "backlog" },
    queue: {
      scope: { labels: ["trial"] },
      actor: "@me",
      readyLabel: "ready-for-agent",
      conflictingLabels: ["needs-info"],
      excludeLabels: ["spec"],
      readyStatuses: ["To Do"],
      doneStatuses: ["Done"],
    },
    contractPaths: ["docs/agents/acceptance.md", ".sandcastle/prompt.md"],
    reportRoot: "acceptance/reports",
    evidenceRoots: ["acceptance/runs"],
    runner: {
      promptFile: ".sandcastle/prompt.md",
      skillsRoot,
      branchStrategy: "merge-to-head",
      maxIterations: 3,
      idleTimeoutSeconds: false,
      executionTimeoutSeconds: 900,
      completionTimeoutSeconds: 15,
      commandTimeoutSeconds: 30,
      artifactRoot: ".sandcastle/evidence",
    },
  };
  const commit = () => {
    write(join(cwd, ".sandcastle/workflow.json"), JSON.stringify(config));
    git("add", ".");
    git("commit", "-m", "fixture");
  };
  commit();
  return { root, cwd, git, write, config, commit, skillsRoot };
}

test("one installed helper binds committed project settings to native Sandcastle options without invoking an agent", (t) => {
  const f = fixture(t);
  let invocations = 0;
  const sandcastle = {
    WORKFLOW_PROTOCOL_VERSION: 1,
    Output: { object: (definition) => definition },
    run: () => {
      invocations++;
    },
  };
  const sandbox = { tag: "none", name: "no-sandbox" };
  const options = workflowRunOptions({
    sandcastle,
    sandbox,
    cwd: f.cwd,
    configPath: ".sandcastle/workflow.json",
  });
  assert.equal(invocations, 0);
  assert.equal(options.sandbox, sandbox);
  assert.equal(options.cwd, f.cwd);
  assert.equal(options.promptFile, join(f.cwd, ".sandcastle/prompt.md"));
  assert.equal(
    options.promptArgs.IMPLEMENT_SKILL,
    join(f.skillsRoot, "implement/SKILL.md"),
  );
  assert.deepEqual(options.branchStrategy, { type: "merge-to-head" });
  assert.equal(options.maxIterations, 3);
  assert.equal(options.idleTimeoutSeconds, false);
  assert.equal(options.executionTimeoutSeconds, 900);
  assert.deepEqual(options.artifacts, {
    root: join(f.cwd, ".sandcastle/evidence"),
    paths: ["acceptance/runs"],
  });
  assert.deepEqual(options.preparation, {
    command: [
      process.execPath,
      join(scripts, "workflow.mjs"),
      "prepare",
      "--config",
      ".sandcastle/workflow.json",
    ],
    timeoutSeconds: 30,
  });
  assert.deepEqual(options.verification.command, [
    process.execPath,
    join(scripts, "workflow.mjs"),
    "verify",
    "--config",
    ".sandcastle/workflow.json",
  ]);
  assert.equal(options.iterationOutput.tag, "workflow-result");
  assert.equal(options.iterationOutput.maxRetries, 0);
  assert.ok(
    options.iterationOutput.schema["~standard"].validate({
      outcome: "completed",
    }).issues,
  );
  assert.equal(f.git("status", "--porcelain"), "");
});

test("startup stops for registered or orphaned Sandcastle worktrees and preserves earlier evidence", (t) => {
  const f = fixture(t);
  const retained = join(f.cwd, ".sandcastle/worktrees/retained");
  f.git("worktree", "add", "-b", "retained", retained);
  const evidence = join(f.cwd, ".sandcastle/evidence/previous/run.json");
  f.write(evidence, '{"status":"held"}\n');
  f.write(join(retained, "unsaved.txt"), "work to recover");
  const opts = {
    sandcastle: {
      WORKFLOW_PROTOCOL_VERSION: 1,
      Output: { object: (value) => value },
    },
    sandbox: { tag: "none" },
    cwd: f.cwd,
    configPath: ".sandcastle/workflow.json",
  };
  assert.throws(() => workflowRunOptions(opts), /retained|worktree/i);
  assert.equal(
    readFileSync(join(retained, "unsaved.txt"), "utf8"),
    "work to recover",
  );
  assert.equal(readFileSync(evidence, "utf8"), '{"status":"held"}\n');
  const orphan = join(f.cwd, ".sandcastle/worktrees/orphan");
  mkdirSync(orphan);
  f.git("worktree", "move", retained, join(f.root, "retained-outside"));
  assert.throws(() => workflowRunOptions(opts), /orphan|worktree/i);
  assert.equal(readFileSync(evidence, "utf8"), '{"status":"held"}\n');
});

test("startup rejects missing prerequisites and incompatible committed settings without modifying the project", async (t) => {
  const scenarios = [
    {
      name: "old-package",
      mutate: (f, opts) => {
        delete opts.sandcastle.WORKFLOW_PROTOCOL_VERSION;
      },
      error: /Upgrade Sandcastle/,
    },
    {
      name: "missing-skill",
      mutate: (f) => rmSync(join(f.skillsRoot, "acceptance/SKILL.md")),
      error: /SKILL.md/,
    },
    {
      name: "missing-resource",
      mutate: (f) =>
        rmSync(
          join(f.skillsRoot, "acceptance/references/acceptance-contract.md"),
        ),
      error: /acceptance-contract.md/,
    },
    {
      name: "missing-transitive-resource",
      mutate: (f) =>
        rmSync(join(f.skillsRoot, "setup-agent-workflow/runner.md")),
      error: /runner.md/,
    },
    {
      name: "head",
      mutate: (f) => {
        f.config.runner.branchStrategy = "head";
        f.commit();
      },
      error: /merge-to-head/,
    },
    {
      name: "unbounded",
      mutate: (f) => {
        delete f.config.runner.executionTimeoutSeconds;
        f.commit();
      },
      error: /executionTimeoutSeconds/,
    },
    {
      name: "missing-prompt",
      mutate: (f) => {
        f.config.runner.promptFile = ".sandcastle/missing.md";
        f.commit();
      },
      error: /committed regular file/,
    },
    {
      name: "unfrozen-prompt",
      mutate: (f) => {
        f.config.contractPaths = ["docs/agents/acceptance.md"];
        f.commit();
      },
      error: /contractPaths/,
    },
    {
      name: "unignored-artifacts",
      mutate: (f) => {
        f.config.runner.artifactRoot = "unignored-output";
        f.commit();
      },
      error: /gitignored/,
    },
    {
      name: "dirty-config",
      mutate: (f) => f.write(join(f.cwd, ".sandcastle/workflow.json"), "{}"),
      error: /clean and committed/,
    },
    {
      name: "container",
      mutate: (f, opts) => {
        opts.sandbox.tag = "bind-mount";
      },
      error: /host noSandbox/,
    },
  ];
  for (const { name, mutate, error } of scenarios) {
    await t.test(name, (t) => {
      const f = fixture(t);
      const opts = {
        sandcastle: {
          WORKFLOW_PROTOCOL_VERSION: 1,
          Output: { object: (value) => value },
        },
        sandbox: { tag: "none" },
        cwd: f.cwd,
        configPath: ".sandcastle/workflow.json",
      };
      mutate(f, opts);
      const before = f.git("status", "--porcelain");
      assert.throws(() => workflowRunOptions(opts), { message: error });
      assert.equal(f.git("status", "--porcelain"), before);
    });
  }
});

test("an incomplete shared installation fails at import before native run can start", async (t) => {
  const f = fixture(t);
  const installed = join(f.root, "incomplete-setup/scripts");
  cpSync(scripts, installed, { recursive: true });
  rmSync(join(installed, "workflow-io.mjs"));
  await assert.rejects(
    import(pathToFileURL(join(installed, "workflow-run.mjs"))),
    /workflow-io.mjs/,
  );
  assert.equal(f.git("status", "--porcelain"), "");
});
