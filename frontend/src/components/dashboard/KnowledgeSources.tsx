import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { KnowledgeSource } from "@/data/dashboardTypes";
import { cn } from "@/lib/utils";

type KnowledgeSourcesProps = {
  sources: KnowledgeSource[];
  totalDocuments: number;
  totalChunks: number;
};

const statusConfig: Record<
  KnowledgeSource["status"],
  { icon: typeof CheckCircle2; label: string; className: string }
> = {
  synced: {
    icon: CheckCircle2,
    label: "Synced",
    className: "text-chart-4",
  },
  syncing: {
    icon: Loader2,
    label: "Syncing",
    className: "text-primary animate-spin",
  },
  error: {
    icon: AlertCircle,
    label: "Error",
    className: "text-destructive",
  },
};

export function KnowledgeSources({
  sources,
  totalDocuments,
  totalChunks,
}: KnowledgeSourcesProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Knowledge base</CardTitle>
        <CardDescription>
          {totalDocuments} documents · {totalChunks.toLocaleString()} chunks
          indexed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-0">
        {sources.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No knowledge sources connected yet.
          </p>
        )}
        {sources.map((source, index) => {
          const config = statusConfig[source.status];
          const StatusIcon = config.icon;

          return (
            <div key={source.name}>
              <div className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{source.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {source.documents} docs · {source.lastSynced}
                  </p>
                </div>
                <span
                  className={cn(
                    "flex shrink-0 items-center gap-1 text-xs font-medium",
                    config.className,
                  )}
                >
                  <StatusIcon className="size-3.5" />
                  {config.label}
                </span>
              </div>
              {index < sources.length - 1 && <Separator />}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
