# Memoization

## 1. Memoizing Props Without React.memo Is Useless

**Principle:** React re-renders every child when a parent re-renders, regardless of whether props changed. Wrapping a callback in `useCallback` does nothing unless the receiving component is memoized or uses the prop as a hook dependency.

**Rule:** Only memoize a prop value when the receiving component is wrapped in `React.memo`/`createMemoComponent`, the prop feeds a hook dependency array downstream, or the prop is forwarded to another memoized component.

**Anti-pattern:**
```tsx
const Component = () => {
  const onClick = useCallback(() => {
    doSomething();
  }, []);

  return <button onClick={onClick}>click me</button>;
};
```

**Correct pattern:**
```tsx
import { createMemoComponent } from "@fly4react/memo";

const ExpensiveChild = createMemoComponent(
  ({ onClick }: { onClick: () => void }) => {
    return <HeavyTree onClick={onClick} />;
  },
  { propKeys: ["onClick"] }
);

const Component = () => {
  const onClick = useCallback(() => doSomething(), []);
  return <ExpensiveChild onClick={onClick} />;
};
```

## 2. Never Spread Props Into a Memoized Component

**Principle:** Spreading makes it impossible to audit reference stability — any upstream change can inject an unstable prop and silently break memoization.

**Rule:** Pass each prop explicitly to memoized components so every reference is visible and auditable.

**Anti-pattern:**
```tsx
const ChildMemo = React.memo(Child);

const Wrapper = (props: WrapperProps) => {
  return <ChildMemo {...props} />;
};
```

**Correct pattern:**
```tsx
import { createMemoComponent } from "@fly4react/memo";

const ChildMemo = createMemoComponent(Child, {
  propKeys: ["id", "name", "onSelect"],
});

const Wrapper = ({ id, name, onSelect }: WrapperProps) => {
  return <ChildMemo id={id} name={name} onSelect={onSelect} />;
};
```

## 3. Children Prop Breaks Memoization

**Principle:** JSX nesting (`<Memo><div /></Memo>`) is syntactic sugar for `children={<div />}` — a fresh object every render, breaking the memo check.

**Rule:** When a memoized component receives children, memoize the children value with `useMemo`.

**Anti-pattern:**
```tsx
const PanelMemo = React.memo(Panel);

const Page = () => {
  return (
    <PanelMemo>
      <div>Static content</div>
    </PanelMemo>
  );
};
```

**Correct pattern:**
```tsx
const PanelMemo = React.memo(Panel);

const Page = () => {
  const content = useMemo(() => <div>Static content</div>, []);
  return <PanelMemo>{content}</PanelMemo>;
};
```

## 4. Non-Primitive Values From Custom Hooks

**Principle:** Custom hooks hide whether returned values have stable references. A non-memoized function or object returned from a hook silently breaks any downstream memoization.

**Rule:** Memoize non-primitive return values inside the hook itself.

**Anti-pattern:**
```tsx
const useForm = () => {
  const submit = () => validateAndSend();
  return { submit };
};

const Page = () => {
  const { submit } = useForm();
  return <FormMemo onSubmit={submit} />;
};
```

**Correct pattern:**
```tsx
const useForm = () => {
  const submit = useCallback(() => validateAndSend(), []);
  return { submit };
};

const Page = () => {
  const { submit } = useForm();
  return <FormMemo onSubmit={submit} />;
};
```

## 5. Stabilize Callbacks With useLatestValueRef

**Principle:** When a callback depends on values that change every render, `useCallback` with those deps produces a new reference each time. A ref holding the latest value lets you keep a stable callback reference.

**Rule:** When deps change too often for `useCallback` to maintain stability, use `useLatestValueRef`.

**Anti-pattern:**
```tsx
const Editor = ({ items }: { items: Item[] }) => {
  const [cursor, setCursor] = useState(0);

  const handleSave = useCallback(() => {
    saveAtPosition(items, cursor);
  }, [items, cursor]);

  return <ToolbarMemo onSave={handleSave} />;
};
```

**Correct pattern:**
```tsx
function useLatestValueRef<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}

const Editor = ({ items }: { items: Item[] }) => {
  const [cursor, setCursor] = useState(0);
  const cursorRef = useLatestValueRef(cursor);
  const itemsRef = useLatestValueRef(items);

  const handleSave = useCallback(() => {
    saveAtPosition(itemsRef.current, cursorRef.current);
  }, []);

  return <ToolbarMemo onSave={handleSave} />;
};
```

## 6. useMemo for Expensive Calculations — Measure First

**Principle:** Most in-component calculations cost under 2ms, while re-rendering UI can cost 20ms+. Blind `useMemo` adds caching overhead for negligible savings.

**Rule:** Only wrap in `useMemo` after measuring that the calculation is expensive relative to total render time.

**Anti-pattern:**
```tsx
const List = ({ items }: { items: Item[] }) => {
  const sorted = useMemo(
    () => [...items].sort((a, b) => a.name.localeCompare(b.name)),
    [items]
  );
  return sorted.map((item) => <Row key={item.id} item={item} />);
};
```

**Correct pattern:**
```tsx
const List = ({ items }: { items: Item[] }) => {
  // For small arrays (<1000), skip useMemo — the real win is memoized rows
  const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name));
  return sorted.map((item) => <RowMemo key={item.id} item={item} />);
};
```

## 7. useMemo on Initial Render Is Pure Overhead

**Principle:** `useMemo` only helps on re-renders. On first mount, React must execute the function AND cache the result. In components that mount once and never re-render, this is wasted work.

**Rule:** Do not add `useMemo` to components unlikely to re-render (top-level routes, one-time modals).

## 8. Render Props With Memoized Components

**Principle:** A render prop (function as children) is re-created every render, breaking memoization on the receiving component.

**Rule:** Stabilize render functions with `useCallback` when passing to memoized components.

**Anti-pattern:**
```tsx
const ListMemo = React.memo(VirtualList);

const Page = () => {
  return (
    <ListMemo>
      {(item: Item) => <Row item={item} />}
    </ListMemo>
  );
};
```

**Correct pattern:**
```tsx
const ListMemo = React.memo(VirtualList);

const Page = () => {
  const renderItem = useCallback((item: Item) => <Row item={item} />, []);
  return <ListMemo>{renderItem}</ListMemo>;
};
```

## 9. Prefer createMemoComponent Over Raw React.memo

**Principle:** `React.memo` compares all props shallowly by default — any stray unstable prop breaks memoization silently. `createMemoComponent` from `@fly4react/memo` lets you declare which props to compare and provides debug logging.

**Rule:** Use `createMemoComponent` with explicit `propKeys`; fall back to `React.memo` only if unavailable.

**Anti-pattern:**
```tsx
const CardMemo = React.memo(Card);
```

**Correct pattern:**
```tsx
import { createMemoComponent } from "@fly4react/memo";

const CardMemo = createMemoComponent(Card, {
  propKeys: ["id", "title", "onSelect"],
});
```
