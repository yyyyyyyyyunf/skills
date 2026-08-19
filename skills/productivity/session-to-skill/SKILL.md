---
name: session-to-skill
description: Decide what a finished session should leave behind, and write it.
disable-model-invocation: true
---

A session that taught you something leaves three kinds of residue, and they have different homes. Sort the evidence first, then build only what survives the gates.

Most of this skill's value is in what it **stops** you from writing. A capability that fails a gate is not a smaller skill — it is not a skill.

## 1. Sort the evidence

Collect the decision points, the assumptions that turned out wrong, the symptom-to-cause chains, the commands that worked, the safety boundaries you discovered, and the verification you ran. Then sort each item by what it will be *for*:

| Destination | Takes | Never takes |
| --- | --- | --- |
| **Skill** | A repeatable action, a decision boundary, a non-obvious constraint, an observable proof of success | Session chronology, personal reflection |
| **Article** | Context, chronology, the argument, representative failures, interpretation | Exhaustive operating instructions |
| **This repo's `CLAUDE.md`** | Repository-specific commands, ownership, architecture, persistent local conventions | Anything a different repo would also need |

The third row is the one people skip, and skipping it is how a skill gets born that only works in one repo. "The build command is `pnpm dev:spa`" is a fact about a repo, not a capability — it goes in that repo's `CLAUDE.md`, and nothing else needs to happen.

Code volume is a resource-planning signal only. A long session is not evidence that a skill should exist.

## 2. State the thesis, then run the gates

Before creating any file, write this sentence for each candidate:

> This skill helps an agent **[action] [target]** when **[trigger]**, while preserving **[constraint]**, and verifies success through **[observable outcome]**.

If you cannot fill every slot, you do not yet have a candidate. Then every gate must pass:

| Gate | Passes when | If it fails |
| --- | --- | --- |
| **Triggerability** | A concrete future request could activate it | Keep the material in the article |
| **Repeatability** | The action or decision is likely to recur | Article, or the repo's `CLAUDE.md` |
| **Knowledge delta** | It teaches non-obvious procedure, local integration, or a hard-won failure boundary | **Do not create a skill** |
| **Coherence** | One trigger family, one operational target, one primary outcome | Split into independent capabilities |
| **Verifiability** | Success is externally observable | Treat it as reference material |
| **Stability** | The core method survives routine version changes | Move the volatile facts to `references/` |
| **Boundary clarity** | It states its exclusions and stopping conditions | Narrow the capability until it does |

**Knowledge delta** is the gate that fails most often and matters most. A skill restating what the model already does by default costs context load on every turn and changes nothing.

Name an accepted skill with a verb and its target: `split-dokploy-traffic-safely` over `traefik-notes`, `migrate-nextjs-rsc-under-cdn-constraints` over `nextjs-migration`.

## 3. Write it

Call the Skill tool with "writing-for-agents" and follow it. That is the authority on how the file is written — information hierarchy, what gets pushed behind a pointer, completion criteria, leading words, and the no-op test on every line. Its `SKILL-MECHANICS.md` decides the invocation, which also decides how the `description` is written.

Bundle a resource only when its trigger is met, and never create an empty directory for one:

| Resource | Add when |
| --- | --- |
| `scripts/` | An operation is deterministic, fragile, or you have rewritten it more than once |
| `references/` | Schemas, protocols, detailed examples, or volatile facts would otherwise obscure the operational core |
| `assets/` | The skill copies or transforms an output resource |

Then wire it into this repo, per `CLAUDE.md`:

```bash
python3 .githooks/readme-domain-table.py insert README.md <bucket> <name> "<one-line purpose>"
scripts/link-skills.sh
```

## Done when

- Every collected item reached one of the three destinations, or was deliberately dropped.
- Every created skill has a thesis sentence with no empty slots, and passed all seven gates.
- Every rejected candidate's material landed somewhere — the article or a `CLAUDE.md` — rather than evaporating.
- `writing-for-agents` was actually loaded before any skill file was written.
- The README row and symlinks exist, so `pre-commit` passes.
