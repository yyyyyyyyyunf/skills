import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
  cpSync,
  symlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const cli = fileURLToPath(new URL("./workflow.mjs", import.meta.url));
const hash = (value) => createHash("sha256").update(value).digest("hex");
const configPath = ".sandcastle/workflow.json";

function fixture(t, scope = { labels: ["trial"] }) {
  const root = mkdtempSync(join(tmpdir(), "workflow-p5-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const dir = join(root, "repo");
  mkdirSync(dir);
  const env = { ...process.env, BACKLOG_CWD: dir };
  const exec = (cmd, args) =>
    execFileSync(cmd, args, {
      cwd: dir,
      env,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  const git = (...args) => exec("git", args);
  const backlog = (...args) => exec("backlog", args);
  const write = (path, data) => {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), data);
  };
  git("init", "-b", "main");
  backlog(
    "init",
    "Workflow proof",
    "--defaults",
    "--integration-mode",
    "none",
    "--check-branches",
    "false",
    "--include-remote",
    "false",
    "--auto-open-browser",
    "false",
  );
  write(".gitignore", "acceptance/runs/\n");
  write(
    "docs/agents/acceptance.md",
    "Contract: execute the agreed assertions and retain checks.log.\n",
  );
  const config = {
    version: 1,
    tracker: { type: "backlog", command: ["backlog"], directory: "backlog" },
    queue: {
      scope,
      actor: "@me",
      readyLabel: "ready-for-agent",
      conflictingLabels: [
        "needs-triage",
        "needs-info",
        "ready-for-human",
        "wontfix",
      ],
      excludeLabels: ["spec", "wayfinder:map"],
      readyStatuses: ["To Do"],
      doneStatuses: ["Done"],
    },
    contractPaths: ["docs/agents/acceptance.md"],
    reportRoot: "acceptance/reports",
    evidenceRoots: ["acceptance/runs"],
  };
  write(configPath, JSON.stringify(config));
  const commit = () => {
    git("add", ".");
    git("commit", "-m", "fixture");
    return git("rev-parse", "HEAD");
  };
  const task = (title, ...args) =>
    backlog(
      "task",
      "create",
      title,
      "--ac",
      "Pass the agreed check",
      "--labels",
      "trial,ready-for-agent",
      ...args,
    );
  const context = () => ({
    version: 1,
    iterationId: "attempt-1",
    hostRepoDir: dir,
    targetBranch: "main",
    targetCommit: git("rev-parse", "HEAD"),
  });
  const invoke = (operation, input) => {
    // Deliberately poison BACKLOG_CWD: the shared command must bind its own cwd.
    const result = spawnSync(
      process.execPath,
      [cli, operation, "--config", configPath],
      {
        cwd: root,
        env: { ...process.env, BACKLOG_CWD: root },
        input: JSON.stringify(input),
        encoding: "utf8",
      },
    );
    return {
      ...result,
      value: result.status === 0 ? JSON.parse(result.stdout) : undefined,
    };
  };
  return {
    root,
    dir,
    config,
    git,
    backlog,
    write,
    commit,
    task,
    context,
    invoke,
  };
}

test("prepare excludes parent specs, selects dependencies in order, and recognizes collected completion", (t) => {
  const f = fixture(t);
  f.task("Parent", "--labels", "spec");
  f.task("First", "--parent", "TASK-1");
  f.task("Second", "--parent", "TASK-1", "--dep", "TASK-1.1");
  f.commit();
  let result = f.invoke("prepare", f.context());
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.value.decision, "run");
  assert.equal(result.value.metadata.ticketId, "TASK-1.1");
  f.backlog("task", "edit", "TASK-1.1", "-s", "Done");
  f.backlog("task", "complete", "TASK-1.1");
  f.commit();
  result = f.invoke("prepare", f.context());
  assert.equal(result.value.metadata.ticketId, "TASK-1.2");
  f.backlog("task", "edit", "TASK-1.2", "-s", "Done");
  f.commit();
  result = f.invoke("prepare", f.context());
  assert.equal(result.value.decision, "no-work");
});

test("prepare distinguishes blocked queues, empty scopes, conflicting roles and read failures", (t) => {
  const f = fixture(t);
  f.task("Human", "--assignee", "@other");
  f.commit();
  let result = f.invoke("prepare", f.context());
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.value.decision, "blocked");
  f.backlog("task", "edit", "TASK-1", "-a", "", "--add-label", "needs-info");
  f.commit();
  result = f.invoke("prepare", f.context());
  assert.equal(result.value.decision, "blocked");
  f.config.queue.scope = { taskIds: ["TASK-999"] };
  f.write(configPath, JSON.stringify(f.config));
  f.commit();
  result = f.invoke("prepare", f.context());
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /TASK-999/);
  f.config.queue.scope = { labels: ["empty"] };
  f.write(configPath, JSON.stringify(f.config));
  f.commit();
  assert.equal(f.invoke("prepare", f.context()).value.decision, "no-work");
});

