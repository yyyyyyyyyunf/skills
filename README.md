# Skills

My agent skills for Claude Code, Codex, Cursor, and Kimi Code.

## Install

```bash
npx skills@latest add yyyyyyyyyunf/skills
```

For local development, `scripts/link-skills.sh` symlinks every skill into the harness directories, so a `git pull` updates them all in place. Add `--project <dir>` to also link into `<dir>/.cursor/skills/`, which is the only level Cursor reads.

## Invocation

Every skill is one of two kinds, and the difference is who can reach it:

- **`user`** — only you, by typing its name. Costs no context, but you have to remember it exists. Start at [`which-skill`](skills/engineering/which-skill/SKILL.md), the router over everything here.
- **`model`** — the agent fires it on its own when a task fits, and other skills can call it. Its description stays loaded every turn, which is the price of that reach.

## Engineering

> Daily code work.

| Skill | Purpose | Invocation |
| ----- | ------- | ---------- |
| [`settle`](skills/engineering/settle/SKILL.md) | Interview a plan until it holds, recording terms in `CONTEXT.md` and hard calls as ADRs | user |
| [`code-review`](skills/engineering/code-review/SKILL.md) | Review changes since a fixed point on two axes: repo standards and originating spec | model |
| [`codebase-design`](skills/engineering/codebase-design/SKILL.md) | Deep-module vocabulary — depth, seams, adapters — for designing a module's shape | model |
| [`codebase-value-audit`](skills/engineering/codebase-value-audit/SKILL.md) | Is this much code justified? Strict LOC accounting, every line attributed, verdict per block | model |
| [`diagnosing-bugs`](skills/engineering/diagnosing-bugs/SKILL.md) | Hard bugs and perf regressions — refuses to theorise before a tight red feedback loop exists | model |
| [`domain-modeling`](skills/engineering/domain-modeling/SKILL.md) | Actively sharpen the project's domain language; write the glossary and ADRs as terms resolve | model |
| [`git-guardrails-claude-code`](skills/engineering/git-guardrails-claude-code/SKILL.md) | Install hooks that block destructive git commands before they execute | model |
| [`implement`](skills/engineering/implement/SKILL.md) | Build a ticket end to end, driving TDD internally and closing with a code review | user |
| [`improve-codebase-architecture`](skills/engineering/improve-codebase-architecture/SKILL.md) | Survey the codebase for deepening opportunities and present them as candidates | user |
| [`prototype`](skills/engineering/prototype/SKILL.md) | Throwaway program that answers one design question talking cannot settle | model |
| [`react-coding`](skills/engineering/react-coding/SKILL.md) | Hard rules for React: re-renders, memoization, keys, context, refs, closures | model |
| [`research`](skills/engineering/research/SKILL.md) | Delegate reading legwork to a background agent; get back a cited Markdown file | model |
| [`resolving-merge-conflicts`](skills/engineering/resolving-merge-conflicts/SKILL.md) | Resolve an in-progress merge by intent traced to each side's source, never by picking lines | model |
| [`setup-agent-workflow`](skills/engineering/setup-agent-workflow/SKILL.md) | Run once per repo: configure the issue tracker, triage labels, and doc layout | user |
| [`tdd`](skills/engineering/tdd/SKILL.md) | Test-driven development, one red-green slice at a time | model |
| [`to-spec`](skills/engineering/to-spec/SKILL.md) | Collapse the current thread into a spec and publish it to the tracker | user |
| [`to-tickets`](skills/engineering/to-tickets/SKILL.md) | Split a spec into tracer-bullet tickets, each declaring its blocking edges | user |
| [`triage`](skills/engineering/triage/SKILL.md) | Move incoming issues through triage roles until they are agent-ready | user |
| [`wayfinder`](skills/engineering/wayfinder/SKILL.md) | Chart a map of decision tickets for an effort too big to hold in one session | user |
| [`which-skill`](skills/engineering/which-skill/SKILL.md) | Router over every skill here — start here when you forget what exists | user |

## Productivity

> Non-code workflow tools.

| Skill | Purpose | Invocation |
| ----- | ------- | ---------- |
| [`clarify`](skills/productivity/clarify/SKILL.md) | The same interview as `settle`, stateless — for when there is no repo underneath | user |
| [`grilling`](skills/productivity/grilling/SKILL.md) | The interview primitive: rounds, the frontier, facts are the agent's job and decisions are yours | model |
| [`handoff`](skills/productivity/handoff/SKILL.md) | Compact this session into a document a cold agent can continue from | user |
| [`holding-analytical-judgment`](skills/productivity/holding-analytical-judgment/SKILL.md) | Under pushback, new evidence revises a judgment and new emotion does not | model |
| [`session-to-skill`](skills/productivity/session-to-skill/SKILL.md) | Decide what a finished session should leave behind — and mostly, that it should leave no skill | user |
| [`teach`](skills/productivity/teach/SKILL.md) | Learn a concept across sessions, using the current directory as a stateful workspace | user |
| [`technical-writing`](skills/productivity/technical-writing/SKILL.md) | Form, spine, and anti-slop editing for technical prose | model |
| [`to-questionnaire`](skills/productivity/to-questionnaire/SKILL.md) | Turn a decision that needs someone else's knowledge into a questionnaire for them | user |
| [`wait-what`](skills/productivity/wait-what/SKILL.md) | That last message did not land — re-pitch it in plain language | user |
| [`writing-for-agents`](skills/productivity/writing-for-agents/SKILL.md) | How to write anything an agent consumes: skills, `AGENTS.md`, pointed-at docs | model |

## Adding a skill

See [CLAUDE.md](CLAUDE.md). A `pre-commit` hook enforces the parts that fail silently; enable it once per clone:

```bash
git config core.hooksPath .githooks
```

## License

MIT — see [LICENSE](LICENSE), which also carries the third-party notices for the skills that came from elsewhere.
