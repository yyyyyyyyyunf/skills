# Issue tracker: Backlog.md

Issues and specs for this repo live as Markdown files in a project-local backlog folder, managed by the [`backlog`](https://github.com/MrLesk/Backlog.md) CLI. Every task is a plain `.md` file, so the tracker is diffable and travels with the repo — but **drive it through the CLI, never by hand-editing the files**, or the board index and the frontmatter drift apart.

Task ids carry a configurable prefix (default `TASK-1`). Read commands accept `--json` for stable, scriptable output — prefer it whenever you are parsing rather than reading.

## Prerequisite: the CLI must be reachable

Use the project's configured CLI entry point. When the repo pins the CLI, use it throughout this document and the runner (for example `pnpm exec backlog`); prefer that version to an unrelated global binary. If the configured entry is a global CLI, check once at the start of the session:

```bash
command -v backlog
```

If the selected CLI is missing, install it using the chosen package-manager/global setup rather than working around the tracker. For a global CLI:

```bash
npm i -g backlog.md      # or: bun add -g backlog.md, brew install backlog-md
```

**The npm package is `backlog.md` (with the dot); the command it installs is `backlog`.** If a global install is unwanted, every command below also works as `npx backlog.md <args>` — but never shorten that to `npx backlog`, which resolves to an unrelated third-party package and will appear to work while doing something else entirely.

Prefer the MCP server over shelling out where the harness supports it:

```bash
claude mcp add backlog --scope user -- backlog mcp start
```

With MCP configured, the agent calls tools directly instead of spawning a process per operation. The operations below are identical either way — this file describes what to do, not which transport carries it.

## Conventions

- **Create a task**: `backlog task create "<title>" -d "<description>"`. Add `--ac "<criterion>"` (repeatable) for acceptance criteria, `--priority`, `--type`, `--labels`.
- **Read a task**: `backlog task view <id>` (or the shorthand `backlog <id>`). Add `--json` when parsing.
- **List tasks**: `backlog task list --json`, filtered with `-s "<status>"`, `--labels <label>`, `-a <assignee>`, `--parent <id>`.
- **Search**: `backlog search "<query>"`.
- **Edit**: `backlog task edit <id>` with the field flags — `--status`/`-s`, `--label` (replace all), `--add-label`/`--remove-label`, `--assignee`/`-a`, `--priority`, `--ac`, `--dod`, `--plan`, `--notes`, `--final-summary`.
- **Comment**: `backlog task edit <id> --comment "<text>"` (add `--comment-author` where the author matters).
- **Finish**: set the terminal status (`backlog task edit <id> -s "<done-status>"`) after required acceptance/finalization. Done tasks can remain in `tasks/` and on the board.
- **Collect finished tasks periodically**: `backlog task complete <id>` moves a terminal task to `completed/`; `backlog cleanup` offers age-based interactive collection. This is housekeeping, not each task's completion step. Do not run interactive cleanup inside AFK.
- **Archive**: `backlog task archive <id>` removes a task from the active workflow, for example abandoned or withdrawn work. It is distinct from collecting completed work and is not the routine action for a successful task.
- **Board / UI**: `backlog board` for the Kanban view, `backlog browser` for the web UI. Both group by **status**.

`--plan`, `--notes` and `--final-summary` replace their field. Use the installed CLI's `--append-plan`, `--append-notes` or `--append-final-summary` to append. `--ac` adds criteria; `--acceptance-criteria` replaces all. In Backlog 1.51.0, replacement cannot be combined with `--check-ac` in one invocation; perform those operations separately when required. Do not rewrite agreed criteria during finalization.

Git does not preserve empty directories. In a fresh checkout/worktree, Backlog 1.51.0 `task complete` fails when `backlog/completed/` is absent: create the configured completed directory (`mkdir -p backlog/completed` for the default layout), then use the CLI to collect tasks. Directory preparation does not authorize hand-editing tracker files. Collected tasks remain readable through `task view` and still satisfy completed dependency checks.

## Completion and persistence

Tracker operations write files in this repository; their changes travel with the work only once committed to Git. When completing a ticket, finish all tracker updates before the final task commit, including comments, notes, the final summary and terminal status. For the native AFK receipt protocol, finish implementation/plans/test specs before acceptance and limit post-acceptance changes to the selected task plus its report/receipt. Perform any required parent/map changes before that judged implementation checkpoint or as separately verified work; do not smuggle them into finalization. If the implementation is already committed, make a follow-up commit containing the tracker changes. CLI or MCP success alone does not establish that all of these changes are committed.

## Status values

The status vocabulary is per-project. Read the real one before mapping anything onto it:

```bash
backlog config list
```

Typical shape is `To Do` → `In Progress` → `Done`. Everywhere below that a status is named, substitute this repo's actual value.

## Triage roles live in labels, not status

The five canonical triage roles (see `triage-labels.md`) map to **labels**, applied with `backlog task edit <id> --add-label <role>` while removing the prior/conflicting role with `--remove-label`. Keep scope labels when changing triage roles. They do **not** map to status.

The two are orthogonal axes and collapsing them loses information: a task can legitimately be `In Progress` *and* `needs-info`, and `wontfix` is a triage verdict rather than a workflow stage. The cost is that the Kanban board does not show triage state — query it instead with `backlog task list --labels needs-triage --json`, which is what `/triage` does.

## When a skill says "publish to the issue tracker"

```bash
backlog task create "<title>" -d "<description>" --ac "<criterion>"
```

For a spec, put the acceptance criteria in `--ac` (repeatable) and the definition of done in `--dod` — that is what makes the task verifiable without reading prose. For a plan that is not yet ready to work, `--draft` creates it unpromoted.

## When a skill says "fetch the relevant ticket"

```bash
backlog task view <id> --json
```

The user will normally pass the id directly. Given only a title fragment, `backlog search "<fragment>"` first.

## Wayfinding operations

Used by `/wayfinder`. The **map** is one task; its **children** are the decision tickets. Backlog.md expresses both parentage and blocking natively, so nothing here needs a text-convention fallback.

- **Map**: `backlog task create "<effort>" --labels wayfinder:map -d "<Notes / Decisions-so-far / Fog body>"`. Keep the three-part body in the description and update it with `-d` as decisions land.
- **Child ticket**: `backlog task create "<question>" --parent <map-id> --labels wayfinder:<type>`, where `<type>` is `research`, `prototype`, `grilling`, or `task`. The question goes in the description.
- **Blocking**: `backlog task edit <child> --dep <blocker-id>` (repeatable). A ticket is unblocked when every task it depends on has reached the terminal status.
- **Frontier query**: `backlog task list --parent <map-id> --json`, then inspect `task view <id> --json` for nonterminal leaf tasks, detailed dependencies, readiness and assignee. Backlog 1.51.0 list JSON has no dependencies field; never treat its absence as no blockers. Use completed dependency detail, including collected tasks, and the project's triage/assignee rules. First eligible numeric ID wins.
- **Claim**: `backlog task edit <id> -a @me -s "<in-progress-status>"` — the session's first write, before any work.
- **Resolve**: `backlog task edit <id> --notes "<answer>" --final-summary "<one-line outcome>" -s "<done-status>"`, then append a context pointer (gist + task id) to the map's Decisions-so-far via `backlog task edit <map-id> -d "<updated body>"`.

## Pull requests as a triage surface

**PRs as a request surface: no.**

Backlog.md is not connected to a forge, so PRs never arrive in it on their own. If this repo does treat external PRs as feature requests, triage them on the forge and open a Backlog.md task for the ones that become work, referencing the PR URL with `--ref`.
