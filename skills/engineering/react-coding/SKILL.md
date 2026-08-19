---
name: react-coding
description: React coding quality guide with component patterns, performance rules, and hooks best practices. Use when writing or modifying React/TSX components, reviewing React code, or diagnosing React performance issues.
---

# React Coding Guide

## Modes

- **Default**: the hard rules below apply whenever you write or modify React code. No reference file is needed.
- **Diagnostic**: a symptom is reported. Match it against the trigger table in Detailed References and load only the files whose trigger fires.

## Hard Rules

### Re-renders & Composition
- Never define a component inside another component — causes remount every render.
- Move state down: extract state + consumers into the smallest child component.
- Pass heavy subtrees as `children` or element props to stateful wrappers — they skip re-renders.
- Custom hooks do NOT isolate re-renders — the host component still re-renders on any hook state change.

### Memoization
- Never memoize props unless the receiver is wrapped in `React.memo`/`createMemoComponent`, or the prop feeds a hook dependency.
- One unstable non-primitive prop (including `children`) breaks entire memoization — audit all props.
- Never spread `{...props}` into a memoized component — pass each prop explicitly.
- When callback deps change frequently, stabilize with `useLatestValueRef` instead of adding deps to `useCallback`.
- Non-primitive values from custom hooks must be memoized inside the hook.

### Reconciliation & Keys
- Use unique stable IDs as `key` on dynamic lists — never array index when items reorder/add/remove.
- Same component type in both ternary branches shares state — add distinct `key` to force reset.
- `key` does NOT prevent re-renders — it controls instance identity only.

### Context
- Always memoize Context Provider `value` with `useMemo`/`useCallback`.
- `useMemo` inside a consumer cannot prevent Context-triggered re-renders — fix at provider level.
- Split Context into Data (changes) and API (stable) providers when consumers only need actions.

### Refs & Lifecycle
- Never read/write `ref.current` during render — only in effects or event handlers.
- Use `useLayoutEffect` (not `useEffect`) when measuring DOM and immediately repositioning to prevent flicker.
- Never call `debounce()`/`throttle()` in render body — wrap in `useMemo(fn, [])` or `useRef`.

### Closures
- Always list every referenced variable in `useCallback`/`useMemo`/`useEffect` dependency arrays.
- For stable callbacks needing fresh state: use Ref-escape pattern (ref updated every render + zero-dep `useCallback`).

### Data Fetching
- Never `await` sequential fetches — use `Promise.all` or independent `.then()` chains.
- Always handle race conditions: use AbortController or cleanup boolean in useEffect.
- Return a cleanup function from every data-fetching useEffect.

### Error Handling
- Place ErrorBoundaries at app root AND at route/feature boundaries.
- ErrorBoundary catches sync render errors only — use try/catch + state updater re-throw for async/event errors.

### Portals
- Use `createPortal` for modals/tooltips/dropdowns trapped in Stacking Context ancestors.
- Synthetic events bubble through React tree; native DOM events follow DOM tree.

## Soft Suggestions

- Prefer composition (children-as-props, state-down) over memoization.
- Accept elements as props (`icon={<Spinner />}`) instead of config props (`iconName`, `iconColor`).
- Reach for an HOC only to intercept DOM events across components; hooks cover everything else.
- Use `useReducer` for stable dispatch-based Context API providers.
- Prefer `position: fixed` + portal for overlays; `position: absolute` is unreliable.
- Prefer a data-fetching library (SWR, React Query) for caching/deduplication in production.

## Memoization Strategy

1. Check if `@fly4react/memo` is installed → use `createMemoComponent` with `propKeys`
2. Not installed → suggest `pnpm add @fly4react/memo` (selective prop comparison + debug logging)
3. User declines → fall back to `React.memo`

## Recommended Hooks

When needed: check project for existing hook → reuse. If not found → create in project's hooks directory.

- **`useLatestValueRef`** — stabilize callbacks without adding deps
- **`useDebounce` / `useThrottle`** — ref-based, stable across re-renders
- **`useThrowAsyncError`** — re-throw async errors into ErrorBoundary

## Detailed References

The hard rules above are the whole contract for writing code. Reach for a reference only when a rule is contested, a symptom resists the rule, or you need the mechanism behind it — each one triggers on a distinct situation:

| Load | When |
| --- | --- |
| [component-composition.md](references/component-composition.md) | A subtree re-renders and you cannot see which state caused it; deciding whether to move state down, pass a subtree as `children`, or accept it as an element prop; designing a component API around element props (`icon={<Spinner />}`); choosing between render props and a hook |
| [memoization.md](references/memoization.md) | `React.memo` was added and changed nothing; auditing which prop broke memoization; a `useMemo` whose cost you have not measured; wiring `@fly4react/memo`'s `createMemoComponent` and `propKeys` |
| [reconciliation.md](references/reconciliation.md) | A component lost or unexpectedly kept its state; an input remounts and loses focus on every keystroke; a list reorders wrongly; deciding what belongs in a `key` |
| [higher-order-components.md](references/higher-order-components.md) | Intercepting DOM events without touching the wrapped component; an HOC swallows a consumer's callback or leaks its own props inward; naming a wrapper |
| [context-performance.md](references/context-performance.md) | Every consumer re-renders when one slice of context changes; splitting a provider into Data and API halves; a `useMemo` inside a consumer that isn't helping; needing a context selector |
| [refs-and-lifecycle.md](references/refs-and-lifecycle.md) | Measuring the DOM then repositioning, and it flickers; `useLayoutEffect` warns during SSR; exposing an imperative handle; a ref reads `null` at the moment you need it |
| [closures.md](references/closures.md) | A callback or effect sees a stale value; a `setTimeout`/`setInterval` captured old state; building a stable zero-dep callback that still reads fresh state; justifying why a ref is absent from a dependency array |
| [portals.md](references/portals.md) | A modal or dropdown is clipped, or sits behind something despite its `z-index`; `position: fixed` is being shifted by an ancestor `transform`; an event or form submit does not reach the handler you expected; CSS stops inheriting into a portal |
| [data-fetching.md](references/data-fetching.md) | Requests run in a waterfall; a stale response overwrites a newer one; choosing blocking (`Promise.all`) versus progressive rendering; a child's `useEffect` never fires because the parent renders conditionally |
| [error-handling.md](references/error-handling.md) | An error escaped the ErrorBoundary; deciding where boundaries go; propagating an async or event-handler error into the React lifecycle; giving a boundary a reset path |

In Diagnostic mode, load only the rows whose trigger matches the reported symptom. Loading all ten buries the one that answers the question.
