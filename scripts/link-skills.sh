#!/usr/bin/env bash
# Symlink every skill in this repo into the harness skill directories.
#
# .agents/skills is the canonical install point: Kimi Code, Codex, and Cursor
# all read it. Claude Code only reads .claude/skills, so each skill is also
# linked there — pointing at the .agents/skills entry, so the repo stays the
# single source of truth. The .claude/skills directory itself must stay a real
# directory: Claude Code has shipped regressions that ignore a symlinked
# top-level skills dir.
#
# Flat links: each harness expects skills exactly one level deep, so a nested
# skills/<bucket>/<name>/ becomes <dest>/<name>. Never link the skills/ tree
# itself — no harness discovers bucket subdirectories.
#
# Usage:
#   scripts/link-skills.sh                     # user-level: ~/.agents/skills + ~/.claude/skills
#   scripts/link-skills.sh --project <dir>     # ...plus <dir>/.agents/skills + <dir>/.claude/skills
#   scripts/link-skills.sh --prune             # also remove dangling links left by renames
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"

# Pairs of (real, alias) destinations. Real entries link to this repo; alias
# entries link to the matching real entry.
REALS=( "$HOME/.agents/skills" )   # Kimi Code, Codex, Cursor
ALIASES=( "$HOME/.claude/skills" ) # Claude Code

PRUNE=0
PROJECT=""

while [ $# -gt 0 ]; do
  case "$1" in
    --project)
      [ $# -ge 2 ] || { echo "error: --project needs a directory" >&2; exit 1; }
      PROJECT="$2"
      shift 2
      ;;
    --prune)
      PRUNE=1
      shift
      ;;
    *)
      echo "error: unknown argument '$1'" >&2
      echo "usage: link-skills.sh [--project <dir>] [--prune]" >&2
      exit 1
      ;;
  esac
done

if [ -n "$PROJECT" ]; then
  [ -d "$PROJECT" ] || { echo "error: no such directory: $PROJECT" >&2; exit 1; }
  PROJECT="$(cd "$PROJECT" && pwd)"
  REALS+=("$PROJECT/.agents/skills")
  ALIASES+=("$PROJECT/.claude/skills")
fi

# Collect every skill: parallel arrays of source dir and skill name.
SRCS=()
NAMES=()
while IFS= read -r -d '' skill_md; do
  src="$(dirname "$skill_md")"
  SRCS+=("$src")
  NAMES+=("$(basename "$src")")
done < <(find "$REPO/skills" -name SKILL.md -not -path '*/node_modules/*' -print0)

pruned=0

# Prune first: a rename leaves a link whose target no longer exists, and the
# harness keeps listing it until it is gone.
if [ "$PRUNE" -eq 1 ]; then
  for dest in "${REALS[@]}" "${ALIASES[@]}"; do
    [ -d "$dest" ] || continue
    for link in "$dest"/*; do
      [ -L "$link" ] || continue
      [ -e "$link" ] || { rm -f "$link"; pruned=$((pruned + 1)); }
    done
  done
fi

linked=0

for i in "${!REALS[@]}"; do
  real="${REALS[$i]}"
  alias="${ALIASES[$i]}"
  mkdir -p "$real" "$alias"

  for j in "${!SRCS[@]}"; do
    src="${SRCS[$j]}"
    name="${NAMES[$j]}"

    # A real directory here is another tool's copy, not ours — replace it with
    # a link so this repo is the single source of truth.
    for target in "$real/$name" "$alias/$name"; do
      if [ -e "$target" ] && [ ! -L "$target" ]; then
        rm -rf "$target"
      fi
    done

    ln -sfn "$src" "$real/$name"
    ln -sfn "$real/$name" "$alias/$name"
    linked=$((linked + 1))
  done
done

echo "linked ${#SRCS[@]} skill(s) into $(( ${#REALS[@]} * 2 )) destination(s):"
for i in "${!REALS[@]}"; do
  echo "  ${REALS[$i]}"
  echo "  ${ALIASES[$i]} (aliases -> ${REALS[$i]})"
done
[ "$PRUNE" -eq 1 ] && echo "pruned $pruned dangling link(s)"

cat <<'EOF'

Note: a skill name collides across sources — if another repo links a skill of
the same name into the same directory, whichever script ran last wins. Run
with --prune after renaming or removing a skill.
EOF
