# AFK implementation progress

Spec and dependency graph: [implementation plan](afk-workflow-implementation.md).

| Package | State | Evidence / next action |
| --- | --- | --- |
| P0 | passed | Both acceptance reports: `acceptance/reports/AFK-P0-baseline.md`. Sandcastle 1447 passed/2 Windows skips, typecheck/build passed; skills integrity passed; independent review completed |
| P1 | in progress | Bound plan in Sandcastle `acceptance/plans/AFK-P1.md`; real process-tree cancellation regression next |
| P2 | pending P1 | Activity and bounded silent execution |
| P3 | pending P0 | Durable evidence and cumulative recovery |
| P4 | pending P1, P3 | Single-iteration guarded merge |
| P5 | pending P4 | Shared workflow prepare/verify commands |
| P6 | pending P4, P5 | Native multi-iteration progression |
| P7 | pending P2, P6 | Setup migration and Backlog conventions |
| P8 | pending P7 | Packaged real AFK trial |

Development branch in both repositories: `codex/afk-workflow`. Sandcastle implementation worktree: `/private/tmp/afk-sandcastle-work`, linked to the user's fork at `/Users/zongyf/Documents/code/sandcastle`. Its original checkout and the historical demo remain unchanged.

Accepted acceptance plans: [skills P0](../../acceptance/plans/AFK-P0.md), Sandcastle `acceptance/plans/AFK-P0.md` in its worktree. Original start revisions and planned gates remain in the implementation plan.
