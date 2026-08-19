# Report format

The acceptance report is the one artifact a human reads. It is committed, so it is also the record of what was true at the moment the delivery closed.

Write it to the report path declared in `docs/agents/acceptance.md`, named for the delivery and the run — `acceptance/reports/<delivery>-<round>.md`. A repair round is a new file, not an edit of the old one: a published report describes code that existed at that moment, and re-verification after a fix is the next report.

## Skeleton

```markdown
# Acceptance — <delivery name>

<verdict>. coverage: <passed>/<attempted> · blocked: <n> · gap: <n> · none: <n>

standard: <spec | old behaviour | authored>
baseline: <path, or "none — equivalence unverified">
thresholds: <the declared values used for this run>
downgrades: <check ids downgraded to structural equivalence, or "none">
sensitivity: <sampled n of m, all red on revert | UNVERIFIED for this batch>

| Unit | Check | Verdict | Round | Judged by | Evidence |
| ---- | ----- | ------- | ----- | --------- | -------- |
| ...  | ...   | pass    | 1     | program   | <path>   |

## Failed

### <check id> — <one line>
Expected: <from the baseline or the spec>
Observed: <what the evidence shows>
Evidence: <paths>

## Blocked

| Check | Missing |
| ----- | ------- |
| <id>  | reproduce — no way to construct an expired coupon |

## Gap

| Behaviour | Expected proof |
| --------- | -------------- |
| <what changed> | <the test that should exist and does not> |

## None

| Behaviour | Why nothing observes it |
| --------- | ----------------------- |
| <what changed> | <files, and the entry/output paths they sit on> |

## Gates

<one line: which preconditions ran and their result>
```

## Rules the skeleton encodes

**The header carries four numbers, always.** `coverage` counts only checks that were attempted and judged. `blocked`, `gap`, and `none` sit beside it, never inside it. A report with a full coverage line and no other numbers is either a delivery with nothing unproven, or a report that hid what it could not prove — and the reader cannot tell which.

**Every non-pass section is a table, not prose.** Each row names the checkable thing its outcome requires: a contract role or file path for `blocked`, the absent test for `gap`, the files and paths for `none`. Tables make an escape hatch visible; paragraphs make it comfortable.

**`Round` is per check, not per report.** A check that needed two attempts says so on its own row.

**`Judged by` is `program` or `blind`.** It records which verdicts came from a threshold comparison and which from a sub-agent that saw only the check and the two artifacts.

**Gates get one line.** Tests, type-check, lint, build. They ran, they are preconditions, and they do not enter the table.

## Worked example

```markdown
# Acceptance — tangram floor components → Next

Held. coverage: 68/71 · blocked: 4 · gap: 37 · none: 2

standard: old behaviour
baseline: acceptance/baseline/floors/
thresholds: pixel diff ≤ 0.15%, dom structural equality
downgrades: CountDown, AdSlider, InfoFlow — structural equivalence (animation, live content)
sensitivity: sampled 8 of 71, all red on revert

| Unit | Check | Verdict | Round | Judged by | Evidence |
| ---- | ----- | ------- | ----- | --------- | -------- |
| FloorGap | Renders the configured gap between floors | pass | 1 | program | runs/0417/floorgap.png |
| ProductList | Product cards match the baseline layout | pass | 2 | blind | runs/0417/productlist.png |
| CouponList | Expired coupon shows the fallback price | failed | 2 | program | runs/0417/couponlist.png |
| DepartureCityList | Departure city list renders for the configured district | blocked | — | — | — |

## Failed

### CouponList-expired — fallback price is absent
Expected: baseline shows "¥0" struck through with the fallback label
Observed: label renders, struck-through price is missing
Evidence: runs/0417/couponlist.png, acceptance/baseline/floors/couponlist.png

## Blocked

| Check | Missing |
| ----- | ------- |
| DepartureCityList-render | reproduce — no fixture produces a configured district |
| IBUHeader-currency | reproduce — requires an authenticated session |

## Gap

| Behaviour | Expected proof |
| --------- | -------------- |
| helper.ts price rounding rewritten | no test covers rounding |
| sharedActions floor ordering rewritten | no test covers ordering |

## None

| Behaviour | Why nothing observes it |
| --------- | ----------------------- |
| loadComponent import path change | build-time module resolution only; no entry or output path |

## Gates

Type-check clean, lint clean, `pnpm build` succeeds; no test suite exists in this repo.
```

Read the example's header as one sentence: 68 of 71 attempted checks passed, four could not be reached, **37 changed behaviours have no proof at all**, and the three animated components are no longer compared by pixel. That last set of facts is what the report exists to deliver — the coverage number alone would have read as a near-clean pass.
