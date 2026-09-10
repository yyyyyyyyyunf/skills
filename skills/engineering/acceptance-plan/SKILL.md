---
name: acceptance-plan
description: Bind an agreed acceptance contract to the execution environment before implementation, and capture any required pre-change baseline. Use at the start of implement, when planning acceptance checks, or before a migration, refactor, or dependency change whose existing behaviour must be preserved.
---

# Acceptance plan

Turn the agreed ticket requirements into an executable plan before changing the implementation. Preserve the standard while binding commands, fixtures, tests, and evidence paths to the current environment.

## Inputs

Read [the acceptance contract](../acceptance/references/acceptance-contract.md), `docs/agents/acceptance.md`, and the ticket or approved spec, including its testing and design decisions. Reuse prior user decisions; this stage does not reopen taste or tool choices that were already settled.

If project configuration or a required acceptance decision is missing, identify it. In an interactive planning session, resolve only the missing decision with the user before implementation. In an unattended run, return `held` with the missing input and the next action; the caller can preserve the record and hand it back without waiting indefinitely. For missing project configuration, name `docs/agents/acceptance.md` and tell the user to run `/setup-agent-workflow`.

Every `held` outcome below still completes the handoff record in step 4 before returning; implementation remains stopped, but its planning artifacts are preserved.

## 1. Bind each requirement

Keep the ticket's criterion IDs, required/advisory classification, expected outcomes, and references. Turn each into a check with:

- Its proof method and the capability provider that will execute it.
- The state/data and steps needed to exercise it.
- The assertion or judging rubric and the evidence artifacts it needs.
- Concrete test cases, commands, and output paths where now knowable.
- Whether an approved design reference or an old-behaviour baseline is required.

For tests, name the file and case, or the planned file and case when this ticket creates them. Existing regression assertions are valid when they exercise the preservation claim. Check that the planned assertion could distinguish the intended behaviour from an incorrect result; use existing red/green evidence or a suitable negative case where available.

When the project provides a test-script workflow, bind the expected test-spec format/discovery rules, the existing execution command, and how its results identify each required case. The implementation writes or updates those specs; acceptance runs that entry point rather than inventing a different tool integration.

Carry required engineering gates separately. Derive additional checks only from agreed requirements or project constraints; label any uncovered requirement instead of inventing a new acceptance obligation. If the task has no contract, propose one from its requirements and obtain agreement or explicit delegated authority before implementation. Preserve that agreement in the plan.

## 2. Check prerequisites

Verify current capabilities rather than assuming setup's inventory is still accurate. Apply the project's tool preferences and allowed alternatives, preserving the agreed proof.

Classify each prerequisite as:

| Provider | Action |
| --- | --- |
| Available now | Verify the entry point, fixture, tool, or reference is reachable |
| This ticket | Record the preparation work and how availability will be verified after it is built |
| Blocking ticket | Confirm that dependency has completed and the capability is actually available |
| Unresolved | Record the missing state, capability, permission, or decision |

A new application need not already run before its first ticket. A page, endpoint, fixture, or test harness that this ticket is meant to create can be planned without claiming it already works. The plan must explain a feasible way to build and exercise it within the agreed scope and permissions.

If a required external prerequisite remains unresolved, return `held` before implementation. When required preparation is feasible within this ticket, the plan can be `ready`; `acceptance` must still verify that preparation succeeded. Advisory shortfalls remain visible without holding the ticket.

## 3. Capture required baselines

Decide per check, not once for the whole ticket. New behaviour uses its expected result and records baseline `not applicable`; an approved design reference is used directly. For old/new comparisons, capture the old behaviour while it is still intact, even when the migration also has a spec.

If that window has closed, record the affected checks as `blocked` and return `held` when they are required. Never sample the new implementation as its own old baseline.

For each required comparison baseline:

- Use the declared reproduction and observation path to capture it twice. Establish repeatability for the declared comparison, including any agreed normalisation.
- If captures disagree, stabilise the fixture or report the unresolved comparison. Use structural comparison only when it preserves the agreed assertion or was an approved alternative; losing a required dimension is a blocker.
- Record normalisation and applicable thresholds with the artifact. Commit the baseline before altering the behaviour it represents; inability to capture or commit a required baseline leaves readiness `held`.

Apply repetition or sensitivity requirements declared by the project or ticket to the relevant proof methods. Record a safe negative control or isolated revert procedure where needed; baseline comparison rules are not a universal UI testing requirement.

## 4. Hand off

Write the plan to the declared plan directory as `<ticket-or-delivery-id>.md`. For an older configuration without a plan path, use `acceptance/plans/` and record that path in the ticket. Plans are committed task artifacts. If project configuration was missing, the same default can hold the blocked planning record.

Include:

- Ticket/spec references, the approved contract, and the starting commit.
- Checks, required gates, prerequisite providers, reference artifacts, and concrete execution details.
- Any `blocked`, `gap`, or `none` classification with its checkable reason.
- **Readiness: `ready` or `held`**, and the unresolved requirements and next actions.

Link the plan from the ticket using its tracker workflow. `ready` authorizes implementation under the plan; it is not an acceptance pass. The caller persists the plan and tracker changes, including a `held` record, before ending the task.
