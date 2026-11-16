import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { useParams } from 'react-router-dom'

export function CoursePage() {
  const { courseId } = useParams()

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader title="課程總覽" description={`課程 ID: ${courseId}`} />
      <EmptyState
        icon="📖"
        title="課程內容建置中"
        description="Phase 2 將完整實作課程管理功能。"
      />
    </div>
  )
}
