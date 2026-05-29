import { Card, CardContent, CardFooter, CardHeader } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";

function RunCardSkeleton() {
  return (
    <Card class="h-full">
      <CardHeader class="gap-3">
        <div class="flex gap-2">
          <Skeleton class="h-5 w-16 rounded-full" />
          <Skeleton class="h-5 w-20 rounded-full" />
        </div>
        <Skeleton class="h-5 w-3/4" />
        <Skeleton class="h-3 w-1/2" />
      </CardHeader>
      <CardContent class="grid gap-3">
        <div class="flex gap-2">
          <Skeleton class="h-4 w-8" />
          <Skeleton class="h-4 w-8" />
          <Skeleton class="h-4 w-8" />
        </div>
        <div class="grid grid-cols-3 gap-3">
          <Skeleton class="h-8 w-full" />
          <Skeleton class="h-8 w-full" />
          <Skeleton class="h-8 w-full" />
        </div>
      </CardContent>
      <CardFooter class="justify-between">
        <div class="flex items-center gap-2">
          <Skeleton class="h-8 w-8 rounded-full" />
          <Skeleton class="h-4 w-24" />
        </div>
        <Skeleton class="h-4 w-16" />
      </CardFooter>
    </Card>
  );
}

export { RunCardSkeleton };
