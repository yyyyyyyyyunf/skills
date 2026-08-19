# Error Handling

## 1. ErrorBoundary Placement Strategy

**Principle:** A single top-level ErrorBoundary catches everything but replaces the entire UI with a fallback. Granular boundaries let unaffected sections remain interactive.

**Rule:** Place ErrorBoundaries around independently-failing sections. Each boundary should wrap a subtree that can meaningfully degrade without destroying the rest of the page.

**Correct pattern:**
```tsx
const App = () => (
  <Layout>
    <ErrorBoundary fallback={<SidebarError />}>
      <Sidebar />
    </ErrorBoundary>
    <ErrorBoundary fallback={<MainError />}>
      <MainContent />
    </ErrorBoundary>
  </Layout>
);
```

## 2. try/catch Cannot Wrap useEffect Externally

**Principle:** `useEffect` callbacks execute asynchronously after render. A try/catch around the component body or JSX never catches errors thrown inside effects.

**Rule:** Place try/catch inside the effect callback itself.

**Anti-pattern:**
```tsx
const Component = () => {
  try {
    useEffect(() => {
      throw new Error('async failure'); // NOT caught
    }, []);
  } catch (e) {
    return <ErrorFallback />;
  }
  return <div />;
};
```

**Correct pattern:**
```tsx
const Component = () => {
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    try {
      riskyOperation();
    } catch (e) {
      setError(e as Error);
    }
  }, []);
  if (error) return <ErrorFallback error={error} />;
  return <div />;
};
```

## 3. try/catch Cannot Catch Child Component Errors

**Principle:** Child component rendering happens inside React's reconciler, not inside the parent's render function call stack. try/catch in a parent cannot intercept errors thrown during child rendering.

**Rule:** Use ErrorBoundary (not try/catch) to catch errors from child components.

**Anti-pattern:**
```tsx
const Parent = () => {
  try {
    return <ChildThatMightThrow />; // NOT caught by this try/catch
  } catch (e) {
    return <Fallback />;
  }
};
```

**Correct pattern:**
```tsx
const Parent = () => (
  <ErrorBoundary fallback={<Fallback />}>
    <ChildThatMightThrow />
  </ErrorBoundary>
);
```

## 4. No setState During Render

**Principle:** Calling setState during the render phase triggers an infinite loop or React warnings. A catch block during render that calls setState will cause this.

**Rule:** Never call setState in a synchronous catch block during render. Use an effect or event handler to transition to error state.

**Anti-pattern:**
```tsx
const Component = () => {
  const [error, setError] = useState<Error | null>(null);
  try {
    const data = processSync(rawData);
    return <Display data={data} />;
  } catch (e) {
    setError(e as Error); // setState during render!
  }
  return <Fallback />;
};
```

**Correct pattern:**
```tsx
const Component = ({ rawData }: { rawData: unknown }) => {
  const result = useMemo(() => {
    try {
      return { data: processSync(rawData), error: null };
    } catch (e) {
      return { data: null, error: e as Error };
    }
  }, [rawData]);

  if (result.error) return <Fallback error={result.error} />;
  return <Display data={result.data} />;
};
```

## 5. What ErrorBoundary Cannot Catch

**Principle:** ErrorBoundaries only catch errors during rendering, lifecycle methods, and constructors of the tree below them.

**Rule:** ErrorBoundary does NOT catch:
- Event handler errors → use try/catch inside the handler
- Async code (setTimeout, promises) → re-throw into React lifecycle
- Server-side rendering errors
- Errors in the boundary itself

## 6. Re-throwing Async Errors into React Lifecycle

**Principle:** Async errors (from fetch, setTimeout, promises) escape React's rendering call stack. To let an ErrorBoundary catch them, re-throw during a React lifecycle update using a state updater that throws.

**Rule:** Use a hook that captures async errors and re-throws them during render via setState updater.

**Correct pattern:**
```tsx
const useThrowAsyncError = () => {
  const [, setState] = useState();
  return useCallback((error: Error) => {
    setState(() => { throw error; });
  }, []);
};

const DataLoader = () => {
  const throwError = useThrowAsyncError();
  useEffect(() => {
    fetch('/api/data')
      .then((r) => r.json())
      .then(setData)
      .catch(throwError);
  }, [throwError]);
  return <div />;
};
```

## 7. Callback Wrapper Pattern for Event Handler Errors

**Principle:** Event handlers don't propagate to ErrorBoundaries. A wrapper function can catch errors and re-throw them into React's lifecycle.

**Correct pattern:**
```tsx
const useCallbackWithErrorHandling = <T extends (...args: never[]) => void>(callback: T) => {
  const throwError = useThrowAsyncError();
  return useCallback((...args: Parameters<T>) => {
    try {
      callback(...args);
    } catch (e) {
      throwError(e as Error);
    }
  }, [callback, throwError]) as T;
};

const Form = () => {
  const handleSubmit = useCallbackWithErrorHandling(() => {
    riskyOperation(); // Error propagates to nearest ErrorBoundary
  });
  return <button onClick={handleSubmit}>Submit</button>;
};
```

## 8. ErrorBoundary with Reset Capability

**Principle:** A stuck error fallback with no recovery path forces users to refresh. Providing a reset mechanism improves UX.

**Rule:** Include a reset callback that clears the boundary's error state, allowing the subtree to re-mount.

**Correct pattern:**
```tsx
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: (props: { reset: () => void }) => React.ReactNode },
  { error: Error | null }
> {
  state = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    reportError(error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return this.props.fallback({ reset: this.reset });
    }
    return this.props.children;
  }
}
```
