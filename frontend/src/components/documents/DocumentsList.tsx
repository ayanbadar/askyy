import { useState } from "react";
import { Download, Eye, FileText, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { SyncedDocument } from "@/api/documents";
import { fetchDocumentForDownload } from "@/api/documents";
import { DocumentViewer } from "@/components/documents/DocumentViewer";
import { DocumentIndexStatusBadge } from "@/components/documents/DocumentIndexStatusBadge";
import {
  formatDocumentDate,
  formatDocumentSource,
  formatMimeType,
} from "@/lib/formatDocument";
import { downloadBlob } from "@/lib/documentContent";
import { cn } from "@/lib/utils";

type DocumentsListProps = {
  documents: SyncedDocument[];
  total: number;
  isFetching?: boolean;
  emptyMessage?: string | null;
};

export function DocumentsList({
  documents,
  total,
  isFetching = false,
  emptyMessage = null,
}: DocumentsListProps) {
  const [viewDocument, setViewDocument] = useState<SyncedDocument | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const handleDownload = async (document: SyncedDocument) => {
    setDownloadingId(document.id);
    try {
      const result = await fetchDocumentForDownload(document.id);
      downloadBlob(result.blob, result.filename);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>All documents</CardTitle>
            {isFetching && (
              <Loader2
                className="size-4 animate-spin text-muted-foreground"
                aria-label="Updating results"
              />
            )}
          </div>
          <CardDescription>
            {total === 1 ? "1 document synced" : `${total} documents synced`}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-4 pb-3 font-normal">Name</th>
                  <th className="px-4 pb-3 font-normal">Type</th>
                  <th className="px-4 pb-3 font-normal">Folder</th>
                  <th className="px-4 pb-3 font-normal">Source</th>
                  <th className="px-4 pb-3 font-normal">Modified</th>
                  <th className="px-4 pb-3 font-normal">Indexing</th>
                  <th className="px-4 pb-3 font-normal">Added</th>
                  <th className="px-4 pb-3 text-right font-normal">Actions</th>
                </tr>
              </thead>
              <tbody className={cn(isFetching && "opacity-60")}>
                {documents.length === 0 && emptyMessage ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center text-muted-foreground"
                    >
                      {emptyMessage}
                    </td>
                  </tr>
                ) : (
                  documents.map((document) => (
                    <tr key={document.id} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex min-w-[200px] items-center gap-3">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <FileText className="size-4" />
                          </span>
                          <span className="truncate font-medium">
                            {document.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatMimeType(document.mime_type)}
                      </td>
                      <td className="max-w-[160px] truncate px-4 py-3 text-muted-foreground">
                        {document.folder_name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDocumentSource(document.source)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                        {formatDocumentDate(document.modified_time)}
                      </td>
                      <td className="px-4 py-3">
                        <DocumentIndexStatusBadge
                          status={document.index_status}
                          chunkCount={document.chunk_count}
                          error={document.index_error}
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                        {formatDocumentDate(document.first_seen_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`View ${document.name}`}
                            disabled={!document.is_viewable}
                            onClick={() => setViewDocument(document)}
                          >
                            <Eye className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Download ${document.name}`}
                            disabled={downloadingId === document.id}
                            onClick={() => void handleDownload(document)}
                          >
                            {downloadingId === document.id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Download className="size-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <DocumentViewer
        document={viewDocument}
        open={viewDocument !== null}
        onOpenChange={(open) => {
          if (!open) {
            setViewDocument(null);
          }
        }}
      />
    </>
  );
}
