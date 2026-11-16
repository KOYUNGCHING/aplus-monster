import { MochiWidget } from '@/components/mascot/MochiWidget'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'

export function ProgressPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="學習進度"
        description="追蹤各科目的學習狀況"
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>各科目進度</CardTitle>
            </CardHeader>
            <EmptyState
              icon="📊"
              title="尚無進度資料"
              description="完成讀書計畫和測驗後，這裡會顯示各科目的詳細進度。"
            />
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>弱點分析</CardTitle>
            </CardHeader>
            <EmptyState
              icon="🎯"
              title="尚無弱點資料"
              description="完成測驗後，系統會根據答題表現分析你的弱點。"
              className="py-6"
            />
          </Card>
        </div>
        <div>
          <MochiWidget
            mood="studying"
            message="每次練習都讓你更進步！繼續加油 💪"
            progress={{ xp: 240, level: 3, unlockedItems: [] }}
          />
        </div>
      </div>
    </div>
  )
}
