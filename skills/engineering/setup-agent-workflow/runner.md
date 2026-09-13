# Unattended execution

Project configuration consumed by the runner prompt and `implement`. Fill the entry points and transport from the actual integration; preserve customisations on reruns. This file owns the runner handoff, not the implementation or acceptance procedure.

## Entry and environment

- Runner and installed version:
- Launch command and entry script:
- Agent/provider and execution environment:
- Skill lookup/invocation in that environment:
- Workflow: `implement`; its required skills must also be available.
- Branch/merge strategy, including where held checkpoint commits land:
- Overall iteration bound and per-invocation idle/absolute/completion deadlines:

Read `docs/agents/issue-tracker.md` for tracker commands and persistence order. Include a pointer to `docs/agents/acceptance.md` for proof workflows once that file exists; otherwise list it and the missing acceptance skills as execution prerequisites below. The `implement` integration remains blocked until its required configuration and skills are available. The task/spec carries the approved acceptance contract.

## Queue

- Scope and read command/API, including pagination:
- Buildable-ticket and readiness rules, including dependency and human-prerequisite exclusions:
- Selection/claim and parent-spec lookup:
- How a failed read differs from a valid empty scope:

No eligible work with unfinished tickets in scope is a blocked queue. Queue exhaustion means a successful read found no remaining work in scope.

## Per-attempt result

Bind the following semantics to the actual structured-output or file transport and its validator. Record the exact schema/tag/path here so the prompt, `implement`, and entry script agree. The host supplies a fresh attempt ID and selected ticket; agent output identifies that attempt/ticket, artifact references and unresolved steps. For native Sandcastle, read the appended iteration-context JSON and use the installed workflow schema/receipt protocol. The host owns no-work/blocked queue decisions; the agent does not select another ticket or declare exhaustion.

| Outcome | Meaning | Default runner action |
| --- | --- | --- |
| `completed` | Required acceptance passed, tracker finalization succeeded, and required work/artifacts are durable | Independently check persistence/cleanup, then allow another eligible ticket |
| `held` | Required acceptance or preparation could not pass; work and blockers were preserved, ticket remains open | Stop and report next actions |
| `incomplete` | Finalization, artifact persistence, or another required execution step failed | Stop and report recovery references |


Host queue outcomes: `no-work` follows a successful complete scope read with nothing remaining; `blocked` means unfinished but ineligible work and carries blockers. `iteration-limit` is distinct from both.

- Authoritative committed configuration path and installed shared command/helper paths:
- Actual result schema and transport:
- Host validation before merge, followed by destination/cleanup/record confirmation:
- Any explicitly agreed continuation-policy override:

Missing, invalid, stale, or contradictory results stop the run. A preserved/dirty worktree, failed commit/merge/cleanup, or unreadable required artifact stops it even if the agent reports `completed`. A process exit or stop token alone is not an accepted result.

## Durable artifacts and recovery

- Plan/report paths and their Git persistence:
- Relative evidence paths exported from each task worktree and their persistent host root:
- Runner preparation/outcome/error record and raw/validated result paths outside disposable worktrees:
- How to retrieve evidence after worktree removal:
- How to inspect retained worktrees/commits and explicitly resume after resolving the cause:

Preserve retained work when saving it fails. This configuration does not authorize deleting leftovers during setup or silently retrying held work.

## Verification and outstanding preparation

- Integration: `verified` / `unverified` / `blocked`, with date, tested entry/version, and evidence:
- Queue at last check: `ready` / `empty` / `blocked` / `unknown`, with scope and outstanding ticket IDs:
- Remaining environment, acceptance-contract, or capability preparation, and the next check/action:

These are observations from setup, not permanent guarantees. The runner rechecks its prerequisites and each attempt's result when launched. Configuration can be complete while execution still needs preparation.
