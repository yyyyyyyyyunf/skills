# Delivery — main and fly4ai package setup

verdict: passed

The user authorized merging the accepted AFK changes to both remote main branches, updating local main and running `scripts/link-skills.sh`. The follow-up reserved npm publication to the user.

Skills code checkpoint `0f7066d` is merged to origin/main and checked out on local main. The setup reference now identifies `@fly4ai/sandcastle`, preserves protocol capability checks, and documents the existing Kimi 0.1.1 peer alias to the same fork. Independent Standards and Spec reviews have zero remaining findings; the repository integrity hook and `git diff --check` passed.

`scripts/link-skills.sh` completed successfully. All 32 skills have verified links in both `~/.agents/skills` and `~/.claude/skills` (64 resolved links). Raw proof: `acceptance/runs/FLY4AI-RELEASE/{integrity.log,link-skills.log,links.json,main-delivery.json}`. No non-link destination entries needed replacement.

Sandcastle's `d1633b9` code checkpoint is merged to its fork's remote main and local main. It prepares `@fly4ai/sandcastle@0.13.0`, with matching package/lock metadata, versioned changelog, new-scope templates/examples and manual release workflow. Typecheck, build, 1561 tests (2 existing Windows-only skips), actual tarball installation, CLI init and Kimi import/type checks passed. See [the owning release-preparation report](/Users/zongyf/Documents/code/sandcastle/acceptance/reports/FLY4AI-RELEASE.md).

Both main worktrees were clean and equal to their remote tracking refs after the non-forced pushes. These final delivery reports are subsequent documentation-only commits. npm publication, organization setup and release tagging remain with the user; no publication was attempted after that delegation.
