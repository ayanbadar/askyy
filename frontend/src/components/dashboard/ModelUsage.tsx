import { Bot, Coins, Zap } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type ModelUsageProps = {
  model: string;
  requestsToday: number;
  avgTokensPerRequest: number;
  estimatedCostUsd: number;
  tokenUsageToday: number;
};

export function ModelUsage({
  model,
  requestsToday,
  avgTokensPerRequest,
  estimatedCostUsd,
  tokenUsageToday,
}: ModelUsageProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Model usage</CardTitle>
        <CardDescription>Today&apos;s LLM consumption</CardDescription>
      </CardHeader>
      <CardContent className="space-y-0">
        <div className="flex items-center gap-3 py-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Bot className="size-4" />
          </span>
          <div>
            <p className="font-medium">{model}</p>
            <p className="text-xs text-muted-foreground">Active model</p>
          </div>
        </div>
        <Separator />
        <div className="flex items-center justify-between gap-4 py-3">
          <span className="flex items-center gap-2 text-muted-foreground">
            <Zap className="size-4" />
            Requests
          </span>
          <span className="font-medium tabular-nums">
            {requestsToday.toLocaleString()}
          </span>
        </div>
        <Separator />
        <div className="flex items-center justify-between gap-4 py-3">
          <span className="text-muted-foreground">Tokens today</span>
          <span className="font-medium tabular-nums">
            {(tokenUsageToday / 1000).toFixed(0)}k
          </span>
        </div>
        <Separator />
        <div className="flex items-center justify-between gap-4 py-3">
          <span className="text-muted-foreground">Avg tokens / request</span>
          <span className="font-medium tabular-nums">
            {avgTokensPerRequest.toLocaleString()}
          </span>
        </div>
        <Separator />
        <div className="flex items-center justify-between gap-4 py-3">
          <span className="flex items-center gap-2 text-muted-foreground">
            <Coins className="size-4" />
            Est. cost
          </span>
          <span className="font-medium tabular-nums">
            ${estimatedCostUsd.toFixed(2)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
