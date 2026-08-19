---
name: technical-writing
description: Form, spine, and anti-slop editing for technical prose. Use when drafting or revising an article, a blog post, a long-form doc, a writeup of a debugging session, or a design rationale — and when a draft reads like AI wrote it.
---

Technical prose for human readers. (For documents an *agent* reads — skills, `AGENTS.md`, pointed-at docs — call the Skill tool with "writing-for-agents" instead; the two share no rules.)

One sentence carries the whole standard: **keep a sentence only when it contributes an observed fact, evidence, causal reasoning, a constraint or trade-off, a decision, a reproducible action, or a concrete consequence.** Delete sentences whose only job is to announce the topic, inflate importance, manufacture surprise, smooth a transition, or repeat a conclusion. Preserve the factual proposition; remove its rhetorical wrapper. Never swap a banned phrase for a synonym.

## References

| File | When to load |
| --- | --- |
| [`references/writing-style.md`](references/writing-style.md) | Before drafting or revising any prose. Carries the reading contract, the three article spines (`pattern` / `process` / `system`) and their per-spine rules, title and slug derivation, narrator choice, section design, narrative movement, defending a technical viewpoint, endings, punctuation, the eight hard bans, and the Chinese slop search. |
| [`references/visuals.md`](references/visuals.md) | When the prose raises a question a picture would answer faster, or you are choosing between Excalidraw and Mermaid. Carries the explanation contract each visual owes, scope and progression control, and authoring rules. |

Load `writing-style.md` before the first paragraph, not after — the spine choice governs section design, and retrofitting a spine means rewriting.

## Done when

- The draft has one named spine, and its sections follow that spine's rules.
- Every paragraph opens on an observation, constraint, action, or result — never on an announcement of its own topic.
- The eight hard bans survive a read-through, and the Chinese slop search returns no unresolved hit.
- Each visual answers one named question, and no two make the same point. Zero visuals is correct when prose, code, or a table explains it without forcing the reader to simulate.
- The ending lands on the last technical point. No recap, no CTA, no borrowed profundity.
