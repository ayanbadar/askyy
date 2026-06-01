import axios from "axios";
import { apiClient } from "@/api/client";
import { parseContentDispositionFilename } from "@/lib/documentContent";

export type DocumentIndexStatus =
  | "pending"
  | "processing"
  | "indexed"
  | "failed"
  | "skipped";

export type SyncedDocument = {
  id: number;
  drive_file_id: string;
  name: string;
  mime_type: string;
  modified_time: string;
  folder_name: string | null;
  source: "google_drive";
  first_seen_at: string;
  is_viewable: boolean;
  index_status: DocumentIndexStatus;
  index_error: string;
  chunk_count: number;
};

export type SyncedDocumentListResponse = {
  documents: SyncedDocument[];
  total: number;
};

export type DocumentContentResult = {
  blob: Blob;
  filename: string;
  contentType: string;
};

export async function listDocuments(
  search?: string,
): Promise<SyncedDocumentListResponse> {
  const { data } = await apiClient.get<SyncedDocumentListResponse>(
    "/sources/documents/",
    {
      params: search ? { q: search } : undefined,
    },
  );
  return data;
}

async function fetchDocumentContent(
  documentId: number,
  disposition: "inline" | "attachment",
): Promise<DocumentContentResult> {
  try {
    const response = await apiClient.get<Blob>(
      `/sources/documents/${documentId}/content/`,
      {
        params: { disposition },
        responseType: "blob",
        timeout: 120_000,
      },
    );

    const contentType =
      typeof response.headers["content-type"] === "string"
        ? response.headers["content-type"]
        : "application/octet-stream";
    const filename =
      parseContentDispositionFilename(
        response.headers["content-disposition"],
      ) ?? "document";

    return {
      blob: response.data,
      filename,
      contentType,
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
      try {
        const message = JSON.parse(await error.response.data.text()) as {
          message?: string;
        };
        throw new Error(message.message ?? "Failed to fetch document.");
      } catch (parseError) {
        if (
          parseError instanceof Error &&
          parseError.message !== error.message
        ) {
          throw parseError;
        }
      }
    }

    throw error;
  }
}

export function fetchDocumentForView(
  documentId: number,
): Promise<DocumentContentResult> {
  return fetchDocumentContent(documentId, "inline");
}

export function fetchDocumentForDownload(
  documentId: number,
): Promise<DocumentContentResult> {
  return fetchDocumentContent(documentId, "attachment");
}
