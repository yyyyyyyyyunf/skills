# Unattended execution

Read when setup finds an active runner or the user selects one. This guide connects project configuration to an execution loop; manual use of the engineering skills needs none of it.

## Discover and draft

Follow the actual launch command through its entry script, prompts, hooks, and imported package version. Read the installed API and template before adapting them. For Sandcastle, use [the adapter guide](sandcastle.md). Other runners can use their native result and lifecycle mechanisms to satisfy the same project contract.

Keep existing choices for agent, model, sandbox, dependency preparation, branch strategy, iteration limits, and project-specific restrictions unless a change is required and included in the draft. A logs directory alone is not a configured runner. When there is no runner, initialise one only when the user has selected it; reuse the vendor's initializer where available.

Draft [runner.md](../runner.md) as `docs/agents/runner.md`. Record actual entry points and result transport, not a second implementation workflow. Responsibilities:

- The runner chooses from the configured queue, starts an attempt, and decides whether another attempt may begin.
- Its task prompt loads and follows the installed `implement` skill for one selected ticket, with the ticket/spec context and a fresh attempt ID.
- `implement` performs planning, implementation, review, acceptance, and tracker finalization. Tracker persistence order comes from `docs/agents/issue-tracker.md`; proof requirements come from the project acceptance configuration and approved ticket.

Check skill resolution in the environment that actually executes the task, including required subskills and independent review/judgement capabilities. Host installation or a host symlink does not establish container availability. Preserve harness invocation metadata; when a Skill tool cannot invoke a user-invoked skill, the runner's user prompt must explicitly instruct the agent to read and follow its installed `SKILL.md`. Resolve the path in that environment. Missing skills remain a preparation gap; do not silently fall back to the vendor's generic workflow.

## Migrate existing projects

Find workflow and acceptance rules duplicated in prompts, agent instructions, tracker docs, and active parent specs. Replace duplicated process steps with pointers to their owners. Keep project requirements there until their intended meaning is settled. Examples of conflicts to resolve include single-commit instructions alongside checkpoint commits, closing local tickets after the final commit, and skipping all acceptance for new behaviour without a historical baseline.

Inspect the existing open tickets in the selected queue against the shared acceptance contract when that integration is used. Reuse outcomes and proof already agreed in ticket/spec/project docs; only missing decisions require user input. Include concrete contract and readiness corrections in the setup draft, and apply approved corrections through the tracker. Do not require recreating tickets or reopening settled product design.

Bind prerequisites to the actual executor. A ticket that requires a browser provider unavailable there stays ineligible until an allowed equivalent exists, the capability is prepared, or a user-approved contract change is recorded. A ticket may still create its own app, fixture, or selected testing entry point. Distinguish that in-scope preparation from unavailable credentials, an unknown standard, or a required human approval.

The queue reader must preserve these distinctions:

- Select only approved buildable tickets, with completed blockers and no outstanding human prerequisite or conflicting triage role. Parent specs are context unless explicitly planned as executable work.
- Define queue scope independently of eligibility. No eligible ticket with unfinished work in scope means `blocked`; a successfully read scope with no remaining work means `no-work`.
- Use the tracker's actual statuses, labels, dependency semantics, and pagination. Keep dependency data available or fetch it before selection.
- A failed command, malformed response, or incomplete read is an error. Validate every stage of a shell pipeline; never convert its failure into an empty list.

## Results, persistence, and continuation

Use the result semantics in the runner seed. Bind each result to a fresh attempt ID and its selected ticket; validate the payload at runtime. Prefer a runner's structured-output facility or a fresh result file with an explicit schema over matching prose in a session log. A successful agent process or a stop token alone does not prove delivery completion.

After an attempt, the default policy starts another only after `completed`, successful finalization, and successful runner cleanup. `held`, `incomplete`, a missing/invalid result, or a preserved worktree stops the run for inspection. `no-work` ends normally; a wholly `blocked` queue ends with its blockers reported. Keep retries bounded within the implementation/acceptance workflow; do not automatically restart a held ticket in fresh worktrees. A project-specific continuation policy must be explicitly agreed and still stop on persistence, merge, cleanup, or result-validation failures.

Reaching the overall iteration bound ends the run with that reason; it does not establish queue exhaustion or turn the last completed ticket into an all-work-done claim.

Inspect persistence independently where the runner can: local tracker/report changes must have reached the destination branch; a remote tracker must confirm the required state. Required artifact references must remain readable. Reject a completed result that contradicts those checks. A stopping decision is separate from the branch strategy: committed work from a held attempt may already have merged under `merge-to-head`. Preserve the selected strategy and report what landed.

Store required evidence outside disposable worktrees, or copy it before cleanup. Gitignored evidence inside a clean worktree is still deleted with that worktree. Declare a persistent artifact root and expose only that destination to the execution environment; align report references and project acceptance paths with it. Use a documented lifecycle point or a persistent mount/path, and prove retrieval after cleanup. When durable storage is unavailable, report the limitation and hold affected delivery rather than claiming the evidence is preserved.

Keep existing leftovers visible during setup. Automatic cleanup must retain work whenever saving it fails; a failed salvage commit is not proof that there was nothing to save. Migrating configuration does not authorize deleting retained worktrees, refs, or evidence. Resolve unsafe cleanup paths in the approved runner changes before enabling the loop.

## Verify the adapter

Verify generated or modified adapters with a fake task executor and temporary repositories/fixtures first. Exercise observable continuation, persistence, and cleanup, rather than matching instruction text. Run the project's relevant checks for any added executable code.

| Scenario | Required observation |
| --- | --- |
| Completed ticket, persisted tracker/report, readable evidence | A second eligible ticket can start; the first is not selected again |
| Acceptance passed but tracker close/commit failed | Incomplete result; no next attempt |
| Required proof held, with notes committed and worktree clean | Ticket stays open; the default loop stops |
| Agent exits normally with a dirty/preserved worktree | No new worktree is allocated for another attempt |
| Agent, merge, cleanup, or artifact persistence fails | Error and recovery references survive; no automatic next attempt |
| Missing, malformed, or previous-attempt result | Rejected; no next attempt |
| No work versus unfinished but ineligible tickets | Distinct terminal outcomes |
| Tracker query fails | Failure, never empty-queue success |
| Clean worktree removed | Required evidence remains retrievable at report references |

Check the actual execution environment separately: skills are readable, queue commands work, selected tools are available or assigned to feasible preparation, and the result channel is supported. When available within the user's authorized environment, use a bounded probe to read the installed workflow and return a result without selecting or modifying real tickets. Do not start the live queue as a setup smoke test.

Report integration `verified` only when the adapter scenarios and actual environment checks passed. Otherwise record `unverified` or `blocked` with the missing check or preparation. Queue readiness is separate: a verified runner may have an empty or blocked queue, and a ticket can be ready while the runner environment still needs preparation. Setup can finish recording those gaps without claiming unattended execution is ready.
