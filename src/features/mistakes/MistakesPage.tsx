import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'

export function MistakesPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="錯題本"
        description="從測驗中記錄的錯誤，幫助你掌握弱點"
      />
      <EmptyState
        icon="🔍"
        title="錯題本是空的"
        description="完成測驗後，答錯的題目會自動記錄在這裡。"
      />
    </div>
  )
}
