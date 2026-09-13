# Sandcastle native workflow

Read after [unattended execution](unattended-execution.md) when Sandcastle is present or selected. Inspect the installed package exports/types/templates. This integration requires `WORKFLOW_PROTOCOL_VERSION === 1`, `preparation`, `verification`, `iterationOutput`, artifact export and confirmed cancellation. The original official 0.12.0 lacks this protocol; a version string alone cannot distinguish it from a compatible local fork artifact. Report an upgrade/preparation gap before agent invocation when capabilities are missing. Do not generate a per-project outer loop as a fallback.

Use the published `@fly4ai/sandcastle` ([source](https://github.com/yyyyyyyyyunf/sandcastle)), this workflow's maintained fork. Version selection belongs to the project's dependencies and lockfile. For npm:

```sh
npm install --save-dev @fly4ai/sandcastle
npx @fly4ai/sandcastle init --help
```

Use the project's chosen package-manager equivalent when applicable. Imports omit the version: `@fly4ai/sandcastle` and `@fly4ai/sandcastle/sandboxes/no-sandbox`. Keep capability checks for the published package, local tarballs and other explicitly selected compatible builds.

## Initialize or migrate

For first use, run `npx @fly4ai/sandcastle init` with the selected non-interactive flags from its help (or the equivalent command for an explicitly selected build). A blank scaffold and Custom tracker suit Backlog. If the selected third-party agent or provider is absent from the menu, placeholder scaffold selections are acceptable without execution or image building; immediately replace the active wiring with the selected adapter, model/auth and provider before any run. Initialization, dependency/image preparation and live execution are separate steps.

For a rerun, follow package scripts to the actual entry and every referenced prompt. `sandcastle init` rejects an existing `.sandcastle/`; do not delete logs or retained work to make it run. Edit active configuration in place, preserving model/auth choices, useful hooks, limits and project acceptance requirements. Retire active references to a bespoke AFK loop/reaper/checker after wiring the native entry. Historical scripts and records can remain inactive for review; migration does not execute cleanup or replay their real queue.

Resolve the selected agent's existing adapter package from project dependencies, a supplied installation or its primary documentation. If it is unavailable, record the dependency preparation needed; do not implement a new project-specific adapter as a setup workaround. For Kimi, the existing `sandcastle-agent-kimi` package supplies `kimiCode`. Preserve the selected host OAuth alias or API-key channel when constructing it.

Inspect the installed Kimi adapter's manifest and type imports. If it still expects `@ai-hero/sandcastle`, satisfy that peer name with an npm alias targeting the project's resolved `@fly4ai/sandcastle` version, alongside the direct fork dependency. Keep both resolutions aligned in the project lockfile. This alias installs the fork under the peer's expected name; it is only needed while the adapter uses that name.

## One project configuration, installed shared checks

Read [workflow-protocol.md](workflow-protocol.md). Its committed `.sandcastle/workflow.json` owns queue/contract parameters. Add a `runner` section:

```json
{
  "runner": {
    "promptFile": ".sandcastle/prompt.md",
    "skillsRoot": "/absolute/installed/skills",
    "branchStrategy": "merge-to-head",
    "maxIterations": 10,
    "idleTimeoutSeconds": false,
    "executionTimeoutSeconds": 3600,
    "completionTimeoutSeconds": 60,
    "commandTimeoutSeconds": 30,
    "artifactRoot": ".sandcastle/evidence"
  }
}
```

These are example values; retain the project's chosen finite limits. Paths inside the project are relative, `skillsRoot` is absolute. Include the actual entry, prompt, project acceptance document and Backlog config in `contractPaths`. Keep `.sandcastle/evidence/`, `.sandcastle/logs/`, `.sandcastle/worktrees/` and the configured evidence roots gitignored. Commit the configuration and contract before launch.

Use the installed [workflow-run.mjs](../scripts/workflow-run.mjs) `workflowRunOptions({ sandcastle, sandbox, cwd, configPath })` to bind that configuration to a native call. This helper reads committed settings, verifies host skill/script/prompt availability, rejects incompatible settings and stops for leftovers under `.sandcastle/worktrees/`. Skill resources use relative inline Markdown links; startup follows those links transitively, so missing required references fail before invocation. It returns options; it never calls `run`, chooses a task, mutates Git or cleans worktrees. The installed `workflow.mjs` commands own queue selection and completion verification. Projects do not copy their source.

The shared startup helper currently verifies the host `noSandbox` path. A container requires actual in-container skill/reference availability and separately proven path mapping; a host symlink is insufficient. Record that preparation gap instead of enabling a host-path configuration inside a container.

## Native entry and prompt

Keep the project's native entry small: import the installed Sandcastle namespace, selected agent adapter and noSandbox provider; import `workflowRunOptions` through its setup-resolved installed absolute path; derive the repository root from the entry's `import.meta.url`; then call `sandcastle.run({ ...workflowRunOptions(...), agent: selectedAgent })`. Preserve the existing agent construction and authentication channel. Print the run's stop reason and recovery record path; do not add another loop or catch-and-continue handler. The official blank template uses a top-level awaited `run()`; use the project's chosen Node/tsx command for its actual `.mjs`/`.mts` entry.

`workflowRunOptions` supplies an absolute `promptFile`, the `IMPLEMENT_SKILL` prompt argument, shared preparation/verification argv, `Output.object` with the installed workflow schema, zero extraction retries, explicit merge strategy, limits and artifact export. `.sandcastle/prompt.md` is not auto-discovered. Existing project-specific prompt arguments or restrictions must be retained when adapting the entry and prompt; avoid overriding the host-generated attempt/ticket identity.

The prompt should:

1. Read repository instructions and `docs/agents/runner.md`/`issue-tracker.md`/`acceptance.md`.
2. Read the appended `<sandcastle-iteration-context>` JSON. Use its `iterationId` as the attempt ID, its metadata's selected ticket and frozen contract, and its actual worktree/source/target paths. The host has already selected the task; do not choose another ticket or report queue exhaustion from the agent.
3. Explicitly read and follow `{{IMPLEMENT_SKILL}}` for that ticket and its parent context. Keep implementation, review, acceptance and finalization ordering in that skill. Resolve its required subskills in the same environment, including independent review/judgement capabilities. Install complete skill directories and referenced resources, not isolated SKILL.md copies.
4. After finalization, emit `<workflow-result>` with the shared completed/held/incomplete schema. Write evidence under the configured relative evidence paths in the task worktree; Sandcastle copies those paths into the handoff's artifact root before checking/cleanup. Use the shared report/receipt binding. The completion token is optional shutdown guidance, never acceptance or an empty-queue verdict.

A completed result passes schema extraction, shared verification and a checked fast-forward before the next preparation. Held/incomplete retains the source and stops. Invalid results, command errors and failed persistence stop with recovery references. `no-work`/`blocked` are host preparation decisions; `iteration-limit` means the configured bound was reached. `RunResult.preparation` carries a terminal queue decision and its metadata. Read `<runner.artifactRoot>/<run-id>/run.json`, per-iteration raw/validated results and retained paths to investigate; setup does not silently restart held work.

## Verify generated configuration

Exercise the generated entry with a fake agent/executor and temporary Git/Backlog fixtures. Assert the installed shared path and native option bindings, missing-capability failure before invocation, observable stop behavior and preservation of historical artifacts. Include a copy of an existing configuration to verify model/auth and acceptance choices survive migration. Core process/merge checks belong to Sandcastle's tests; do not recreate that engine in the project.

Separately check real executor skill/reference access, tracker CLI and required proof tools. Record resolved executable paths and versions in the actual launch environment; a different shell's PATH can select another Kimi or Node installation. Use a bounded environment probe only within the authorized environment. Do not launch a real project queue as a setup smoke test. A runnable configuration can remain `unverified` until its environment proof runs; record exactly which check is missing. The final temporary Kimi trial proves actual authentication and task execution, not just file existence.
