import { cn } from '@/lib/cn'
import { Button } from './Button'

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  title = '發生錯誤',
  message = '請稍後再試，或重新整理頁面。',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-3 py-12 px-6 text-center', className)}
      role="alert"
    >
      <span className="text-4xl" aria-hidden="true">⚠️</span>
      <h3 className="text-base font-semibold text-[var(--text)]">{title}</h3>
      <p className="text-sm text-[var(--muted)] max-w-sm">{message}</p>
      {onRetry && (
        <Button size="sm" variant="secondary" onClick={onRetry} className="mt-2">
          重試
        </Button>
      )}
    </div>
  )
}
