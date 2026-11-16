import { cn } from '@/lib/cn'
import { ROUTES } from '@/lib/routes'
import { useAuthContext } from '@/features/auth/AuthContext'
import { isSupabaseConfigured } from '@/lib/supabase'
import { NavLink } from 'react-router-dom'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  {
    label: '儀表板',
    href: ROUTES.app,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    label: '學期',
    href: ROUTES.semesters,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    label: '計畫',
    href: ROUTES.planner,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    label: '錯題本',
    href: ROUTES.mistakes,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
  {
    label: 'AI 導師',
    href: ROUTES.tutor,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  },
  {
    label: '進度',
    href: ROUTES.progress,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    label: '設定',
    href: ROUTES.settings,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="3" /><path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14" />
      </svg>
    ),
  },
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const { user, mode } = useAuthContext()
  return (
    <aside
      className={cn(
        'hidden md:flex flex-col w-[var(--sidebar-width)] h-full bg-[var(--surface)] border-r border-[var(--border)] shrink-0',
        className,
      )}
      aria-label="主選單"
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 h-[var(--topbar-height)] border-b border-[var(--border)] shrink-0">
        <div className="w-7 h-7 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-xs font-bold">
          A+
        </div>
        <span className="font-bold text-[var(--text)]">A+ Monster</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === ROUTES.app}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-control)] text-sm font-medium transition-colors duration-150',
                isActive
                  ? 'bg-[var(--primary-soft)] text-[var(--primary)]'
                  : 'text-[var(--muted)] hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]',
              )
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Auth / Demo mode banner */}
      {mode === 'cloud' && user ? (
        <div className="p-3 mx-3 mb-3 bg-[var(--primary-soft)] rounded-[var(--radius-control)] text-xs text-[var(--primary)]">
          <p className="font-semibold mb-0.5">☁️ {user.displayName ?? user.email ?? '已登入'}</p>
          <p>資料已同步雲端。</p>
        </div>
      ) : (
        <div className="p-3 mx-3 mb-3 bg-[var(--yellow)] rounded-[var(--radius-control)] text-xs text-[#7A6000]">
          <p className="font-semibold mb-0.5">📱 本機示範模式</p>
          <p>資料存於瀏覽器。
            {isSupabaseConfigured && <NavLink to={ROUTES.login} className="underline ml-1">登入</NavLink>}
          </p>
        </div>
      )}
    </aside>
  )
}
