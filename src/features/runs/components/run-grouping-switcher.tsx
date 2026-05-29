import type { GroupBy } from "@/features/runs/manifest-helpers";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";

interface Props {
  value: GroupBy;
  onChange: (next: GroupBy) => void;
}

function RunGroupingSwitcher(props: Props) {
  return (
    <Tabs value={props.value} onChange={(v) => props.onChange(v as GroupBy)}>
      <TabsList>
        <TabsTrigger value="case">By case</TabsTrigger>
        <TabsTrigger value="language">By language</TabsTrigger>
        <TabsTrigger value="layout">By layout</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

export { RunGroupingSwitcher };
