# Sandcastle adapter

Read after [unattended execution](unattended-execution.md) when Sandcastle is present or selected. Adapt the installed version. The findings below were checked against `@ai-hero/sandcastle` 0.12.0; inspect its local package exports/types/templates and consult the [official documentation](https://github.com/mattpocock/sandcastle) for APIs that differ.

## Reuse initialization

For an existing integration, follow package scripts to the real entry file and every referenced prompt. Edit in place after the setup draft; preserve custom hooks, model/provider choices, and project restrictions. `sandcastle init` rejects an existing `.sandcastle/`, so rerunning it is not a migration. A directory containing only logs also needs an explicit destination/preservation decision rather than deletion to make init succeed.

For first use, install or reuse the project's selected version, then use its official `init` with the chosen provider and agent. Read that version's help to supply supported non-interactive options where possible. Choose a minimal suitable template; the `blank` scaffold is sufficient when the implementation workflow will come from skills. Keep initialization, image building, and live task execution distinct. Inspect generated files and finish adapting them before reporting the integration ready.

The 0.12.0 initializer provides GitHub Issues, Beads, and Custom tracker choices. Use Custom for Backlog.md or another tracker without a native adapter, then use `docs/agents/issue-tracker.md` to resolve the placeholders in `SETUP_ISSUE_TRACKER.md` and the generated files. Reuse the tracker selected by setup; do not create another queue or label vocabulary. Custom scaffolds deliberately fail until configured.

Official templates are editable starting points. The 0.12.0 `simple-loop` and `sequential-reviewer` implementation prompts prescribe commit-before-close without a follow-up commit; replace their duplicated implementation/finalization sequence with the `implement` handoff. Preserve useful task context and dependency preparation. Choosing a template does not install the engineering skills.

## Wire the prompt and environment

The entry must explicitly pass `promptFile` or `prompt`; `.sandcastle/prompt.md` is not automatically discovered. Preserve dynamic context only after validating its queue command and failure handling. If using `promptArgs`, bind the fresh attempt ID and selected ticket/context through supported substitutions.

The task prompt should do four things:

1. Read the repo instructions and the project runner/tracker configuration.
2. Use the selected ticket and parent spec, or select one eligible ticket using the configured queue rules.
3. Load and follow the installed `implement` skill. Keep implementation and acceptance ordering in that skill, and task-specific standards in the approved contract.
4. Return the configured attempt result after finalization, including its IDs and artifact references. Queue exhaustion or blockage can return before implementation, with the appropriate reason.

Check skill availability for the selected agent in its actual environment. With a host runner, inspect the harness's real skill paths; with a container, make the complete required skill directories and references available through the approved installation or read-only mounts. Symlinks targeting host-only paths do not establish container access. Use the harness's supported invocation mechanism, with an explicit read-and-follow instruction when a user-invoked skill is not callable through its Skill tool.

Bind durable evidence storage before the attempt. A persistent host artifact root can be exposed through a narrow container mount or an explicitly permitted host path for `noSandbox`. Retain the project's evidence layout where possible and ensure it is gitignored where appropriate. Do not rely on reading artifacts from a worktree after `run()` returns: cleanup may already have removed it.

## Connect outcomes to the loop

The installed 0.12.0 API exposes completion signals, structured output, and `preservedWorktreePath`. Its public hooks run during setup, not after each iteration. Agent/merge errors fail the call, but a normal exit with held prose or a preserved worktree can proceed to another internal iteration. Its final result can also lose an earlier iteration's preserved path when a later iteration overwrites it.

For that API, use an outer loop that calls `run({ ...projectOptions, maxIterations: 1 })` once per attempt. Preserve the project's overall iteration bound. Before the first call, check the execution prerequisites and unresolved leftovers for this run; stop for investigation instead of hiding retained work through cleanup. Before each subsequent call, finish validating the preceding result.

Implement the boundary as follows:

1. Create a fresh attempt ID and pass it into the prompt with the project result schema.
2. Use `Output.object` with a supported schema validator already available to the project, or `Output.string` followed by JSON/schema validation. In 0.12.0 these require one iteration and the opening output tag in the resolved prompt. Keep extraction retries disabled (`maxRetries: 0`) so malformed output cannot create an unexamined retry. Keep result extraction distinct from completion signals.
3. Await the entire call. On an exception, persist the error and any returned recovery paths/commit information outside the disposable worktree, then stop.
4. Check `preservedWorktreePath` before considering continuation. If present, report it and stop, regardless of the agent's claimed outcome. Do not automatically delete it.
5. Validate the current result's attempt/ticket identity, outcome, artifact references, and finalization using the project contract. Apply its continuation policy. Persist the runner's decision outside the disposable worktree before allocating another one.

The default `<promise>COMPLETE</promise>` is a stop token, not proof that a ticket passed or that the queue is empty. If retained, its meaning must agree with the result protocol. A blocked queue must not be reported as all tickets completed.

`merge-to-head` can merge commits before cleanup and before the caller sees the result. The outer loop stops further allocation; it does not prevent the current held attempt's checkpoint commits from merging. Keep this distinction visible in `docs/agents/runner.md`. A different merge policy is a separate project decision.

On versions with another supported per-attempt API, it may replace the outer loop if it provides the same checks before another worktree is allocated. Use the installed API, not imagined `afterIteration` or `stopOnDirty` hooks.

## Verify without running the queue

Apply the scenarios in the generic guide to the generated wrapper with an injected/fake `run` function. Assert call count and that failures stop before a second allocation; include an early preserved path followed by a would-be successful attempt. Exercise queue parsing separately, including failed subprocesses and conflicting readiness labels.

Use a temporary Git repository to prove the project's tracker finalization order and artifact persistence across worktree cleanup. Adapt any retained reaper only within the approved changes; simulate a failed salvage operation and require it to preserve the work. Never run the project's real cleanup command for this test.

Then check the selected execution environment and record what was verified. A static inspection or fake executor does not prove container credentials, skill access, or browser capabilities. If a bounded environment probe cannot run, finish configuration with that readiness gap explicit and give the exact next check.
