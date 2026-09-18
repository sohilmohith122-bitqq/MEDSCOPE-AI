export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-red-500/20 bg-red-500/8 p-6 text-center">
      <p className="font-semibold text-red-300">Something went wrong</p>
      <p className="mt-1 text-sm text-red-400/80">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-danger mt-4 text-sm px-4 py-2">
          Retry
        </button>
      )}
    </div>
  );
}
