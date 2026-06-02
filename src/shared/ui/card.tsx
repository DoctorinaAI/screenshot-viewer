import type { JSX } from "solid-js";
import { splitProps } from "solid-js";
import { cn } from "@/shared/lib/cn";
import { ripple } from "@/shared/lib/ripple";

void ripple;

interface CardProps extends JSX.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

function Card(props: CardProps) {
  const [local, rest] = splitProps(props, ["class", "children", "interactive"]);
  return (
    <div
      use:ripple={local.interactive || undefined}
      class={cn(
        // Borderless: rely on a soft elevation that lifts slightly on hover
        // for interactive cards. Subtle ring stays only in dark mode to keep
        // the card boundary readable against an almost-equal background.
        "rounded-xl bg-card text-card-foreground shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06]",
        local.interactive &&
          "cursor-pointer transition-[transform,box-shadow,background-color] duration-150 hover:bg-accent/40 hover:shadow-md active:scale-[0.99]",
        local.class,
      )}
      {...rest}
    >
      {local.children}
    </div>
  );
}

function CardHeader(props: JSX.HTMLAttributes<HTMLDivElement>) {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <div class={cn("flex flex-col space-y-1.5 p-6", local.class)} {...rest}>
      {local.children}
    </div>
  );
}

function CardTitle(props: JSX.HTMLAttributes<HTMLHeadingElement>) {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <h3 class={cn("text-2xl font-semibold leading-none tracking-tight", local.class)} {...rest}>
      {local.children}
    </h3>
  );
}

function CardDescription(props: JSX.HTMLAttributes<HTMLParagraphElement>) {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <p class={cn("text-sm text-muted-foreground", local.class)} {...rest}>
      {local.children}
    </p>
  );
}

function CardContent(props: JSX.HTMLAttributes<HTMLDivElement>) {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <div class={cn("p-6 pt-0", local.class)} {...rest}>
      {local.children}
    </div>
  );
}

function CardFooter(props: JSX.HTMLAttributes<HTMLDivElement>) {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <div class={cn("flex items-center p-6 pt-0", local.class)} {...rest}>
      {local.children}
    </div>
  );
}

export type { CardProps };
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
