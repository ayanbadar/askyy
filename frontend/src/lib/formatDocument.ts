import type { DocumentIndexStatus } from "@/api/documents";

const MIME_LABELS: Record<string, string> = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "Word",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "Excel",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    "PowerPoint",
  "application/msword": "Word",
  "application/vnd.ms-excel": "Excel",
  "application/vnd.ms-powerpoint": "PowerPoint",
  "text/plain": "Text",
  "text/markdown": "Markdown",
  "text/csv": "CSV",
  "application/vnd.google-apps.document": "Google Doc",
  "application/vnd.google-apps.spreadsheet": "Google Sheet",
  "application/vnd.google-apps.presentation": "Google Slides",
  "application/vnd.google-apps.folder": "Folder",
};

export function formatMimeType(mimeType: string): string {
  if (MIME_LABELS[mimeType]) {
    return MIME_LABELS[mimeType];
  }

  const subtype = mimeType.split("/").pop();
  if (!subtype) {
    return mimeType;
  }

  return subtype.replace(/[._-]+/g, " ").toUpperCase();
}

export function formatDocumentDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function formatDocumentSource(source: SyncedDocumentSource): string {
  if (source === "google_drive") {
    return "Google Drive";
  }

  return source;
}

const INDEX_STATUS_LABELS: Record<DocumentIndexStatus, string> = {
  pending: "Pending",
  processing: "Indexing",
  indexed: "Indexed",
  failed: "Failed",
  skipped: "Skipped",
};

const INDEX_STATUS_STYLES: Record<DocumentIndexStatus, string> = {
  pending: "bg-muted text-muted-foreground",
  processing: "bg-primary/10 text-primary",
  indexed: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  failed: "bg-destructive/10 text-destructive",
  skipped: "bg-muted/50 text-muted-foreground",
};

export function formatIndexStatusLabel(status: DocumentIndexStatus): string {
  return INDEX_STATUS_LABELS[status] ?? status;
}

export function getIndexStatusClassName(status: DocumentIndexStatus): string {
  return INDEX_STATUS_STYLES[status] ?? INDEX_STATUS_STYLES.pending;
}

export function formatIndexStatusDetail(
  status: DocumentIndexStatus,
  chunkCount: number,
): string | null {
  if (status === "indexed" && chunkCount > 0) {
    return chunkCount === 1 ? "1 chunk" : `${chunkCount} chunks`;
  }
  return null;
}

export type SyncedDocumentSource = "google_drive";
