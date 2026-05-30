import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function Layout() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <NavLink
            to="/"
            className="text-xl font-bold tracking-tight text-slate-900 dark:text-white"
          >
            Askyy
          </NavLink>

          <nav
            className="flex items-center gap-4 text-sm"
            aria-label="Main navigation"
          >
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive
                  ? 'font-medium text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }
              end
            >
              Home
            </NavLink>

            {isAuthenticated ? (
              <>
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    isActive
                      ? 'font-medium text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }
                >
                  Dashboard
                </NavLink>
                <span className="hidden text-slate-500 sm:inline">
                  {user?.name}
                </span>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-lg bg-slate-100 px-3 py-1.5 text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Log out
                </button>
              </>
            ) : (
              <NavLink
                to="/login"
                className="rounded-lg bg-indigo-600 px-3 py-1.5 font-medium text-white transition hover:bg-indigo-500"
              >
                Sign in
              </NavLink>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 py-4 text-center text-sm text-slate-500 dark:border-slate-800">
        &copy; {new Date().getFullYear()} Askyy
      </footer>
    </div>
  );
}
