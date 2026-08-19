---
name: which-skill
description: Ask which skill or flow fits your situation. A router over the skills in this repo.
disable-model-invocation: true
---

# Which skill?

You don't remember every skill, so ask.

A **flow** is a path through the skills. Most paths run along one **main flow**, and two **on-ramps** merge onto it. Everything else is standalone, or runs underneath.

Skills split by **invocation**: the ones you **type** (this router exists for those — you are the index) and the ones the **agent fires on its own** (listed under Underneath and marked where they appear, so you know what is already in effect without reaching for it).

## The main flow: idea → ship

The route most work travels. You have an idea and want it built.

1. **`/settle`** — sharpen the idea by interview. Start here whenever you are **working in a working directory**: it's stateful, retaining what it learns in `CONTEXT.md` and ADRs. (No working directory? Use `/clarify` — see Standalone. Both run the same `grilling` primitive; `settle` is the one that leaves a paper trail, which makes it the better of the two whenever a repo is there to leave it in.)
2. **Branch — can you settle every question in conversation?** If a question needs a runnable answer (state, business logic, a UI you have to see), detour through a prototype, bridged by **`/handoff`** in both directions (a prototype lives in its own directory, which is exactly what `/handoff` is for — see Phase boundaries):
   - **`/handoff`** out, then open a fresh session against that file,
   - **`/prototype`** to answer the question with throwaway code,
   - **`/handoff`** back what you learned, and reference it from the original idea thread.
3. **Branch — is this a multi-session build?**
   - **Yes** → **`/to-spec`** (turn the thread into a spec), then **`/to-tickets`** to split it into tracer-bullet tickets, each declaring its **blocking edges**. How those edges are physically expressed is tracker-specific — see `docs/agents/issue-tracker.md`, written by `/setup-agent-workflow`. Any ticket whose blockers are done can be grabbed: kick off **`/implement`** per ticket, **`/clear`ing context between each one**. Each ticket is self-contained, so the last one's context is disposable.
   - **No** → **`/implement`** right here, in the same context window.

   Either way, **`/implement`** builds each issue by driving `tdd` internally — one red-green slice at a time — then closes out by running `code-review`, a two-axis review (Standards + Spec) of the diff, before committing. Both of those are agent-fired, so you get them without asking; reach for them by name when you want one on its own — a concrete behaviour built test-first with no spec, or a branch reviewed against a fixed point.

### Context hygiene

Keep steps 1–3 in **one unbroken context window** — don't compact or clear until after `/to-tickets` — so the grilling, spec, and tickets all build on the same thinking. Each `/implement` then starts fresh, working from the ticket.

The limit on this is the **smart zone**: the window (~150k tokens on state-of-the-art models) within which the model still reasons sharply. If a session approaches it before `/to-tickets`, don't push on degraded — `/compact` at the nearest phase boundary and carry on (see Phase boundaries).

## On-ramps

A starting situation that generates work, then merges onto the main flow.

- **Bugs and requests piling up** → **`/triage`**. It moves issues through triage roles and produces agent-ready issues, which **`/implement`** later picks up.

  Triage is only for issues **you didn't create** — bug reports, incoming feature requests, anything that arrives raw. Tickets that `/to-tickets` produced are already agent-ready, so **don't triage them**.

- **Something's broken** → `diagnosing-bugs` (agent-fired — describe the breakage and it starts). For the hard ones: the bug that resists a first glance, the intermittent flake, the regression that crept in between two known-good states. It refuses to theorise until it has a **tight feedback loop** — one command that already goes red on *this* bug — then fixes with a regression test. Its post-mortem hands off to **`/improve-codebase-architecture`** when the real finding is that there's no good seam to lock the bug down.

- **A huge, foggy effort — a greenfield project or a huge feature build, too big for one session** → **`/wayfinder`**, the most cognitively demanding flow here. When the way from here to the destination isn't visible yet, it charts a **shared map** of **decision tickets** on the issue tracker and resolves them one at a time — producing **decisions, not deliverables** — until the fog is pushed back and the way is clear. Where **`/settle`** sharpens an idea you can hold in one session, wayfinder is for the idea you can't — and it's slower and denser, so save it for exactly that, never a well-scoped feature.

  When the map clears, **it hands off, it doesn't build**: merge onto the main flow at **`/to-spec`**, which collapses the map's linked decisions into a buildable plan, then `/to-tickets` and `/implement` as usual. Looping the map straight into `/implement` skips that collapse and throws the linked detail away — go straight to `/implement` only when the effort turned out genuinely small.

## Codebase health

Not feature work — upkeep.

- **`/improve-codebase-architecture`** — run whenever you have a spare moment to keep the codebase good for agents to operate in. It surfaces **deepening opportunities**; picking one _generates an idea_ you can take into the main flow at **`/settle`**. It's the survey that finds the candidates; `codebase-design` (below) is the bench you design the chosen one on.
- `codebase-value-audit` (agent-fired) — answers a different question: not "is this well designed" but **"is this much code justified at all"**. Strict LOC accounting, a product-surface inventory, every line attributed to exactly one sub-product, a worth verdict per block. Reach for it when a line count is being used in an argument and nobody agrees what it measures.

## Underneath — agent-fired, you don't have to remember these

Each is the single source of truth for its area, and each runs *beneath* the skills above. Named here so you know what's in effect; reach for one directly only when its own subject, not the process around it, is the problem.

