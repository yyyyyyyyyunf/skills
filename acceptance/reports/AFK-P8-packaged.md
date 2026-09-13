# Acceptance — AFK-P8

verdict: passed
required criteria: 4/4 · required gates: 8/8
coverage: 4/4 · failed: 0 · blocked: 0 · gap: 0 · none: 0

contract: P8 in [the approved implementation plan](../../docs/plans/afk-workflow-implementation.md)
plan: [AFK-P8](../plans/AFK-P8.md); negative controls and the explicit strict-ancestor proof were added at T1 to cover existing requirements
code state: skills/proof `14cc1ec` (full revision in `delivery-checkpoints.json`), clean at checkpoint `7170130`; shared workflow executable `3c5227fe8a54b0b22bdad125f14f2950578c8071`; Sandcastle source `9679cb9d8dee35d90209c0a9d371b8aadbc5bbec`, accepted executable `82183fc3a94ef1f2b8effbb3dd314947827f2c07`. Only this report and progress documentation follow those tested checkpoints.
provider changes: none. Actual native launches use Node 24.21.0, Kimi 0.42.0, `sandcastle-agent-kimi` 0.1.1, host OAuth alias `kimi-code/k3` with apiKey omitted, noSandbox and Backlog 1.51.0 on Darwin 25.5.
proof-quality results: both positive host proofs and nine isolated package/identity corruption controls passed. The second real run is the retained negative control for same-commit tests. Independent replay of the final trial's test commits produced the expected behavior failures before implementation, with prior behavior passing; all ten final assertions passed without skips.

Evidence paths below are relative to `acceptance/runs/AFK-P8/`. Raw evidence is gitignored; reports, plans and executable host proofs are committed. These are observations of the completed trial, not another queue runner.

| Criterion | Requirement / expected result | Proof and judge | Outcome | Round | Evidence |
| --- | --- | --- | --- | --- | --- |
| AC-P8.1 | Native packaged entry executes two real dependent tasks through implementation, independent Standards/Spec review, acceptance and committed Done state | Actual Kimi sessions, named CLI assertions, committed history and Backlog reads / program, with independent model reviews | pass | 2 | `real-tasks-run-3.log`, `run-3-task-{1,2}-session.zip`, `run-3-task-{1,2}-observed.json`, `run-3-final-tests.log`, `run-3-red-proof/` |
| AC-P8.2 | Exact public package; reconcile identities, checked/merged revisions, report and evidence; two accepted iterations, three preparations, no-work and readable exports after cleanup | Package/lockfile/public-import proof, Git and hash assertions plus corruption controls / program | pass | 2 | `order-package-identity.json`, `run-3-proof.json`, `run-3-controls.log`, `run-3/native/`, `run-3/archive-manifest.json` |
| AC-P8.3 | Preserve historical configuration/records and original checkouts; trial stays separate from formal queues | Reused P7 executed migration assertions and final original Git revision/status assertions / program | pass | 0 | [P7 report](AFK-P7-setup.md), `original-checkouts-final.json` |
| AC-P8.4 | Attribute failures, repair the responsible layer, rerun affected checks and finish a full successful chain on delivered code | Preserved failed runs, regression gates, negative controls and final complete run / program | pass | 2 | `run-1/failure-summary.json`, `run-2/contract-failure-summary.json`, `run-2-order-negative.log`, `order-repair-skills-tests.log`, `run-3-proof.json` |

## Required gates

All commands exited 0. Sandcastle code did not change during P8, so its completed gates remain applicable after the skills-only repair.

| Gate | Outcome | Execution record |
| --- | --- | --- |
| Sandcastle `npm run typecheck` | pass | `sandcastle-gates/typecheck.log` |
| Sandcastle `npm run build`, including public declaration check | pass | `sandcastle-gates/build.log` |
| Sandcastle `npm test` | pass | `sandcastle-gates/tests.log`: 69 files, 1561 passed, 2 existing Windows-only skips, 85.35 seconds |
| Sandcastle `npx vitest run --config acceptance/fixtures/vitest.config.ts` | pass | `sandcastle-gates/shared-integration.log`: one real Git/Backlog/shared-command integration, 11.63 seconds |
| Skills `node --test skills/engineering/setup-agent-workflow/scripts/*.test.mjs` | pass | `order-repair-skills-tests.log`: 51 passed, zero skipped, 134.72 seconds, after `14cc1ec` |
| Skills `bash .githooks/pre-commit` | pass | `order-repair-integrity.log`, after `14cc1ec` |
| Final trial `npm test` with Node 24.21.0 | pass | `run-3-final-tests.log`: 10 passed, zero skipped, at `33511116247b948d1931327ee525f53e898b9159` |
| Final trial `git diff --check` | pass | `run-3-final-diff-check.log`; clean status independently asserted in `run-3-proof.json` |

