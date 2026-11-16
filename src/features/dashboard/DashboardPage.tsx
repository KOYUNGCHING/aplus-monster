import { MochiWidget } from '@/components/mascot/MochiWidget'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { ROUTES } from '@/lib/routes'
import { todayISO } from '@/lib/date'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

// Placeholder data until persistence layer (Phase 2)
const mockProgress = { xp: 240, level: 3, unlockedItems: [] }

export function DashboardPage() {
  const today = todayISO()
  const greeting = getGreeting()

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title={`${greeting}👋`}
        description={`今天是 ${new Date(today).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}`}
        actions={
          <Link to={ROUTES.onboarding}>
            <Button size="sm" variant="secondary">設定新學期</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Today's tasks */}
          <Card>
            <CardHeader>
              <CardTitle>今日任務</CardTitle>
              <Badge variant="default">0 項</Badge>
            </CardHeader>
            <EmptyState
              icon="📋"
              title="尚無今日任務"
              description="先建立課程和學習計畫，任務就會出現在這裡。"
              action={{ label: '設定課程', onClick: () => window.location.assign(ROUTES.onboarding) }}
            />
          </Card>

          {/* Courses */}
          <Card>
            <CardHeader>
              <CardTitle>目前課程</CardTitle>
              <Link to={ROUTES.semesters}>
                <Button size="sm" variant="ghost">查看全部</Button>
              </Link>
            </CardHeader>
            <EmptyState
              icon="📚"
              title="尚未建立課程"
              description="新增學期和課程，開始規劃讀書計畫。"
              action={{ label: '新增學期', onClick: () => window.location.assign(ROUTES.semesters) }}
            />
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Mochi */}
          <MochiWidget
            mood="happy"
            message="歡迎回來！先把課程設定好，Mochi 再幫你排計畫 ✨"
            progress={mockProgress}
          />

          {/* Upcoming deadlines */}
          <Card>
            <CardHeader>
              <CardTitle>即將截止</CardTitle>
            </CardHeader>
            <EmptyState
              icon="📅"
              title="沒有即將到來的截止日"
              className="py-6"
            />
          </Card>

          {/* Weekly progress */}
          <Card>
            <CardHeader>
              <CardTitle>本週進度</CardTitle>
            </CardHeader>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--muted)]">完成時數</span>
                <span className="font-semibold text-[var(--text)]">0 / 0 hrs</span>
              </div>
              <div
                className="w-full h-2.5 bg-[var(--border)] rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={0}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="本週學習進度 0%"
              >
                <div className="h-full bg-[var(--mint)] rounded-full w-0 transition-all duration-500" />
              </div>
              <p className="text-xs text-[var(--muted)]">設定讀書計畫後開始追蹤</p>
            </div>
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
