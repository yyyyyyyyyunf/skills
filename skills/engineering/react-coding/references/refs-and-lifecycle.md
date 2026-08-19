# Refs & Lifecycle

## 1. Refs for Mutable Non-Rendered Data

**Principle:** Refs are mutable containers preserved across re-renders. They are ideal for values that participate in logic but never appear in JSX output.

**Rule:** Use `useRef` for data that does not drive rendering — timer IDs, previous values, instance counters, abort controllers.

**Anti-pattern:**
```tsx
function CharCounter() {
  const countRef = useRef(0);
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    countRef.current = e.target.value.length;
  };
  return (
    <div>
      <input onChange={onChange} />
      <p>Characters: {countRef.current}</p> {/* Always shows 0 */}
    </div>
  );
}
```

**Correct pattern:**
```tsx
function CharCounter() {
  const [count, setCount] = useState(0);
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCount(e.target.value.length);
  };
  return (
    <div>
      <input onChange={onChange} />
      <p>Characters: {count}</p>
    </div>
  );
}
```

## 2. The `useLatestValueRef` Pattern

**Principle:** Closures capture values at creation time. When a stable callback needs access to the latest state/props without being recreated, store the changing value in a ref updated synchronously on every render.

**Rule:** Use `useLatestValueRef` to bridge stable function references with fresh data.

```tsx
export function useLatestValueRef<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}
```

**Anti-pattern:**
```tsx
function SearchInput() {
  const [query, setQuery] = useState("");
  const sendRequest = useCallback(() => {
    fetch(`/api/search?q=${query}`);
  }, [query]);
  const debouncedSearch = useMemo(() => debounce(sendRequest, 500), [sendRequest]);
  return <input onChange={(e) => { setQuery(e.target.value); debouncedSearch(); }} />;
}
```

**Correct pattern:**
```tsx
function useDebounce(callback: () => void, delay: number) {
  const callbackRef = useLatestValueRef(callback);
  const debouncedFn = useMemo(
    () => debounce(() => callbackRef.current(), delay),
    [delay]
  );
  return debouncedFn;
}

function SearchInput() {
  const [query, setQuery] = useState("");
  const debouncedSearch = useDebounce(() => {
    fetch(`/api/search?q=${query}`);
  }, 500);
  return <input onChange={(e) => { setQuery(e.target.value); debouncedSearch(); }} />;
}
```

## 3. Debounce/Throttle with Refs

**Principle:** `debounce` and `throttle` rely on an internal timer that persists between calls. If the wrapping function is recreated every render, the timer is lost.

**Rule:** Create the debounced/throttled function exactly once. Use `useLatestValueRef` to give it access to changing state.

**Anti-pattern:**
```tsx
function AutoSave({ content }: { content: string }) {
  const save = () => fetch("/api/save", { method: "POST", body: content });
  const debouncedSave = debounce(save, 1000);
  useEffect(() => { debouncedSave(); }, [content]);
  return null;
}
```

**Correct pattern:**
```tsx
function AutoSave({ content }: { content: string }) {
  const contentRef = useLatestValueRef(content);
  const debouncedSave = useMemo(
    () => debounce(() => fetch("/api/save", { method: "POST", body: contentRef.current }), 1000),
    []
  );
  useEffect(() => {
    debouncedSave();
    return () => debouncedSave.cancel();
  }, [content, debouncedSave]);
  return null;
}
```

## 4. `useLayoutEffect` vs `useEffect`

**Principle:** `useEffect` runs after the browser paints. `useLayoutEffect` runs synchronously after DOM mutations but before paint — preventing visual flicker.

**Rule:** Use `useLayoutEffect` when measuring DOM geometry and immediately adjusting UI. Use `useEffect` for everything else.

**Anti-pattern:**
```tsx
function ResponsiveNav({ items }: { items: NavItem[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(items.length);
  useEffect(() => {
    const count = calculateVisibleItems(ref.current!);
    setVisibleCount(count);
  }, [items]);
  return <div ref={ref}>{items.slice(0, visibleCount).map(/* ... */)}</div>;
}
```

**Correct pattern:**
```tsx
function ResponsiveNav({ items }: { items: NavItem[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(-1);
  useLayoutEffect(() => {
    const count = calculateVisibleItems(ref.current!);
    setVisibleCount(count);
  }, [items]);
  if (visibleCount === -1) {
    return <div ref={ref} style={{ visibility: "hidden" }}>{items.map(/* ... */)}</div>;
  }
  return <div ref={ref}>{items.slice(0, visibleCount).map(/* ... */)}</div>;
}
```

## 5. `forwardRef` and Passing Refs to Children

**Principle:** The `ref` prop is reserved by React. To pass a parent's ref to a child's DOM element, use `forwardRef` or a named prop.

**Rule:** Prefer a named prop (e.g., `inputRef`) for simplicity. Use `forwardRef` for library components where consumers expect the standard `ref` prop.

**Correct pattern (named prop):**
```tsx
function TextInput({ inputRef, placeholder }: {
  inputRef?: React.RefObject<HTMLInputElement>;
  placeholder: string;
}) {
  return <input ref={inputRef} placeholder={placeholder} />;
}
```

## 6. `useImperativeHandle` — Exposing Imperative API

**Principle:** Exposing the raw DOM element leaks implementation details. `useImperativeHandle` lets a child define a controlled imperative API.

**Rule:** Use `useImperativeHandle` when a parent needs to trigger actions on a child. Define the smallest API surface.

**Correct pattern:**
```tsx
interface InputFieldAPI {
  focus: () => void;
  shake: () => void;
}

const InputField = forwardRef<InputFieldAPI, { label: string }>((props, apiRef) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [shouldShake, setShouldShake] = useState(false);

  useImperativeHandle(apiRef, () => ({
    focus: () => inputRef.current?.focus(),
    shake: () => setShouldShake(true),
  }), []);

  return <input ref={inputRef} className={shouldShake ? "shake" : ""} />;
});
```

## 7. Callback Refs

**Principle:** The `ref` attribute accepts a callback function that fires when the element mounts (receives node) and unmounts (receives null).

**Rule:** Use callback refs when you need setup/teardown tied to a DOM element's lifecycle — ResizeObserver, measuring on mount, third-party library integration.

**Correct pattern:**
```tsx
function ResizeAware({ children }: { children: React.ReactNode }) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const callbackRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(node);
  }, []);
  return <div ref={callbackRef}>{children}</div>;
}
```

## 8. SSR and `useLayoutEffect`

**Principle:** `useLayoutEffect` does not run during server-side rendering. The server-rendered HTML reflects only the first render — without layout-effect adjustments.

**Rule:** Introduce a client-only guard: a state variable flipped in `useEffect`.

**Correct pattern:**
```tsx
function ResponsiveNav({ items }: { items: NavItem[] }) {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);
  if (!isClient) return <NavPlaceholder />;
  return <FullResponsiveNav items={items} />;
}
```

## 9. Ref Access Timing

**Principle:** A ref attached to a DOM element is `null` initially and only populated after React commits to the DOM.

**Rule:** Only read DOM refs inside `useEffect`, `useLayoutEffect`, event handlers, or callback refs — never during render.

**Anti-pattern:**
```tsx
function FocusInput() {
  const ref = useRef<HTMLInputElement>(null);
  if (!ref.current) return null; // Never renders!
  return <input ref={ref} />;
}
```

**Correct pattern:**
```tsx
function FocusInput() {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return <input ref={ref} />;
}
```
