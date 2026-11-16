import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { useParams } from 'react-router-dom'

export function CourseNotesPage() {
  const { courseId } = useParams()

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader title="課程筆記" description={`課程 ${courseId} 的筆記`} />
      <EmptyState
        icon="📝"
        title="尚無筆記"
        description="Phase 2 將完整實作 Markdown 筆記功能。"
      />
    </div>
  )
}
