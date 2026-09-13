#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { check, clean, loadConfig } from "./workflow-io.mjs";
import { prepare } from "./workflow-backlog.mjs";
import { verify } from "./workflow-verify.mjs";

try {
  const [operation, flag, configPath, ...extra] = process.argv.slice(2);
  check(
    ["prepare", "verify"].includes(operation) &&
      flag === "--config" &&
      configPath &&
      !extra.length,
    "Usage: node workflow.mjs prepare|verify --config <committed-project-json>",
  );
  const input = readFileSync(0, "utf8");
  check(Buffer.byteLength(input) <= 1024 * 1024, "Host context exceeds 1 MiB");
  const ctx = JSON.parse(input);
  const config = loadConfig(ctx, configPath);
  if (operation === "prepare") clean(ctx.hostRepoDir);
  const result =
    operation === "prepare"
      ? prepare(ctx, config, configPath)
      : verify(ctx, config);
  process.stdout.write(JSON.stringify(result) + "\n");
} catch (error) {
  process.stderr.write(
    `Workflow ${process.argv[2] ?? "command"} failed: ${error.message}\n`,
  );
  process.exitCode = 1;
}