function delivery(t, { collect = false } = {}) {
  const f = fixture(t, { taskIds: ["TASK-1"] });
  f.task("Implementation");
  f.commit();
  const ctx = f.context();
  const prepared = f.invoke("prepare", ctx);
  assert.equal(prepared.status, 0, prepared.stderr);
  ctx.metadata = prepared.value.metadata;
  f.git("checkout", "-b", "candidate");
  f.write("feature.txt", "implemented\n");
  const implementationRevision = f.commit();
  const evidencePath = "acceptance/runs/TASK-1/attempt-1/checks.log";
  f.write(evidencePath, "Assertions: 1 passed\n");
  const binding = {
    version: 1,
    ticketId: "TASK-1",
    attemptId: ctx.iterationId,
    verdict: "passed",
    implementationRevision,
    artifacts: [
      {
        path: evidencePath,
        sha256: hash(readFileSync(join(f.dir, evidencePath))),
      },
    ],
  };
  const reportPath = "acceptance/reports/TASK-1-attempt-1.md",
    receiptPath = "acceptance/reports/TASK-1-attempt-1.receipt.json";
  const report = () =>
    `# Acceptance — TASK-1\n\nverdict: ${binding.verdict}\nrequired criteria: 1/1 · required gates: 1/1\n\nThe agreed check passed.\n\n\`\`\`afk-acceptance\n${JSON.stringify(binding)}\n\`\`\`\n`;
  const seal = () => {
    f.write(reportPath, report());
    f.write(
      receiptPath,
      JSON.stringify({
        ...binding,
        report: {
          path: reportPath,
          sha256: hash(readFileSync(join(f.dir, reportPath))),
        },
      }),
    );
  };
  seal();
  f.backlog("task", "edit", "TASK-1", "-s", "Done", "--check-ac", "1");
  if (collect) f.backlog("task", "complete", "TASK-1");
  f.commit();
  const artifactRoot = join(f.root, "artifacts");
  mkdirSync(artifactRoot);
  cpSync(
    join(f.dir, "acceptance/runs"),
    join(artifactRoot, "acceptance/runs"),
    { recursive: true },
  );
  const resultPath = join(f.root, "result.json");
  const output = {
    attemptId: ctx.iterationId,
    ticketId: "TASK-1",
    outcome: "completed",
    receiptPath,
  };
  const verify = () => {
    writeFileSync(resultPath, JSON.stringify({ output }));
    return f.invoke("verify", {
      ...ctx,
      worktreePath: f.dir,
      sourceBranch: "candidate",
      candidateCommit: f.git("rev-parse", "HEAD"),
      artifactRoot,
      resultPath,
    });
  };
  return {
    ...f,
    ctx,
    binding,
    output,
    reportPath,
    receiptPath,
    evidencePath,
    artifactRoot,
    seal,
    verify,
  };
}

function alterReport(f, change) {
  f.write(
    f.reportPath,
    change(readFileSync(join(f.dir, f.reportPath), "utf8")),
  );
  const receipt = JSON.parse(readFileSync(join(f.dir, f.receiptPath)));
  receipt.report.sha256 = hash(readFileSync(join(f.dir, f.reportPath)));
  f.write(f.receiptPath, JSON.stringify(receipt));
  f.commit();
}

for (const collect of [false, true])
  test(`verify accepts committed delivery with collected=${collect}`, (t) => {
    const f = delivery(t, { collect });
    const result = f.verify();
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.value.decision, "accept");
  });

