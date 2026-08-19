---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
disable-model-invocation: true
---

Implement the work described by the user in the spec or tickets.

Before touching any code, call the Skill tool with "acceptance-plan" to fix what counts as done. When the work must preserve behaviour that already exists — a migration, a refactor, a dependency bump — it also freezes the baseline, which is only samplable while the old code is still intact.

Use /tdd where possible, at pre-agreed seams.

Run typechecking regularly, single test files regularly, and the full test suite once at the end.

Once done, use /code-review to review the work.

Then call the Skill tool with "acceptance" to verify it against the plan and report coverage. Review reads the diff, so its findings are the cheapest to act on; acceptance runs the code, and re-capturing evidence is expensive enough to be worth spending after review has settled.

Commit your work to the current branch.
