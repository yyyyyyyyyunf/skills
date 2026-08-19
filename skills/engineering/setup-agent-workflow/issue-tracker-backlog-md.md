# Issue tracker: Backlog.md

Issues and specs for this repo live as Markdown files in a project-local backlog folder, managed by the [`backlog`](https://github.com/MrLesk/Backlog.md) CLI. Every task is a plain `.md` file, so the tracker is diffable and travels with the repo — but **drive it through the CLI, never by hand-editing the files**, or the board index and the frontmatter drift apart.

Task ids carry a configurable prefix (default `TASK-1`). Read commands accept `--json` for stable, scriptable output — prefer it whenever you are parsing rather than reading.

## Prerequisite: the CLI must be reachable

Check once at the start of any session that uses this tracker:

```bash
command -v backlog
```

If it is missing, install it rather than working around it:

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
- **Edit**: `backlog task edit <id>` with the field flags — `--status`/`-s`, `--labels`, `--assignee`/`-a`, `--priority`, `--ac`, `--dod`, `--plan`, `--notes`, `--final-summary`.
- **Comment**: `backlog task edit <id> --comment "<text>"` (add `--comment-author` where the author matters).
- **Close**: set the terminal status (`backlog task edit <id> -s "<done-status>"`). `backlog task archive <id>` moves it out of the active board — archive only when the task should stop being visible, not merely because it is finished.
- **Board / UI**: `backlog board` for the Kanban view, `backlog browser` for the web UI. Both group by **status**.

`--plan` and `--notes` **replace** the field rather than appending. To add to an existing plan, read the current value first (`backlog task view <id> --json`) and write back the combined text.

## Status values

The status vocabulary is per-project. Read the real one before mapping anything onto it:

```bash
backlog config
```

Typical shape is `To Do` → `In Progress` → `Done`. Everywhere below that a status is named, substitute this repo's actual value.

## Triage roles live in labels, not status

The five canonical triage roles (see `triage-labels.md`) map to **labels**, applied with `backlog task edit <id> --labels <role>`. They do **not** map to status.

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
- **Frontier query**: `backlog task list --parent <map-id> --json`, then keep tickets that are not terminal, have no unfinished `dependencies`, and have no assignee. First in id order wins.
- **Claim**: `backlog task edit <id> -a @me -s "<in-progress-status>"` — the session's first write, before any work.
- **Resolve**: `backlog task edit <id> --notes "<answer>" --final-summary "<one-line outcome>" -s "<done-status>"`, then append a context pointer (gist + task id) to the map's Decisions-so-far via `backlog task edit <map-id> -d "<updated body>"`.

## Pull requests as a triage surface

**PRs as a request surface: no.**

Backlog.md is not connected to a forge, so PRs never arrive in it on their own. If this repo does treat external PRs as feature requests, triage them on the forge and open a Backlog.md task for the ones that become work, referencing the PR URL with `--ref`.
