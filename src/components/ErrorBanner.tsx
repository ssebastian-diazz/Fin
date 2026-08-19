export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-3 rounded-none border border-danger/30 bg-danger-dim px-3 py-2 text-xs text-danger"
    >
      <span>{message}</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="font-semibold uppercase tracking-wide shrink-0 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/50 rounded-none"
        >
          Reintentar
        </button>
      )}
    </div>
  )
}
