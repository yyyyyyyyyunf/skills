# AFK implementation progress

Spec and dependency graph: [implementation plan](afk-workflow-implementation.md).

| Package | State | Evidence / next action |
| --- | --- | --- |
| P0 | passed | Both acceptance reports: `acceptance/reports/AFK-P0-baseline.md`. Sandcastle 1447 passed/2 Windows skips, typecheck/build passed; skills integrity passed; independent review completed |
| P1 | passed | Sandcastle `acceptance/reports/AFK-P1-termination.md`, code `9c8fef3`: 1465 passed/2 Windows skips in 55 files; typecheck/build passed. Two-axis review has no remaining findings. Original process-group probe passed 96/96 after the Darwin reaping repair |
| P2 | passed | Sandcastle `acceptance/reports/AFK-P2-activity.md`, code `c4867c2`: 1487 passed/2 Windows skips in 58 files; typecheck/build passed; final two-axis review has no remaining findings |
| P3 | passed | Sandcastle `acceptance/reports/AFK-P3-evidence.md`, code `f3d4442`: 1499 passed/2 Windows skips in 61 files; typecheck/build passed; both independent reviews have zero remaining findings |
| P4 | passed | Sandcastle `acceptance/reports/AFK-P4-verification.md`, code `b3c353c`: 1521 passed/2 Windows skips in 65 files; typecheck/build passed; both reviews have no remaining findings |
| P5 | passed | `acceptance/reports/AFK-P5-workflow.md`, code `10b113b`: 35 passed, no skips; integrity gate passed; final Standards/Spec reviews have no remaining findings |
| P6 | passed | Sandcastle `acceptance/reports/AFK-P6-iterations.md`, code `82183fc`: 1561 passed/2 existing Windows skips in 69 files, typecheck/build passed; real shared-command Backlog integration passed; final reviews have no remaining findings |
| P7 | passed | `acceptance/reports/AFK-P7-setup.md`, code `3c5227f`: 51 shared tests, migration proof and 12 native forward scenarios passed; integrity passed, final Standards/Spec reviews have zero findings |
| P8 | in progress | Package identity and real capability probe passed. Run 1 retained TASK-2 on the trial's 900-second deadline. Run 2 completed transport/identity/cleanup but failed its stricter test-before-implementation contract (`acceptance/runs/AFK-P8/run-2/`). Skill/proof repair `14cc1ec` has zero final review findings and 51 passing shared tests. Run 3 is active in `/private/tmp/afk-order-trial-ca_lb8qg/repo` with explicit strict-ancestor checks and the template's finite 3600-second deadline; see `acceptance/plans/AFK-P8.md` |

Development branch in both repositories: `codex/afk-workflow`. Sandcastle implementation worktree: `/private/tmp/afk-sandcastle-work`, linked to the user's fork at `/Users/zongyf/Documents/code/sandcastle`. Its original checkout and the historical demo remain unchanged.

Accepted acceptance plans: [skills P0](../../acceptance/plans/AFK-P0.md), Sandcastle `acceptance/plans/AFK-P0.md` in its worktree. Original start revisions and planned gates remain in the implementation plan.
