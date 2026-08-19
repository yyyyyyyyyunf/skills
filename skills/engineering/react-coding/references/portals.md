# Portals

## 1. When to Use Portals

**Principle:** CSS Stacking Context is inescapable — no z-index can break out. Portals render elements outside DOM ancestors that create Stacking Context traps.

**Rule:** Use `createPortal` when a modal/tooltip/dropdown is inside a DOM subtree with `position` + `z-index`, `transform`, or other Stacking-Context-forming properties.

**Anti-pattern:**
```tsx
const MainContent = () => {
  const [showModal, setShowModal] = useState(false);
  return (
    <div style={{ transform: 'translate(0, 0)' }}>
      <button onClick={() => setShowModal(true)}>Open</button>
      {showModal && <ModalDialog />}
    </div>
  );
};
```

**Correct pattern:**
```tsx
import { createPortal } from 'react-dom';

const MainContent = () => {
  const [showModal, setShowModal] = useState(false);
  return (
    <div style={{ transform: 'translate(0, 0)' }}>
      <button onClick={() => setShowModal(true)}>Open</button>
      {showModal && createPortal(<ModalDialog />, document.getElementById('portal-root')!)}
    </div>
  );
};
```

## 2. Avoid `position: absolute` for Screen-Centered Overlays

**Principle:** `position: absolute` positions relative to the nearest positioned ancestor, not the viewport.

**Rule:** Use `position: fixed` combined with a portal to the document root for full-screen modals.

## 3. Synthetic Events Bubble Through React Tree (Not DOM Tree)

**Principle:** React's synthetic event system propagates through the React component tree, regardless of DOM location.

**Rule:** Use React synthetic event handlers (not `addEventListener`) to intercept events from portalled descendants.

**Anti-pattern:**
```tsx
const App = () => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.addEventListener('click', () => {
      console.log('caught click'); // NEVER fires for portalled children
    });
  }, []);
  return (
    <div ref={ref}>
      {createPortal(<ModalDialog />, document.getElementById('portal-root')!)}
    </div>
  );
};
```

**Correct pattern:**
```tsx
const App = () => (
  <div onClick={() => console.log('caught click from modal')}>
    {createPortal(<ModalDialog />, document.getElementById('portal-root')!)}
  </div>
);
```

## 4. Form Submit Does Not Bubble Through React Tree

**Principle:** `onSubmit` on `<form>` is a native DOM event. Portalled buttons are outside the DOM form.

**Rule:** Place the `<form>` tag inside the portalled component if the modal needs form submission.

**Anti-pattern:**
```tsx
const App = () => (
  <form onSubmit={handleSubmit}>
    {createPortal(
      <button type="submit">Save</button>,
      document.getElementById('portal-root')!,
    )}
  </form>
);
```

**Correct pattern:**
```tsx
const App = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open</button>
      {open && createPortal(
        <form onSubmit={handleSubmit}>
          <input name="field" />
          <button type="submit">Save</button>
        </form>,
        document.getElementById('portal-root')!,
      )}
    </>
  );
};
```

## 5. CSS Cascading Breaks with Portals

**Principle:** CSS selectors relying on DOM ancestry won't apply to portalled elements.

**Rule:** Style portalled components with self-contained class names — never rely on ancestor-descendant selectors.

## 6. Portal Target Must Be a DOM Element

**Rule:** Pass a non-null DOM element obtained via `document.getElementById()` as the portal target.

```tsx
const portalTarget = document.getElementById('portal-root');
if (!portalTarget) return null;
return createPortal(<ModalDialog />, portalTarget);
```

## 7. Portalled Components Share Parent's React Lifecycle and Context

**Principle:** Despite different DOM location, portalled components remain in the React tree. They re-render with parent, access the same Context, and unmount with parent.

**Rule:** Do not duplicate Context providers inside portals — they already have access.

## 8. Stacking Context Traps

**Principle:** Stacking Context is formed by `position` + `z-index`, `transform`, CSS animations, flex/grid children with z-index. Once formed, no child can appear above a sibling with higher stacking order.

**Rule:** When an overlay appears beneath other elements despite high z-index, diagnose Stacking Context traps — then use a portal to escape.

## 9. `position: fixed` Cannot Escape Transform

**Principle:** `transform` forms a new Containing Block, causing `position: fixed` children to be positioned relative to that ancestor instead of viewport.

**Rule:** When using CSS transitions with `transform` on containers, always portal overlays out of those containers.
