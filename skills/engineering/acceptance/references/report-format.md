# Acceptance report

Write one report per delivery attempt to the configured report directory. Use a distinct run ID and link it from the ticket. Reports and plans are committed; raw evidence remains under the gitignored evidence root.

Read [the acceptance contract](acceptance-contract.md) for the verdict rule. This report records its application, including project-specific methods and authorized exceptions.

For the shared unattended Backlog integration, append the [workflow report binding and receipt](../../setup-agent-workflow/references/workflow-protocol.md#acceptance-report-and-receipt). Manual reports keep this format without that additional transport binding.

## Skeleton

```markdown
# Acceptance — <ticket or delivery>

verdict: <passed | held>
required criteria: <passed>/<total> · required gates: <passed>/<total>
coverage: <passed>/<attempted> · failed: <n> · blocked: <n> · gap: <n> · none: <n>

contract: <ticket/spec reference, including agreed exceptions>
plan: <path; identify any checks planned late>
code state: <revision and any uncommitted task changes represented by the evidence>
provider changes: <requested provider, actual provider, and why the agreed alternative is equivalent; or none>
proof-quality results: <required comparison/repetition/sensitivity results and any loss of precision; or not applicable>

| Criterion | Requirement | Expected result / reference | Proof and judge | Outcome | Round | Evidence or blocker |
| --- | --- | --- | --- | --- | --- | --- |
| AC-1 | required | <assertion; baseline/design reference only if needed> | <method; program / blind / human> | <pass / failed / blocked / gap> | <0, 1, or 2> | <paths or specific missing input> |

## Required gates

| Gate | Outcome | Execution record or blocker |
| --- | --- | --- |
| <gate> | <pass / failed / blocked> | <command/result evidence> |

## Reference artifacts

| Criterion | Requirement | Reference |
| --- | --- | --- |
| AC-1 | <expected result / design reference / pre-change baseline> | <source or path; baseline not applicable for new behaviour; required-but-missing path otherwise> |

## Outstanding actions

<For every failed, blocked, or gap item, say what was expected, what was observed or missing, and the next action. Identify advisory items as such. Include explicitly required human approvals that are still pending.>

## None

<Changed material with no observable behaviour: paths and the reason no entry/output path is affected. This does not discharge an acceptance criterion.>
```

## Counting and interpretation

- **Required criteria** includes every agreed required criterion, including failed, blocked, and gap items in the total. A criterion passes only when all proof required for it is established. Missing requirements keep the verdict held even when the total is not yet knowable.
- **Required gates** counts project and ticket requirements, including unresolved gates in the total. List advisory gate observations separately if any.
- **Coverage** is passed checks over attempted checks, including advisory checks. Blocked and gap checks are outside this denominator and counted beside it. Show `0/0 — none attempted` when appropriate; it is not a pass signal.
- **Failed**, **blocked**, and **gap** count check outcomes across required and advisory items; the requirement column makes their effect on the verdict visible. Count `none` classifications separately.
- **Round** is per check: `0` is the initial verification, `1` and `2` are repair rounds. Use `—` for a check that could not run.
- **Judge** names the actual decision maker. An independent model judgement is `blind`, even when invoked through an assertion API; a pending human approval has no completed judge.

The expected result is always present. A baseline is present only when the assertion needs one. A missing required baseline is reported as missing, not as `not applicable`.

## Example — new behaviour without a baseline

```markdown
# Acceptance — TASK-1

verdict: passed
required criteria: 2/2 · required gates: 1/1
coverage: 2/2 · failed: 0 · blocked: 0 · gap: 0 · none: 0

contract: TASK-1, add a task and retain it after reload
plan: acceptance/plans/TASK-1.md
code state: <recorded revision>
provider changes: none; used the project's configured UI-test command
proof-quality results: not applicable

| Criterion | Requirement | Expected result / reference | Proof and judge | Outcome | Round | Evidence or blocker |
| --- | --- | --- | --- | --- | --- | --- |
| AC-1 | required | Adding "Milk" to an empty list shows exactly one matching item | project UI spec assertion / program | pass | 0 | runs/TASK-1/run-1/add-result.json |
| AC-2 | required | Reloading retains that item | project UI spec assertion / program | pass | 0 | runs/TASK-1/run-1/reload-result.json |

## Required gates

| Gate | Outcome | Execution record or blocker |
| --- | --- | --- |
| Project build | pass | runs/TASK-1/run-1/build.txt |

## Reference artifacts

Both checks use the expected results in TASK-1. Historical baseline: not applicable.

## Outstanding actions

None.
```

The same report would be `held` if the required reload assertion was skipped, its execution environment was unavailable, or the required build failed. A separately agreed advisory visual observation would remain visible without changing that rule.
