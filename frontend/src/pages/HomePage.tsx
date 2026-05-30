import { LoadingState } from "@/components/LoadingState";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useHealthQuery } from "@/hooks";

export function HomePage() {
  const { data, error, isLoading, isError, refetch, isFetching } =
    useHealthQuery();

  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-3xl font-normal">Welcome to Askyy</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          React, Tailwind CSS, and shadcn/ui — connected to your Django API.
        </p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>API health check</CardTitle>
            <CardDescription>Live status from the backend</CardDescription>
          </div>
          {isFetching && !isLoading && (
            <span className="text-xs text-muted-foreground">Refreshing…</span>
          )}
        </CardHeader>
        <CardContent>
          {isLoading && <LoadingState label="Checking API…" />}

          {isError && (
            <Alert variant="destructive">
              <AlertTitle>Health check failed</AlertTitle>
              <AlertDescription className="flex flex-col gap-3">
                <span>{error.message}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-fit"
                  onClick={() => void refetch()}
                >
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {data && (
            <dl className="space-y-0">
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-muted-foreground">Status</dt>
                <dd className="font-medium">{data.status}</dd>
              </div>
              <Separator />
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-muted-foreground">Timestamp</dt>
                <dd className="font-medium">{data.timestamp}</dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
