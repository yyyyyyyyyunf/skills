# Component Composition

## 1. State Updates Are the Only Source of Re-renders

**Principle:** React re-renders are triggered exclusively by state updates (useState, useReducer, external stores). Mutating a local variable does not trigger the React lifecycle.

**Rule:** Always use state-setting functions to drive UI changes.

**Anti-pattern:**
```tsx
const App = () => {
  let isOpen = false;
  return (
    <div>
      <button onClick={() => (isOpen = true)}>Open</button>
      {isOpen ? <ModalDialog /> : null}
    </div>
  );
};
```

**Correct pattern:**
```tsx
const App = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setIsOpen(true)}>Open</button>
      {isOpen ? <ModalDialog /> : null}
    </div>
  );
};
```

## 2. Re-renders Cascade Down the Entire Subtree

**Principle:** When a component re-renders, React re-renders every nested component beneath it — unconditionally, regardless of props.

**Rule:** Be deliberate about where state lives. State high in the tree causes everything below to re-render.

**Anti-pattern:**
```tsx
const App = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setIsOpen(true)}>Open dialog</button>
      {isOpen ? <ModalDialog onClose={() => setIsOpen(false)} /> : null}
      <VerySlowComponent />
      <BunchOfStuff />
    </div>
  );
};
```

**Correct pattern:**
```tsx
const ButtonWithModalDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open dialog</button>
      {isOpen ? <ModalDialog onClose={() => setIsOpen(false)} /> : null}
    </>
  );
};

const App = () => (
  <div>
    <ButtonWithModalDialog />
    <VerySlowComponent />
    <BunchOfStuff />
  </div>
);
```

## 3. Move State Down

**Principle:** By extracting state and its consumers into the smallest possible child component, you confine re-renders to that small subtree.

**Rule:** When state is only used by a subset of rendered output, extract that subset (and the state) into its own component.

**Anti-pattern:**
```tsx
const ScrollableArea = () => {
  const [position, setPosition] = useState(300);
  const onScroll = (e: React.UIEvent) => setPosition(getPosition(e.currentTarget.scrollTop));
  return (
    <div className="scrollable" onScroll={onScroll}>
      <MovingBlock position={position} />
      <VerySlowComponent />
      <BunchOfStuff />
    </div>
  );
};
```

**Correct pattern:**
```tsx
const ScrollableWithMovingBlock = ({ children }: { children: React.ReactNode }) => {
  const [position, setPosition] = useState(300);
  const onScroll = (e: React.UIEvent) => setPosition(getPosition(e.currentTarget.scrollTop));
  return (
    <div className="scrollable" onScroll={onScroll}>
      <MovingBlock position={position} />
      {children}
    </div>
  );
};

const App = () => (
  <ScrollableWithMovingBlock>
    <VerySlowComponent />
    <BunchOfStuff />
  </ScrollableWithMovingBlock>
);
```

## 4. Custom Hooks Do Not Isolate Re-renders

**Principle:** Moving state into a custom hook does NOT move it out of the component. Any state update inside the hook triggers a full re-render of the host component.

**Rule:** After extracting logic to a hook, still co-locate the hook call in the smallest component that needs it.

**Anti-pattern:**
```tsx
const useModalDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const listener = () => setWidth(window.innerWidth);
    window.addEventListener("resize", listener);
    return () => window.removeEventListener("resize", listener);
  }, []);
  return { isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) };
};

// App re-renders on EVERY window resize!
const App = () => {
  const { isOpen, open, close } = useModalDialog();
  return (
    <div>
      <button onClick={open}>Open</button>
      {isOpen ? <ModalDialog onClose={close} /> : null}
      <VerySlowComponent />
    </div>
  );
};
```

**Correct pattern:**
```tsx
const ButtonWithModalDialog = () => {
  const { isOpen, open, close } = useModalDialog();
  return (
    <>
      <button onClick={open}>Open</button>
      {isOpen ? <ModalDialog onClose={close} /> : null}
    </>
  );
};

const App = () => (
  <div>
    <ButtonWithModalDialog />
    <VerySlowComponent />
  </div>
);
```

## 5. Elements Passed as Props Skip Re-renders

**Principle:** Elements created outside a re-rendering component have stable references, so React skips re-rendering them.

