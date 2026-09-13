# Shared unattended workflow protocol

Use this reference for the native Sandcastle + Backlog integration. It owns the machine contract shared by setup, `implement`, `acceptance` and the installed commands. Other trackers keep their existing manual workflow; automated verification for them is not implemented here.

The project commits one configuration, normally `.sandcastle/workflow.json`. Sandcastle invokes the installed `scripts/workflow.mjs` with argv:

```text
node <installed-setup-agent-workflow>/scripts/workflow.mjs prepare --config .sandcastle/workflow.json
node <installed-setup-agent-workflow>/scripts/workflow.mjs verify --config .sandcastle/workflow.json
```

The commands read JSON stdin, write exactly one JSON stdout value and use nonzero exit for invalid inputs or failed reads. They do not run agents, claim tasks, merge, clean worktrees or retry. Sandcastle owns that lifecycle and bounds command execution. Keep the complete skill directory installed; the entry imports its sibling modules.

## Project configuration

```json
{
  "version": 1,
  "tracker": { "type": "backlog", "command": ["backlog"], "directory": "backlog" },
  "queue": {
    "scope": { "labels": ["afk-trial"] },
    "actor": "@me",
    "readyLabel": "ready-for-agent",
    "conflictingLabels": ["needs-triage", "needs-info", "ready-for-human", "wontfix"],
    "excludeLabels": ["spec", "wayfinder:map"],
    "readyStatuses": ["To Do"],
    "doneStatuses": ["Done"]
  },
  "contractPaths": ["docs/agents/acceptance.md", "backlog/config.yml", ".sandcastle/main.mjs", ".sandcastle/prompt.md"],
  "reportRoot": "acceptance/reports",
  "evidenceRoots": ["acceptance/runs"]
}
```

Substitute actual status/label vocabulary, CLI argv and paths. Scope has exactly one of `labels` (all match), `taskIds`, or `parentTaskId` (direct children). Scope labels describe the work, independently of triage readiness. Otherwise an unfinished ticket losing its ready label could falsely make the queue look empty. All scoped unfinished leaves count; parent specs/maps and tasks with children are excluded. An eligible leaf has the ready label, no conflicting role, an allowed status, no other assignee, nonempty acceptance criteria and Backlog's detailed dependency readiness. Selection is stable numeric ticket-ID order.

Backlog must use `checkActiveBranches: false` and `remoteOperations: false`; automatic decisions read the local committed checkout. `task list` does not contain dependencies, so the command reads task and dependency detail and checks committed files. For label/parent scopes, it reconciles the CLI list with Git’s task-file inventory: malformed YAML silently omitted by Backlog is a read error. Task directories must use the CLI-generated `<id> - <title>.md` naming. `Done` is terminal in either `tasks/` or `completed/`. Collection is maintenance, not an extra completion requirement.

`contractPaths` lists the existing approved project acceptance rules, relevant tracker configuration and actual native entry/prompt paths. These files and the workflow configuration are frozen by their committed bytes at the target revision. The selected ticket, its direct dependencies and parent chain also carry contract hashes: title, description, criteria, definition of done, dependencies and references. Claims, notes, checked boxes and terminal status can change; changing the agreed contract requires a new prepared attempt.

