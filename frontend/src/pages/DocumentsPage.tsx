import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Database, Search } from "lucide-react";
import { DocumentsList } from "@/components/documents/DocumentsList";
import { LoadingState } from "@/components/LoadingState";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useDocumentsQuery } from "@/hooks/useDocuments";
import { useGoogleDriveStatusQuery } from "@/hooks/useGoogleDrive";

export function DocumentsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const statusQuery = useGoogleDriveStatusQuery();
  const documentsQuery = useDocumentsQuery(searchQuery || undefined);

  const connected = statusQuery.data?.connected ?? false;
  const activeFileCount = statusQuery.data?.active_file_count ?? 0;
  const documents = documentsQuery.data?.documents ?? [];
  const total = documentsQuery.data?.total ?? 0;
  const isSearching = searchQuery.length > 0;
  const isInitialLoading =
    statusQuery.isLoading || (documentsQuery.isLoading && !documentsQuery.data);
  const showSearch = connected && (activeFileCount > 0 || isSearching);
  const showDocumentsList =
    connected &&
    (documents.length > 0 || isSearching || documentsQuery.isFetching);

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-normal">Documents</h1>
          <p className="mt-2 text-muted-foreground">
            Browse files synced from your connected sources.
          </p>
        </div>

        {showSearch && (
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search documents…"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              className="pl-9"
              aria-label="Search documents"
            />
          </div>
        )}
      </div>

      {isInitialLoading && (
        <LoadingState label="Loading documents…" className="py-16" />
      )}

      {!isInitialLoading && !connected && (
        <Card>
          <CardHeader>
            <CardTitle>No source connected</CardTitle>
            <CardDescription>
              Connect Google Drive on the Source page to start syncing documents
              into your knowledge base.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button render={<Link to="/source" />}>
              <Database className="size-4" />
              Go to Source
            </Button>
          </CardContent>
        </Card>
      )}

      {!isInitialLoading && connected && total === 0 && !isSearching && (
        <Card>
          <CardHeader>
            <CardTitle>No documents yet</CardTitle>
            <CardDescription>
              Choose folders to sync on the Source page, then run a sync to
              import your files.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button render={<Link to="/source" />} variant="outline">
              <Database className="size-4" />
              Manage sources
            </Button>
          </CardContent>
        </Card>
      )}

      {!isInitialLoading && showDocumentsList && (
        <DocumentsList
          documents={documents}
          total={total}
          isFetching={documentsQuery.isFetching && !documentsQuery.isLoading}
          emptyMessage={
            isSearching && documents.length === 0 && !documentsQuery.isFetching
              ? `No documents match "${searchQuery}". Try a different search term.`
              : null
          }
        />
      )}
    </section>
  );
}
