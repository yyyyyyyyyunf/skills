# Closures

## 1. Stale Closure in `useCallback` with Missing Dependencies

**Principle:** `useCallback` caches the closure formed when it was created. If the dependency array is incomplete, the cached closure holds outdated variable snapshots.

**Rule:** Always include every referenced state or prop in the `useCallback` dependency array, or use the Ref-escape pattern.

**Anti-pattern:**
```tsx
const Component = () => {
  const [count, setCount] = useState(0);
  const handleClick = useCallback(() => {
    console.log("Current count:", count); // always 0
  }, []); // missing `count`
  return <MemoizedChild onClick={handleClick} />;
};
```

**Correct pattern:**
```tsx
const Component = () => {
  const [count, setCount] = useState(0);
  const handleClick = useCallback(() => {
    console.log("Current count:", count);
  }, [count]);
  return <MemoizedChild onClick={handleClick} />;
};
```

## 2. Stale Closure in `useRef` Initialization

**Principle:** `useRef` stores its initial value once and never re-initializes. A closure passed to `useRef()` is frozen with the initial render's snapshot.

**Rule:** Never rely on a function passed to `useRef()` to remain current. Update `ref.current` in a `useEffect`.

**Anti-pattern:**
```tsx
const Component = ({ someProp }: { someProp: string }) => {
  const [state, setState] = useState("");
  const ref = useRef(() => {
    console.log(someProp); // always initial prop
    console.log(state); // always ""
  });
  return <HeavyComponentMemo onClick={ref.current} />;
};
```

**Correct pattern:**
```tsx
const Component = ({ someProp }: { someProp: string }) => {
  const [state, setState] = useState("");
  const ref = useRef<() => void>();
  useEffect(() => {
    ref.current = () => {
      console.log(someProp);
      console.log(state);
    };
  });
  return <HeavyComponentMemo onClick={ref.current} />;
};
```

## 3. Stale Closure via `React.memo` Custom Comparison

**Principle:** When a `React.memo` comparison function ignores a callback prop, the memoized component keeps the first reference — permanently stale.

**Rule:** Never exclude callback props from comparison unless they are guaranteed stable (via useCallback or Ref-escape).

## 4. Stale Closure in `useEffect` with Missing Dependencies

**Principle:** The closure inside `useEffect` captures a snapshot. If the dependency array omits a variable, the effect uses a stale value for its lifetime.

**Rule:** Include every variable referenced inside `useEffect` in its dependency array, or use a ref.

**Anti-pattern:**
```tsx
const Timer = () => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      console.log("count is:", count); // always 0
    }, 1000);
    return () => clearInterval(id);
  }, []);
  return <button onClick={() => setCount((c) => c + 1)}>{count}</button>;
};
```

**Correct pattern (functional update):**
```tsx
const Timer = () => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setCount((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []);
  return <span>{count}</span>;
};
```

**Correct pattern (ref for read-only access):**
```tsx
const Timer = () => {
  const [count, setCount] = useState(0);
  const countRef = useRef(count);
  useEffect(() => { countRef.current = count; }, [count]);
  useEffect(() => {
    const id = setInterval(() => {
      console.log("count is:", countRef.current);
    }, 1000);
    return () => clearInterval(id);
  }, []);
  return <button onClick={() => setCount((c) => c + 1)}>{count}</button>;
};
```

## 5. The Ref-Escape Pattern (Stable Callback with Fresh State)

**Principle:** A `useRef` object's identity never changes. By storing a fresh closure in `ref.current` every render, a zero-dep `useCallback` can call `ref.current()` and always reach the latest state.

**Rule:** When a memoized callback must remain stable AND access the latest state, use: (1) create ref, (2) update ref in effect every render, (3) expose stable `useCallback` that delegates to ref.

**Anti-pattern:**
```tsx
const Form = () => {
  const [value, setValue] = useState("");
  const onClick = useCallback(() => {
    submitForm(value);
  }, [value]); // changes every keystroke
  return <HeavyComponentMemo onClick={onClick} />;
};
```

**Correct pattern:**
```tsx
const Form = () => {
  const [value, setValue] = useState("");
  const ref = useRef<() => void>();
  useEffect(() => {
    ref.current = () => submitForm(value);
  });
  const onClick = useCallback(() => { ref.current?.(); }, []);
  return (
    <>
      <input value={value} onChange={(e) => setValue(e.target.value)} />
      <HeavyComponentMemo onClick={onClick} />
    </>
  );
};
```

## 6. Why `ref` Does Not Need to Be in Dependencies

**Principle:** The object returned by `useRef()` is referentially stable across the entire component lifetime. Mutating `ref.current` is visible everywhere the same reference is held.

**Rule:** Never add `ref` to the dependency array — it never changes.

## 7. Stale Closure in setTimeout / setInterval

**Principle:** `setTimeout` and `setInterval` capture the closure at scheduling time. If state changes before the timer fires, the callback sees the old snapshot.

**Rule:** Use functional state updates or a ref to access latest value inside delayed callbacks.

**Anti-pattern:**
```tsx
const Component = () => {
  const [value, setValue] = useState("");
  const handleClick = () => {
    setTimeout(() => {
      console.log("Submitted:", value); // stale
    }, 2000);
  };
  return <button onClick={handleClick}>Submit</button>;
};
```

**Correct pattern:**
```tsx
const Component = () => {
  const [value, setValue] = useState("");
  const valueRef = useRef(value);
  useEffect(() => { valueRef.current = value; }, [value]);
  const handleClick = () => {
    setTimeout(() => {
      console.log("Submitted:", valueRef.current);
    }, 2000);
  };
  return <button onClick={handleClick}>Submit</button>;
};
```

## Summary of Fixes

| Scenario | Fix |
|----------|-----|
| `useCallback` with missing deps | Add variable to dependency array |
| `useCallback` dep changes too often | Ref-escape pattern |
| `useRef` initialized with closure | Update `ref.current` in `useEffect` |
| `React.memo` comparison ignoring callbacks | Ref-escape or compare all props |
| `setTimeout` / `setInterval` | Functional updates or synced ref |
| `useEffect` with missing deps | Add dep or use functional updates / ref |
