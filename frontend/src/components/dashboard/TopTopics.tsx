import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { TopTopic } from "@/data/dashboardTypes";

type TopTopicsProps = {
  topics: TopTopic[];
  title?: string;
  description?: string;
};

const barColors = [
  "bg-chart-1",
  "bg-chart-2",
  "bg-chart-3",
  "bg-chart-4",
  "bg-chart-5",
  "bg-muted-foreground/40",
];

export function TopTopics({
  topics,
  title = "Top topics",
  description = "Most common conversation subjects",
}: TopTopicsProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {topics.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No topics yet. Your common questions will appear here.
          </p>
        )}
        {topics.map((topic, index) => (
          <div key={topic.topic} className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate">{topic.topic}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {topic.count}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${barColors[index] ?? barColors.at(-1)}`}
                style={{ width: `${topic.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
