import { cn } from '@/lib/cn'
import { ROUTES } from '@/lib/routes'
import { Link } from 'react-router-dom'

interface TopBarProps {
  title?: string
  className?: string
}

export function TopBar({ title, className }: TopBarProps) {
  return (
    <header
      className={cn(
        'flex items-center justify-between px-4 md:px-6 h-[var(--topbar-height)] bg-[var(--surface)] border-b border-[var(--border)] shrink-0',
        className,
      )}
    >
      {/* Mobile logo */}
      <Link
        to={ROUTES.app}
        className="flex items-center gap-2 md:hidden"
        aria-label="回到儀表板"
      >
        <div className="w-7 h-7 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-xs font-bold">
          A+
        </div>
        <span className="font-bold text-[var(--text)]">A+ Monster</span>
      </Link>

      {/* Desktop page title */}
      {title && (
        <span className="hidden md:block text-sm font-semibold text-[var(--text)]">{title}</span>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Link
          to={ROUTES.settings}
          aria-label="設定"
          className="p-2 rounded-[var(--radius-control)] text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--primary-soft)] transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14" />
          </svg>
        </Link>
      </div>
    </header>
  )
}
