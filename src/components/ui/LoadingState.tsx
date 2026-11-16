import { cn } from '@/lib/cn'

interface LoadingStateProps {
  message?: string
  className?: string
}

export function LoadingState({ message = '載入中…', className }: LoadingStateProps) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-3 py-12', className)}
      role="status"
      aria-live="polite"
    >
      <svg
        className="animate-spin w-8 h-8 text-[var(--primary)]"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      <p className="text-sm text-[var(--muted)]">{message}</p>
    </div>
  )
}

/** Skeleton block for card placeholders */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('bg-[var(--border)] rounded-[var(--radius-sm)] animate-pulse', className)}
      aria-hidden="true"
    />
  )
}
