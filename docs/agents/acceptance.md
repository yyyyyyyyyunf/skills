# Acceptance

This configuration binds the approved [AFK implementation plan](../plans/afk-workflow-implementation.md) to this repository. It does not change the requirements in that plan.

## Proof and gates

- Shared workflow commands: Node's built-in test runner, real temporary Git/Backlog repositories, and injected process/filesystem failures at the declared seams. Tests exercise command inputs and observable decisions, committed state and durable evidence.
- Setup instructions: execute setup in a temporary project and inspect the resulting runnable integration; matching instruction text alone is not acceptance.
- Integration: the public packaged Sandcastle entry and Kimi/noSandbox/Backlog, followed by two real small dependent tasks in a temporary new project. Required tooling preparation belongs to P0–P7; actual authentication and runtime availability are rechecked before P8.
- Required repository gate: `bash .githooks/pre-commit`.
- The shared command's executable test entry is supplied by P5; until then it is planned, not verified.
- New behavior is judged against the approved plan. Retain existing regression assertions; no screenshot/performance comparison baseline is required by this work.
- Independent code review precedes acceptance. Required outcomes use executable assertions; no additional human approval gate was requested.

## Artifacts

Plans: `acceptance/plans/<delivery-id>.md`. Reports: `acceptance/reports/<delivery-id>-<run-id>.md`. Both are committed. Baselines, when required, live at `acceptance/baseline/` and are committed. Raw evidence: `acceptance/runs/<delivery-id>/<run-id>/`, gitignored. Each run records exact revisions and any uncommitted changes.

During work across repositories, the plan remains authoritative in this repository; each repository records its own checks and results. Formal project queues are outside this delivery.
