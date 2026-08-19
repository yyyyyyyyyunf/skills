---
name: acceptance
description: Prove the delivery works with reproducible evidence, judged by whoever did not build it. Runs after implementation and code review, before committing — `implement` calls it last. Triggers on "verify this works", "collect evidence", "prove it", "did the migration hold", and on any unattended run that must self-certify what it built. Consumes the checks and baseline from `acceptance-plan`; without them it degrades and reports the equivalence gap instead of passing silently. Never judges pass/fail from the same context that wrote the code.
---

# Acceptance

Prove what was built, with evidence someone else can re-derive. The output is a report whose numbers are honest in both directions: what passed, and what nothing proved.

The failure this is built against is a clean-looking report from a run where nothing was observed. Three shapes of it recur, and each has a rule below: a gate reported as a check, a behaviour waved through as "covered by tests", and a green from a check that could not have gone red.

## Prerequisite

Read `docs/agents/acceptance.md` for this repo's capabilities, thresholds, normalisation fields, sampling ratio, and paths. Then read the plan `acceptance-plan` left — the checks, the triage record, the standard, and the baseline.

**With no plan**, run anyway and degrade: triage and author the checks here, then open the report with `no baseline — equivalence unverified` and mark every check that would have compared against a baseline as `blocked`, naming the missing baseline path. Refusing would waste the whole batch; passing silently would hide that the strongest dimension went unchecked.

## The capability contract

Four roles. `docs/agents/acceptance.md` declares what supplies each one in this repo.

| Role | Supplies | Used for |
| --- | --- | --- |
| **reproduce** | Bringing the system to the same observable state | Reaching each check's precondition |
| **observe** | Reading what a user or caller actually receives | The evidence itself |
| **archive** | Persisting an observation as a comparable file | Storing evidence and baselines |
| **sideband** | Console, logs, network — optional | Explaining a failure |

A check whose roles are not all supplied is `blocked`, naming the missing role. **Sideband output explains; it never decides.** "No errors in the log" is not evidence that a user saw the right thing, and in an unattended run it is the most available substitute for actually looking.

## Step 1 — Re-triage against the diff

The plan was written before the diff existed, so its picture of the changed surface is a prediction. Read the real diff and compare. A changed behaviour with no check gets one now, labelled **added at T1**.

Checks accumulate: every check from the plan stands, and this step only adds. Deleting a check or weakening its assertion converts an unwanted red into a green, which is the one edit that makes the report say less than it did before. A high count of T1 additions is itself worth reporting — it says the spec or the plan misjudged the scope.

## Step 2 — Settle the yields

For each **yield** in the triage record, confirm all three:

1. The named test exists.
2. It ran, and passed, in this run.
3. It was added or modified by this change.

The third is what makes a yield mean something. A test that was green before the change and green after proves the behaviour was not broken; it does not prove this change works. Any yield failing any of the three becomes a **gap** — recorded, counted, and reported as unproven. Nothing else about it needs capturing.

## Step 3 — Capture

For each check, use *reproduce* to reach its state and *observe* + *archive* to capture the evidence types the check declared: `text`, `screenshot`, `dom`, plus temporal evidence when the check asserts a process.

**Capture twice; the two must match.** A disagreeing pair has found nondeterminism, and one of two things follows: freeze the source, or downgrade that check to structural equivalence. Either way the downgrade goes in the report — a comparison that silently stopped covering pixels reads exactly like one that still does.

Write evidence to the declared evidence path, which is gitignored. Archive as you go: evidence written mid-run survives a crash near the end.

## Step 4 — Judge

**A program judges first.** Compare against the baseline using the thresholds declared in `docs/agents/acceptance.md`. Those numbers were declared before the run; archive them alongside the evidence and leave them alone for the rest of it. Re-tuning a threshold mid-run adjusts the standard to fit the result.

**What a program cannot settle goes to a blind judge** — a sub-agent given the check, the baseline artifact, and the new artifact, and nothing else. No diff, no plan rationale, no part of this conversation. The context that wrote the code is the worst available judge of whether the code works: it recognises its own intent in the output and reads intent as correctness.

Record, per check, which judged it.

## Step 5 — Repair, at most two rounds

A red check may be fixed and re-verified twice. Then it books itself as `failed` and the batch moves on — one bad unit stops nothing.

- **Re-capture in full after a repair.** Evidence from an earlier round describes code that no longer exists.
- **The baseline and the checks stay fixed.** Both are the standard; editing either to obtain a green is the one move that cannot be detected from the report alone.
- **Report which round each check passed on.** "Green on round 2" is a signal about that unit's difficulty, and a single green erases it.

## Step 6 — Sample the UI checks for sensitivity

On the final code state, take the sampling ratio from `docs/agents/acceptance.md` and, for each sampled UI check, revert the code it declared sensitivity to and confirm the check goes red.

A sampled check that stays green never tested anything. When one fails this way, mark **every unsampled check in that batch** `sensitivity unverified`: a bad draw indicts how the batch was authored, not one row of it.

Logic checks are exempt — a test written test-first proved its own sensitivity when it went red.

## Step 7 — Report

Write the report to the declared report path, which is committed. The skeleton, the required header numbers, and a filled example:

| Need | Reference |
| --- | --- |
| The report skeleton, its header line, the verdict table, and a worked example | [report-format.md](references/report-format.md) |

### What a non-pass must name

Four outcomes are not passes, and each is only valid with something checkable attached:

| Outcome | Means | Valid reason names |
| --- | --- | --- |
| `failed` | Verified and wrong | The observed difference |
| `blocked` | Could not verify | A contract role, or a missing file path |
| `gap` | Nothing proves it | The test that was expected and is absent |
| `none` | Nothing to observe | The changed files, and the entry and output paths they sit on |

A reason that names one of those is one a reader checks in seconds. Prose in its place — "environment limitations", "covered by existing tests" — is the sentence an unattended run reaches for when it has nothing, and it is indistinguishable from a real finding.

### Completion criteria

The run is done when the report states, as absolute numbers:

- **coverage** — checks passed over checks attempted.
- **blocked**, **gap**, and **none** — each counted separately, none of them folded into the coverage denominator.
- every downgrade and every `sensitivity unverified` batch, declared.

Coverage alone is not the answer. `coverage: 71/71` beside `gap: 37` is a report worth reading; the same line with the gaps absorbed into it is a false one.
