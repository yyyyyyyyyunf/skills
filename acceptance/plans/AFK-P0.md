# AFK-P0 — Workflow preparation

Readiness: ready. Starting commit: `0ebb852f1a46614e0aafe43813221291afdbcc6c`.

Contract: P0 in `docs/plans/afk-workflow-implementation.md`; defaults: `docs/agents/acceptance.md`. Preserve the existing uncommitted settle documents on `codex/afk-workflow`.

- AC-P0.1: `bash .githooks/pre-commit` must pass; the historical demo regression entry must report its executed cases and skips. Sandcastle's own baseline is recorded in its worktree.
- AC-P0.2: reuse Node's test runner and the existing demo's temporary Git/Backlog fixture pattern for shared-command tests; real agent credentials are not required here.
- AC-P0.3: create acceptance configuration and persist the implementation plan/progress pointers. Later packages bind their specific commands before edits.

The demo regression was run during planning: 33 passed, zero failed/skipped. This proves the existing test entry is available; it does not prove the forthcoming cancellation or guarded-merge behavior. No old/new comparison baseline is required.
