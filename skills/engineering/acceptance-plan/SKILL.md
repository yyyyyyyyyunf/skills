---
name: acceptance-plan
description: Fix what counts as done before any code moves, and freeze the baseline while it still exists. Runs at the start of implementation — `implement` calls it before `tdd`. Triggers on work about to begin whose result someone must accept; on a migration, refactor, dependency bump, or framework change that must preserve existing observable behaviour, where the baseline can only be sampled before the old code is touched; and on "plan acceptance", "define the acceptance checks", "capture a baseline". Produces the checks and baseline that `acceptance` verifies against.
---

# Acceptance plan

Decide what would make this delivery acceptable, before any of it is built. Two products:

- **Checks** — the observable outcomes someone would accept or reject.
- **Baseline** — when the standard is the behaviour that exists today, a frozen sample of it.

The baseline is why this runs first. It can only be taken while the old behaviour is still running; once the first line changes, that sample is gone and equivalence becomes unprovable for the rest of the effort. Everything else here could be done later. That cannot.

## Prerequisite

Read `docs/agents/acceptance.md`. It declares this repo's capabilities, thresholds, normalisation fields, sampling ratio, and paths — every project-specific value the checks below rest on.

If it is missing, **stop and tell the user to run `/setup-agent-workflow`**. Authoring checks against guessed capabilities produces a plan that `acceptance` cannot execute, and the guessing is invisible in the output.

## Step 1 — Find the standard

Probe in this order and take the first that applies:

| Standard | When | What the checks assert |
| --- | --- | --- |
| **Spec** | A spec or ticket describes the intended result | The result the spec describes |
| **Old behaviour** | Existing behaviour must survive — migration, refactor, dependency bump, framework change | The delivery matches the frozen baseline |
| **Authored** | Neither exists | Outcomes you write now, before building |

Record which one applies. `acceptance` reads it to know whether a missing baseline is a defect or expected.

### The baseline window

On the **old behaviour** branch, before anything else: confirm the old behaviour is still intact and runnable. Check that the working tree carries no changes to the code under migration, and that the old version still starts.

If it does not — the migration already began, the old entry point is gone, dependencies already moved — **stop and report that the baseline window has closed**. Say plainly which checks are now unprovable. A run that proceeds here produces a baseline of the new code and compares it to itself, which reads as a clean pass.

Completion criterion: either a baseline exists on disk, or the report states that equivalence cannot be verified and why.

## Step 2 — Triage every behaviour this work will change

Work from the spec, tickets, or the plan — at this point there is no diff. Each behaviour lands in exactly one:

| | Condition | Outcome |
| --- | --- | --- |
| **verify** | Observable, and the state that exercises it is reachable here | Becomes a check |
| **blocked** | Observable, but that state is unreachable in this environment | Recorded as `blocked`, naming the missing capability or fixture |
| **yield** | A test is the right proof | Recorded as a yield, naming the test that will carry it |
| **none** | On no entry or output path | Recorded as `none`, naming the fact that makes it so |

Two distinctions do the work here:

**`blocked` and `none` are different claims.** `none` says there is nothing to observe; `blocked` says there is, and this environment cannot reach it. A behaviour filed as `none` looks harmless and stops being counted, so a `blocked` misfiled that way disappears. Anything with an observable surface belongs in `blocked`, however awkward reaching it looks.

**A yield names its test.** Logic changes are proven by tests, and re-deriving them through the UI is wasted work. But the yield must name the test that will prove it — file and case. When no test will exist, the behaviour is a **gap**: recorded, counted, and carried into the report as unproven. `acceptance` checks each named test exists, ran, and was added or modified by this change.

Completion criterion: every behaviour in scope carries one of the four labels and the reason its label demands.

## Step 3 — Write the checks

Each **verify** behaviour becomes one check. A check states an outcome a user or an analytics event can observe, and declares the evidence types that would show it: `text`, `screenshot`, `dom`. Add temporal evidence — a recording or frame sequence — only when the check asserts a *process*: an animation, a loading sequence, a multi-step interaction.

**Gates are not checks.** Tests, coverage, `tsc`, lint, format, "build passes", "CI is green", dependency-version compliance — these are preconditions of shipping. Run them and report the result as one line of narrative. A table of gates buries the two or three outcomes that needed a human eye, and in an unattended run it is the easiest way for a delivery to look verified while nothing was observed. The test for every draft check: *would someone accept or reject on this?*

One check, one observable. A check covering several outcomes cannot fail informatively, and a catch-all — "everything else renders correctly" — passes by default. Write the outcomes you actually want to see.

### Reachability — UI and end-to-end checks

Each of these checks declares its precondition state and how to reach it, in terms of the *reproduce* capability declared in `docs/agents/acceptance.md`. "The price shows the expired-coupon fallback" needs an expired coupon to exist; write down how one comes to exist.

A check whose state you cannot construct is `blocked` here, at T0 — not left for `acceptance` to discover. The timing is the whole value: right now the intent behind the change is still known, and a shortfall found here is a fixture someone can add before the work starts, rather than a row of `blocked` after a full batch has run.

### Sensitivity — UI checks

A UI check must be **sensitive** to the change: break the code the check is about, and the check goes red. Declare, per UI check, which file or behaviour it is sensitive to. `acceptance` verifies a sample of these by actually reverting.

Logic checks skip this. A test written test-first has already proved its own sensitivity by going red before it went green; a screenshot has no red step, so the guarantee has to be supplied here.

## Step 4 — Sample the baseline

Only on the **old behaviour** branch. For each check, use the repo's declared *reproduce*, *observe*, and *archive* capabilities to capture the current result, and write it to the baseline path.

Three rules make a baseline trustworthy:

- **Capture twice; the two must match.** A pair that disagrees has found nondeterminism — a timestamp, an id, an animation, a live ad slot. Freeze the source, or downgrade that check to structural equivalence and record the downgrade in the baseline file.
- **Declare normalisation inside the baseline file itself.** Which fields were stripped as unstable, and why. The declaration then travels with the baseline and is reviewed with it.
- **Commit the baseline.** It is the judgement standard; putting it under version control makes any later change to it a reviewable commit rather than a silent adjustment.

## Hand off

Leave behind, at the paths `docs/agents/acceptance.md` declares:

- The checks, each with its evidence types, and — where applicable — its reachability and sensitivity declarations.
- The triage record: every `blocked`, `yield`, `none`, and `gap`, with its reason.
- Which standard applies, and the baseline if one was taken.

`acceptance` consumes exactly this. Tell the user what was recorded as `blocked` or `gap` before the work starts — those are the parts nothing will prove, and now is when they are still cheap to fix.
