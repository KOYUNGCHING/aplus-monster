import { MochiWidget } from '@/components/mascot/MochiWidget'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/LoadingState'
import { useAllCourses } from '@/features/courses/hooks/useCourses'
import { useAllDeadlines } from '@/features/courses/hooks/useDeadlines'
import { useSemesters } from '@/features/semesters/hooks/useSemesters'
import { COURSE_COLORS } from '@/lib/courseColors'
import { daysUntil, formatDate, todayISO } from '@/lib/date'
import { ROUTES } from '@/lib/routes'
import { Link } from 'react-router-dom'
import type { CourseColor } from '@/types'

const mockProgress = { xp: 240, level: 3, unlockedItems: [] }

export function DashboardPage() {
  const today = todayISO()
  const greeting = getGreeting()

  const { data: semesters, isLoading: semLoading } = useSemesters()
  const { data: courses, isLoading: courseLoading } = useAllCourses()
  const { data: allDeadlines, isLoading: dlLoading } = useAllDeadlines()

  const activeSemester = semesters?.find((s) => s.status === 'active')

  // Upcoming deadlines (next 30 days, sorted)
  const upcomingDeadlines = allDeadlines
    ?.filter((d) => {
      const days = daysUntil(d.dueAt)
      return days >= 0 && days <= 30
    })
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
    .slice(0, 5) ?? []

  const activeCourses = courses?.filter((c) => !c.archivedAt) ?? []

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title={`${greeting}👋`}
        description={`今天是 ${new Date(today).toLocaleDateString('zh-TW', {
          year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
        })}`}
        actions={
          <Link to={ROUTES.semesters}>
            <Button size="sm" variant="secondary">管理學期</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Active semester */}
          {semLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : activeSemester ? (
            <div className="bg-[var(--primary-soft)] border border-[var(--border)] rounded-[var(--radius-card)] px-5 py-3 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-[var(--muted)] mb-0.5">目前學期</p>
                <p className="font-semibold text-[var(--primary)]">{activeSemester.name}</p>
                <p className="text-xs text-[var(--muted)]">
                  {formatDate(activeSemester.startDate)} ～ {formatDate(activeSemester.endDate)}
                </p>
              </div>
              <Link to={ROUTES.semesters}>
                <Button size="sm" variant="ghost">查看 →</Button>
              </Link>
            </div>
          ) : (
            <div className="bg-[var(--yellow)] border border-[#D4B800]/30 rounded-[var(--radius-card)] px-5 py-3 flex items-center justify-between gap-4">
              <p className="text-sm text-[#7A6000]">尚未建立學期，先設定才能開始規劃！</p>
              <Link to={ROUTES.semesters}>
                <Button size="sm">新增學期</Button>
              </Link>
            </div>
          )}

          {/* Courses */}
          <Card>
            <CardHeader>
              <CardTitle>目前課程</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="default">{activeCourses.length} 門</Badge>
                <Link to={ROUTES.semesters}>
                  <Button size="sm" variant="ghost">管理</Button>
                </Link>
              </div>
            </CardHeader>
            {courseLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : activeCourses.length === 0 ? (
              <EmptyState
                icon="📚"
                title="尚未建立課程"
                description="在「管理學期」頁面新增課程。"
                action={{ label: '前往學期管理', onClick: () => window.location.assign(ROUTES.semesters) }}
              />
            ) : (
              <div className="space-y-2">
                {activeCourses.map((course) => {
                  const colors = COURSE_COLORS[course.color as CourseColor]
                  return (
                    <Link
                      key={course.id}
                      to={ROUTES.course(course.id)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-control)] border border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--primary-soft)] transition-colors group"
                    >
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: colors.border }}
                      />
                      <span className="text-sm font-medium text-[var(--text)] group-hover:text-[var(--primary)] flex-1">
                        {course.title}
                      </span>
                      {course.code && (
                        <span className="text-xs text-[var(--muted)]">{course.code}</span>
                      )}
                      <span className="text-xs text-[var(--muted)] opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                    </Link>
                  )
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          <MochiWidget
            mood={activeCourses.length > 0 ? 'studying' : 'happy'}
            message={
              activeCourses.length > 0
                ? `加油！你有 ${activeCourses.length} 門課要顧 💪`
                : '歡迎回來！先設定課程，Mochi 再幫你排計畫 ✨'
            }
            progress={mockProgress}
          />

          {/* Upcoming deadlines */}
          <Card>
            <CardHeader>
              <CardTitle>即將截止</CardTitle>
              {upcomingDeadlines.length > 0 && (
                <Badge variant="warning">{upcomingDeadlines.length} 項</Badge>
              )}
            </CardHeader>
            {dlLoading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : upcomingDeadlines.length === 0 ? (
              <EmptyState icon="📅" title="沒有即將截止的項目" className="py-4" />
            ) : (
              <ul className="space-y-2">
                {upcomingDeadlines.map((d) => {
                  const days = daysUntil(d.dueAt)
                  return (
                    <li key={d.id} className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-[var(--text)]">{d.title}</p>
                        <p className="text-xs text-[var(--muted)]">{formatDate(d.dueAt)}</p>
                      </div>
                      <Badge variant={days <= 3 ? 'danger' : days <= 7 ? 'warning' : 'default'}>
                        {days === 0 ? '今天' : `${days} 天`}
                      </Badge>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 6) return '深夜好，'
  if (hour < 12) return '早安，'
  if (hour < 14) return '午安，'
  if (hour < 18) return '下午好，'
  return '晚安，'
}