The two host control groups passed in 5.92 seconds. They accept the installed package and real delivery, then reject a directory symlink, file symlink, changed distribution bytes and six contradictory preparation/source/target/raw/result/verification identities. Final installed, packed and built distribution inventories contain the same 61 regular files with identical bytes. The lockfile's SHA-512 integrity agrees with the tarball; actual public import resolves inside the installed package and exposes protocol version 1, `run`, `Output.object` and noSandbox.

Package: `@ai-hero/sandcastle` 0.12.0, built from the fork and packed locally, not published. Retained artifact: `ai-hero-sandcastle-0.12.0.tgz`; SHA-256 `2e299c3f8835507056effa42589852dce34852602c766043728e00fa27becf40`.

## Final real chain

Project: `/private/tmp/afk-order-trial-ca_lb8qg/repo`, branch `native-order-trial`. The entry imports the installed public Sandcastle package, Kimi adapter and installed shared options builder. There is no project-specific outer iteration loop, checker or recovery program. Configuration declares `merge-to-head`, max 3 iterations, idle timeout disabled, finite 3600-second execution deadline, 60-second completion grace and 30-second shared-command deadline.

Run `763aeaa8-5d54-407c-afec-446210e0c342` started `2026-09-13T12:35:07.294Z`, ended `2026-09-13T13:00:12.934Z`, elapsed **1505.64 seconds**. Preparations were run / run / no-work; both verification decisions were accept. Both source worktrees were removed, all declared artifact hashes were reread successfully afterward, and the host ended clean with only its primary worktree. The final no-work target is the last merged commit.

| Ticket / attempt | Plan → test-spec → judged implementation → merged finalization |
| --- | --- |
| TASK-1 / `5fb459cc-502d-4210-ab63-e53d7da105c3` | `8c58aff` → `ee7b44d` → `2cba864d8e492cccc092202d17f956a5a8bfbe35` → `95684396427c9e9abb1def59c00e8c29fe20e82f` |
| TASK-2 / `048ec3b6-59a8-45c4-a072-a85e73644c7a` | `707c874` → `9bda3e7` → `866a2cec3849aa144257ee66ea74413a227ecf79` → `33511116247b948d1931327ee525f53e898b9159` |

The second target is exactly TASK-1's merged commit. Actual Git history establishes that each plan/test file's last-changing commit is a strict ancestor of its judged implementation. TASK-2's judged revision includes the review fix that constructs the greeting once. Both tasks have Done status, all three criteria checked and committed reports/receipts; Done remains in `backlog/tasks/`. P7 separately proves periodic `backlog task complete` collection into `completed/`.

The ten named assertions cover plain default/named output; uppercase default/named output and name-before-switch order; JSON default/named output; both upper/JSON switch orders; and exact escaped JSON plus parsing for a quoted name. Each observes exit status, exact stdout including newline and empty stderr. Replaying TASK-1's test commit gives 2 preserved passes and 3 new assertion failures; TASK-2's gives 5 preserved passes and 5 new assertion failures. No replay failure is an infrastructure error.

Session exports prove two separate completed review contexts per task and acceptance-plan → code-review → acceptance ordering. TASK-1 read implement and performed red/green work without explicitly invoking the TDD Skill tool; TASK-2 invoked it. The proof records this difference rather than claiming an unobserved invocation. The required behavior and strict commit order are established by the session actions and independent Git/test replay. TASK-1 Standards review had two negligible advisory observations and no documented violation; Spec had no findings. TASK-2's duplication observation was fixed and tested before acceptance.

The `run-3/` archive retains native raw/extracted results, journal, exported evidence, plans/reports and a verified full Git bundle. Sixteen copied files were compared by SHA-256 to the live trial. Identified session exports omit the global Kimi log. P7's historical migration copy and all three real trial projects remain available; the failed first run's worktree has not been discarded.

