# Working in this repo

Skills live in two buckets under `skills/`:

- `engineering/` — daily code work
- `productivity/` — non-code workflow tools

One skill per directory, `skills/<bucket>/<name>/SKILL.md`, plus optional `references/`, `scripts/`, or sibling `*.md` files. The frontmatter `name:` must equal the directory name — `pre-commit` checks this.

Split a third bucket only when one of these grows past roughly 25 rows. Two tables of 10–20 still scan in one screen; a bucket holding one skill is pure overhead.

## Adding a skill

1. Create `skills/<bucket>/<name>/SKILL.md`.
2. Decide the invocation (below) and write the matching frontmatter.
3. Add the README row:
   ```bash
   python3 .githooks/readme-bucket-table.py insert README.md <bucket> <name> "<one-line purpose>" <user|model>
   ```
4. Link it into the harness directories:
   ```bash
   scripts/link-skills.sh
   ```

For the question of whether a capability deserves to be a skill at all, call the Skill tool with "session-to-skill" — it holds the seven gates. For how to write the file, call the Skill tool with "writing-for-agents".

## Choosing the invocation

Make a skill **model-invoked** only when the agent must be able to reach it on its own, or another skill must call it. Its `description` then stays loaded on every turn — permanent context cost, in exchange for that reach — and keeps rich trigger phrasing so auto-invocation fires.

Otherwise make it **user-invoked**: set `disable-model-invocation: true`, and rewrite the `description` as a human-facing one-liner with the trigger list stripped. It costs no context; the price is that you are the index, which is what `which-skill` exists to relieve.

Reuse is not the test. "Could the agent usefully reach for this by itself?" is.

Only `disable-model-invocation` is written — it is a Claude Code field. On Codex, Cursor, and Kimi Code a user-invoked skill silently degrades to model-invoked, which is acceptable: the worst case is the agent firing something you meant to type.

## Naming a skill in another skill

Write `Call the Skill tool with "X"` — naming the tool, without a leading slash.

Most harnesses expose skill invocation as a tool the model calls, so spelling that out lands far more reliably than dropping a `/name` into prose and hoping it reads as a command. Omitting the slash also keeps the instruction harness-neutral.

The Skill tool takes one skill per call. A step needing two is two calls: write `Call the Skill tool twice, for "grilling" and "domain-modeling"` — never "call it with X and Y", which reads as one call taking both.

This applies to **operative** instructions — a skill telling the agent to go run another skill now. Router prose that merely names skills for a human to pick from (`which-skill`, the README) is not invoking anything, so it keeps `/name` as a plain label.

A user-invoked skill can never be reached this way, by any skill, including via the Skill tool. When a step depends on one, tell the human to run it: "tell the user to run `/setup-agent-workflow`".