for (const [name, mutate, error] of [
  [
    "old attempt",
    (f) => {
      f.output.attemptId = "old";
    },
    /attempt/i,
  ],
  [
    "wrong ticket",
    (f) => {
      f.output.ticketId = "TASK-99";
    },
    /ticket/i,
  ],
  [
    "missing receipt",
    (f) => {
      delete f.output.receiptPath;
    },
    /receipt/i,
  ],
  [
    "invalid outcome",
    (f) => {
      f.output.outcome = "no-work";
    },
    /outcome/i,
  ],
  [
    "empty artifacts",
    (f) => {
      f.binding.artifacts = [];
      f.seal();
      f.commit();
    },
    /artifact/i,
  ],
  [
    "missing artifact",
    (f) => {
      rmSync(join(f.artifactRoot, f.evidencePath));
    },
    /artifact|ENOENT/i,
  ],
  [
    "changed artifact",
    (f) => {
      writeFileSync(join(f.artifactRoot, f.evidencePath), "different");
    },
    /hash|artifact/i,
  ],
  [
    "uncommitted tracker",
    (f) => {
      f.backlog("task", "edit", "TASK-1", "-s", "To Do");
    },
    /clean|committed/i,
  ],
  [
    "tracker not terminal",
    (f) => {
      f.backlog("task", "edit", "TASK-1", "-s", "To Do");
      f.commit();
    },
    /terminal|Done/i,
  ],
  [
    "implementation drift",
    (f) => {
      f.write("feature.txt", "not accepted");
      f.commit();
    },
    /after acceptance|finalization/i,
  ],
  [
    "changed contract",
    (f) => {
      f.write("docs/agents/acceptance.md", "No checks needed");
      f.commit();
    },
    /contract/i,
  ],
  [
    "contract changed before acceptance",
    (f) => {
      f.write("docs/agents/acceptance.md", "No checks needed");
      f.binding.implementationRevision = f.commit();
      f.seal();
      f.commit();
    },
    /contract/i,
  ],
  [
    "changed ticket criteria",
    (f) => {
      f.backlog(
        "task",
        "edit",
        "TASK-1",
        "--acceptance-criteria",
        "Easier assertion",
      );
      f.backlog("task", "edit", "TASK-1", "--check-ac", "1");
      f.commit();
    },
    /contract/i,
  ],
  [
    "unchecked criteria",
    (f) => {
      f.backlog("task", "edit", "TASK-1", "--uncheck-ac", "1");
      f.commit();
    },
    /criteria|items/i,
  ],
  [
    "report disagreement",
    (f) =>
      alterReport(f, (text) =>
        text.replace("verdict: passed", "verdict: held"),
      ),
    /verdict/i,
  ],
  [
    "failed required accounting",
    (f) =>
      alterReport(f, (text) =>
        text.replace("required criteria: 1/1", "required criteria: 0/1"),
      ),
    /required|accounting/i,
  ],
  [
    "escaping evidence",
    (f) => {
      f.binding.artifacts[0].path = "../outside";
      f.seal();
      f.commit();
    },
    /path|artifact/i,
  ],
  [
    "symlink evidence",
    (f) => {
      const path = join(f.artifactRoot, f.evidencePath);
      rmSync(path);
      symlinkSync(join(f.dir, "feature.txt"), path);
    },
    /symlink/i,
  ],
  [
    "unrelated revision",
    (f) => {
      const tree = f.git("rev-parse", "HEAD^{tree}");
      f.binding.implementationRevision = f.git(
        "commit-tree",
        tree,
        "-m",
        "unrelated",
      );
      f.seal();
      f.commit();
    },
    /ancestor/i,
  ],
])
  test(`verify rejects ${name}`, (t) => {
    const f = delivery(t);
    mutate(f);
    const result = f.verify();
    assert.notEqual(result.status, 0, result.stdout);
    assert.match(result.stderr, error);
  });

for (const outcome of ["held", "incomplete"])
  test(`verify retains ${outcome} without claiming delivery`, (t) => {
    const f = delivery(t);
    f.output.outcome = outcome;
    const result = f.verify();
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.value.decision, "retain");
    assert.equal(result.value.outcome.status, outcome);
  });

test("prepare rejects malformed CLI data and unsupported cross-branch reads", (t) => {
  const f = fixture(t);
  f.task("One");
  f.commit();
  f.backlog("config", "set", "checkActiveBranches", "true");
  f.commit();
  let result = f.invoke("prepare", f.context());
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /checkActiveBranches/);
  f.backlog("config", "set", "checkActiveBranches", "false");
  f.config.tracker.command = [
    process.execPath,
    "-e",
    "console.log(process.argv[1] === 'config' ? 'false' : '{broken')",
  ];
  f.write(configPath, JSON.stringify(f.config));
  f.commit();
  result = f.invoke("prepare", f.context());
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /JSON|property/i);
});

test("verify rejects absent or malformed extracted output", (t) => {
  const f = delivery(t);
  const resultPath = join(f.root, "bad-result.json");
  const ctx = {
    ...f.ctx,
    worktreePath: f.dir,
    sourceBranch: "candidate",
    candidateCommit: f.git("rev-parse", "HEAD"),
    artifactRoot: f.artifactRoot,
    resultPath,
  };
  for (const data of ["{bad", "{}", '{"output":null}']) {
    writeFileSync(resultPath, data);
    const result = f.invoke("verify", ctx);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /JSON|property|output/i);
  }
});
