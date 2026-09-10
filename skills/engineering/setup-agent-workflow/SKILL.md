---
name: setup-agent-workflow
description: Configure or upgrade this repo's issue tracker, domain docs, acceptance workflow, and optional unattended runner integration.
disable-model-invocation: true
---

# Setup agent workflow

Scaffold the per-repo configuration that the engineering skills assume:

- **Issue tracker** — where issues live (Backlog.md, GitHub, GitLab, local markdown, or a workflow you describe)
- **Triage labels** — the strings used for the five canonical triage roles
- **Domain docs** — where `CONTEXT.md` and ADRs live, and the consumer rules for reading them
- **Acceptance** — project proof methods and capabilities, when the acceptance skills are used
- **Unattended execution** — optional integration with an existing or selected runner

This is a prompt-driven skill, not a deterministic script. Explore, present what you found, confirm with the user, then write.

On a rerun, migrate the existing configuration in place. Keep settled preferences and project customisations; ask only about unresolved choices or conflicting requirements. Existing session authorization carries forward.

## Process

### 1. Explore

Look at the current repo to understand its starting state. Read whatever exists; don't assume:

- `git remote -v` and `.git/config` — is this a GitHub repo? Which one?
- `backlog.config.yml` at the repo root, or a `backlog/` directory — sign that Backlog.md is already the tracker here. If either exists, use the project's CLI entry point with `backlog config list` to read the real status vocabulary; Section A needs it. Prefer a pinned project CLI when present; otherwise check `command -v backlog`. A repo can carry a `backlog/` folder without an installed CLI.
- `AGENTS.md` and `CLAUDE.md` at the repo root — does either exist? Is there already an `## Agent skills` section in either?
- `CONTEXT.md` and `CONTEXT-MAP.md` at the repo root
- `docs/adr/` and any `src/*/docs/adr/` directories
- `docs/agents/` — does this skill's prior output already exist?
- `.scratch/` — sign that a local-markdown issue tracker convention is already in use
- Is the `triage` skill installed? (a `triage` skill folder alongside this one, or `triage` in your available skills.) This decides whether Section B runs at all.
- Is the `acceptance` skill installed? (same test.) This decides whether Section D runs at all. If it is, probe project execution entry points and current harness capabilities: dev/start and test scripts, existing test-spec formats and discovery rules, reports, browser/HTTP/CLI tools, and agent-provided observation capabilities. Distinguish installed tools from verified runnable entry points, and selected future tools from current capabilities.
- Runner entry points — inspect package scripts, dependencies and lockfiles, `.sandcastle/`, and any declared runner config. Follow the actual entry script to its prompts and hooks; a directory containing only old logs is not an active integration. Read scripts before running anything: prompt expansion, hooks, and cleanup commands may mutate state. Inspect configuration without exposing credentials.
- Monorepo signals — a `pnpm-workspace.yaml`, a `workspaces` field in `package.json`, or a populated `packages/*` with its own `src/`. Present only in a genuinely large multi-package repo; their absence means single-context, which is almost every repo.

### 2. Present findings and ask

Summarise what's present and what's missing. Then take the sections in order — one section, one answer, then the next.

Lead each section with the recommended answer so the user can accept it in a word. Give a one-line explainer only when the choice genuinely branches; skip the section entirely when exploration already settled it (Section B when `triage` isn't installed, Section C when there's no monorepo).

**Section A — Issue tracker.**

> Explainer: The "issue tracker" is where issues live for this repo. Skills like `to-tickets`, `triage`, and `to-spec` read from and write to it — they need to know whether to call `backlog task create`, `gh issue create`, write a markdown file under `.scratch/`, or follow some other workflow you describe. Pick the place you actually track work for this repo.

Default posture: **if exploration found `backlog.config.yml` or a `backlog/` directory, propose Backlog.md** — a tracker already in the repo beats one inferred from the remote. Otherwise, if a `git remote` points at GitHub, propose that; at GitLab (`gitlab.com` or self-hosted), propose GitLab. Offer:

