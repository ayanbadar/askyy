import { Loader2 } from "lucide-react";
import type { DocumentIndexStatus } from "@/api/documents";
import {
  formatIndexStatusDetail,
  formatIndexStatusLabel,
  getIndexStatusClassName,
} from "@/lib/formatDocument";
import { cn } from "@/lib/utils";

type DocumentIndexStatusBadgeProps = {
  status: DocumentIndexStatus;
  chunkCount: number;
  error?: string;
};

export function DocumentIndexStatusBadge({
  status,
  chunkCount,
  error,
}: DocumentIndexStatusBadgeProps) {
  const detail = formatIndexStatusDetail(status, chunkCount);
  const isProcessing = status === "processing";

  return (
    <div className="flex flex-col gap-0.5">
      <span
        className={cn(
          "inline-flex w-fit items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium",
          getIndexStatusClassName(status),
        )}
        title={status === "failed" && error ? error : undefined}
      >
        {isProcessing && <Loader2 className="size-3 animate-spin" />}
        {formatIndexStatusLabel(status)}
      </span>
      {detail && (
        <span className="text-xs text-muted-foreground">{detail}</span>
      )}
      {status === "failed" && error && (
        <span
          className="max-w-[180px] truncate text-xs text-destructive/80"
          title={error}
        >
          {error}
        </span>
      )}
    </div>
  );
}
