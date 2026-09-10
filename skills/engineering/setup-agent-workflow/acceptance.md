# Acceptance

This is the project's editable acceptance configuration. Adapt the proof methods, workflows, tools, and requirements to this repo; examples are not mandatory defaults. Tickets carry the acceptance criteria for each delivery, and execution plans bind them to this environment.

## Default proof methods

Describe the preferred way to prove each relevant kind of result: behavioural test assertions, API/CLI checks, browser interaction, design review, or another project-specific method. Mark which choices are defaults and which are requirements. A front end need not use a UI testing framework merely because it has a UI.

Select methods that this project actually uses. UI test scripts and executable UI specs are optional: agent-provided browser observation can be used without either, and work with no agreed UI acceptance uses its other agreed proof methods. An absent UI script alone creates no requirement to install a framework or add tests.

Carry existing project quality constraints and the scope of delegated judgement here when they apply across tickets. Task-specific taste, references, and any explicit final human approval belong in the ticket's contract.

## Capabilities and preparation

Record what was actually observed during setup. An unavailable capability can be selected for future use without claiming it already works. A missing application entry point or tool does not prevent setup from completing; ticket planning must assign preparation work before relying on it. Execution plans recheck availability in the current harness.

| Capability or entry point | Current provider and availability | Preparation still needed |
| --- | --- | --- |
| <relevant test, API, CLI, browser, or review capability> | <available / selected but not yet available / unresolved, with observed provider> | <none, or the work needed> |

The proof method must supply the relevant roles:

- **reproduce:** construct inputs/state and exercise the behaviour.
- **observe:** read the result or evaluate the agreed assertions.
- **archive:** retain results and supporting evidence.
- **sideband:** optional diagnostics explaining a result.

One existing test script can supply several roles. Agent-provided capabilities are valid providers when they can execute the agreed proof and retain its evidence.

## Test specs and execution entry points

Include this section only for methods that run executable test specs through a project script; otherwise omit it. Record:

- **Authoring convention:** test-spec format, discovery location/pattern, and an existing example or local guide to follow.
- **Execution entry point:** the exact project command, relevant working directory, and how to select the required cases.
- **Preparation:** service startup, fixtures, environment variables or credential references, and whether the script manages them. Record references, not secret values.
- **Result contract:** how to identify executed cases, assertion failures, skipped cases, and the report/evidence paths. A zero exit code with the expected tests missing is not proof.

The agent creates or updates these test specs as implementation work, deriving their assertions from the approved ticket. `acceptance` executes the configured entry point and reads its results. These executable test specs are distinct from the product requirement document produced by `to-spec`.

For example, a project may use Midscene specs behind a user-provided npm script. Record that project's conventions and script rather than requiring the acceptance agent to drive Midscene APIs itself. The same contract can describe Playwright, an API test suite, or a custom runner.

## Provider preferences and alternatives

Prefer the configured project execution entry point. Record any mandatory provider and the alternatives the user permits. An agent may substitute an allowed provider only when it preserves the agreed state, assertion, and evidence; report the provider actually used.

Examples of project choices: a fixed UI-test script with no substitute; a preferred browser tool with agent browser capabilities allowed as fallback; or an HTTP test suite for a service. Fill in this project's choice instead of adopting an example automatically.

## Required engineering gates

List the project's actual required gates and execution commands, or point to their authoritative repository configuration. Tickets may add required gates. Record authorized exceptions with the affected ticket.

Behavioural assertions can directly prove acceptance criteria. Whole-suite runs, builds, lint, and type-checks remain separately reported gates when required.

## Comparison and proof-quality policies

Record thresholds and normalisation only for comparisons the project uses. Old/new comparisons need reproducible baselines; new-feature assertions can use expected results without one. Put per-delivery reference choices in the ticket/plan.

Record any required repetition, negative controls, or sensitivity sampling, with the methods they apply to. For sampled checks, specify a safe procedure and sample size capped at the available checks. Leave inapplicable policies out; do not impose pixel thresholds or code-revert sampling on every proof method.

## Paths

| Artifact | Default path | Git |
| --- | --- | --- |
| Plan | `acceptance/plans/<ticket-or-delivery-id>.md` | committed; link from the ticket |
| Baseline | `acceptance/baseline/<ticket-or-delivery-id>/` | committed when the checks require it |
| Evidence | `acceptance/runs/<ticket-or-delivery-id>/<run-id>/` | gitignored |
| Report | `acceptance/reports/<ticket-or-delivery-id>-<run-id>.md` | committed; link from the ticket |

Adapt the roots to this project. Add the evidence root to `.gitignore`. A new run has a distinct report and evidence directory; record the code state each describes.

## Multiple surfaces or packages

Where capabilities differ, declare them separately even if they share one repo. A web client may use generated UI specs and a project test script, while an API uses seeded requests and JSON assertions. Each declaration supplies its own entry points and any differing policies or paths.
