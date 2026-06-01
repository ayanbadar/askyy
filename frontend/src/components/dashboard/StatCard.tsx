import { type LucideIcon, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  changeFormat?: "percent" | "count";
  icon: LucideIcon;
  invertTrend?: boolean;
};

export function StatCard({
  title,
  value,
  change,
  changeLabel = "vs last week",
  changeFormat = "percent",
  icon: Icon,
  invertTrend = false,
}: StatCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const trendIsGood = invertTrend ? isNegative : isPositive;
  const trendIsBad = invertTrend ? isPositive : isNegative;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-normal text-muted-foreground">
          {title}
        </CardTitle>
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-medium tabular-nums">{value}</p>
        {change !== undefined && (
          <p
            className={cn(
              "mt-1 flex items-center gap-1 text-xs",
              trendIsGood && "text-chart-4",
              trendIsBad && "text-destructive",
              !trendIsGood && !trendIsBad && "text-muted-foreground",
            )}
          >
            {isPositive && <TrendingUp className="size-3" />}
            {isNegative && <TrendingDown className="size-3" />}
            <span>
              {changeFormat === "percent" ? (
                <>
                  {isPositive ? "+" : ""}
                  {change}% {changeLabel}
                </>
              ) : (
                <>
                  {change > 0 ? "+" : ""}
                  {change} {changeLabel}
                </>
              )}
            </span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
