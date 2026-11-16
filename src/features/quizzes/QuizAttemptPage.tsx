import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { useParams } from 'react-router-dom'

export function QuizAttemptPage() {
  const { quizId } = useParams()

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title="測驗作答" description={`測驗 ${quizId}`} />
      <EmptyState
        icon="🧪"
        title="測驗功能建置中"
        description="Phase 2 將完整實作測驗作答與結果功能。"
      />
    </div>
  )
}
