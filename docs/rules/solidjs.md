# SolidJS Rules

Read this file before writing or modifying SolidJS components.

SolidJS is **not React**. Components run once (no re-renders). Reactivity is tracked through signal access in reactive contexts. Breaking these rules silently kills reactivity — the component still renders, but stops updating.

## Never destructure props

Destructuring breaks reactivity — the value is read once and never updates.

```tsx
// WRONG — breaks reactivity
function Card({ title, count }: Props) {
  return <div>{title} ({count})</div>;
}

// CORRECT — reactive access
function Card(props: Props) {
  return <div>{props.title} ({props.count})</div>;
}

// CORRECT — splitProps when forwarding subsets
function Card(props: Props & { class?: string }) {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return <div class={cn("rounded-lg", local.class)} {...rest}>{local.children}</div>;
}

// CORRECT — mergeProps for defaults
function Card(props: Props) {
  const merged = mergeProps({ variant: "default" as const }, props);
  return <div>{merged.variant}</div>;
}
```

## Control flow components

Use SolidJS control flow components, not JS expressions. Ternaries and `.map()` evaluate eagerly and bypass fine-grained reactivity.

```tsx
// WRONG
{isLoading() ? <Spinner /> : <Content />}
{items().map((item) => <Card item={item} />)}

// CORRECT
<Show when={!isLoading()} fallback={<Spinner />}>
  <Content />
</Show>

<For each={items()}>{(item) => <Card item={item} />}</For>

<Switch fallback={<Empty />}>
  <Match when={status() === "loading"}><Spinner /></Match>
  <Match when={status() === "error"}><ErrorState /></Match>
  <Match when={status() === "ok"}><Content data={data()} /></Match>
</Switch>
```

`<For>` keys by reference. `<Index>` is for primitive arrays where you want index-as-key (rare).

## No `useEffect`

React idioms don't apply. Use the appropriate primitive:

| React | SolidJS |
|---|---|
| `useState` | `createSignal` |
| `useEffect(() => ..., [dep])` | `createEffect(() => { ...; dep(); })` |
| `useEffect(() => ..., [])` | `onMount(() => { ... })` |
| Cleanup function in `useEffect` | `onCleanup(() => { ... })` |
| `useMemo` | `createMemo` |
| `useCallback` | Not needed — functions are stable in Solid |
| `useRef` | `let ref!: HTMLElement` then `ref={ref}` |

```tsx
import { createSignal, createEffect, onMount, onCleanup, createMemo } from "solid-js";

function Counter() {
  const [count, setCount] = createSignal(0);
  const doubled = createMemo(() => count() * 2);

  createEffect(() => {
    console.log("count is", count());
  });

  onMount(() => {
    const id = setInterval(() => setCount((c) => c + 1), 1000);
    onCleanup(() => clearInterval(id));
  });

  return <div>{count()} doubled is {doubled()}</div>;
}
```

## Resources (async data)

Use `createResource` for any async data. Combine with `<Show>` for loading / error states.

```tsx
import { createResource, Show } from "solid-js";

function Run(props: { runId: string }) {
  const [run] = createResource(() => props.runId, fetchRun);

  return (
    <Show when={!run.loading} fallback={<Skeleton />}>
      <Show when={!run.error} fallback={<ErrorState error={run.error} />}>
        <RunDetail run={run()!} />
      </Show>
    </Show>
  );
}
```

The dependency function passed first is what triggers refetch. Refetch manually via `run.refetch()`.

## Signals vs stores

- **Signals** (`createSignal`) — single value, replaced atomically.
- **Stores** (`createStore`) — nested objects, fine-grained reactivity on individual fields.

```tsx
const [user, setUser] = createSignal<User | null>(null);
setUser({ id: "1", name: "Mikhail" });

const [filters, setFilters] = createStore({ branch: "", status: "", language: "" });
setFilters("branch", "develop");  // only branch-using consumers re-run
```

Reach for stores when components read individual fields independently. Reach for signals when the value is small or always read whole.

## Refs

```tsx
let containerRef!: HTMLDivElement;

function Component() {
  onMount(() => {
    containerRef.scrollTo(0, 0);
  });

  return <div ref={containerRef}>...</div>;
}
```

`!` is required because TS doesn't see the `ref={...}` assignment as initialization.

## Common pitfalls

- ❌ Calling a signal outside a reactive context loses reactivity. `setTimeout(() => count(), 1000)` — fine to read, but won't auto-update.
- ❌ Wrapping JSX in a function that's called inside another component breaks fine-grained updates. Components run once; child JSX is reactive only because Solid compiles `{expr}` into trackers.
- ❌ Reading `props.X` in a closure that doesn't re-evaluate — wrap in `createMemo` or call inside JSX directly.
- ❌ Returning a fragment from a component that needs a single root for ref forwarding.
