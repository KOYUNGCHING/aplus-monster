import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'

export function PlannerPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="讀書計畫"
        description="查看和管理你的學習排程"
        actions={<Button size="sm" disabled title="需先建立課程">✨ AI 生成計畫（即將開放）</Button>}
      />
      <EmptyState
        icon="📅"
        title="尚無讀書計畫"
        description="Phase 2 將完整實作計畫行事曆，包含 AI 生成與手動排程功能。"
      />
    </div>
  )
}
