#!/usr/bin/env bash
# Symlink every skill in this repo into the harness skill directories.
#
# Flat links: each harness expects skills exactly one level deep, so a nested
# skills/<bucket>/<name>/ becomes <dest>/<name>. Never link the skills/ tree
# itself — no harness discovers bucket subdirectories.
#
# Usage:
#   scripts/link-skills.sh                     # user-level: Claude Code, Codex, Kimi Code
#   scripts/link-skills.sh --project <dir>     # ...plus <dir>/.cursor/skills (Cursor's only level)
#   scripts/link-skills.sh --prune             # also remove dangling links left by renames
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"

# User-level destinations. ~/.agents/skills is read by Kimi Code and is the
# de-facto shared directory several tools now write into.
DESTS=(
  "$HOME/.claude/skills"   # Claude Code
  "$HOME/.codex/skills"    # Codex CLI
  "$HOME/.agents/skills"   # Kimi Code
)

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
  DESTS+=("$(cd "$PROJECT" && pwd)/.cursor/skills")
fi

linked=0
pruned=0

for dest in "${DESTS[@]}"; do
  mkdir -p "$dest"

  # Prune first: a rename leaves a link whose target no longer exists, and the
  # harness keeps listing it until it is gone.
  if [ "$PRUNE" -eq 1 ]; then
    for link in "$dest"/*; do
      [ -L "$link" ] || continue
      target="$(readlink "$link")"
      case "$target" in
        "$REPO"/*) [ -e "$target" ] || { rm -f "$link"; pruned=$((pruned + 1)); } ;;
        *) [ -e "$target" ] || { rm -f "$link"; pruned=$((pruned + 1)); } ;;
      esac
    done
  fi

  while IFS= read -r -d '' skill_md; do
    src="$(dirname "$skill_md")"
    name="$(basename "$src")"
    target="$dest/$name"

    # A real directory here is another tool's copy, not ours — replace it with
    # a link so this repo is the single source of truth.
    if [ -e "$target" ] && [ ! -L "$target" ]; then
      rm -rf "$target"
    fi

    ln -sfn "$src" "$target"
    linked=$((linked + 1))
  done < <(find "$REPO/skills" -name SKILL.md -not -path '*/node_modules/*' -print0)
done

echo "linked $linked skill(s) across ${#DESTS[@]} destination(s):"
for dest in "${DESTS[@]}"; do echo "  $dest"; done
[ "$PRUNE" -eq 1 ] && echo "pruned $pruned dangling link(s)"

cat <<'EOF'

Note: a skill name collides across sources — if another repo links a skill of
the same name into the same directory, whichever script ran last wins. Run
with --prune after renaming or removing a skill.
EOF
