# Acceptance — AFK-P7

verdict: passed
required criteria: 4/4 · required gates: 2/2
coverage: 4/4 · failed: 0 · blocked: 0 · gap: 0 · none: 0

contract: P7 in the approved AFK implementation plan
plan: acceptance/plans/AFK-P7.md
code state: `3c5227fe8a54b0b22bdad125f14f2950578c8071`; subsequent uncommitted P8 plan is outside this executable delivery
environment: Darwin 25.5.0, Node 24.21.0, npm 11.19.0, Backlog 1.51.0, Git 2.50.1 (Apple Git-155); native Sandcastle built public distribution from clean `9679cb9`, accepted executable code `82183fc`
provider changes: none; real Git/Backlog and fake Kimi executable for deterministic integration. No model/authentication call in P7
proof quality: missing retained work, unfrozen prompt, unignored output and missing direct/transitive skill resources were exercised with real negative cases. Two early fixtures used incorrect provider/path assumptions and were corrected against the public API. No visual/performance baseline required.

Evidence paths below are relative to `acceptance/runs/AFK-P7/`.

| Criterion | Required expected result | Proof and judge | Outcome | Round | Evidence |
| --- | --- | --- | --- | --- | --- |
| AC-P7.1 | Native generated entry uses installed shared commands and complete skill resources; missing prerequisites fail before agent execution | Real copied skill directories, import/startup failures and independently generated native entry / program | pass | 1 | `review-resources-red.log`, `review-resources-green.log`, `final-tests.log`, `final-forward-repair-1.log` |
| AC-P7.2 | Explicit merge strategy, finite silent execution, durable exports, correct paths/provider and protocol capability | Native option assertions, 12 generated-entry scenarios, reread 5 exported evidence files after removal, verify 3 retained worktrees / program | pass | 1 | `provider-tag-red.log`, `provider-tag-green.log`, `contract-startup-red.log`, `final-tests.log`, `final-forward-repair-1.log` |
| AC-P7.3 | Done stays in tasks; periodic complete moves to completed with dependency detail intact; archive differs; real readiness and label operations | Real Backlog CLI and committed Git inventory assertions / program | pass | 0 | `backlog-lifecycle.log`, `final-tests.log` |
| AC-P7.4 | Migrated historical copy keeps model/auth, acceptance and historical recovery inputs while replacing active outer wiring | Historical-file SHA-256 comparisons, inert auth construction plus actual native empty-queue runs, retained-work startup stop / program | pass | 0 | `final-migration.log`, `forward-setup-report-final.md` |

## Required gates

`node --test skills/engineering/setup-agent-workflow/scripts/*.test.mjs` exited 0: **51 passed**, zero failed/skipped, 137.04 seconds (`final-tests.log`). `bash .githooks/pre-commit` exited 0 (`final-integrity.log`). `git diff --check` passed.

The additional bound migration command exited 0 with its one actual behavior test passed in 5.28 seconds. Fixture `/private/tmp/afk-setup-migration-iBr9Ji/repo` at `225e309617f6891dad9f3b6953a315c6451b43b9` preserves the old acceptance document, inactive outer script, representative historical outcome/evidence bytes and synthetic log/work sentinels. Both host OAuth and API-key-file branches match the historical pure auth planner, and actual native calls end no-work with zero agent iterations. The original has no retained worktrees; this proof explicitly uses a synthetic retained-work input. It does not replay the historical task queue.

The independent setup fixture is `/private/tmp/setup-forward-cli-rbV29K`, final HEAD `5b2cc3d274a81eb9aa0772012e848447006371b8`, clean. Its final full 12-case run exited 0 in fresh fixtures under `/private/tmp/setup-forward-verification-rkt3dH`. The fake executable receives the unchanged native entry's prompt/argv and uses the installed Kimi adapter. Two independent completed tickets demonstrate continuation; dependent selection is covered by the real shared Backlog tests and P6 integration, and remains required in P8's actual model trial.

## Independent review

### Standards

Initial review found no documented production violation and suggested replacing repeated scenario dispatch with a case table. That test readability change is committed. Final review reports zero remaining findings.

### Spec

Initial review found that SKILL.md-only availability checks omitted mandatory referenced resources. Startup now follows the installed instructions' declared relative inline Markdown links transitively, including cross-skill links, and deduplicates cycles by real path. Real complete skill copies with a missing acceptance contract or transitive runner reference demonstrate pre-launch failure. Final review reports zero remaining findings.

## Repairs and limits

Before acceptance, forward testing exposed the incorrect noSandbox tag, CLI PATH ambiguity and third-party adapter discovery gap; the helper/guide now use the actual provider tag, record launch-environment paths and reuse the existing adapter. Startup prerequisite tests also exposed Git check-ignore's incompatibility with literal pathspec mode; only that path-list command now disables pathspec magic.

Acceptance repair round 1 corrected the external fake harness: iteration status completed means lifecycle completion and can include a retained decision. Its added evidence assertion had wrongly required every such worktree to be removed. The native held outcome was correct and preserved its worktree. The repaired harness tests verification accept versus retain explicitly; the single full rerun passed all 12 scenarios. Initial failure remains in `final-forward.log`; exact repaired command, result and fixture revision are in `final-forward-repair-1-result.json`.

The bundled advisory skill validator still rejects the repository's existing Claude `disable-model-invocation` frontmatter (`advisory-skill-validator.log`). That field is intentional and unchanged; required repository integrity passed. No acceptance criterion was relaxed.

No outstanding P7 action. Real authentication, model skill use/independent review, npm-pack distribution identity and the two dependent real tasks are P8 proof, not established by these fake-executor scenarios. The shared startup helper currently supports the verified host noSandbox path; containers and other trackers retain explicit preparation limits.
