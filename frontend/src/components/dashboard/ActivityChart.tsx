import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { WeeklyActivity } from "@/data/dashboardTypes";
import { cn } from "@/lib/utils";

type ActivityChartProps = {
  data: WeeklyActivity[];
};

export function ActivityChart({ data }: ActivityChartProps) {
  const maxConversations = Math.max(...data.map((d) => d.conversations));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Weekly activity</CardTitle>
        <CardDescription>
          Conversations and messages over the last 7 days
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex h-48 items-end justify-between gap-2">
          {data.map((item, index) => {
            const height = (item.conversations / maxConversations) * 100;

            return (
              <div
                key={item.day}
                className="flex flex-1 flex-col items-center gap-2"
              >
                <span className="text-xs tabular-nums text-muted-foreground">
                  {item.conversations}
                </span>
                <div className="flex w-full flex-1 items-end">
                  <div
                    className={cn(
                      "w-full rounded-t-md transition-all",
                      index === data.length - 2
                        ? "bg-primary"
                        : "bg-chart-2/80",
                    )}
                    style={{ height: `${Math.max(height, 8)}%` }}
                    title={`${item.messages} messages`}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {item.day}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-chart-2/80" />
            Conversations
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-primary" />
            Yesterday (highlight)
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
