---
name: acceptance
description: Judge a delivery against its agreed acceptance contract using reproducible evidence and an independent verdict. Runs after implementation and code review, before final completion. Use to verify work, collect evidence, prove a migration held, or certify an unattended run. Reports passed or held with every required proof gap visible.
---

# Acceptance

Establish what the delivery proves, using the standard agreed before implementation. The result is a report and an explicit delivery verdict.

## Inputs and capabilities

Read [the acceptance contract](references/acceptance-contract.md), `docs/agents/acceptance.md`, and the execution plan linked from the ticket. Read the approved requirements and any referenced artifacts as needed.

When the runner selects the shared Backlog protocol, also read [the unattended report binding](../setup-agent-workflow/references/workflow-protocol.md#acceptance-report-and-receipt). Bind the actual judged implementation revision, host attempt and ticket to the report and required evidence. Keep the existing acceptance judgement and required accounting; the machine receipt records that judgement and does not replace it.

If the plan is absent, recover executable checks from the approved contract and mark them `planned late`. Continue checks that can still be proved. A missing baseline blocks only checks that require an old/new comparison; new behaviour can be judged against its agreed expected result. Missing requirements or project capability declarations are explicit blockers, not permission to invent a standard after seeing the result.

For legacy plans, preserve their requirements and map named test yields to test-backed checks. Account for every legacy `blocked`, `gap`, and `none` entry.

The project supplies these roles through its chosen tools, including agent-provided capabilities where appropriate:

| Role | Supplies |
| --- | --- |
| **reproduce** | Reaching the check's state through inputs, fixtures, or interaction |
| **observe** | Reading the result a user or caller receives |
| **archive** | Saving the observation and execution record |
| **sideband** | Optional console, logs, or network context explaining a result |

Use the required roles for the selected proof method. A test runner can execute assertions and retain a test report; it need not supply browser capabilities. Sideband diagnostics alone do not prove the user-facing outcome.

## 1. Reconcile the plan with the delivery

Read the actual changes, including uncommitted task changes, and account for their observable effects. Add checks for missed agreed requirements, labelled `added at T1`. Keep every required assertion and its original strength; additions cannot introduce unapproved taste requirements.

Recheck prerequisite providers. Capabilities created by this ticket may now make a previously unreachable state verifiable; update that classification with the observed availability. Record unresolved external prerequisites as `blocked`. A preferred tool may be replaced only within the project's agreed alternatives and with equivalent proof.

## 2. Execute and archive the proof

For each check, exercise its declared state and retain the evidence its assertion needs. This can be test output, structured HTTP/CLI results, text, screenshots, DOM, or an interaction record. A temporal claim needs evidence of the sequence, not just its final frame.

For test-backed checks, confirm the named assertions exist, exercise the claim, and ran on this delivery. Record failing assertions as `failed`; missing or inadequate assertions are `gap`; an unavailable execution environment is `blocked`. Existing regression tests can prove preservation without being edited. For new behaviour, establish that the assertion exercises that behaviour rather than merely passing on an unrelated path.

Use the project's configured script and read its case results and artifacts. A zero exit code with a required case absent or skipped leaves that criterion unproven; report the skip's actual reason as a blocker or gap. Writing the test spec is not evidence that it ran.

Run required engineering gates and record their results separately. Archive evidence as it is collected under the declared evidence path, which is gitignored. Record the code revision and any uncommitted task changes the evidence describes.

For baseline comparisons, establish repeatable captures using the agreed comparison and normalisation. Follow any additional repetition or sensitivity requirements from the plan. A tool switch, a less exact comparison, or a missing observation must not silently remove a required dimension of proof.

## 3. Judge against the appropriate standard

Use executable assertions where they can settle the criterion: compare observed fields or behaviour to the expected result, compare a design artifact where agreed, or compare to an old baseline where required. Freeze the applicable thresholds and assertions for this run.

Qualitative judgements go to a **blind judge**: an independent agent given the criterion, its approved rubric and delegated discretion, the actual evidence, and reference artifacts only where applicable. It receives no implementation diff or author rationale. A new feature requires no old screenshot for this judgement. If independent judgement is required but unavailable, record that blocker.

Human approval is a proof method only when explicitly required. Use an existing approval of the relevant delivery artifact or report it as pending; do not substitute an agent verdict for it. During unattended execution, record the handoff rather than wait indefinitely.

Record the actual judge: `program`, `blind`, or `human`. A model-backed assertion is a judgement by a model, even when returned through a testing API. The context that authored the implementation does not supply its own qualitative pass.

## 4. Repair within a bound

A failing check may be repaired and re-verified at most twice. After that, retain its failure and finish evaluating the other checks. The limit applies to this delivery attempt; it is not restarted for each tool fallback.

- Re-run affected checks and required gates on the repaired code; evidence must describe the final delivered state.
- Keep the agreed requirements and references fixed. Record the repair round on which each check passed.
- Run any required sensitivity checks using the planned negative control or an isolated revert. Restore and verify the final implementation before producing its evidence. An unproven required sensitivity check leaves the affected proof incomplete.

An unavailable tool or human decision is a blocker to report, not an invitation to repeatedly retry or restart an interview.

## 5. Report and return

Write the report using [report-format.md](references/report-format.md), then compute **`passed` or `held` using the acceptance contract**. Report generation alone does not satisfy acceptance.

Account for every required criterion and engineering gate. Keep advisory observations and `none` classifications visible, with all failures, blockers, gaps, changes of provider, and any loss of evidence precision explained. A full attempted-check coverage ratio can coexist with required blockers; only the required-outcome verdict controls completion.

Return the verdict, report path, and outstanding actions to the caller. On `held`, preserve the implementation and evidence and leave the ticket open. The caller commits the report and any tracker notes according to the repository's persistence workflow.
