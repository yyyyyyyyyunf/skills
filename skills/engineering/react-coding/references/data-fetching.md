# Data Fetching

## 1. Request Waterfalls

**Principle:** When a child fetches data inside useEffect but is conditionally rendered after a parent's fetch completes, requests become sequential. Each fetch waits for the previous component to mount.

**Rule:** Identify and eliminate accidental waterfalls by hoisting parallel fetches to a common ancestor or using data providers.

**Anti-pattern:**
```tsx
const Issue = () => {
  const { data } = useData('/get-issue');
  if (!data) return <Spinner />;
  return (
    <div>
      <h3>{data.title}</h3>
      <Comments /> {/* Mounts AFTER issue loads = waterfall */}
    </div>
  );
};

const Comments = () => {
  const { data } = useData('/get-comments');
  if (!data) return <Spinner />;
  return data.map((c) => <Comment key={c.id} comment={c} />);
};
```

**Correct pattern:**
```tsx
useEffect(() => {
  const controller = new AbortController();
  const [issueRes, commentsRes] = await Promise.all([
    fetch('/get-issue', { signal: controller.signal }),
    fetch('/get-comments', { signal: controller.signal }),
  ]);
  const [issueData, commentsData] = await Promise.all([issueRes.json(), commentsRes.json()]);
  setIssue(issueData);
  setComments(commentsData);
  return () => controller.abort();
}, []);
```

## 2. Parallel Fetches with Progressive Rendering

**Principle:** Fire all requests simultaneously but resolve independently, rendering each piece of UI as its data arrives.

**Rule:** Use independent `.then()` chains (not `Promise.all`) when different sections should appear as soon as ready.

**Correct pattern:**
```tsx
useEffect(() => {
  const controller = new AbortController();
  const opts = { signal: controller.signal };

  fetch('/get-sidebar', opts).then((r) => r.json()).then((data) => setSidebar(data));
  fetch('/get-issue', opts).then((r) => r.json()).then((data) => setIssue(data));
  fetch('/get-comments', opts).then((r) => r.json()).then((data) => setComments(data));

  return () => controller.abort();
}, []);
```

## 3. Race Conditions in useEffect

**Principle:** When a dependency changes while a fetch is in-flight, the old callback still has a reference to `setData`. If the old request resolves after the new one, it overwrites correct data with stale data.

**Rule:** Every useEffect that fetches data on a changing dependency MUST guard against stale responses.

**Anti-pattern:**
```tsx
const Page = ({ id }: { id: string }) => {
  const [data, setData] = useState({});
  useEffect(() => {
    fetch(`/api/page/${id}`)
      .then((r) => r.json())
      .then((r) => setData(r));
  }, [id]);
  return <div>{data.title}</div>;
};
```

**Correct pattern (cleanup boolean):**
```tsx
const Page = ({ id }: { id: string }) => {
  const [data, setData] = useState({});
  useEffect(() => {
    let isActive = true;
    fetch(`/api/page/${id}`)
      .then((r) => r.json())
      .then((r) => { if (isActive) setData(r); });
    return () => { isActive = false; };
  }, [id]);
  return <div>{data.title}</div>;
};
```

## 4. AbortController for Race Condition Prevention

**Principle:** Cancel in-flight requests entirely using AbortController. Frees browser connection slots and prevents unnecessary traffic.

**Rule:** Create AbortController in useEffect, pass signal to fetch, call `.abort()` in cleanup. Filter `AbortError` in catch.

**Correct pattern:**
```tsx
useEffect(() => {
  const controller = new AbortController();
  fetch(`/api/data/${id}`, { signal: controller.signal })
    .then((r) => r.json())
    .then((r) => setData(r))
    .catch((error) => {
      if (error.name === 'AbortError') return;
      setError(error);
    });
  return () => controller.abort();
}, [id]);
```

## 5. Race Condition Fix via Ref Comparison

**Principle:** A ref always holds the latest value across all closures. Compare the current ref value with the response identity before calling setState.

**Correct pattern:**
```tsx
const Page = ({ id }: { id: string }) => {
  const [data, setData] = useState({});
  const latestId = useRef(id);
  useEffect(() => {
    latestId.current = id;
    fetch(`/api/page/${id}`)
      .then((r) => r.json())
      .then((r) => {
        if (latestId.current === r.id) setData(r);
      });
  }, [id]);
  return <div>{data.title}</div>;
};
```

## 6. Data Providers to Avoid Prop Drilling

**Principle:** Hoisting fetches to avoid waterfalls often creates prop drilling. Context-based providers let you trigger fetches high in the tree while consuming deep.

**Rule:** Wrap parallel fetches in Context providers near the root; consume via custom hooks in leaf components.

**Correct pattern:**
```tsx
const CommentsProvider = ({ children }: { children: ReactNode }) => {
  const [comments, setComments] = useState<Comment[]>();
  useEffect(() => {
    fetch('/get-comments').then((r) => r.json()).then(setComments);
  }, []);
  return <CommentsContext.Provider value={comments}>{children}</CommentsContext.Provider>;
};

const Root = () => (
  <SidebarProvider>
    <IssueProvider>
      <CommentsProvider>
        <App />
      </CommentsProvider>
    </IssueProvider>
  </SidebarProvider>
);
```

## 7. Browser Connection Limits

**Principle:** Browsers limit parallel connections to ~6 per host (HTTP/1). Uncontrolled fetches can exhaust this budget.

**Rule:** Never fire unbounded fetch calls at module scope unless critical and guaranteed to be consumed immediately.

## 8. Loading State Strategy

**Principle:** Performance is about the story you tell the user. Blocking, progressive, or prioritized rendering are deliberate UX choices.

**Rule:** Choose loading strategy based on user's reading flow and content importance. Don't let it be an accident of component structure.

**Correct pattern:**
```tsx
const App = () => {
  const { sidebar, issue, comments } = useParallelData();
  return (
    <div className="layout">
      <aside>{sidebar ? <Sidebar data={sidebar} /> : <SidebarSkeleton />}</aside>
      <main>
        {issue ? <IssueDetail data={issue} /> : <IssueSkeleton />}
        {comments ? <CommentList data={comments} /> : <CommentsSkeleton />}
      </main>
    </div>
  );
};
```

## 9. Conditional Rendering Blocks Child useEffect

**Principle:** A component hidden behind a conditional (`if (loading) return <Spinner />`) will not mount or trigger its useEffect.

**Rule:** Understand this to identify why child fetches are sequential — the child doesn't exist until the parent finishes loading.