## Failures, repairs and review

1. Package preparation encountered sandbox npm-cache permissions, an install attempted before the tarball existed, and a configured registry DNS failure. Packing completed with a dedicated temporary cache; installation then used the public registry and the actual tarball. Later fresh trials installed from that verified cache offline. Initial logs remain beside `install.log`.
2. Initial host proof review exposed symlinked distribution files and incomplete identity comparisons. Proof checkpoint `44d53b6` added recursive regular-file/inventory/byte checks and preparation/raw/result/verification identity comparisons. The old proof accepts a linked distribution in `package-controls-before-repair.log`; repaired controls reject it. The host proof's empty/incomplete-run negatives are retained as well.
3. Real run 1 merged TASK-1, then hit the trial's 900-second execution deadline during TASK-2 finalization after a model request waited 283.365 seconds. This was the trial's overly short bound, not an idle-timeout leak. Native execution stopped; no owned Kimi/entry/Backlog process remained; TASK-2 was not merged and its worktree, uncommitted finalization and artifacts survived. Startup refused retained work. Repair round 1 adopted the already accepted template's finite 3600-second deadline and repeated both tasks in a fresh project.
4. Real run 2 completed transport, identities, evidence, merge, cleanup and no-work, but both agents committed tests with implementation despite the frozen trial's stronger sequencing rule. The reviewers incorrectly treated the shared default or earlier task as permission to waive it. This is a contract failure, preserved separately from transport success. Repair round 2 changed implement and code-review to honor ticket-specific ordering and added the strict-ancestor host assertion. The old run now fails that assertion. Fresh tickets clarify the same existing requirement; they do not weaken it. The final complete run satisfies it.
5. A retry preflight initially read the wrong Backlog readiness field. It was corrected to the CLI's observed nested readiness data; the original failure is retained. Session observation was also corrected to accept Kimi's actual two-item AgentSwarm provider and to distinguish an explicit TDD tool call from demonstrated TDD behavior. The timed-out session still fails the completed-context check. These are host observation repairs, not changes to agent outcomes.

Independent Standards and Spec reviews of the final skills/proof checkpoint `14cc1ec` both report zero remaining findings. Final shared tests and integrity ran after that repair; Sandcastle needed no further change during P8. Earlier P0–P7 reports retain their own implementation failures and repairs.

## Runtime and available usage

`usage-observations.json` is reproduced by the retained `usage-observer.py` from the seven exported Kimi sessions. Counts include each task's two review contexts. They exclude this host Codex session and any cancelled request for which Kimi supplied no usage record; they are not a billing estimate.

| Invocation | Elapsed seconds | Requests with usage | Input other | Cached input read | Output |
| --- | ---: | ---: | ---: | ---: | ---: |
| Read-only capability probe | 75.729 | 7 | 9,398 | 95,744 | 1,653 |
| Run 1, deadline failure | 1477.149 | 86 | 110,958 | 3,261,440 | 32,456 |
| Run 2, commit-order failure | 1442.603 | 89 | 115,914 | 3,282,176 | 32,447 |
| Run 3, accepted complete chain | 1505.640 | 78 | 104,367 | 2,806,272 | 28,691 |

All recorded cache-creation counts are zero. The capability probe established actual authentication, skill readability, two independent agent contexts and the two baseline tests; it was not repeated between trials.

## Reference artifacts

Expected results come from the approved P8 plan and both committed trial tickets/plans. Existing named regression assertions prove prior CLI behavior. No visual or performance baseline is required. [P7 acceptance](AFK-P7-setup.md) supplies actual historical configuration/evidence preservation and native setup tests; final original checkout assertions preserve demo `cc0f342`, Sandcastle `e99f832` and adapter `1f45a03`, all clean.

## Outstanding actions

None within P0–P8's approved delivery. This establishes the tested serial macOS/Kimi/noSandbox/Backlog path, with deterministic failure scenarios from P1–P7. It does not establish universal task success, host permission isolation, Windows/container support for this workflow, or other tracker verification. Publishing the fork and migrating formal projects remain outside this delivery.

## None

No unaccounted behavior changes. Final acceptance/progress documentation records the tested state and does not change execution.
