import { cn } from '@/lib/cn'
import { ROUTES } from '@/lib/routes'
import { Link, matchPath, useLocation } from 'react-router-dom'

interface TopBarProps {
  title?: string
  className?: string
}

const PAGE_TITLES: Array<{ path: string; title: string }> = [
  { path: ROUTES.onboarding, title: '開始設定' },
  { path: ROUTES.semesters, title: '學期與課程' },
  { path: ROUTES.courseNotes(), title: '課程筆記' },
  { path: ROUTES.courseQuizzes(), title: '課程測驗' },
  { path: ROUTES.course(), title: '課程總覽' },
  { path: ROUTES.quiz(), title: '測驗作答' },
  { path: ROUTES.planner, title: '讀書計畫' },
  { path: ROUTES.mistakes, title: '錯題本' },
  { path: ROUTES.tutor, title: 'AI 導師' },
  { path: ROUTES.progress, title: '學習進度' },
  { path: ROUTES.settings, title: '設定' },
  { path: ROUTES.app, title: '儀表板' },
]

function getPageTitle(pathname: string) {
  return PAGE_TITLES.find(({ path }) => matchPath({ path, end: true }, pathname))?.title
    ?? '學習工作台'
}

export function TopBar({ title, className }: TopBarProps) {
  const { pathname } = useLocation()
  const pageTitle = title ?? getPageTitle(pathname)

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
      <span className="hidden text-sm font-semibold text-[var(--text)] md:block">
        {pageTitle}
      </span>

      {/* Actions */}
      <div className="ml-auto flex items-center gap-2">
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
