---
name: to-tickets
description: Break a plan, spec, or the current conversation into a set of tracer-bullet tickets, each declaring its blocking edges, published to the configured tracker — edges as text in one file per ticket locally, or native blocking links on a real tracker.
disable-model-invocation: true
---

# To Tickets

Break a plan, spec, or conversation into a set of **tickets** — tracer-bullet vertical slices, each declaring the tickets that **block** it.

The issue tracker and triage label vocabulary should have been provided to you. If not, tell the user to run `/setup-agent-workflow`.

When the repo uses the `acceptance` skills, read `docs/agents/acceptance.md` and [the shared acceptance contract](../acceptance/references/acceptance-contract.md) before drafting verification. Missing configuration for that integration is a preparation gap to resolve before assigning unattended readiness. If these skills are not used, retain the repo's existing verification workflow and use the ticket fields below; installing acceptance is not a prerequisite for standalone ticket planning.

If unattended execution is configured, also read `docs/agents/runner.md`. Judge prerequisite providers against its selected execution environment, rather than assuming tools available in this planning session are available to the runner. Keep runner setup gaps distinct from preparation that a ticket can deliver.

## Process

### 1. Gather context

Work from whatever is already in the conversation context. If the user passes a reference (a spec path, an issue number or URL) as an argument, fetch it and read its full body and comments.

Carry forward the spec's testing decisions, quality/taste constraints, references, delegated judgement, and open acceptance questions. Existing user decisions remain settled; the review below addresses only new or unresolved choices.

### 2. Explore the codebase (optional)

If you have not already explored the codebase, do so to understand the current state of the code. Ticket titles and descriptions should use the project's domain glossary vocabulary, and respect ADRs in the area you're touching.

Look for opportunities to prefactor the code to make the implementation easier. "Make the change easy, then make the easy change."

### 3. Draft vertical slices

Break the work into **tracer bullet** tickets.

<vertical-slice-rules>

- Each slice completes a narrow end-to-end behaviour through the layers it actually needs, with its agreed proof — vertical, not a disconnected layer task
- A completed slice is demoable or verifiable on its own
- Each slice is sized to fit in a single fresh context window
- Any prefactoring should be done first

</vertical-slice-rules>

Give each ticket its **blocking edges** — the other tickets that must complete before it can start. A ticket with no blockers can start immediately.

Draft a verification contract for each slice: criterion IDs and expected results, required/advisory status, proof method and evidence, prerequisite providers, applicable references, and required engineering gates. Use project defaults and record task-specific overrides; apply the shared contract when using the acceptance integration. For a selected project test-script workflow, specify which behaviour its test specs must assert; exact spec paths and commands can be bound by `acceptance-plan`. A browser-observation method can use agent capabilities without generating UI specs; a ticket with no agreed UI proof does not acquire a UI-test requirement.

Assign missing verification preparation to this ticket or explicit blockers. A first-page ticket can create its own runnable entry point and verification specs. Unresolved external capabilities, acceptance decisions, or required human intervention remain visible and prevent an AFK-ready label. Checks needing an old-behaviour baseline must say so even when the ticket also introduces new behaviour.

**Wide refactors are the exception to vertical slicing.** A **wide refactor** is one mechanical change — rename a column, retype a shared symbol — whose **blast radius** fans across the whole codebase, so a single edit breaks thousands of call sites at once and no vertical slice can land green. Don't force it into a tracer bullet; sequence it as **expand–contract**. First expand: add the new form beside the old so nothing breaks. Then migrate the call sites over in batches sized by blast radius (per package, per directory), each batch its own ticket blocked by the expand, keeping CI green batch to batch because the old form still exists. Finally contract: delete the old form once no caller remains, in a ticket blocked by every migrate batch. When even the batches can't stay green alone, keep the sequence but let them share an integration branch that all block a final integrate-and-verify ticket — green is promised only there.

### 4. Quiz the user

Present the proposed breakdown as a numbered list. For each ticket, show:

- **Title**: short descriptive name
- **Blocked by**: which other tickets (if any) must complete first
- **What it delivers**: the end-to-end behaviour this ticket makes work
- **How it will be accepted**: the required outcomes, proof methods and evidence, prerequisite providers, and any human approval or delegated taste judgement
- **Readiness**: whether the acceptance contract is settled and its prerequisites have feasible providers

