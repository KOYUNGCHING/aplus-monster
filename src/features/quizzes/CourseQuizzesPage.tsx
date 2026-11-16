import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { useParams } from 'react-router-dom'

export function CourseQuizzesPage() {
  const { courseId } = useParams()

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader title="測驗庫" description={`課程 ${courseId} 的測驗`} />
      <EmptyState
        icon="🧪"
        title="尚無測驗"
        description="Phase 2 將完整實作測驗生成與作答功能。"
      />
    </div>
  )
}