**Rule:** Pass expensive subtrees as props (or children) to stateful wrappers.

**Anti-pattern:**
```tsx
const Parent = () => {
  const [state, setState] = useState(0);
  return (
    <div>
      <button onClick={() => setState(s => s + 1)}>Update</button>
      <ExpensiveChild />
    </div>
  );
};
```

**Correct pattern:**
```tsx
const Parent = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState(0);
  return (
    <div>
      <button onClick={() => setState(s => s + 1)}>Update</button>
      {children}
    </div>
  );
};

const App = () => (
  <Parent>
    <ExpensiveChild />
  </Parent>
);
```

## 6. Elements as Props for Flexible Component APIs

**Principle:** Instead of forwarding configuration props (iconName, iconColor), accept the entire element as a prop. This inverts control.

**Rule:** When a component renders a sub-component whose appearance varies per use-site, accept it as an element prop.

**Anti-pattern:**
```tsx
const Button = ({ isLoading, iconName, iconColor, iconSize }: ButtonProps) => {
  const Icon = getIcon(iconName);
  return (
    <button>
      Submit {isLoading ? <Icon color={iconColor} size={iconSize} /> : null}
    </button>
  );
};
```

**Correct pattern:**
```tsx
const Button = ({ icon }: { icon?: React.ReactElement }) => {
  return <button>Submit {icon}</button>;
};

<Button icon={<Loading color="white" size="large" />} />
<Button icon={<Error color="red" />} />
```

## 7. Default Props via cloneElement — Preserve Consumer Overrides

**Principle:** `cloneElement` creates a copy with merged props. Always spread original props AFTER defaults so consumer values win.

**Rule:** When using cloneElement for defaults, spread `...element.props` after your defaults.

**Anti-pattern:**
```tsx
const Button = ({ appearance, size, icon }: ButtonProps) => {
  const defaultIconProps = { size: size === "large" ? "large" : "medium", color: appearance === "primary" ? "white" : "black" };
  const clonedIcon = React.cloneElement(icon, defaultIconProps);
  return <button>Submit {clonedIcon}</button>;
};
// Consumer's color="red" is silently ignored!
```

**Correct pattern:**
```tsx
const Button = ({ appearance, size, icon }: ButtonProps) => {
  const defaultIconProps = { size: size === "large" ? "large" : "medium", color: appearance === "primary" ? "white" : "black" };
  const mergedProps = { ...defaultIconProps, ...icon.props };
  const clonedIcon = React.cloneElement(icon, mergedProps);
  return <button>Submit {clonedIcon}</button>;
};
```

## 8. Render Props for Passing State to Child Elements

**Principle:** When a parent needs to pass its own state to a received element, render props make the data flow explicit.

**Rule:** Use render props when the parent needs to pass state or derived values to the child. Name the prop `renderXxx`.

**Anti-pattern:**
```tsx
const Button = ({ icon }: { icon: React.ReactElement }) => {
  const [isHovered, setIsHovered] = useState(false);
  const cloned = React.cloneElement(icon, { isHovered });
  return (
    <button onMouseOver={() => setIsHovered(true)} onMouseOut={() => setIsHovered(false)}>
      {cloned}
    </button>
  );
};
```

**Correct pattern:**
```tsx
const Button = ({ renderIcon }: { renderIcon: (state: { isHovered: boolean }) => React.ReactElement }) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <button onMouseOver={() => setIsHovered(true)} onMouseOut={() => setIsHovered(false)}>
      {renderIcon({ isHovered })}
    </button>
  );
};

<Button renderIcon={({ isHovered }) => <HomeIcon className={isHovered ? "hovered" : ""} />} />
```

## 9. Hooks Replace Render Props for Non-DOM Logic

**Principle:** For stateful logic not tied to a specific DOM element, hooks provide the same sharing with less indirection.

**Rule:** Default to hooks for sharing stateful logic. Use render-props only when the logic is coupled to a DOM element the sharing component owns.

**Correct pattern:**
```tsx
const useWindowWidth = () => {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const listener = () => setWidth(window.innerWidth);
    window.addEventListener("resize", listener);
    return () => window.removeEventListener("resize", listener);
  }, []);
  return width;
};

const Layout = () => {
  const width = useWindowWidth();
  return width > 600 ? <WideLayout /> : <NarrowLayout />;
};
```
