import { A } from "@solidjs/router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

function HomePage() {
  return (
    <div class="grid gap-6">
      <div class="grid gap-2">
        <h1 class="text-3xl font-semibold tracking-tight">Welcome</h1>
        <p class="text-muted-foreground">
          Internal viewer for Flutter integration-test screenshots. The runs list lands here in a
          future milestone — see{" "}
          <a
            class="underline underline-offset-4"
            href="https://github.com/DoctorinaAI/doctorina/issues/3695"
          >
            DoctorinaAI/doctorina#3695
          </a>
          .
        </p>
      </div>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <A href="/ui-kit" class="block">
          <Card interactive>
            <CardHeader>
              <CardTitle>UI Kit</CardTitle>
              <CardDescription>
                Every primitive with all its variants. Visual contract for the design system.
              </CardDescription>
            </CardHeader>
            <CardContent class="text-sm text-muted-foreground">Open showcase →</CardContent>
          </Card>
        </A>
        <Card>
          <CardHeader>
            <CardTitle>Runs list</CardTitle>
            <CardDescription>Coming in Milestone 4. Will read Firestore.</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Run page</CardTitle>
            <CardDescription>Coming in Milestone 5. Will fetch manifest + zip.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}

export default HomePage;
