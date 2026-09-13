# AFK-P5 — Shared workflow decisions

Readiness: ready; P4 passed at Sandcastle `b3c353c`. Starting skills revision: `a53c6ff`. Contract: P5 in [the approved implementation plan](../../docs/plans/afk-workflow-implementation.md). Execution environment and gates: [acceptance configuration](../../docs/agents/acceptance.md).

| Criterion | Executable proof / expected result |
| --- | --- |
| AC-P5.1 | Real Backlog CLI and temporary Git repository: explicit queue scope, parent exclusion, conflicting triage labels, assignee and dependencies; distinct run/no-work/blocked and command errors |
| AC-P5.2 | Public CLI JSON input/output: reject missing/malformed output, stale attempt, wrong ticket, empty evidence, missing files and escaping/symlink paths |
| AC-P5.3 | Candidate Git history: Done in tasks or completed is accepted; uncommitted tracker state, unrelated implementation commit and implementation changes after acceptance are rejected |
| AC-P5.4 | Committed report/receipt bind attempt, ticket, verdict, implementation revision and hashes of durable artifacts; report disagreement and changed approved contract are rejected |
| AC-P5.5 | Host decides structural consistency only; instructions keep acceptance judgement in the existing skill. Existing manual tracker workflows remain available |

Implement one installed Node-stdlib CLI with `prepare` and `verify`, plus internal modules only where they own distinct rules. Both operations read versioned JSON stdin and emit one JSON object; subprocesses use argv, bounded reads and the selected project cwd. The project supplies one committed JSON configuration. Read that configuration and contract files from the iteration's target revision so candidate edits cannot redefine checks.

Prepare reads a complete explicit Backlog scope and detailed dependency/readiness fields. Require local-only Backlog reads (`checkActiveBranches: false`, `remoteOperations: false`) for this first supported unattended path. The host generates the attempt ID; selection returns opaque metadata containing the ticket, its original task path and frozen contract hashes. Parent specs are context, not executable work. Never claim or mutate tracker state from the shared checker.

Verify consumes Sandcastle's extracted `result.output` (P6 supplies the extraction). A committed receipt references a committed acceptance report and nonempty hashed evidence under the configured artifact exports. The report includes a small machine binding and an unambiguous verdict; acceptance remains responsible for the approved assertions. The implementation revision must be an ancestor of the candidate, and later diffs may contain only the selected tracker record and exact report/receipt files. Held/incomplete return retain; invalid protocol throws with a useful reason.

Test entry: `node --test skills/engineering/setup-agent-workflow/scripts/*.test.mjs`. Use real Backlog/Git fixtures and CLI fault inputs; no model calls. Required gate: `bash .githooks/pre-commit`. Preserve raw logs under `acceptance/runs/AFK-P5/`; commit plan and report. Independent Standards/Spec review precedes acceptance. P6 integrates the commands with the native loop; P7 validates generated project setup.
