# Acceptance

What `acceptance-plan` and `acceptance` need to know about this repo. They own the judgement structure — what counts as a check, who renders the verdict, what a non-pass must name. Everything below is what only this repo can answer.

Both skills read this file before doing anything. A blank field is a real answer: it means checks depending on it come back `blocked`, which is the honest outcome. Fill in what is true; leave the rest blank rather than guessing.

## Roles

| Role | Supplied by |
| --- | --- |
| **reproduce** — bring the system to an observable state | `pnpm dev` on port 3000; navigate with Playwright |
| **observe** — read what a user or caller receives | `page.screenshot()` and `page.content()` |
| **archive** — persist an observation comparably | PNG + normalised HTML under the baseline path |
| **sideband** — explain a failure (optional) | browser console and network log via Playwright tracing |

Sideband output explains a failure; it never decides one.

## Thresholds

The numbers a program compares against. Declared here, before any run; archived with the evidence; unchanged for the duration of a run.

| Comparison | Threshold |
| --- | --- |
| Screenshot pixel difference | ≤ 0.15% of pixels |
| DOM | structural equality after normalisation |
| HTTP response | exact equality on the declared field set |

## Normalisation

Stripped before comparing, because they differ on every capture:

- Timestamps and formatted dates
- Generated ids, request ids, trace ids
- Durations and latency numbers
- Cache-busting query strings on asset URLs

## Sensitivity sampling

Share of UI checks verified by reverting the code they declare sensitivity to and confirming the check goes red: **10%, minimum 3**.

## Paths

| | Path | Git |
| --- | --- | --- |
| Baseline | `acceptance/baseline/` | committed — changing a baseline is a reviewable commit |
| Evidence | `acceptance/runs/` | gitignored |
| Report | `acceptance/reports/` | committed |

## Monorepo

Declare per package when the packages differ. A browser front end and a headless service supply the roles differently, and one merged declaration is wrong for both.

```markdown
## apps/web

| Role | Supplied by |
| --- | --- |
| reproduce | `pnpm --filter web dev` on port 3000; Playwright navigation |
| observe | screenshot + DOM |
| archive | PNG + normalised HTML |
| sideband | browser console |

Thresholds: pixel ≤ 0.15%, DOM structural equality
Paths: `acceptance/web/{baseline,runs,reports}/`

## apps/api

| Role | Supplied by |
| --- | --- |
| reproduce | `pnpm --filter api dev` on port 4000; `curl` against seeded fixtures |
| observe | status code + response body |
| archive | JSON under the baseline path |
| sideband | server log |

Thresholds: exact equality on status and body after normalisation
Paths: `acceptance/api/{baseline,runs,reports}/`
```

## Not declared here

The list of units or checks to verify. That changes with every delivery; `acceptance-plan` produces it per run and hands it to `acceptance`.
