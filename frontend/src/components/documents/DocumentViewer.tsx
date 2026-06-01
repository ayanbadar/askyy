import { useCallback, useEffect, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import type { SyncedDocument } from "@/api/documents";
import {
  fetchDocumentForDownload,
  fetchDocumentForView,
} from "@/api/documents";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoadingState } from "@/components/LoadingState";
import {
  downloadBlob,
  isImageMimeType,
  isPdfMimeType,
  isTextLikeMimeType,
} from "@/lib/documentContent";

type DocumentViewerProps = {
  document: SyncedDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type PreviewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      objectUrl: string;
      contentType: string;
      textContent?: string;
      filename: string;
    };

export function DocumentViewer({
  document,
  open,
  onOpenChange,
}: DocumentViewerProps) {
  const [preview, setPreview] = useState<PreviewState>({ status: "idle" });
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!open || !document) {
      return;
    }

    let cancelled = false;

    const loadPreview = async () => {
      setPreview({ status: "loading" });

      try {
        const result = await fetchDocumentForView(document.id);
        if (cancelled) {
          return;
        }

        const objectUrl = URL.createObjectURL(result.blob);

        if (isTextLikeMimeType(result.contentType)) {
          const textContent = await result.blob.text();
          if (cancelled) {
            URL.revokeObjectURL(objectUrl);
            return;
          }

          setPreview({
            status: "ready",
            objectUrl,
            contentType: result.contentType,
            textContent,
            filename: result.filename,
          });
          return;
        }

        setPreview({
          status: "ready",
          objectUrl,
          contentType: result.contentType,
          filename: result.filename,
        });
      } catch (error) {
        if (!cancelled) {
          setPreview({
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : "Failed to load document preview.",
          });
        }
      }
    };

    void loadPreview();

    return () => {
      cancelled = true;
    };
  }, [document, open]);

  useEffect(() => {
    if (!open) {
      setPreview({ status: "idle" });
      setIsDownloading(false);
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (preview.status === "ready") {
        URL.revokeObjectURL(preview.objectUrl);
      }
    };
  }, [preview]);

  const handleDownload = useCallback(async () => {
    if (!document) {
      return;
    }

    setIsDownloading(true);
    try {
      const result = await fetchDocumentForDownload(document.id);
      downloadBlob(result.blob, result.filename);
    } finally {
      setIsDownloading(false);
    }
  }, [document]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-full max-w-5xl flex-col sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle className="truncate pr-8">{document?.name}</DialogTitle>
          <DialogDescription>
            Preview synced document content from Google Drive.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-[50vh] overflow-hidden rounded-lg border bg-muted/20">
          {preview.status === "loading" && (
            <LoadingState label="Loading preview…" className="h-[50vh]" />
          )}

          {preview.status === "error" && (
            <div className="flex h-[50vh] items-center justify-center px-6 text-center text-sm text-muted-foreground">
              {preview.message}
            </div>
          )}

          {preview.status === "ready" && isPdfMimeType(preview.contentType) && (
            <iframe
              title={document?.name ?? "Document preview"}
              src={preview.objectUrl}
              className="h-[60vh] w-full bg-background"
            />
          )}

          {preview.status === "ready" &&
            isImageMimeType(preview.contentType) && (
              <div className="flex h-[60vh] items-center justify-center p-4">
                <img
                  src={preview.objectUrl}
                  alt={document?.name ?? "Document preview"}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            )}

          {preview.status === "ready" &&
            isTextLikeMimeType(preview.contentType) && (
              <pre className="h-[60vh] overflow-auto p-4 text-xs whitespace-pre-wrap">
                {preview.textContent}
              </pre>
            )}

          {preview.status === "ready" &&
            !isPdfMimeType(preview.contentType) &&
            !isImageMimeType(preview.contentType) &&
            !isTextLikeMimeType(preview.contentType) && (
              <div className="flex h-[50vh] flex-col items-center justify-center gap-3 px-6 text-center text-sm text-muted-foreground">
                <p>Preview is not available for this file type.</p>
                <Button type="button" onClick={() => void handleDownload()}>
                  <Download className="size-4" />
                  Download file
                </Button>
              </div>
            )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <Button
            type="button"
            onClick={() => void handleDownload()}
            disabled={isDownloading || !document}
          >
            {isDownloading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
