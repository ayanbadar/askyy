import { FileText } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { UserDocument } from "@/data/dashboardTypes";
import { cn } from "@/lib/utils";

type MyDocumentsProps = {
  documents: UserDocument[];
};

const statusStyles: Record<UserDocument["status"], string> = {
  ready: "text-chart-4",
  processing: "text-primary",
  failed: "text-destructive",
};

const statusLabels: Record<UserDocument["status"], string> = {
  ready: "Ready",
  processing: "Processing",
  failed: "Failed",
};

export function MyDocuments({ documents }: MyDocumentsProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>My documents</CardTitle>
        <CardDescription>
          Files you&apos;ve uploaded to the knowledge base
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-0">
        {documents.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No documents synced yet. Connect Google Drive to add files.
          </p>
        )}
        {documents.map((document, index) => (
          <div key={document.id ?? document.name}>
            <div className="flex items-start gap-3 py-3">
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{document.name}</p>
                <p className="text-xs text-muted-foreground">
                  {document.type} · {document.uploadedAt}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 text-xs font-medium",
                  statusStyles[document.status],
                )}
              >
                {statusLabels[document.status]}
              </span>
            </div>
            {index < documents.length - 1 && <Separator />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
