# AFK-P8 — Packaged real unattended trial

Readiness: ready. P7 passed in [its acceptance report](../reports/AFK-P7-setup.md): skills `3c5227f`, 51 shared tests, migration proof and 12 native forward scenarios passed, with both final reviews clear. No real task has started. Sandcastle source checkpoint is `9679cb9` (accepted executable change `82183fc`), with a clean worktree. Contract: P8 in [the approved implementation plan](../../docs/plans/afk-workflow-implementation.md). Package installation and the bounded real environment probe are preparation supplied by this ticket before seeding agent-ready work.

| Criterion | Required proof / expected result |
| --- | --- |
| AC-P8.1 | Apply the accepted setup flow in a new temporary Node CLI project. Kimi/noSandbox/Backlog executes TASK-1 and then dependent TASK-2 through the package's native entry. Both complete implementation, independent Standards/Spec review, executable acceptance, tracker finalization and commits |
| AC-P8.2 | Verify installed public exports and bytes against the built tarball; reconcile attempt/ticket identity, preparation target, source/candidate/merged revisions, report/receipt hashes and exported evidence. Two accepted iterations, three preparations, final host `no-work`; second target is first merged candidate. Re-read evidence after source worktrees are removed |
| AC-P8.3 | Reuse P7's actual historical-configuration migration proof, preserve the original demo checkout/status/revision and historical artifacts, and keep the new trial separate from formal queues |
| AC-P8.4 | Record every failure with owner, reproduction and repair. Re-run affected deterministic checks before repeating the real chain. The final successful complete two-task run and required regression gates must describe delivered code |

## Environment preparation

Build the clean fork and `npm pack --ignore-scripts --pack-destination <temporary package directory>`; scripts are disabled only during packing because the build is run explicitly. Install the local tarball and selected `sandcastle-agent-kimi` 0.1.1 through npm in the new project. Record SHA-256, npm integrity, source revision/clean status, installed resolution and an exact comparison of installed distribution files against the built source. Use only package exports, never source or dist links, in the real entry. Package and install problems are preparation failures to repair before model work.

Use the intended Node 24.21.0 and `/Users/zongyf/.kimi-code/bin/kimi` 0.42.0; bind PATH for the actual native launch. Preserve the selected host OAuth alias `kimi-code/k3`, with apiKey omitted. Do not read or copy credentials into evidence. Use fixture-owned global Git configuration and the new project's Git identity; this avoids changing the shared host safe.directory configuration. The full installed skills at `/Users/zongyf/.agents/skills` and Backlog 1.51.0 are available locally; setup startup verifies linked resources and shared scripts.

One bounded read-only environment probe may run through the packaged Sandcastle API before seeding tasks. It must authenticate, read the installed required skills and dispatch independent read-only subagents, retaining their results. Kimi's [documented independent Agent contexts](https://moonshotai.github.io/kimi-code/en/customization/agents) establish a feasible provider; the real probe establishes availability in this invocation. No extra model calls are used for cases already proved deterministically. If the probe fails, preserve evidence and repair the actual prerequisite; file existence alone is not authentication proof.

Configure the native queue for label `trial`, maximum 3 iterations, idle timeout disabled, finite 900-second per-iteration execution timeout, 60-second completion grace and 30-second shared-command deadline. The probe has its own shorter finite bound. Reports/plans are committed; evidence is written under worktree-relative `acceptance/runs/` and exported to the configured `.sandcastle/evidence/` root. Retained work stops startup until its cause is explicitly addressed; no automatic replay or cleanup.

Repair round 1: the first real run completed and merged TASK-1, but TASK-2 reached the 900-second execution deadline after a model request waited approximately 284 seconds. It left uncommitted tracker/report/receipt finalization. The process stopped, the source worktree and exports survived, the host kept only TASK-1, and startup rejected the retained work. Preserve that complete trial at `/private/tmp/afk-native-trial-1jZlXI` with archived evidence under `acceptance/runs/AFK-P8/run-1/`. Repeat both tasks in a fresh clone of the seeded pre-implementation revision, changing only the per-iteration execution deadline to the accepted setup template's finite 3600 seconds. Keep the same package, model/auth, contracts, maximum iterations and all other limits. This is a trial-configuration repair; no Sandcastle or shared workflow executable change is indicated. No further model capability probe is needed because both actual task sessions exercised the provider and independent reviews.

## Two small tickets

The project starts with a greeting CLI and two Node regression assertions (default and named greeting). Use this observable CLI seam, with no browser or service dependency.

- TASK-1 adds `--upper`: `node bin/greet.mjs --upper Ada` prints exactly `HELLO, ADA!\n`, and `--upper` without a name prints `HELLO, WORLD!\n`; both exit 0 with empty stderr. Existing default/named plain greetings stay unchanged.
- TASK-2 depends on TASK-1 and adds `--json`: `--json Ada` prints exactly `{"greeting":"Hello, Ada!"}\n`; combining `--upper --json Ada` prints `{"greeting":"HELLO, ADA!"}\n`, exit 0 and empty stderr. Plain and uppercase text modes remain unchanged. Option order is independent for these two switches.

Create contracts through Backlog CLI with required criteria, selected Node proof, readiness scope and the real dependency edge. No UI requirement is being substituted: these new tasks are CLI behavior. Preserve the independently exercised setup's Node acceptance method. Use ESM `test/*.test.mjs` and `node:test`/`node:assert/strict` with child-process observations. The agent writes tests and implementation; the host does not pre-solve the tickets.

The implementation skill's plan/review/acceptance ordering remains required. Commit plans/test specs before the implementation revision being judged. After acceptance only the selected task and exact report/receipt may change. Complete Done tasks remain in tasks; periodic collection was proved in P7 and is not required for each real task.

## Gates and evidence

Required final gates: Sandcastle typecheck, build (including public types check), complete Vitest suite, P6 real Backlog/shared-command integration; skills complete shared Node test suite and integrity hook; the delivered temporary project's `npm test` and `git diff --check`. Existing Windows-only skips retain their previous classification and cannot discharge native POSIX requirements. Record actual case totals and logs.

Host proof commands are `node acceptance/fixtures/afk-package-proof.mjs <source> <tarball> <project>` for distribution/lockfile/public-import identity and `node acceptance/fixtures/afk-real-run-proof.mjs <project> <run.json>` for the completed run's observable state. Export only the identified trial/probe Kimi sessions with `kimi export <sessionId> --yes --no-include-global-log --output <zip>` to retain actual independent-agent records and available per-request usage. These proof tools read results; they do not execute/retry a queue or make workflow decisions.

Added at T1 after independent review: `node acceptance/fixtures/afk-proof-controls.mjs <source> <tarball> <project> <run.json>` checks both positive proofs and isolated negative controls for linked/altered installed distribution files and contradictory preparation, source/target, raw/extracted and verification identities. The tarball's distribution inventory and bytes must match the built and installed distribution. Controls mutate only disposable copies and never restart the real queue.

Raw host observations: `acceptance/runs/AFK-P8/`. New trial keeps its own native journals, raw/extracted results, reports, receipts and exported test logs. Record available model usage and elapsed time; if the adapter supplies no usage, state that limitation rather than inventing totals. Plans, reports, executable proof and progress records are committed in their owning repositories.

New behavior uses the stated expected outcomes; prior greeting regression assertions prove preservation. No visual or timing baseline is required. P7 supplies the original-configuration preservation assertions. Independent review of any new delivery code precedes final acceptance; the real Kimi tasks must supply their own required independent review evidence. Formal project migration and publishing remain outside this delivery.