- `domain-modeling` — sharpen the project's *domain* language: challenge a fuzzy term, resolve an overloaded word ("account" doing three jobs), record a hard-to-reverse decision as an ADR. It's the active discipline `/settle` drives to keep `CONTEXT.md` a clean glossary.
- `codebase-design` — the deep-module vocabulary (module, interface, depth, seam, adapter, leverage, locality) for designing a module's *shape*: a lot of behaviour behind a small interface at a clean seam. `tdd` and `/improve-codebase-architecture` both speak it.
- `react-coding` — hard rules for React: re-render prevention, memoization strategy, reconciliation and keys, context splitting, refs and lifecycle, closure traps. In effect whenever you write TSX; its `references/` load per-topic when you are diagnosing a specific performance problem.
- `holding-analytical-judgment` — the corrective for analysis under pushback: **new evidence revises a judgment, new emotion does not**. It runs beneath `code-review`, `diagnosing-bugs`, and any review where the reader is the subject, so a conclusion doesn't soften just because it landed badly.
- `technical-writing` — form, spine, narrator, and anti-slop editing for Chinese technical prose. In effect when you draft an article, a long doc, or a writeup.
- `writing-for-agents` — reference for writing documents agents consume: skills, `AGENTS.md`, pointed-at docs. Information hierarchy, progressive disclosure, completion criteria, leading words, the no-op test.

## Phase boundaries

A **phase** is a chunk of work inside a session — the grilling, the implementation, the QA. At the **boundary** between two of them you have five options, and picking between them is the fuzziest decision in this whole map:

- **Continue** — stay put. Costs nothing, loses nothing.
- **`/clear`** — empty the window, when nothing here matters to what's next.
- **`/handoff`** — write a portable markdown file. Narrow: only for a **new harness**, a **new directory**, a **colleague**, or forking a side task **mid-phase**. What it buys is portability.
- **Subagent** — send a tightly-scoped task to its own window and get a report back.
- **`/compact`** — compress this context and seed a fresh session with it. The **default**, at the bottom of the tree rather than the first reach.

Read [PHASE-BOUNDARIES.md](PHASE-BOUNDARIES.md) for the ordered tree — the five questions, the reasoning behind each branch, and why the primary-source cost makes **Continue** the one to rule out first. Make the decision **at** a boundary; mid-phase, continue or split the rest into subagents.

## Standalone

Off the main flow entirely.

- **`/clarify`** — the same relentless interview as **`/settle`**, but **stateless**: it saves nothing locally and builds no `CONTEXT.md`. Reach for it when you are **not working in a working directory** — sharpening a plan, a design, a piece of writing, anything with no repo under it. If you are in a working directory, use **`/settle`** instead: it runs the same interview and leaves a paper trail, so it is strictly the better one.
- `grilling` (agent-fired) — the interview primitive itself: rounds, the frontier, facts are the agent's job and decisions are yours, and it follows the language you ask in. **`/clarify`** and **`/settle`** are the two named ways in, and `/triage`, `/wayfinder` and `/improve-codebase-architecture` all run it internally. Reach for it directly only when you want the interview with no wrapper around it.
- **`/session-to-skill`** — at the end of a session that taught you something, decide what deserves to outlive it. Classifies the evidence three ways — a reusable **skill**, an **article**, or a **project-local fact** that belongs in this repo's `CLAUDE.md` — then puts each skill candidate through seven gates before any file is created. Its job is as much to *stop* you writing a skill that shouldn't exist as to write the ones that should; it calls `writing-for-agents` for the actual authoring.
- `resolving-merge-conflicts` (agent-fired) — work an in-progress merge or rebase conflict hunk by hunk, resolving by **intent** traced to each side's primary source rather than by picking lines, then finish the operation. It never runs `--abort`. Reach for it when you are already mid-conflict.
- `prototype` (agent-fired) — a small, throwaway program that answers one design question: does this state model feel right, or what should this UI look like. Throwaway is a constraint on how the code is written, not a promise to destroy it: the answer folds into the real code, and the prototype itself is kept as a **primary source** on a `prototype/<name>` branch out of main, pointed at from the implementation issue. It's the detour in step 2 of the main flow, but reach for it any time a design question is hard to settle on paper.
- `research` (agent-fired) — delegate reading legwork to a **background agent**: it investigates a question against **primary sources**, then leaves a cited Markdown file in the repo. Keep working while it reads. The file it produces is something to take *into* the main flow at **`/settle`** — research feeds the thinking, it doesn't replace it.
- **`/to-questionnaire`** — when the thing blocking you isn't in your head or the codebase but in **someone else's**, this writes them a questionnaire to fill in. It's the inverse of **`/clarify`**: instead of interviewing you about the subject, it interviews you about the **send** — who it's going to, what you need back — and aims the questions at the gap. What comes back is material for **`/settle`** or **`/to-spec`**.
- **`/wait-what`** — the corrective for a message that didn't land. Use it mid-conversation, inside any other skill, and the agent re-pitches what it just said with the context you were missing, in plain English, using the `CONTEXT.md` vocabulary. It works after the fact; **`/settle`** is the upfront cure, because a shared language agreed early is what stops the jargon arriving at all.
- **`/teach`** — learn a concept over multiple sessions, using the current directory as a stateful workspace.

## Run-once setup

- **`/setup-agent-workflow`** — run before your first engineering flow in a repo. Configures the issue tracker, triage labels, and doc layout the other skills assume, writing them to `docs/agents/`. Backlog.md is the tracker it proposes when it detects one; GitHub, GitLab, local markdown, and a free-form custom workflow are all supported.
- `git-guardrails-claude-code` (agent-fired) — installs Claude Code hooks that block destructive git commands (`push`, `reset --hard`, `clean`, `branch -D`) before they execute. Once per machine or repo, not per session.
