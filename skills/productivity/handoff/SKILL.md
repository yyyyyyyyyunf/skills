---
name: handoff
description: Compact the current conversation into a handoff document for another agent to pick up.
argument-hint: "What will the next session be used for?"
disable-model-invocation: true
---

Write a handoff document summarising the current conversation so a fresh agent can continue the work.

The receiving agent has **zero** knowledge of this session. Never write "as we discussed", "per the earlier exchange", or "the approach we settled on" — inline the thing itself. A phrase that only resolves against this conversation is a dead reference in the document.

Include a "suggested skills" section, naming which skills the next agent should call the Skill tool for.

Do not duplicate content already captured in other artifacts (specs, plans, ADRs, issues, commits, diffs). Reference them by path or URL instead.

Redact any sensitive information, such as API keys, passwords, or personally identifiable information.

If the user passed arguments, treat them as a description of what the next session will focus on and tailor the doc accordingly.

## Delivery

The file is the deliverable. Do not also print the document, or any part of it, into the conversation — a handoff written twice costs the whole document's tokens for nothing.

1. Write it to a random filename in the OS temporary directory, never the current workspace: `/tmp/handoff-<token>.md`, where `<token>` is short and unique (`$RANDOM`, `uuidgen | head -c 8`).
2. Open it for the user (`open <path>` on macOS).
3. Reply with the path and nothing else — no summary, no preface, no fenced copy of the contents.

## Quality bar

Check each before delivering, and revise until every answer is yes:

- Could a cold teammate start from this document and work for an hour without asking anything beyond the open decisions it lists?
- Is every file path real, and does every referenced artifact exist at the path given?
- Where a previous approach was abandoned, does the document say **why** — so the receiver doesn't retry it?
- Are the trade-offs preserved as trade-offs, rather than averaged into a bland recommendation?
- Are the user's own words quoted verbatim wherever their exact phrasing shaped a decision?
- Does every open decision appear as a question with its options already identified, rather than as something the receiver might silently choose?
- Did any secret survive the redaction pass? Scan for tokens, passwords, connection strings.
