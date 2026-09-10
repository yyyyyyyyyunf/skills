# Acceptance contract

The agreement between planning a ticket and judging its delivery. `to-tickets` gets this agreement reviewed before unattended execution; `acceptance-plan` binds it to the execution environment; `acceptance` judges the evidence.

## Project customisation

`docs/agents/acceptance.md` is the project's editable acceptance configuration: default proof methods, capability providers, tool preferences and alternatives, engineering gates, comparison policies, and artifact paths. The methods below are examples, not a closed list of supported tools or workflows.

A ticket can explicitly override project defaults. Exceptions to project requirements need user authorization; an executing agent cannot relax them to obtain a pass. Record those exceptions with the ticket. The shared contract defines how to carry and judge the agreement; the project and task supply its actual standards.

## What a ticket must settle

For each acceptance criterion, record:

- **ID and expected outcome** — a condition, action, and observable result, or another precise claim someone can accept or reject. Cite the requirement or agreed design reference it comes from.
- **Requirement** — required by default. An advisory observation must be agreed as advisory before implementation; failure is never a reason to make a required item optional.
- **Proof** — what would demonstrate this outcome: a named kind of test assertion, an HTTP/CLI result, browser interaction and observation, or explicitly requested human approval. Name the evidence needed to support the claim.
- **Prerequisites** — state, data, permissions, and capabilities, supplied by the existing environment, this ticket, or named blocking tickets. An unresolved external dependency must be visible.
- **Reference** — the expected result in the requirement; an approved design artifact where relevant; and whether a pre-change baseline is needed to prove preservation.

Also carry forward required engineering gates, the agreed testing seams, and the bounds of delegated judgement. Concrete commands and test/evidence paths can be bound in the execution plan; ticket authors need not invent paths for code that does not exist yet.

### Taste and human judgement

Settle design direction, important quality constraints, references, and delegated discretion during `settle` or ticket review. Within that agreed scope, agents may choose details and independent agents may judge evidence. Human final approval is required only when explicitly requested, and is recorded as a required acceptance item.

A phrase such as "looks good" needs an agreed reference, assessable criteria, or explicit delegation of that judgement. Execution may add checks to cover agreed requirements, but cannot introduce new taste requirements or relax existing ones. In an unattended run, an unresolved decision is a recorded blocker, not an open-ended interview.

### Standards and baselines

References are per check, so a ticket can add a feature and preserve existing behaviour at the same time:

- **New behaviour:** judge against the agreed expected result. A historical baseline is `not applicable`.
- **Design fidelity:** judge against the approved design reference; this need not be a capture of an old implementation.
- **Preservation:** declare the behaviour that must survive and the proof. Existing regression assertions can be valid proof; a claim that compares old and new observations requires a baseline captured before the change.

A spec does not remove a preservation obligation. Record required baselines as captured or missing; `not applicable` is never a substitute for a missing required baseline. Capturing the new implementation cannot recover a lost old baseline.

### Tools and evidence

The project supplies capabilities, preferred tools, and permitted alternatives. A substitute is valid when it can exercise the same state, observe the same outcome, and retain the required evidence. Respect an explicit tool requirement. Record which provider actually ran; a configured preference is not evidence of current availability.

Proof follows the criterion. An assertion over a response can prove an API result; a browser interaction can prove a UI behaviour. A successful build alone cannot prove an agreed interaction. Front-end work does not automatically require UI automation, screenshots, or a particular testing framework. Report only the dimensions the agreed proof supports.

Specific behavioural assertions are acceptance proof. Broad test-suite runs, lint, type-checking, and builds are engineering gates when the project or ticket requires them. Keep both visible without treating a green gate as proof of unrelated outcomes.

## Readiness for unattended implementation

A ticket is `ready-for-agent` when its contract is approved and every required prerequisite has a feasible provider in the intended execution environment: available now, deliverable by this ticket within its scope and permissions, or supplied by a named blocker. Use `docs/agents/runner.md` when a runner is configured; tools in the planning session alone do not establish its capabilities. Unfinished blockers still prevent selection.

Creating the first page, fixture, or verification entry point can be part of the ticket itself. Describe how it will be established and verified; its absence before implementation is not by itself a blocker. An unknown standard, unresolved external capability, or required live human intervention prevents unattended readiness. Publish such work with the outstanding condition visible rather than assigning the AFK-ready label.

Setup completes when project capabilities, preferences, and gaps are declared. It need not install every tool or create a runnable application. Ticket planning owns assigning the missing preparation work.

## Verdict

Per required or advisory check, report one outcome:

| Outcome | Evidence or reason required |
| --- | --- |
| `pass` | Evidence supports the agreed assertion, judged by a program, an independent agent, or the explicitly required human |
| `failed` | The observed result contradicts the assertion |
| `blocked` | Verification or required approval could not run; name the missing capability, state, reference, permission, or decision |
| `gap` | The expected proof is absent or does not establish the claim; identify it |

`none` is a scope classification for changed material with no observable behaviour, not a way to satisfy an acceptance criterion. Name the files and why no entry/output path is affected; applicable engineering gates still apply.

The delivery verdict is **`passed` only when every required criterion and required engineering gate passes**, and the report accounts for all agreed requirements. Missing required baselines, approvals, or required proof-quality checks keep it **`held`**. Advisory failures remain in the report but do not block completion. Neither an empty report nor an unknown contract qualifies as passed.

Report generation and delivery acceptance are separate outcomes. On `held`, preserve the work and evidence, leave the ticket open, and identify the next actions. The consuming workflow persists those records according to its tracker rules; the report does not control an external runner's retry loop.
