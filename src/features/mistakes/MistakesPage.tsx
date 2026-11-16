import { MochiAvatar } from '@/components/mascot/MochiAvatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { LoadingState } from '@/components/ui/LoadingState'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAllMistakes, useSetMistakeResolved } from '@/features/mistakes/hooks/useMistakes'
import { attemptDB, courseDB, questionDB, quizDB } from '@/lib/db'
import type { Course, Mistake, Quiz, QuizAttempt, QuizQuestion } from '@/types'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

// ─── Load all quizzes and questions in one query ──────────────────────────────

function useAllQuizzesAndQuestions() {
  return useQuery({
    queryKey: ['mistake-context'],
    queryFn: async () => {
      const [courses, quizzes, questions, attempts] = await Promise.all([
        courseDB.getAll(),
        quizDB.getAll(),
        questionDB.getAll(),
        attemptDB.getAll(),
      ])
      return { courses, quizzes, questions, attempts }
    },
  })
}

// ─── Filter tab ───────────────────────────────────────────────────────────────

type FilterTab = 'all' | 'unresolved' | 'resolved'

const filterLabels: Record<FilterTab, string> = {
  all: '全部',
  unresolved: '未解決',
  resolved: '已解決',
}

// ─── Mistake card ─────────────────────────────────────────────────────────────

interface MistakeCardProps {
  mistake: Mistake
  question: QuizQuestion | undefined
  attempt: QuizAttempt | undefined
  courseName: string | undefined
  onSetResolved: (id: string, resolved: boolean) => void
  resolving: boolean
}

function MistakeCard({ mistake, question, attempt, courseName, onSetResolved, resolving }: MistakeCardProps) {
  const isResolved = !!mistake.resolvedAt
  const rawCorrectAnswer = question
    ? Array.isArray(question.answer)
      ? question.answer[0]
      : question.answer
    : '—'
  const rawUserAnswer = attempt?.answersJson[mistake.questionId] ?? '（無作答紀錄）'

  function formatAnswer(answer: string): string {
    if (question?.type !== 'mcq' || !question.options) return answer
    const index = ['A', 'B', 'C', 'D'].indexOf(answer)
    return index >= 0 ? `${answer}. ${question.options[index]}` : answer
  }

  // Truncate prompt at 80 chars
  const promptPreview = question
    ? question.prompt.length > 80
      ? question.prompt.slice(0, 80) + '…'
      : question.prompt
    : '（題目已刪除）'

  return (
    <Card padding="md" className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1 min-w-0">
          {courseName && (
            <span className="text-xs text-[var(--muted)]">{courseName}</span>
          )}
          <p className="text-sm font-medium text-[var(--text)]">{promptPreview}</p>
        </div>
        {isResolved ? (
          <Badge variant="success">已解決</Badge>
        ) : (
          <Badge variant="danger">未解決</Badge>
        )}
      </div>

      <div className="grid gap-1 text-xs text-[var(--muted)] sm:grid-cols-2">
        <span className="min-w-0">
          <span className="font-medium">你的答案：</span>
          <span className="text-[var(--danger)] font-medium">{formatAnswer(rawUserAnswer)}</span>
        </span>
        <span className="min-w-0">
          <span className="font-medium">正確答案：</span>
          <span className="text-[var(--success,#3DB57A)] font-medium">{formatAnswer(rawCorrectAnswer)}</span>
        </span>
        <span className="sm:col-span-2">
          {new Date(mistake.createdAt).toLocaleDateString('zh-TW')}
        </span>
      </div>

      <div className="flex justify-end">
        <Button
          variant="secondary"
          size="sm"
          loading={resolving}
          onClick={() => onSetResolved(mistake.id, !isResolved)}
        >
          {isResolved ? '重新開啟' : '標記解決'}
        </Button>
      </div>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function MistakesPage() {
  const [filter, setFilter] = useState<FilterTab>('all')

  const { data: mistakes, isLoading: mistakesLoading, isError: mistakesError } = useAllMistakes()
  const contextQuery = useAllQuizzesAndQuestions()
  const setResolved = useSetMistakeResolved()

  const isLoading = mistakesLoading || contextQuery.isLoading

  // Build lookup maps
  const questionMap = new Map<string, QuizQuestion>(
    (contextQuery.data?.questions ?? []).map((q) => [q.id, q]),
  )
  const quizMap = new Map<string, Quiz>(
    (contextQuery.data?.quizzes ?? []).map((q) => [q.id, q]),
  )
  const courseMap = new Map<string, Course>(
    (contextQuery.data?.courses ?? []).map((c) => [c.id, c]),
  )
  const attemptMap = new Map<string, QuizAttempt>(
    (contextQuery.data?.attempts ?? []).map((attempt) => [attempt.id, attempt]),
  )

  // Filter mistakes
  const filtered = (mistakes ?? []).filter((m) => {
    if (filter === 'unresolved') return !m.resolvedAt
    if (filter === 'resolved') return !!m.resolvedAt
    return true
  })

  if (isLoading) return <LoadingState message="載入錯題中…" />

  if (mistakesError || contextQuery.isError) {
    return (
      <ErrorState
        title="載入失敗"
        description="無法載入錯題本，請重新整理後再試。"
        onRetry={() => {
          void contextQuery.refetch()
        }}
      />
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="錯題本"
        description="從測驗中記錄的錯誤，幫助你掌握弱點"
      />

      {/* Filter tabs */}
      <div
        className="flex gap-1 p-1 bg-[var(--border)] rounded-[var(--radius-control)] w-fit mb-5"
        role="tablist"
        aria-label="篩選錯題"
      >
        {(Object.keys(filterLabels) as FilterTab[]).map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={filter === tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-1.5 text-sm rounded-[calc(var(--radius-control)-2px)] transition-colors font-medium ${
              filter === tab
                ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            {filterLabels[tab]}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-12">
          <MochiAvatar mood="studying" size="lg" />
          <EmptyState
            title="錯題本是空的"
            description={
              filter === 'all'
                ? '完成測驗後，答錯的題目會自動記錄在這裡。'
                : filter === 'unresolved'
                  ? '目前沒有未解決的錯題，繼續保持！'
                  : '還沒有已解決的錯題。'
            }
          />
        </div>
      )}

      {filtered.length > 0 && (
        <div className="flex flex-col gap-3">
          {filtered.map((mistake) => {
            const question = questionMap.get(mistake.questionId)
            const quiz = question ? quizMap.get(question.quizId) : undefined
            const course = quiz ? courseMap.get(quiz.courseId) : undefined

            return (
              <MistakeCard
                key={mistake.id}
                mistake={mistake}
                question={question}
                attempt={attemptMap.get(mistake.attemptId)}
                courseName={course?.title}
                onSetResolved={(id, resolved) => setResolved.mutate({ id, resolved })}
                resolving={setResolved.isPending && setResolved.variables?.id === mistake.id}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
