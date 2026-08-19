# Context & Performance

## 1. Memoize Provider Value

**Principle:** Every re-render of a Context provider creates a new value object by default. A new object triggers re-renders in every consumer — even when logical content hasn't changed.

**Rule:** Always wrap Context provider value in `useMemo`, and callbacks in `useCallback`.

**Anti-pattern:**
```tsx
const NavigationController = ({ children }: { children: React.ReactNode }) => {
  const [isNavExpanded, setIsNavExpanded] = useState(true);
  const toggle = () => setIsNavExpanded(!isNavExpanded);
  const value = { isNavExpanded, toggle };
  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};
```

**Correct pattern:**
```tsx
const NavigationController = ({ children }: { children: React.ReactNode }) => {
  const [isNavExpanded, setIsNavExpanded] = useState(true);
  const toggle = useCallback(() => setIsNavExpanded(prev => !prev), []);
  const value = useMemo(() => ({ isNavExpanded, toggle }), [isNavExpanded, toggle]);
  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};
```

## 2. Children-as-Props Isolation for Providers

**Principle:** If a provider is inside a component with its own frequently-changing state, the provider re-renders on every state change of that parent, recreating its value.

**Rule:** Extract the provider into its own component that accepts `children` as props.

**Anti-pattern:**
```tsx
const Layout = ({ children }: { children: React.ReactNode }) => {
  const [scroll, setScroll] = useState(0);
  useEffect(() => { /* scroll listener updating state every frame */ }, []);
  return (
    <NavigationController>
      <div className="layout">{children}</div>
    </NavigationController>
  );
};
```

**Correct pattern:**
```tsx
const Page = () => (
  <NavigationController>
    <Layout>
      <Sidebar />
      <MainPart />
    </Layout>
  </NavigationController>
);

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [scroll, setScroll] = useState(0);
  return <div className="layout">{children}</div>;
};
```

## 3. Split Providers by Change Frequency (Data vs API)

**Principle:** All consumers re-render when Context value changes, even if they only use a stable part. Splitting into Data (changes) and API (stable) contexts lets action-only consumers avoid re-renders.

**Rule:** Separate Context into frequently-changing Data context and stable API context.

**Anti-pattern:**
```tsx
const NavigationContext = createContext({
  isNavExpanded: false,
  open: () => {},
  close: () => {},
});

const SomeComponent = () => {
  const { open } = useContext(NavigationContext);
  return <button onClick={open}>Open Nav</button>;
};
```

**Correct pattern:**
```tsx
const NavigationDataContext = createContext({ isNavExpanded: false });
const NavigationApiContext = createContext({ open: () => {}, close: () => {}, toggle: () => {} });

const NavigationController = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, { isNavExpanded: true });
  const data = useMemo(() => ({ isNavExpanded: state.isNavExpanded }), [state.isNavExpanded]);
  const api = useMemo(() => ({
    open: () => dispatch({ type: 'open-sidebar' }),
    close: () => dispatch({ type: 'close-sidebar' }),
    toggle: () => dispatch({ type: 'toggle-sidebar' }),
  }), []);

  return (
    <NavigationDataContext.Provider value={data}>
      <NavigationApiContext.Provider value={api}>
        {children}
      </NavigationApiContext.Provider>
    </NavigationDataContext.Provider>
  );
};

const SomeComponent = () => {
  const { open } = useContext(NavigationApiContext);
  return <button onClick={open}>Open Nav</button>;
};
```

## 4. Use useReducer for Stable Dispatch-Based API

**Principle:** With `useState`, toggle functions depend on current state (closure), making them unstable. With `useReducer`, `dispatch` is inherently stable.

**Rule:** When a Context API provider needs toggle-style functions, use `useReducer` so dispatchers become stable and the API context value never changes.

## 5. Memoization Cannot Prevent Consumer Re-Renders

**Principle:** When Context value changes, React unconditionally re-renders every `useContext` consumer. `useMemo` inside the consumer is useless — the re-render already happened.

**Rule:** Do not attempt to prevent Context-triggered re-renders inside the consumer. Fix at the provider level.

**Anti-pattern:**
```tsx
const useNavOpen = () => {
  const { open } = useContext(NavigationContext);
  return useMemo(() => open, []);
};
```

**Correct pattern:**
```tsx
const useNavOpen = () => {
  const { open } = useContext(NavigationApiContext);
  return open;
};
```

## 6. HOC + React.memo as a Context Selector

**Principle:** When you need a single value from Context in a performance-sensitive component but cannot restructure providers, a HOC that subscribes to Context and passes the value to a `React.memo`-wrapped inner component acts as a selector.

**Rule:** Use this pattern only as a last resort when provider restructuring isn't possible.

**Correct pattern:**
```tsx
const withNavigationOpen = <P extends { openNav: () => void }>(
  Component: React.ComponentType<P>
) => {
  const MemoizedComponent = React.memo(Component);
  return (props: Omit<P, 'openNav'>) => {
    const { open } = useContext(NavigationContext);
    return <MemoizedComponent {...(props as P)} openNav={open} />;
  };
};
```

## 7. Context Eliminates Prop Drilling and Intermediate Re-Renders

**Principle:** When state is passed through intermediate components via props, every intermediate re-renders on state change even though it only passes data through. Context skips intermediates.

**Rule:** Use Context (with children-as-props) to pass shared state directly to leaf consumers.

**Anti-pattern:**
```tsx
const Page = () => {
  const [isNavExpanded, setIsNavExpanded] = useState(true);
  return (
    <Sidebar isNavExpanded={isNavExpanded} toggleNav={() => setIsNavExpanded(!isNavExpanded)} />
  );
};
```

**Correct pattern:**
```tsx
const Page = () => (
  <NavigationController>
    <Sidebar />
  </NavigationController>
);

const ExpandButton = () => {
  const { isNavExpanded, toggle } = useNavigationData();
  return <button onClick={toggle}>{isNavExpanded ? 'Collapse' : 'Expand'}</button>;
};
```
