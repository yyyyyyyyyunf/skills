---
name: settle
description: Sharpen a plan by relentless interview, and record what settles — terms into CONTEXT.md, hard-to-reverse calls as ADRs.
disable-model-invocation: true
---

Call the Skill tool twice, for "grilling" and "domain-modeling".

Both must actually load. If you are reading this and have not received the contents of either, call the Skill tool for the missing one before you ask a single question — a session that improvises an interview instead of running `grilling` is not this skill. The tell is a round arriving without a recommended answer attached to each question.

When settling work for implementation, include acceptance in the interview: intended outcomes, important quality and taste constraints, design references, testing seams, and the discretion delegated to the agent. Reuse project defaults in `docs/agents/acceptance.md` when present. Resolve direction and consequential choices here; leave concrete cases and commands for ticket planning and execution. Require final human approval only when the user asks for it, and carry that requirement forward explicitly.