For native startup, add the `runner` settings and installed `workflowRunOptions` binding described in [Sandcastle setup](sandcastle.md#one-project-configuration-installed-shared-checks). The helper returns native options; it does not execute the queue. Keep agent/model/auth construction in the project entry. The shared commands also accept this configuration's extra `runner` section, which is frozen with the other configuration bytes.

## Host handoff and decisions

Prepare input contains `version: 1`, a fresh `iterationId`, `hostRepoDir`, `targetBranch` and the full `targetCommit`. It returns `version: 1`, `decision: run | no-work | blocked`, and opaque `metadata`. A run includes `ticketId`, `taskPath` and frozen contract bindings. Blocked includes the remaining ticket IDs and reasons. A failed read is an error, never an empty queue.

Sandcastle appends one `<sandcastle-iteration-context>` JSON handoff after resolving the project prompt. It carries that exact metadata, the preparation context, actual `worktreePath`/`sandboxRepoDir`, `sourceBranch`, durable per-iteration `artifactRoot` and `outputTag`. The agent works only on the selected ticket. Its attempt ID is the host's `iterationId`; it does not generate or recycle one. Evidence is written at configured relative paths in the worktree, then exported by Sandcastle before verification and cleanup; the agent must not invent a host artifact path.

Verify receives the same metadata plus `worktreePath`, `sourceBranch`, `candidateCommit`, durable `artifactRoot` and `resultPath`. Sandcastle's structured extractor writes the per-iteration object at `result.output`. The shared checker does not scrape stdout tags.

Use the installed `scripts/workflow-output.mjs` export `workflowOutputSchema` as the Standard Schema for native `iterationOutput: Output.object({ tag: "workflow-result", schema: workflowOutputSchema, maxRetries: 0 })`. The prompt instructs the agent to put the following object inside `<workflow-result>…</workflow-result>`; the checker uses the same schema. Do not copy a project-specific validator or use the legacy single-result `output` option for this queue.

```json
{
  "attemptId": "<host iterationId>",
  "ticketId": "TASK-1",
  "outcome": "completed",
  "receiptPath": "acceptance/reports/TASK-1-<attempt>.receipt.json"
}
```

`held` and `incomplete` use the same identities, their outcome and a nonempty `unresolved` list containing reasons and next actions; they return `retain` and stop. Only a verified `completed` returns `accept`. Queue `no-work`/`blocked` belong to host preparation, not the agent's per-ticket output. Malformed, missing, stale or contradictory completion data is an error with preserved recovery references.

## Acceptance report and receipt

During unattended acceptance, record the full implementation revision actually judged. It includes executable test specs and required plans; commit them before collecting the final evidence. Complete the existing acceptance report with its required criterion/gate accounting. Its verdict line is exactly one `verdict: passed` or `verdict: held`. For completed delivery, write exactly one `code state: <full Git SHA>` line matching `implementationRevision`, with no uncommitted changes or extra annotation.

Keep the standard `required criteria: <passed>/<total> · required gates: <passed>/<total>` line. Completed delivery requires at least one criterion and all required criteria/gates passed. The host rejects missing or contradictory accounting without rejudging the individual assertions.

Append one `afk-acceptance` JSON fence. This is a binding of the report's judgement, not a replacement for the report:

````markdown
```afk-acceptance
{
  "version": 1,
  "ticketId": "TASK-1",
  "attemptId": "<host iterationId>",
  "verdict": "passed",
  "implementationRevision": "<full Git SHA>",
  "artifacts": [
    { "path": "acceptance/runs/TASK-1/<attempt>/checks.log", "sha256": "<SHA-256 of exact file bytes>" }
  ]
}
```
````

List every required evidence file, with paths relative to the candidate worktree and within configured evidence roots. The set must be nonempty. Archive actual observations, not just commands planned or a success sentence. Hash exact file bytes with SHA-256. Missing, changed, duplicate, escaping or symlink references fail verification. Sandcastle snapshots the configured evidence directories before checking; the checker reads that durable snapshot.

Write `<report-name>.receipt.json` beside the report. It contains all fields from the JSON fence, plus:

```json
{
  "report": {
    "path": "acceptance/reports/TASK-1-<attempt>.md",
    "sha256": "<SHA-256 of the final Markdown report bytes>"
  }
}
```

The report does not contain its own hash. The receipt is committed with the report and tracker finalization. Emit the final structured result after that commit and a clean-worktree check; it points to the receipt. This avoids a circular dependency on the final commit's SHA.

After the implementation revision, only the selected task's old/new path and these exact report/receipt files may change. Updating another task, a plan, source, test or acceptance configuration requires a new implementation checkpoint and acceptance of that state. `implementationRevision` must be an ancestor of the candidate, not merely an object present somewhere in Git.

The host checks identity, committed tracker terminal state and checked criteria, frozen contracts, ancestry, finalization diff, report agreement and readable hashed evidence. The acceptance skill remains responsible for whether the agreed proof really passed. A structurally valid receipt alone is not product acceptance.
