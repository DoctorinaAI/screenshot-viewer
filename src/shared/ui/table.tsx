import type { JSX } from "solid-js";
import { splitProps } from "solid-js";
import { cn } from "@/shared/lib/cn";

function Table(props: JSX.HTMLAttributes<HTMLTableElement>) {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <div class="relative w-full overflow-auto">
      <table class={cn("w-full caption-bottom text-sm", local.class)} {...rest}>
        {local.children}
      </table>
    </div>
  );
}

function TableHeader(props: JSX.HTMLAttributes<HTMLTableSectionElement>) {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <thead class={cn("[&_tr]:border-b", local.class)} {...rest}>
      {local.children}
    </thead>
  );
}

function TableBody(props: JSX.HTMLAttributes<HTMLTableSectionElement>) {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <tbody class={cn("[&_tr:last-child]:border-0", local.class)} {...rest}>
      {local.children}
    </tbody>
  );
}

function TableFooter(props: JSX.HTMLAttributes<HTMLTableSectionElement>) {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <tfoot
      class={cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", local.class)}
      {...rest}
    >
      {local.children}
    </tfoot>
  );
}

function TableRow(props: JSX.HTMLAttributes<HTMLTableRowElement>) {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <tr
      class={cn(
        "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
        local.class,
      )}
      {...rest}
    >
      {local.children}
    </tr>
  );
}

function TableHead(props: JSX.ThHTMLAttributes<HTMLTableCellElement>) {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <th
      class={cn(
        "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
        local.class,
      )}
      {...rest}
    >
      {local.children}
    </th>
  );
}

function TableCell(props: JSX.TdHTMLAttributes<HTMLTableCellElement>) {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <td class={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", local.class)} {...rest}>
      {local.children}
    </td>
  );
}

function TableCaption(props: JSX.HTMLAttributes<HTMLTableCaptionElement>) {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <caption class={cn("mt-4 text-sm text-muted-foreground", local.class)} {...rest}>
      {local.children}
    </caption>
  );
}

export { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow };
