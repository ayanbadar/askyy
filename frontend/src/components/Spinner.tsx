interface SpinnerProps {
  label?: string;
}

export function Spinner({ label = 'Loading…' }: SpinnerProps) {
  return (
    <div className="flex items-center gap-3 text-slate-500" role="status" aria-live="polite">
      <span
        className="inline-block size-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600 dark:border-slate-700 dark:border-t-indigo-400"
        aria-hidden="true"
      />
      <span className="text-sm">{label}</span>
    </div>
  );
}
