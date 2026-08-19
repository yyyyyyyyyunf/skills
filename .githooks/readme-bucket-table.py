#!/usr/bin/env python3
"""Insert or check a skill row inside a README bucket table.

Line-based: never use DOTALL with `|.*` — that swallows the rest of the file.

Two modes, one file:
  insert  — called by an agent adding a skill (see CLAUDE.md)
  check   — called by .githooks/pre-commit to catch a missing row
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

BUCKETS = ("engineering", "productivity")
INVOCATIONS = ("user", "model")
ROW_RE = re.compile(r"\| \[`([^`]+)`\]")
SEP_RE = re.compile(r"\| [-:]+ \| [-:]+ \| [-:]+ \|")


def heading_for(bucket: str) -> str:
    return bucket.capitalize()


def find_table(lines: list[str], heading: str) -> tuple[int, int, int]:
    header_at = None
    needle = f"## {heading}"
    for i, line in enumerate(lines):
        if line.rstrip("\n") == needle:
            header_at = i
            break
    if header_at is None:
        raise SystemExit(f"error: bucket heading '{needle}' not found")

    sep = None
    for j in range(header_at + 1, len(lines)):
        stripped = lines[j].strip()
        if stripped.startswith("## ") and j != header_at:
            break
        if SEP_RE.match(stripped):
            sep = j
            break
    if sep is None:
        raise SystemExit(f"error: bucket table for '{heading}' not found")

    start = sep + 1
    end = start
    while end < len(lines) and lines[end].lstrip().startswith("|"):
        end += 1
    return header_at, start, end


def row_names(lines: list[str], start: int, end: int) -> list[str]:
    names = []
    for line in lines[start:end]:
        m = ROW_RE.match(line.strip())
        if m:
            names.append(m.group(1))
    return names


def make_row(bucket: str, name: str, purpose: str, invocation: str) -> str:
    return (
        f"| [`{name}`](skills/{bucket}/{name}/SKILL.md) | {purpose} | {invocation} |\n"
    )


def sort_key(line: str) -> str:
    m = ROW_RE.match(line.strip())
    return m.group(1) if m else line


def insert(text: str, bucket: str, name: str, purpose: str, invocation: str) -> str:
    if bucket not in BUCKETS:
        raise SystemExit(
            f"error: invalid bucket '{bucket}' (expected one of: {'|'.join(BUCKETS)})"
        )
    if invocation not in INVOCATIONS:
        raise SystemExit(
            f"error: invalid invocation '{invocation}' "
            f"(expected one of: {'|'.join(INVOCATIONS)})"
        )
    lines = text.splitlines(keepends=True)
    _, start, end = find_table(lines, heading_for(bucket))
    existing = lines[start:end]
    if name in row_names(lines, start, end):
        print(f"README row for {name} already present under ## {heading_for(bucket)}")
        return text
    existing.append(make_row(bucket, name, purpose, invocation))
    existing.sort(key=sort_key)
    return "".join(lines[:start] + existing + lines[end:])


def check(text: str, bucket: str, name: str) -> bool:
    lines = text.splitlines(keepends=True)
    _, start, end = find_table(lines, heading_for(bucket))
    return name in row_names(lines, start, end)


def _self_test() -> None:
    sample = (
        "# Root\n\n"
        "## Engineering\n\n"
        "> Daily code work.\n\n"
        "| Skill | Purpose | Invocation |\n"
        "| ----- | ------- | ---------- |\n"
        "| [`aaa`](skills/engineering/aaa/SKILL.md) | A | model |\n"
        "\n"
        "## Productivity\n\n"
        "| Skill | Purpose | Invocation |\n"
        "| ----- | ------- | ---------- |\n"
        "| [`bbb`](skills/productivity/bbb/SKILL.md) | B | user |\n"
        "\n"
        "## After\n\n"
        "prose that must survive\n"
    )
    out = insert(sample, "engineering", "zzz", "Z", "user")
    assert "## Productivity" in out, out
    assert "## After" in out, out
    assert "prose that must survive" in out, out
    assert "[`zzz`](skills/engineering/zzz/SKILL.md) | Z | user |" in out, out
    assert check(out, "engineering", "zzz")
    assert check(out, "productivity", "bbb")
    assert not check(out, "engineering", "bbb")

    again = insert(out, "engineering", "zzz", "Z", "user")
    assert again == out

    # alphabetical placement, not append
    multi = insert(sample, "engineering", "mmm", "M", "model")
    rows = [l for l in multi.splitlines() if l.startswith("| [`")]
    assert rows[0].startswith("| [`aaa`"), rows
    assert rows[1].startswith("| [`mmm`"), rows

    empty = (
        "## Engineering\n\n"
        "| Skill | Purpose | Invocation |\n"
        "| ----- | ------- | ---------- |\n"
        "\n"
        "## Productivity\n\n"
        "| Skill | Purpose | Invocation |\n"
        "| ----- | ------- | ---------- |\n"
    )
    filled = insert(empty, "productivity", "handoff", "Hand off a session", "user")
    assert check(filled, "productivity", "handoff")
    assert "| Skill | Purpose | Invocation |" in filled.split("## Productivity")[1]

    for bad in (("nope", "x", "P", "user"), ("engineering", "x", "P", "auto")):
        try:
            insert(sample, *bad)
        except SystemExit:
            pass
        else:
            raise AssertionError(f"expected rejection for {bad}")

    print("self-test ok")


def main(argv: list[str]) -> int:
    if len(argv) >= 1 and argv[0] == "--self-test":
        _self_test()
        return 0
    usage = (
        "usage: readme-bucket-table.py insert <README> <bucket> <name> <purpose> <user|model>\n"
        "       readme-bucket-table.py check  <README> <bucket> <name>\n"
        "       readme-bucket-table.py --self-test\n"
    )
    if len(argv) < 1:
        sys.stderr.write(usage)
        return 2
    cmd = argv[0]
    if cmd == "insert":
        if len(argv) != 6:
            sys.stderr.write(usage)
            return 2
        path = Path(argv[1])
        path.write_text(insert(path.read_text(), argv[2], argv[3], argv[4], argv[5]))
        print(f"inserted README row under ## {heading_for(argv[2])}")
        return 0
    if cmd == "check":
        if len(argv) != 4:
            sys.stderr.write(usage)
            return 2
        path = Path(argv[1])
        if check(path.read_text(), argv[2], argv[3]):
            return 0
        sys.stderr.write(
            f"README.md missing row for `{argv[3]}` inside ## {heading_for(argv[2])}\n"
        )
        return 1
    sys.stderr.write(f"error: unknown command '{cmd}'\n")
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
