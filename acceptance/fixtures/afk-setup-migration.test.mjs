import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";

test("a historical configuration copy migrates to native startup while preserving auth, acceptance and recovery inputs", async () => {
  const source = realpathSync(process.env.AFK_DEMO_SOURCE);
  const forward = realpathSync(process.env.AFK_FORWARD_PROJECT);
  const dist = realpathSync(process.env.AFK_SANDCASTLE_DIST);
  const root = mkdtempSync("/private/tmp/afk-setup-migration-");
  const cwd = join(root, "repo");
  mkdirSync(cwd);
  const write = (relative, bytes) => {
    const path = join(cwd, relative);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, bytes);
  };
  const hash = (path) =>
    createHash("sha256").update(readFileSync(path)).digest("hex");
  const copied = [
    "package.json",
    ".gitignore",
    ".sandcastle/.gitignore",
    ".sandcastle/main.mts",
    ".sandcastle/prompt.md",
    "scripts/afk-run.mjs",
    "docs/agents/acceptance.md",
    "docs/agents/runner.md",
    "docs/agents/issue-tracker.md",
    "backlog/config.yml",
    "scripts/.afk-runs/afk-2026-09-12T14-58-36-415Z-3-940300.json",
    "acceptance/runs/task-1.1/2026-09-12T14-32-04-813Z/build.txt",
  ];
  const sourceHashes = new Map(
    copied.map((path) => [path, hash(join(source, path))]),
  );
  for (const path of copied) write(path, readFileSync(join(source, path)));
  write(
    ".sandcastle/logs/migration-sentinel.log",
    "Historical-log sentinel: migration must preserve it.\n",
  );
  write(
    ".sandcastle/worktrees/retained/unsaved.txt",
    "Synthetic retained work: do not delete.\n",
  );
  const immutable = [
    "scripts/afk-run.mjs",
    "docs/agents/acceptance.md",
    "scripts/.afk-runs/afk-2026-09-12T14-58-36-415Z-3-940300.json",
    "acceptance/runs/task-1.1/2026-09-12T14-32-04-813Z/build.txt",
    ".sandcastle/logs/migration-sentinel.log",
  ];
  const originalHashes = new Map(
    immutable.map((path) => [path, hash(join(cwd, path))]),
  );
  const env = {
    ...process.env,
    BACKLOG_CWD: cwd,
    GIT_CONFIG_GLOBAL: join(root, "gitconfig"),
  };
  delete env.KIMI_API_KEY;
  writeFileSync(env.GIT_CONFIG_GLOBAL, "");
  const git = (...args) =>
    execFileSync("git", args, {
      cwd,
      env,
      encoding: "utf8",
      stdio: "pipe",
    }).trim();
  git("init", "-b", "main");
  git("config", "user.name", "Migration proof");
  git("config", "user.email", "migration@example.invalid");
  git("add", ".");
  git("commit", "-m", "historical configuration copy");
  const initialRevision = git("rev-parse", "HEAD");
  const old = await import(pathToFileURL(join(cwd, "scripts/afk-run.mjs")));

  // Apply the independently generated setup's native prompt and shared settings.
  cpSync(
    join(forward, ".sandcastle/prompt.md"),
    join(cwd, ".sandcastle/prompt.md"),
  );
  const config = JSON.parse(
    readFileSync(join(forward, ".sandcastle/workflow.json")),
  );
  config.queue.scope = { labels: ["migration-proof-empty"] };
  config.contractPaths = [
    "docs/agents/acceptance.md",
    "backlog/config.yml",
    ".sandcastle/main.mjs",
    ".sandcastle/prompt.md",
  ];
  config.runner.idleTimeoutSeconds = 3600; // Preserve the historical silent-work setting.
  config.runner.executionTimeoutSeconds = 3600;
  write(".sandcastle/workflow.json", JSON.stringify(config, null, 2));
  const helper = join(
    config.runner.skillsRoot,
    "setup-agent-workflow/scripts/workflow-run.mjs",
  );
  const entry = `import * as sandcastle from ${JSON.stringify(join(dist, "index.js"))};
import { noSandbox } from ${JSON.stringify(join(dist, "sandboxes/no-sandbox.js"))};
import { kimiCode } from ${JSON.stringify(join(source, "node_modules/sandcastle-agent-kimi/dist/index.js"))};
import { workflowRunOptions } from ${JSON.stringify(helper)};
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const cwd = fileURLToPath(new URL('../', import.meta.url));
const envFile = new URL('.env', import.meta.url);
if (existsSync(envFile)) process.loadEnvFile(envFile);
const apiKey = process.env.KIMI_API_KEY;
export const agentOptions = apiKey ? { model: 'kimi-for-coding', apiKey } : { model: 'kimi-code/k3' };
const result = await sandcastle.run({ ...workflowRunOptions({ sandcastle, sandbox: noSandbox(), cwd, configPath: '.sandcastle/workflow.json' }), agent: kimiCode(agentOptions) });
export { result };
console.log(JSON.stringify({ stopReason: result.stopReason, runRecordPath: result.runRecordPath, iterations: result.iterations.length }));
`;
  write(".sandcastle/main.mjs", entry);
  write(".sandcastle/main.mts", "import './main.mjs';\n");
  const packageJson = JSON.parse(readFileSync(join(cwd, "package.json")));
  packageJson.scripts.afk = "node .sandcastle/main.mjs";
  write("package.json", JSON.stringify(packageJson, null, 2));
  write(
    ".gitignore",
    readFileSync(join(cwd, ".gitignore"), "utf8") + "\n.sandcastle/evidence/\n",
  );
  write(
    "docs/agents/runner.md",
    readFileSync(join(forward, "docs/agents/runner.md"), "utf8") +
      "\nMigration: historical acceptance requirements remain in docs/agents/acceptance.md. Idle and absolute limits are 3600 seconds. Authentication preserves shell/.sandcastle/.env API key or the host OAuth alias. Old scripts/.afk-runs and evidence are retained history.\n",
  );
  // Local-only reads are mandatory for the migrated native checker.
  for (const key of ["checkActiveBranches", "remoteOperations"])
    execFileSync("backlog", ["config", "set", key, "false"], {
      cwd,
      env,
      stdio: "pipe",
    });
  git("add", ".");
  git("commit", "-m", "configure native workflow");
  assert.equal(git("status", "--porcelain"), "");
  const stopped = spawnSync(process.execPath, [".sandcastle/main.mjs"], {
    cwd,
    env,
    encoding: "utf8",
    timeout: 30_000,
  });
  assert.notEqual(stopped.status, 0);
  assert.match(stopped.stderr, /retained|orphaned/);
  assert.equal(
    readFileSync(
      join(cwd, ".sandcastle/worktrees/retained/unsaved.txt"),
      "utf8",
    ),
    "Synthetic retained work: do not delete.\n",
  );
  // The test owner preserves the synthetic recovery input outside the launch root.
  // This is an explicit fixture operation, not automatic startup cleanup.
  renameSync(
    join(cwd, ".sandcastle/worktrees/retained"),
    join(root, "retained"),
  );
  for (const apiKey of [undefined, "fixture-noncredential"]) {
    if (apiKey) write(".sandcastle/.env", `KIMI_API_KEY=${apiKey}\n`);
    const expected = old.planKimiAuth({
      apiKey,
      credentialsDir: "fixture-host-credentials",
    }).agentOptions;
    const probe = `import assert from 'node:assert/strict'; const m = await import('./.sandcastle/main.mjs'); assert.deepEqual(m.agentOptions, ${JSON.stringify(expected)}); assert.equal(m.result.stopReason, 'no-work'); assert.equal(m.result.iterations.length, 0); console.log('AUTH_AND_EMPTY_QUEUE_VERIFIED');`;
    const output = execFileSync(
      process.execPath,
      ["--input-type=module", "-e", probe],
      { cwd, env, encoding: "utf8", stdio: "pipe", timeout: 30_000 },
    );
    assert.match(output, /AUTH_AND_EMPTY_QUEUE_VERIFIED/);
    const result = JSON.parse(
      output.split("\n").find((line) => line.startsWith('{"stopReason"')),
    );
    const record = JSON.parse(readFileSync(result.runRecordPath));
    assert.equal(record.iterations.length, 0);
    assert.equal(record.preparations[0].decision.decision, "no-work");
    console.log(
      JSON.stringify({
        authMode: apiKey ? "api-key-file" : "oauth-host",
        ...result,
      }),
    );
  }
  for (const [path, digest] of originalHashes)
    assert.equal(hash(join(cwd, path)), digest, path);
  for (const [path, digest] of sourceHashes)
    assert.equal(hash(join(source, path)), digest, `source changed: ${path}`);
  assert.equal(
    readFileSync(join(root, "retained/unsaved.txt"), "utf8"),
    "Synthetic retained work: do not delete.\n",
  );
  assert.equal(git("status", "--porcelain"), "");
  console.log(
    JSON.stringify({
      project: cwd,
      initialRevision,
      migratedRevision: git("rev-parse", "HEAD"),
      preservedFiles: Object.fromEntries(originalHashes),
      sourceUnchanged: true,
      realAgentCalls: 0,
    }),
  );
});
