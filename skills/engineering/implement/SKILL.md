---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
disable-model-invocation: true
---

Implement the work described by the user in the spec or tickets.

Inspect the initial working-tree changes so you can distinguish existing work from this task's changes, and record the starting commit for review. When working from a ticket, read `docs/agents/issue-tracker.md` for its operations and persistence rules.

When invoked by an unattended runner, read its supplied handoff and `docs/agents/runner.md` for the attempt ID, result transport, and durable artifact locations. Use that protocol after finalization; acceptance's verdict alone does not declare successful task persistence or authorize another iteration. Missing required handoff configuration is an incomplete attempt to report, not permission to improvise a success signal.

For the shared Backlog workflow, read [its protocol](../setup-agent-workflow/references/workflow-protocol.md). Work on the host-selected ticket and retain its attempt identity. Commit plans and test specs with the implementation state that acceptance judges. After acceptance, limit finalization to this ticket and its report/receipt; any additional implementation change requires acceptance of the new state.

Before touching any code, call the Skill tool with "acceptance-plan" to bind the agreed contract and capture any required pre-change baseline. Read its readiness result. If it is `held`, record the blockers and go directly to finalization below, preserving the planning record without starting implementation.

When ready, call the Skill tool with "tdd" where appropriate at the pre-agreed seams. Create or update any executable test specs the contract requires, following the project's conventions and execution entry points. Complete preparation assigned to this ticket and record capabilities it actually establishes in the project acceptance configuration.

Run focused checks while working and the project/ticket's required engineering gates before completion. A test script's successful exit is useful only with evidence that the expected assertions actually ran.

Commit an implementation checkpoint, then call the Skill tool with "code-review", supplying the recorded starting commit as the fixed point and the current ticket/spec reference and content. Reuse the task context already read. Its branch diff must include the implementation being reviewed. Resolve findings and commit review fixes before acceptance; the checkpoint is not a declaration that the ticket is complete.

Then call the Skill tool with "acceptance" to execute the plan and return its verdict and report path. Review findings are cheaper to act on before evidence is collected. Only a `passed` verdict permits completed-ticket updates; a `held` report is a handoff with outstanding work.

## Finalization

Persist the work to the current branch, including plans, executable test specs, reports, and tracker records. For a passed ticket, complete its tracker updates. Otherwise leave it open and record the blocker/failure, artifact links, and next actions. Follow `docs/agents/issue-tracker.md` for the required order of updates and commits. On a held attempt, return that outcome after preserving the records; dependent tickets remain blocked.

After all tracker updates and commits, inspect `git status --short`. Commit any remaining changes belonging to this task and check again. Preserve unrelated changes and report any that remain. If a required tracker update or commit fails, or task changes remain uncommitted, report the task's completion as incomplete with the remaining steps and paths; a successful code commit alone is not successful completion.

For an unattended attempt, emit its configured result only after these checks and after required artifacts are durable beyond worktree cleanup. Include the current attempt and ticket IDs, verdict/report references, and unresolved steps. If the protocol writes a result file into the repo, persist that write and recheck the worktree before finishing; prefer the configured output channel when available. Let the runner perform its own completion and continuation checks.
