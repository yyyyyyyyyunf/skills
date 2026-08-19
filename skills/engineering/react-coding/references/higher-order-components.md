# Higher-Order Components

## 1. When HOCs Are Still Justified

**Principle:** Hooks replaced most shared-logic use cases. HOCs remain useful only for cross-cutting behavior that must wrap any component without modifying its internals — mainly callback enhancement and DOM event interception.

**Rule:** Only introduce a HOC when the same wrapper logic must apply identically to many unrelated components.

**Anti-pattern:**
```tsx
const withTheme = (Component: React.FC<{ theme: string }>) => {
  return (props: any) => {
    const { theme } = useContext(ThemeContext);
    return <Component {...props} theme={theme} />;
  };
};
const ThemedButton = withTheme(Button);
```

**Correct pattern:**
```tsx
const Button = () => {
  const { theme } = useTheme();
  return <button className={theme}>Click</button>;
};
```

## 2. Spreading Props Through the Wrapped Component

**Principle:** A HOC is transparent — the consumer should pass any prop the inner component accepts without the HOC swallowing it.

**Rule:** Always forward all received props via `{...props}`.

**Anti-pattern:**
```tsx
const withLogging = (Component: React.FC<any>) => {
  return (props: any) => {
    useEffect(() => { console.log('mounted'); }, []);
    return <Component />;
  };
};
```

**Correct pattern:**
```tsx
const withLogging = (Component: React.FC<any>) => {
  return (props: any) => {
    useEffect(() => { console.log('mounted'); }, []);
    return <Component {...props} />;
  };
};
```

## 3. Preserving the Original Callback When Overriding

**Principle:** When a HOC intercepts a callback prop, the original must still fire so the component's contract isn't broken.

**Rule:** Always call `props.onClick?.()` (or the relevant original callback) inside your replacement handler.

**Anti-pattern:**
```tsx
const withLoggingOnClick = (Component: React.FC<any>) => {
  return (props: any) => {
    const onClick = () => {
      console.log('clicked');
    };
    return <Component {...props} onClick={onClick} />;
  };
};
```

**Correct pattern:**
```tsx
const withLoggingOnClick = (Component: React.FC<any>) => {
  return (props: any) => {
    const onClick = () => {
      console.log('clicked');
      props.onClick?.();
    };
    return <Component {...props} onClick={onClick} />;
  };
};
```

## 4. Separating HOC-Specific Props from Component Props

**Principle:** Props meant only for the HOC's logic must not leak to the inner component.

**Rule:** Destructure HOC-specific props out of the rest-spread before forwarding.

**Anti-pattern:**
```tsx
const withLogging = (Component: React.FC<any>) => {
  return (props: any) => {
    const onClick = () => {
      console.log(props.logText);
      props.onClick?.();
    };
    return <Component {...props} onClick={onClick} />;
  };
};
```

**Correct pattern:**
```tsx
const withLogging = (Component: React.FC<any>) => {
  return ({ logText, ...props }: { logText: string } & Record<string, any>) => {
    const onClick = () => {
      console.log(logText);
      props.onClick?.();
    };
    return <Component {...props} onClick={onClick} />;
  };
};
```

## 5. Static Config via Function Arguments vs. Dynamic Data via Props

**Principle:** HOCs accept data in two ways: arguments (static, definition-time) and props (dynamic, render-time).

**Rule:** Use the HOC function's second argument for fixed-per-definition data. Use props for per-instance data.

**Anti-pattern:**
```tsx
const ButtonLogFoo = withLogging(Button, { text: 'foo' });
const ButtonLogBar = withLogging(Button, { text: 'bar' });
const ButtonLogBaz = withLogging(Button, { text: 'baz' });
```

**Correct pattern:**
```tsx
const LoggingButton = withLogging(Button);

const Page = () => (
  <>
    <LoggingButton logText="foo" onClick={handleA}>A</LoggingButton>
    <LoggingButton logText="bar" onClick={handleB}>B</LoggingButton>
  </>
);
```

## 6. Intercepting DOM Events Without Modifying Inner Components

**Principle:** Wrapping a component in a DOM element with an event handler lets you block event bubbling without touching inner component code.

**Rule:** Only introduce a wrapper DOM node when the HOC must intercept a DOM event at a boundary.

**Correct pattern:**
```tsx
const withSuppressKeyPress = (Component: React.FC<any>) => {
  return (props: any) => (
    <div onKeyPress={(e: React.KeyboardEvent) => e.stopPropagation()}>
      <Component {...props} />
    </div>
  );
};

const ModalWithSuppressedKeyPress = withSuppressKeyPress(Modal);
```

## 7. Naming Convention

**Rule:** Name HOC functions with a `with` prefix describing what they add (e.g., `withLoggingOnClick`, `withSuppressKeyPress`).