Ask the user:

- Does the granularity feel right? (too coarse / too fine)
- Are the blocking edges correct — does each ticket only depend on tickets that genuinely gate it?
- Should any tickets be merged or split further?
- Are the proposed verification methods and prerequisite providers sufficient, with all required human decisions settled before unattended execution?

Iterate until the user approves the breakdown.

### 5. Publish the tickets to the configured tracker

Publish the approved tickets. **How** depends on the tracker `/setup-agent-workflow` configured — the tickets are the same either way, only the shape of the blocking edges changes:

- **Local files** → write one file per ticket under `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01` in dependency order (blockers first). Each file's "Blocked by" lists the numbers/titles it depends on. Use the per-ticket file template below — one ticket per file, never a single combined file.
- **A real issue tracker (GitHub, Linear, …)** → publish one issue per ticket in dependency order (blockers first) so each ticket's blocking edges can reference real identifiers. Use the platform's native blocking / sub-issue relationship where it has one; otherwise set each ticket's "Blocked by" to the blocking issues.

In either tracker, assign `ready-for-agent` only when required outcomes and proof methods are agreed and prerequisites have feasible providers, with no required live human intervention. Apply the shared readiness rule when using the acceptance integration. For other tickets, record the outstanding decision or prerequisite and retain an appropriate non-ready state using the project's tracker conventions. A ticket can be specified for an agent while still waiting for named blockers; those blockers continue to exclude it from selection.

Work the **frontier**: eligible agent tickets whose blockers are all done. For a purely linear chain that means top to bottom. When using the integrated workflow, point to the configured runner command and any remaining readiness gaps, or to manual `implement`. If unattended execution is wanted but not connected, tell the user to rerun `/setup-agent-workflow`; it can initialise or migrate the integration. `implement` invokes `acceptance-plan` and `acceptance` at the appropriate stages.

Do NOT close or modify any parent issue.

<local-ticket-template>

# <NN> — <Ticket title>

**What to build:** the end-to-end behaviour this ticket makes work, from the user's perspective — not a layer-by-layer implementation list.

**Blocked by:** the numbers/titles of the tickets that gate this one, or "None — can start immediately".

**Status:** <ready-for-agent only when eligible; otherwise the project's non-ready state>

- [ ] AC-1 (required): <condition/action and expected result>
- [ ] AC-2 (required, or explicitly agreed advisory): <expected result>

**Verification:**

| Criterion | Proof and evidence | Prerequisites and provider | Reference |
| --- | --- | --- | --- |
| AC-1 | <assertion/method and retained result> | <available, this ticket, blocking ticket, or unresolved> | <requirement/design; baseline required or not applicable> |

**Required gates and judgement:** <project gates plus additions or authorized exceptions; delegated design judgement and any required human approval>.

</local-ticket-template>

<issue-template>

## Parent

A reference to the parent issue on the tracker (if the source was an existing issue, otherwise omit this section).

## What to build

The end-to-end behaviour this ticket makes work, from the user's perspective — not layer-by-layer implementation.

## Acceptance criteria

- [ ] AC-1 (required): <condition/action and expected result>
- [ ] AC-2 (required, or explicitly agreed advisory): <expected result>

## Verification

| Criterion | Proof and evidence | Prerequisites and provider | Reference |
| --- | --- | --- | --- |
| AC-1 | <assertion/method and retained result> | <available, this ticket, blocking ticket, or unresolved> | <requirement/design; baseline required or not applicable> |

Required gates and judgement: <project gates plus additions or authorized exceptions; delegated design judgement and any required human approval>.

## Blocked by

- A reference to each blocking ticket, or "None — can start immediately".

</issue-template>

In either form, avoid speculative implementation paths or code snippets — they go stale fast. References to existing requirements, designs, test conventions, and execution entry points are appropriate; `acceptance-plan` binds new concrete test and artifact paths. If a prototype produced a snippet that encodes a decision more precisely than prose can (state machine, reducer, schema, type shape), inline it and note briefly that it came from a prototype. Trim to the decision-rich parts — not a working demo, just the important bits.
