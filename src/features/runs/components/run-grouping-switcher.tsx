import type { GroupBy } from "@/features/runs/manifest-helpers";
import { useT } from "@/shared/lib/i18n";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";

interface Props {
  value: GroupBy;
  onChange: (next: GroupBy) => void;
}

function RunGroupingSwitcher(props: Props) {
  const t = useT();
  return (
    <Tabs value={props.value} onChange={(v) => props.onChange(v as GroupBy)}>
      <TabsList class="w-full select-none">
        <TabsTrigger value="case" class="flex-1 select-none">
          {t("run.groupBy.case")}
        </TabsTrigger>
        <TabsTrigger value="language" class="flex-1 select-none">
          {t("run.groupBy.language")}
        </TabsTrigger>
        <TabsTrigger value="layout" class="flex-1 select-none">
          {t("run.groupBy.layout")}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

export { RunGroupingSwitcher };
