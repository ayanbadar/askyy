import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ResponseBreakdownProps = {
  resolvedFirstTry: number;
  multiTurn: number;
  escalated: number;
  abandoned: number;
};

const segments = [
  { key: "resolvedFirstTry", label: "Resolved first try", color: "bg-chart-4" },
  { key: "multiTurn", label: "Multi-turn", color: "bg-chart-2" },
  { key: "escalated", label: "Escalated", color: "bg-chart-3" },
  { key: "abandoned", label: "Abandoned", color: "bg-destructive/70" },
] as const;

export function ResponseBreakdown(props: ResponseBreakdownProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Resolution breakdown</CardTitle>
        <CardDescription>How conversations ended this week</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex h-3 overflow-hidden rounded-full">
          {segments.map(({ key, color }) => (
            <div
              key={key}
              className={cn(color, "transition-all")}
              style={{ width: `${props[key]}%` }}
              title={`${props[key]}%`}
            />
          ))}
        </div>
        <ul className="space-y-2">
          {segments.map(({ key, label, color }) => (
            <li key={key} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className={cn("size-2.5 rounded-full", color)} />
                {label}
              </span>
              <span className="tabular-nums text-muted-foreground">
                {props[key]}%
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
