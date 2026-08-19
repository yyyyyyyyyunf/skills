# Reconciliation

## 1. Never Define Components Inside Other Components

**Principle:** React identifies components by comparing the `type` reference between renders. A component defined inside another creates a new function reference on every render, causing React to unmount/remount the child.

**Rule:** Always define components at module scope.

**Anti-pattern:**
```tsx
const Form = () => {
  const Input = ({ value }: { value: string }) => (
    <input type="text" defaultValue={value} />
  );
  return <Input value="hello" />;
};
```

**Correct pattern:**
```tsx
const Input = ({ value }: { value: string }) => (
  <input type="text" defaultValue={value} />
);

const Form = () => {
  return <Input value="hello" />;
};
```

## 2. Same Component Type in Ternary Shares State

**Principle:** When two branches of a conditional render the same component type at the same position, React treats them as the same instance — state is preserved across the condition flip.

**Rule:** Add distinct `key` props to force unmount/remount when same-type components should be independent.

**Anti-pattern:**
```tsx
const Form = () => {
  const [isCompany, setIsCompany] = useState(false);
  return (
    <>
      {isCompany ? (
        <Input id="company-tax-id" placeholder="Company Tax ID" />
      ) : (
        <Input id="person-tax-id" placeholder="Personal Tax ID" />
      )}
    </>
  );
};
```

**Correct pattern:**
```tsx
const Form = () => {
  const [isCompany, setIsCompany] = useState(false);
  return (
    <>
      {isCompany ? (
        <Input id="company-tax-id" key="company" placeholder="Company Tax ID" />
      ) : (
        <Input id="person-tax-id" key="person" placeholder="Personal Tax ID" />
      )}
    </>
  );
};
```

## 3. Use Key for State Reset on Context Change

**Principle:** Changing a component's `key` tells React it's a new element. React unmounts the old instance (destroying state) and mounts fresh.

**Rule:** To reset uncontrolled component state when an external value changes, pass that value as the `key`.

**Anti-pattern:**
```tsx
const Page = () => {
  const { url } = useRouter();
  return <Input id="search" />;
};
```

**Correct pattern:**
```tsx
const Page = () => {
  const { url } = useRouter();
  return <Input id="search" key={url} />;
};
```

## 4. Dynamic Lists Require Stable, Unique Keys

**Principle:** For dynamic arrays, React uses `key` to match instances across renders. Index as `key` associates state with position rather than identity.

**Rule:** Always use a stable unique identifier from the data as `key` for dynamic lists. Only use index for truly static arrays.

**Anti-pattern:**
```tsx
const List = ({ items }: { items: Item[] }) => (
  <>
    {items.map((item, index) => (
      <ListItem key={index} data={item} />
    ))}
  </>
);
```

**Correct pattern:**
```tsx
const List = ({ items }: { items: Item[] }) => (
  <>
    {items.map((item) => (
      <ListItem key={item.id} data={item} />
    ))}
  </>
);
```

## 5. Key Does Not Prevent Re-renders

**Principle:** `key` helps React identify which instance to reuse; it does not prevent re-rendering. To prevent unnecessary re-renders, use `React.memo`.

**Rule:** Combine `React.memo` on items with stable data-ID keys for performant lists.

**Anti-pattern:**
```tsx
const ListItemMemo = React.memo(ListItem);

const List = ({ items }: { items: Item[] }) => (
  <>
    {items.map((item, index) => (
      <ListItemMemo key={index} data={item} />
    ))}
  </>
);
```

**Correct pattern:**
```tsx
const ListItemMemo = React.memo(ListItem);

const List = ({ items }: { items: Item[] }) => (
  <>
    {items.map((item) => (
      <ListItemMemo key={item.id} data={item} />
    ))}
  </>
);
```

## 6. Reconciliation Compares by Type and Position

**Principle:** React iterates children and compares the `type` at each position. Same type = re-render (update). Different type = unmount old, mount new.

**Rule:** When conditionally rendering same-type components that should be independent, use different `key` values.

**Correct pattern:**
```tsx
{mode === "edit" ? (
  <TextField variant="outlined" key="edit" />
) : (
  <TextField variant="standard" key="view" />
)}
```

## 7. Same Key Forces Instance Reuse Across Positions

**Principle:** Two elements at different positions with the same `type` and `key` are treated as the same instance — state is preserved.

**Rule:** Use identical `key` on same-type components at different positions when you intentionally want to preserve state.

**Correct pattern:**
```tsx
const Tabs = () => {
  const [isCompany, setIsCompany] = useState(false);
  return (
    <>
      {isCompany ? <Input id="company" key="tax-input" /> : null}
      {!isCompany ? <Input id="person" key="tax-input" /> : null}
    </>
  );
};
```
