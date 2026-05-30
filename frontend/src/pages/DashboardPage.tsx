import { useAuth } from '@/contexts/AuthContext';

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <section>
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">
        Protected route — only visible when authenticated.
      </p>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold">Profile</h2>
        <dl className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-slate-500">Name</dt>
            <dd className="font-medium">{user?.name}</dd>
          </div>
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-slate-500">Email</dt>
            <dd className="font-medium">{user?.email}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
