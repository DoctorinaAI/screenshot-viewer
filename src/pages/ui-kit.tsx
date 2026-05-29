import type { JSX, ParentProps } from "solid-js";
import { createSignal } from "solid-js";
import { Avatar } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Checkbox } from "@/shared/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@/shared/ui/popover";
import { Select } from "@/shared/ui/select";
import { Separator } from "@/shared/ui/separator";
import { Skeleton } from "@/shared/ui/skeleton";
import { Switch } from "@/shared/ui/switch";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Textarea } from "@/shared/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";

function Section(props: ParentProps<{ title: string; description?: string; id: string }>) {
  return (
    <Card id={props.id} class="scroll-mt-20">
      <CardHeader>
        <CardTitle class="text-xl">{props.title}</CardTitle>
        {props.description ? <CardDescription>{props.description}</CardDescription> : null}
      </CardHeader>
      <CardContent class="flex flex-wrap items-start gap-4">{props.children}</CardContent>
    </Card>
  );
}

function Row(props: ParentProps<{ class?: string }>) {
  return (
    <div class={`flex flex-wrap items-center gap-3 ${props.class ?? ""}`}>{props.children}</div>
  );
}

function UiKitPage() {
  const [checked, setChecked] = createSignal(false);
  const [switched, setSwitched] = createSignal(true);
  const [dialogOpen, setDialogOpen] = createSignal(false);

  const sections = [
    { id: "buttons", title: "Button" },
    { id: "badges", title: "Badge" },
    { id: "cards", title: "Card" },
    { id: "inputs", title: "Input / Textarea / Label" },
    { id: "select", title: "Select" },
    { id: "checkbox-switch", title: "Checkbox + Switch" },
    { id: "tabs", title: "Tabs" },
    { id: "dialog", title: "Dialog" },
    { id: "dropdown", title: "Dropdown menu" },
    { id: "popover", title: "Popover" },
    { id: "tooltip", title: "Tooltip" },
    { id: "skeleton", title: "Skeleton" },
    { id: "separator", title: "Separator" },
    { id: "avatar", title: "Avatar" },
    { id: "table", title: "Table" },
  ] as const;

  return (
    <div class="grid gap-6">
      <header class="grid gap-2">
        <h1 class="text-3xl font-semibold tracking-tight">UI Kit</h1>
        <p class="max-w-prose text-muted-foreground">
          Visual contract for the design system. Every primitive lives in{" "}
          <code>src/shared/ui/</code> and is composed from Tailwind tokens + CVA + Kobalte. Use this
          page to spot regressions after token or component changes.
        </p>
        <nav class="flex flex-wrap gap-2 pt-2 text-xs">
          {sections.map((s) => (
            <a
              href={`#${s.id}`}
              class="rounded-md border bg-muted/40 px-2 py-1 text-muted-foreground hover:text-foreground"
            >
              {s.title}
            </a>
          ))}
        </nav>
      </header>

      <Section id="buttons" title="Button" description="Variants and sizes.">
        <Row>
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </Row>
        <Row>
          <Button size="sm">Small</Button>
          <Button>Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon" aria-label="Icon">
            <Icon name="check" />
          </Button>
        </Row>
        <Row>
          <Button disabled>Disabled</Button>
          <Button variant="outline" disabled>
            Disabled
          </Button>
        </Row>
      </Section>

      <Section id="badges" title="Badge" description="Status, branch, language, neutral.">
        <Row>
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
        </Row>
        <Row>
          <Badge variant="ok">OK</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="failed">Failed</Badge>
        </Row>
      </Section>

      <Section
        id="cards"
        title="Card"
        description="Compound: Header, Title, Description, Content, Footer."
      >
        <div class="grid w-full gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Default</CardTitle>
              <CardDescription>Plain non-interactive surface.</CardDescription>
            </CardHeader>
            <CardContent class="text-sm text-muted-foreground">
              Body lives here. Padding matches the design system.
            </CardContent>
            <CardFooter>
              <Button size="sm">Action</Button>
            </CardFooter>
          </Card>
          <Card interactive>
            <CardHeader>
              <CardTitle>Interactive</CardTitle>
              <CardDescription>Has hover + ripple. For clickable run cards.</CardDescription>
            </CardHeader>
            <CardContent class="text-sm text-muted-foreground">
              Click anywhere — the whole card is the target.
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section id="inputs" title="Input / Textarea / Label" description="Form primitives.">
        <div class="grid w-full gap-4 sm:grid-cols-2">
          <Input label="Branch" placeholder="develop" />
          <Input label="Author" placeholder="user@doctorina.com" error="Invalid email" />
          <div class="grid gap-2">
            <Label for="textarea-demo">Notes</Label>
            <Textarea id="textarea-demo" placeholder="Free-form notes…" />
          </div>
          <div class="grid gap-2">
            <Label for="input-disabled">Disabled</Label>
            <Input id="input-disabled" disabled value="Not editable" />
          </div>
        </div>
      </Section>

      <Section id="select" title="Select" description="Kobalte-driven, keyboard-accessible.">
        <Select
          label="Branch"
          placeholder="Pick a branch"
          options={["main", "develop", "feature/runs", "hotfix/release"]}
        />
      </Section>

      <Section id="checkbox-switch" title="Checkbox + Switch" description="Two-state toggles.">
        <div class="grid w-full gap-4 sm:grid-cols-2">
          <Checkbox
            label="Show only failed shots"
            description="Hide everything that resolved to status='ok'."
            checked={checked()}
            onChange={setChecked}
          />
          <Switch
            label="Group by language"
            description="Default grouping is by case."
            checked={switched()}
            onChange={setSwitched}
          />
        </div>
      </Section>

      <Section id="tabs" title="Tabs" description="Used for the run page grouping switcher.">
        <Tabs defaultValue="by-case" class="w-full">
          <TabsList>
            <TabsTrigger value="by-case">By case</TabsTrigger>
            <TabsTrigger value="by-language">By language</TabsTrigger>
            <TabsTrigger value="by-layout">By layout</TabsTrigger>
          </TabsList>
          <TabsContent value="by-case" class="text-sm text-muted-foreground">
            Compare languages × layouts inside each test case.
          </TabsContent>
          <TabsContent value="by-language" class="text-sm text-muted-foreground">
            Compare cases × layouts inside each language.
          </TabsContent>
          <TabsContent value="by-layout" class="text-sm text-muted-foreground">
            Compare cases × languages inside each layout breakpoint.
          </TabsContent>
        </Tabs>
      </Section>

      <Section id="dialog" title="Dialog" description="Fullscreen image viewer foundation.">
        <Dialog open={dialogOpen()} onOpenChange={setDialogOpen}>
          <DialogTrigger as={Button} variant="outline">
            Open dialog
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm action</DialogTitle>
              <DialogDescription>
                This is the standard dialog. Focus is trapped; Escape closes; the overlay handles
                outside-click dismiss.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setDialogOpen(false)}>Confirm</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Section>

      <Section id="dropdown" title="Dropdown menu" description="Overflow actions for run cards.">
        <DropdownMenu>
          <DropdownMenuTrigger as={Button} variant="outline">
            Actions
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Run</DropdownMenuLabel>
            <DropdownMenuItem>
              Open
              <DropdownMenuShortcut>↵</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>Copy run ID</DropdownMenuItem>
            <DropdownMenuItem>Open in CI</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>Delete (CI-only)</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Section>

      <Section id="popover" title="Popover" description="Filter pickers, info bubbles.">
        <Popover>
          <PopoverTrigger as={Button} variant="outline">
            Open popover
          </PopoverTrigger>
          <PopoverContent>
            <div class="grid gap-2">
              <PopoverTitle>Filter</PopoverTitle>
              <PopoverDescription>
                Pop-ups host filter controls, info, and lightweight forms.
              </PopoverDescription>
              <div class="grid gap-2 pt-2">
                <Input label="Min shots" placeholder="0" />
                <Button size="sm">Apply</Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </Section>

      <Section id="tooltip" title="Tooltip" description="Hover hints on truncated commits / chips.">
        <Tooltip>
          <TooltipTrigger as={Button} variant="ghost">
            Hover me
          </TooltipTrigger>
          <TooltipContent>Commit subject preview</TooltipContent>
        </Tooltip>
      </Section>

      <Section id="skeleton" title="Skeleton" description="Loading placeholders.">
        <div class="grid w-full gap-3">
          <Skeleton class="h-4 w-1/3" />
          <Skeleton class="h-4 w-1/2" />
          <Skeleton class="h-4 w-2/3" />
          <div class="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-4">
            <Skeleton class="aspect-square w-full" />
            <Skeleton class="aspect-square w-full" />
            <Skeleton class="aspect-square w-full" />
            <Skeleton class="aspect-square w-full" />
          </div>
        </div>
      </Section>

      <Section id="separator" title="Separator" description="Section dividers.">
        <div class="grid w-full gap-3">
          <div>Above</div>
          <Separator />
          <div>Below</div>
        </div>
        <div class="flex h-8 items-center gap-3">
          <span>Left</span>
          <Separator orientation="vertical" />
          <span>Right</span>
        </div>
      </Section>

      <Section id="avatar" title="Avatar" description="Author + reviewer chips.">
        <Row>
          <Avatar fallback="MM" size="sm" />
          <Avatar fallback="MM" />
          <Avatar fallback="MM" size="lg" />
          <Avatar src="https://avatars.githubusercontent.com/u/1?v=4" alt="Octocat" fallback="GH" />
        </Row>
      </Section>

      <Section id="table" title="Table" description="Debug / metadata views.">
        <Table>
          <TableCaption>Latest five runs (mock data).</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Run</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Status</TableHead>
              <TableHead class="text-right">Shots</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell class="font-medium">26635914236-1</TableCell>
              <TableCell>develop</TableCell>
              <TableCell>
                <Badge variant="ok">success</Badge>
              </TableCell>
              <TableCell class="text-right">1152</TableCell>
            </TableRow>
            <TableRow>
              <TableCell class="font-medium">26634891001-1</TableCell>
              <TableCell>main</TableCell>
              <TableCell>
                <Badge variant="warning">partial</Badge>
              </TableCell>
              <TableCell class="text-right">1148</TableCell>
            </TableRow>
            <TableRow>
              <TableCell class="font-medium">26628772419-2</TableCell>
              <TableCell>feature/runs</TableCell>
              <TableCell>
                <Badge variant="failed">failed</Badge>
              </TableCell>
              <TableCell class="text-right">812</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Section>
    </div>
  );
}

function Icon(props: { name: "check" }): JSX.Element {
  if (props.name === "check") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="h-4 w-4"
        aria-hidden="true"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    );
  }
  return null;
}

export default UiKitPage;
