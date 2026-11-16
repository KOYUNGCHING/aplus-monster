import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'

export function SemestersPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="學期管理"
        description="管理你的所有學期和課程"
        actions={<Button size="sm">＋ 新增學期</Button>}
      />
      <EmptyState
        icon="📚"
        title="尚未建立學期"
        description="點擊「新增學期」建立第一個學期，然後新增課程開始規劃。"
        action={{ label: '＋ 新增學期', onClick: () => {} }}
      />
    </div>
  )
}
