import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <section className="py-16 text-center">
      <h1 className="text-5xl font-bold">404</h1>
      <p className="mt-4 text-slate-600 dark:text-slate-400">
        The page you are looking for does not exist.
      </p>
      <Link
        to="/"
        className="mt-6 inline-block text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
      >
        Go back home
      </Link>
    </section>
  );
}
