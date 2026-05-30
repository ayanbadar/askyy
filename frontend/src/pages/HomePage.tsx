import { getHealth } from '@/api';
import { Spinner } from '@/components/Spinner';
import { useHealthQuery } from '@/hooks';

export function HomePage() {
  const { data, error, isLoading, isError, refetch, isFetching } =
    useHealthQuery();

  return (
    <section>
      <h1 className="text-4xl font-bold tracking-tight">Welcome to Askyy</h1>
      <p className="mt-3 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
        React boilerplate with Vite, TypeScript, TanStack Query, Axios, and
        Tailwind CSS.
      </p>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">API health check</h2>
          {isFetching && !isLoading && (
            <span className="text-xs text-slate-500">Refreshing…</span>
          )}
        </div>

        {isLoading && (
          <div className="mt-4">
            <Spinner label="Checking API…" />
          </div>
        )}

        {isError && (
          <div
            role="alert"
            className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300"
          >
            <p>{error.message}</p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-3 rounded-lg bg-red-600 px-3 py-1.5 text-white hover:bg-red-500"
            >
              Retry
            </button>
          </div>
        )}

        {data && (
          <dl className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
            <div className="flex justify-between gap-4 py-3">
              <dt className="text-slate-500">Status</dt>
              <dd className="font-medium">{data.status}</dd>
            </div>
            <div className="flex justify-between gap-4 py-3">
              <dt className="text-slate-500">Timestamp</dt>
              <dd className="font-medium">{data.timestamp}</dd>
            </div>
          </dl>
        )}
      </div>

      <p className="mt-6 text-sm text-slate-500">
        Tip: wire your backend to <code className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800">{getHealth.name}()</code> at{' '}
        <code className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800">GET /health</code>.
      </p>
    </section>
  );
}