- **Backlog.md** — issues live as Markdown files in a project-local `backlog/` folder, driven by the [`backlog`](https://github.com/MrLesk/Backlog.md) CLI (native parent/child, dependencies, labels, acceptance criteria, and an MCP server). Needs `npm i -g backlog.md` once per machine; offer to run it when exploration found the CLI missing.
- **GitHub** — issues live in the repo's GitHub Issues (uses the `gh` CLI)
- **GitLab** — issues live in the repo's GitLab Issues (uses the [`glab`](https://gitlab.com/gitlab-org/cli) CLI)
- **Local markdown** — issues live as files under `.scratch/<feature>/` in this repo (good for solo projects or repos without a remote, and with no CLI to install)
- **Other** (Jira, Linear, etc.) — ask the user to describe the workflow in one paragraph; the skill will record it as freeform prose

Backlog.md and local markdown both store issues as files in the repo. Pick Backlog.md when you want a CLI, a board, and machine-checkable structure; pick local markdown when you want no dependency at all.

Record the choice in `docs/agents/issue-tracker.md`. The GitHub and GitLab templates carry a "PRs as a request surface" flag, defaulted **off** — leave it off and don't raise it; a user who wants external PRs in the triage queue can flip the flag in the file later.

**Section B — Triage label vocabulary.** Skip this section entirely if the `triage` skill isn't installed (exploration told you) — an uninstalled skill needs no labels.

If it is installed, ask exactly one question:

> Do you want to keep the default triage labels? (recommended: **yes**)

The defaults are the five canonical roles, each label string equal to its name: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. On **yes**, write them as-is. Only if the user says no — usually because their tracker already uses other names (e.g. `bug:triage` for `needs-triage`) — collect the overrides so `triage` applies existing labels instead of creating duplicates.

**Section C — Domain docs.** Default to **single-context** — one `CONTEXT.md` + `docs/adr/` at the repo root. This fits almost every repo; write it without asking.

Offer **multi-context** — a root `CONTEXT-MAP.md` pointing to per-context `CONTEXT.md` files — only when exploration found monorepo signals. Then confirm which layout they want.

**Section D — Acceptance.** Skip this section entirely if the `acceptance` skill isn't installed (exploration told you) — an uninstalled skill needs no declaration.

> Explainer: `docs/agents/acceptance.md` is this project's editable acceptance configuration: proof methods, execution entry points, tool preferences and alternatives, required gates, and artifact paths. `to-tickets` uses it when proposing how to verify each ticket; `acceptance-plan` binds that agreement to the execution environment; `acceptance` judges the evidence. Different projects can supply different workflows without changing those skills.

Read [the shared acceptance contract](../acceptance/references/acceptance-contract.md) for readiness and judgement rules. Setup declares capabilities and preparation gaps; it can complete before the application or its selected test tools exist. Ticket planning assigns the missing work to this ticket or explicit blockers.

Present a draft of the file rather than a list of questions — most of it is discoverable, and the user's job is to correct it. Fill it from exploration:

- **Default methods and requirements** — the proof methods and engineering gates this project uses. Carry forward existing quality constraints and delegated judgement. Distinguish defaults a ticket may override from requirements whose exceptions need user authorization.
- **Capabilities and gaps** — what supplies *reproduce*, *observe*, and *archive*, with optional *sideband* diagnostics, for each relevant proof method. State which providers are available, selected but not yet available, or unresolved. A project test script may supply several roles; an agent's built-in capabilities may also supply them. Record missing preparation without pretending it has run.
- **Test-spec workflow, when selected** — where the agent should create or update executable test specs, the local format and examples, the exact project execution command, and how to read executed cases, assertions, skips, and reports. Prefer an existing user-provided script to inventing a new tool integration. Omit this section for methods that do not use test specs; an absent UI script does not require creating one. Product specs and executable test specs are different artifacts.
- **Provider preferences and alternatives** — respect fixed execution entry points or required tools. Otherwise record the user's preferred provider and permitted substitutes; alternatives must preserve the agreed proof. A selected tool does not have to be installed during setup.
- **Comparison and proof-quality policies** — applicable thresholds, normalisation, repetition, and sensitivity requirements. Preserve existing project requirements; ask only about relevant unresolved choices. No universal pixel threshold or mandatory UI sampling applies to every project.
- **Four artifact roots** — plan, baseline, and report are committed; evidence is gitignored. Defaults: `acceptance/plans/`, `acceptance/baseline/`, `acceptance/reports/`, and `acceptance/runs/`. Use ticket/delivery IDs and run IDs as in the seed template, and add the evidence root to `.gitignore`.

Declare separately for surfaces or packages whose capabilities differ. A front end and backend may use different proof methods even within a single package.

Keep per-delivery criteria out of this project configuration. `to-tickets` gets their outcomes, proof methods, and prerequisite providers agreed with the user; `acceptance-plan` binds concrete execution details and captures only the baselines those checks require.

**Section E — Unattended execution.** This is optional and independent of the tracker choice. Carry forward an existing runner or the user's stated choice. If neither exists, offer manual execution as the default, with Sandcastle or another runner as alternatives. Manual execution completes setup without runner files or dependencies.

For an existing or selected runner, read [unattended execution](references/unattended-execution.md). For Sandcastle, also read [its adapter guide](references/sandcastle.md). Reuse its initialization and execution APIs; adapt the project prompt to hand each eligible ticket to `implement`, and wire the per-attempt result to the runner's continuation decision. Installing a runner does not make skills or acceptance tools available inside its execution environment.

This integration requires `implement` and its subskills/configuration. If Section D was skipped because acceptance is unavailable, record that execution prerequisite and keep the integration blocked; do not emit a working acceptance pointer to an absent file or enable a generic fallback loop.

Draft `docs/agents/runner.md` using [runner.md](runner.md), together with the actual entry-script, prompt, and artifact-storage changes. Inspect existing open tickets and duplicated workflow rules for migration gaps. Settle what existing requirements mean before changing them; a missing UI tool does not authorize dropping a required UI check. Report integration verification and queue readiness separately.

### 3. Confirm and edit

Show the user a draft of:

- The `## Agent skills` block to add to whichever of `CLAUDE.md` / `AGENTS.md` is being edited (see step 4 for selection rules)
- The contents of `docs/agents/issue-tracker.md`, `docs/agents/domain.md`, `docs/agents/triage-labels.md` (the last only when `triage` is installed), and `docs/agents/acceptance.md` (only when `acceptance` is installed)
- When Section E selects a runner: `docs/agents/runner.md`, proposed runner changes, and any existing-ticket contract/readiness corrections. Keep unresolved requirements visible rather than inventing their answers.

Let them edit before writing.

### 4. Write

**Pick the file to edit:**

- If `CLAUDE.md` exists, edit it.
- Else if `AGENTS.md` exists, edit it.
- If neither exists, ask the user which one to create — don't pick for them.

Never create `AGENTS.md` when `CLAUDE.md` already exists (or vice versa) — always edit the one that's already there.

If an `## Agent skills` block already exists in the chosen file, update its contents in-place rather than appending a duplicate. Preserve surrounding user edits except for specific conflicting workflow rules whose migration was included in the approved draft.

The block:

```markdown
## Agent skills

### Issue tracker

[one-line summary of where issues are tracked]. Before reading or updating tickets, read `docs/agents/issue-tracker.md` for operations and persistence rules.

### Triage labels

[one-line summary of the label vocabulary]. See `docs/agents/triage-labels.md`.

### Domain docs

[one-line summary of layout — "single-context" or "multi-context"]. See `docs/agents/domain.md`.

### Acceptance

[one-line summary of this project's acceptance methods]. Before drafting ticket verification or running acceptance, read `docs/agents/acceptance.md` for project workflows, capabilities, and requirements.

### Unattended execution

[one-line summary of the selected runner]. Before configuring or using it, read `docs/agents/runner.md` for its entry point, per-attempt result, and stopping rules.
```

Include the `### Triage labels` sub-block, and write `docs/agents/triage-labels.md`, only when `triage` is installed and Section B ran. When it isn't, both are omitted. The `### Acceptance` sub-block and `docs/agents/acceptance.md` follow the same rule for the `acceptance` skill and Section D.

Include `### Unattended execution` and write `docs/agents/runner.md` only when a runner is selected. When switching to manual execution, retire obsolete runner pointers and automatic entry points within the approved scope; preserve user work and artifacts.

Then write the docs files using the seed templates in this skill folder as a starting point:

- [issue-tracker-backlog-md.md](./issue-tracker-backlog-md.md) — Backlog.md issue tracker
- [issue-tracker-github.md](./issue-tracker-github.md) — GitHub issue tracker
- [issue-tracker-gitlab.md](./issue-tracker-gitlab.md) — GitLab issue tracker
- [issue-tracker-local.md](./issue-tracker-local.md) — local-markdown issue tracker
- [triage-labels.md](./triage-labels.md) — label mapping (only if `triage` is installed)
- [domain.md](./domain.md) — domain doc consumer rules + layout
- [acceptance.md](./acceptance.md) — acceptance roles, thresholds, normalisation, paths (only if `acceptance` is installed)
- [runner.md](./runner.md) — project runner entry, handoff, result protocol, and verification (only when selected)

Every tracker document must include **Completion and persistence** rules: where tracker updates are stored, what makes them durable, and their required order relative to Git commits. Keep tracker-specific ordering in this document so consuming skills can delegate to it. Preserve these rules when adapting a seed template or updating an existing document.

For "other" issue trackers, write `docs/agents/issue-tracker.md` from scratch using the user's description, including these persistence rules.

**If Backlog.md was chosen, also make the tracker real** — writing the doc that describes a tracker is not the same as having one:

1. Reuse the pinned project CLI when present. If the chosen entry point is unavailable, install it through the project's package manager, or use `npm i -g backlog.md` when a global CLI was selected. A missing global binary does not require a global install when the project CLI works.
2. Initialise the tracker if no `backlog/` directory or `backlog.config.yml` exists: `backlog init "<project name>"` through the selected entry point.
3. Read the real status vocabulary with `backlog config list` through the selected CLI entry point, and write those exact values into `docs/agents/issue-tracker.md` wherever the template names a status — the template ships with `To Do` / `In Progress` / `Done` as a placeholder shape, not as fact. Bare `backlog config` starts interactive configuration rather than a read-only query.
4. Offer the MCP server: `claude mcp add backlog --scope user -- backlog mcp start`. It replaces a process spawn per operation with a direct tool call. Offer it; don't run it unasked, since it edits the user's harness config rather than this repo.

When Section E selected a runner, also implement the approved adapter changes: initialise only for first use, update the real entry script and prompts, wire result validation and continuation, and configure durable artifacts. Apply agreed existing-ticket corrections through the tracker. Writing `docs/agents/runner.md` alone does not establish the integration.

### 5. Verify and hand off

Check generated links, invocation paths, and consistency across the project docs. When a runner was selected, perform the adapter verification in the unattended execution guide. Fix failures in the configuration within scope; name external preparation or unresolved decisions that remain.

Report which configuration was created or migrated, which checks actually ran, and any remaining preparation. Configuration completion does not claim that selected future capabilities are runnable. For a runner, distinguish integration `verified`, `unverified`, or `blocked` from queue `ready`, `empty`, or `blocked`; use `unknown` when the queue could not be read. Never describe a failed tracker read as an empty queue.

Give the actual next command or outstanding action. Users may edit `docs/agents/*.md` directly or rerun setup to adopt workflow updates, change preferences, or repair runner integration. In the integrated flow, `implement` invokes acceptance planning and acceptance without separate manual steps.
