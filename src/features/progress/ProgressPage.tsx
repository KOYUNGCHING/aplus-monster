import { MochiWidget } from '@/components/mascot/MochiWidget'
import { MochiAvatar } from '@/components/mascot/MochiAvatar'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { LoadingState } from '@/components/ui/LoadingState'
import { PageHeader } from '@/components/ui/PageHeader'
import { useProgressData } from '@/features/progress/hooks/useProgressData'
import { suggestReplan, AINotConfiguredError } from '@/lib/aiGateway'
import { isSupabaseConfigured } from '@/lib/supabase'
import { studySessionDB } from '@/lib/db'
import { uuid } from '@/lib/id'
import { toLocalDateISO } from '@/lib/date'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { Course, QuizAttempt, StudySession } from '@/types'

function averageScore(attempts: QuizAttempt[]): number | null {
  const scores = attempts.flatMap((attempt) =>
    typeof attempt.score === 'number' ? [attempt.score] : [],
  )
  if (scores.length === 0) return null
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
}

function getCurrentWeekRange() {
  const start = new Date()
  const day = start.getDay()
  start.setDate(start.getDate() - (day === 0 ? 6 : day - 1))
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return { start: toLocalDateISO(start), end: toLocalDateISO(end) }
}

function SummaryMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <Card padding="sm">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className="text-2xl font-bold text-[var(--text)] mt-1">{value}</p>
      <p className="text-xs text-[var(--muted)] mt-1">{detail}</p>
    </Card>
  )
}

function CourseProgress({ course, sessions, attempts }: {
  course: Course
  sessions: StudySession[]
  attempts: QuizAttempt[]
}) {
  const completed = sessions.filter((session) => session.status === 'completed')
  const completedMinutes = completed.reduce((sum, session) => sum + session.durationMinutes, 0)
  const score = averageScore(attempts)

  return (
    <div className="border-b border-[var(--border)] py-4 last:border-b-0 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium text-[var(--text)]">{course.title}</p>
          {course.code && <p className="text-xs text-[var(--muted)]">{course.code}</p>}
        </div>
        <Badge variant={score === null ? 'default' : score >= 60 ? 'success' : 'warning'}>
          {score === null ? '尚無測驗分數' : `平均 ${score} 分`}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
        <div className="rounded-[var(--radius-control)] bg-[var(--bg)] p-3">
          <span className="text-[var(--muted)]">完成讀書</span>
          <p className="font-semibold text-[var(--text)]">{completed.length} / {sessions.length} 次</p>
        </div>
        <div className="rounded-[var(--radius-control)] bg-[var(--bg)] p-3">
          <span className="text-[var(--muted)]">累計時間</span>
          <p className="font-semibold text-[var(--text)]">{completedMinutes} 分鐘</p>
        </div>
      </div>
    </div>
  )
}

export function ProgressPage() {
  const progressQuery = useProgressData()

  if (progressQuery.isLoading) return <LoadingState message="整理學習進度中…" />
  if (progressQuery.isError || !progressQuery.data) {
    return <ErrorState message="無法載入學習進度" onRetry={() => void progressQuery.refetch()} />
  }

  const { courses, sessions, quizzes, questions, attempts, mistakes } = progressQuery.data
  const activeCourses = courses.filter((course) => !course.archivedAt)
  const quizMap = new Map(quizzes.map((quiz) => [quiz.id, quiz]))
  const questionMap = new Map(questions.map((question) => [question.id, question]))
  const week = getCurrentWeekRange()
  const weekSessions = sessions.filter((session) => {
    const date = toLocalDateISO(session.startsAt)
    return date >= week.start && date <= week.end
  })
  const weekCompleted = weekSessions.filter((session) => session.status === 'completed')
  const completedMinutes = weekCompleted.reduce((sum, session) => sum + session.durationMinutes, 0)
  const scoredAverage = averageScore(attempts)
  const unresolvedMistakes = mistakes.filter((mistake) => !mistake.resolvedAt)

  const unresolvedByCourse = new Map<string, number>()
  for (const mistake of unresolvedMistakes) {
    const question = questionMap.get(mistake.questionId)
    const quiz = question ? quizMap.get(question.quizId) : undefined
    if (quiz) unresolvedByCourse.set(quiz.courseId, (unresolvedByCourse.get(quiz.courseId) ?? 0) + 1)
  }
  const weaknessCourses = activeCourses
    .map((course) => ({ course, count: unresolvedByCourse.get(course.id) ?? 0 }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)

  const hasLearningData = sessions.length > 0 || attempts.length > 0 || mistakes.length > 0
  const mochiMessage = !hasLearningData
    ? '完成讀書計畫或測驗後，我會幫你整理進度。'
    : unresolvedMistakes.length > 0
      ? `你有 ${unresolvedMistakes.length} 題可回顧，慢慢來就好。`
      : '目前沒有未解決錯題，穩定累積最重要！'

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="學習進度"
        description="依本機真實紀錄彙整，不包含 AI 推測"
        actions={
          isSupabaseConfigured && weaknessCourses.length > 0 ? (
            <AIReplanButton
              weaknessCourses={weaknessCourses.map(({ course, count }) => ({
                courseId: course.id,
                topicName: course.title,
                weaknessScore: Math.min(count / 10, 1),
              }))}
              currentSessions={sessions}
            />
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SummaryMetric label="本週讀書" value={`${completedMinutes} 分鐘`} detail={`完成 ${weekCompleted.length} / ${weekSessions.length} 次計畫`} />
        <SummaryMetric label="測驗平均" value={scoredAverage === null ? '尚無分數' : `${scoredAverage} 分`} detail={`${attempts.length} 次作答紀錄`} />
        <SummaryMetric label="待複習錯題" value={`${unresolvedMistakes.length} 題`} detail={`累計記錄 ${mistakes.length} 題`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <CardHeader><CardTitle>各科目進度</CardTitle></CardHeader>
            {activeCourses.length === 0 ? (
              <EmptyState icon="📚" title="尚無進行中的課程" description="先建立課程，再記錄讀書計畫與測驗。" />
            ) : activeCourses.map((course) => {
              const courseQuizIds = new Set(quizzes.filter((quiz) => quiz.courseId === course.id).map((quiz) => quiz.id))
              return (
                <CourseProgress
                  key={course.id}
                  course={course}
                  sessions={sessions.filter((session) => session.courseId === course.id)}
                  attempts={attempts.filter((attempt) => courseQuizIds.has(attempt.quizId))}
                />
              )
            })}
          </Card>

          <Card>
            <CardHeader><CardTitle>弱點訊號</CardTitle></CardHeader>
            {weaknessCourses.length === 0 ? (
              <EmptyState icon="🎯" title="尚無待複習錯題" description="完成可自動評分的測驗後，答錯題目會依課程彙整在這裡。" className="py-6" />
            ) : (
              <div className="space-y-3">
                {weaknessCourses.map(({ course, count }) => (
                  <div key={course.id} className="flex items-center justify-between gap-3 rounded-[var(--radius-control)] bg-[var(--bg)] p-3">
                    <span className="text-sm font-medium text-[var(--text)]">{course.title}</span>
                    <Badge variant="danger">{count} 題待複習</Badge>
                  </div>
                ))}
                <p className="text-xs text-[var(--muted)]">目前依課程彙整；題目尚未設定主題時，不會推測主題弱點。</p>
              </div>
            )}
          </Card>
        </div>
        <div><MochiWidget mood={unresolvedMistakes.length > 0 ? 'thinking' : 'studying'} message={mochiMessage} /></div>
      </div>
    </div>
  )
}

// ─── AI Replan Button + Dialog ────────────────────────────────────────────────

interface ReplanProposal {
  type: string
  courseId: string
  rationale: string
  suggestedDate: string
  durationMinutes: number
  priority: 'low' | 'medium' | 'high'
}

interface ReplanResult {
  proposals: ReplanProposal[]
  summary: string
  warnings: string[]
}

interface AIReplanButtonProps {
  weaknessCourses: { courseId: string; topicName: string; weaknessScore: number }[]
  currentSessions: StudySession[]
}

function AIReplanButton({ weaknessCourses, currentSessions }: AIReplanButtonProps) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
        ✨ AI 建議調整計畫
      </Button>
      <AIReplanDialog
        open={open}
        onClose={() => setOpen(false)}
        weaknessCourses={weaknessCourses}
        currentSessions={currentSessions}
      />
    </>
  )
}

interface AIReplanDialogProps {
  open: boolean
  onClose: () => void
  weaknessCourses: { courseId: string; topicName: string; weaknessScore: number }[]
  currentSessions: StudySession[]
}

function AIReplanDialog({ open, onClose, weaknessCourses, currentSessions }: AIReplanDialogProps) {
  const qc = useQueryClient()
  const [step, setStep] = useState<'idle' | 'loading' | 'review' | 'done'>('idle')
  const [result, setResult] = useState<ReplanResult | null>(null)
  const [aiError, setAiError] = useState('')
  const [approving, setApproving] = useState(false)

  function handleClose() {
    setStep('idle')
    setResult(null)
    setAiError('')
    onClose()
  }

  async function handleGenerate() {
    setAiError('')
    setStep('loading')
    try {
      const today = new Date()
      const semesterEnd = new Date()
      semesterEnd.setDate(semesterEnd.getDate() + 60)
      const remainingDays = Math.round((semesterEnd.getTime() - today.getTime()) / 86400000)

      const raw = await suggestReplan({
        weakTopics: weaknessCourses,
        currentPlan: currentSessions.slice(0, 30).map((s) => ({
          courseId: s.courseId,
          date: toLocalDateISO(s.startsAt),
          title: s.title,
        })),
        remainingDays,
      }) as ReplanResult
      setResult(raw)
      setStep('review')
    } catch (err) {
      setAiError(
        err instanceof AINotConfiguredError
          ? 'AI 功能需要設定 Supabase 和 NVIDIA API。'
          : err instanceof Error ? err.message : 'AI 服務暫時無法使用'
      )
      setStep('idle')
    }
  }

  async function handleApprove() {
    if (!result?.proposals) return
    setApproving(true)
    setAiError('')
    try {
      const now = new Date().toISOString()
      const sessions: StudySession[] = result.proposals
        .filter((p) => p.suggestedDate && p.durationMinutes > 0)
        .map((p) => ({
          id: uuid(),
          courseId: p.courseId,
          title: `[AI 建議] ${p.rationale.slice(0, 40)}`,
          startsAt: `${p.suggestedDate}T09:00:00`,
          durationMinutes: p.durationMinutes,
          status: 'planned',
          priority: p.priority ?? 'medium',
          rationale: p.rationale,
          sourceStatus: 'ai_suggested',
          origin: 'ai',
          createdAt: now,
          updatedAt: now,
        }))
      await Promise.all(sessions.map((s) => studySessionDB.put(s)))
      qc.invalidateQueries({ queryKey: ['sessions'] })
      setStep('done')
    } catch (err) {
      setAiError(err instanceof Error ? err.message : '儲存失敗')
    } finally {
      setApproving(false)
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} title="✨ AI 建議調整計畫">
      {step === 'idle' && (
        <div className="space-y-4">
          <p className="text-sm text-[var(--muted)]">
            根據你的錯題弱點，AI 會建議額外的複習行程。草稿需你確認後才會加入計畫。
          </p>
          <div className="bg-[var(--primary-soft)] rounded-[var(--radius-control)] p-3 text-sm text-[var(--primary)]">
            <p className="font-medium mb-1">偵測到 {weaknessCourses.length} 個科目弱點：</p>
            <ul className="list-disc pl-4 space-y-0.5">
              {weaknessCourses.map((w, i) => <li key={i}>{w.topicName}</li>)}
            </ul>
          </div>
          {aiError && <p role="alert" className="text-sm text-[var(--danger)]">{aiError}</p>}
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose} fullWidth>取消</Button>
            <Button fullWidth onClick={() => void handleGenerate()}>生成建議</Button>
          </div>
        </div>
      )}

      {step === 'loading' && (
        <div className="flex flex-col items-center gap-4 py-8">
          <MochiAvatar mood="thinking" size="md" />
          <p className="text-sm text-[var(--muted)]">AI 正在分析你的學習狀況…</p>
        </div>
      )}

      {step === 'review' && result && (
        <div className="space-y-4">
          <div className="bg-[var(--primary-soft)] rounded-[var(--radius-control)] p-3 text-sm text-[var(--primary)]">
            {result.summary}
          </div>
          {result.warnings.length > 0 && (
            <div className="bg-[var(--yellow)] rounded-[var(--radius-control)] p-3 text-sm text-[#7A6000]">
              <p className="font-medium mb-1">注意：</p>
              <ul className="list-disc pl-4 space-y-0.5">
                {result.warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}
          <div className="max-h-60 overflow-y-auto space-y-2 border border-[var(--border)] rounded-[var(--radius-control)] p-3">
            <p className="text-xs text-[var(--muted)] mb-2">共 {result.proposals.length} 筆建議行程</p>
            {result.proposals.map((p, i) => (
              <div key={i} className="text-sm border-b border-[var(--border)] pb-2 last:border-0 last:pb-0">
                <div className="flex justify-between gap-2">
                  <span className="font-medium text-[var(--text)]">{p.rationale.slice(0, 50)}</span>
                  <span className="text-xs text-[var(--muted)] shrink-0">{p.suggestedDate}</span>
                </div>
                <span className="text-xs text-[var(--muted)]">{p.durationMinutes} 分鐘 · {p.priority === 'high' ? '高優先' : p.priority === 'medium' ? '中優先' : '低優先'}</span>
              </div>
            ))}
          </div>
          {aiError && <p role="alert" className="text-sm text-[var(--danger)]">{aiError}</p>}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep('idle')} fullWidth>重新生成</Button>
            <Button fullWidth loading={approving} onClick={() => void handleApprove()}>
              ✓ 確認加入計畫
            </Button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="text-center space-y-4">
          <MochiAvatar mood="celebrating" size="lg" className="mx-auto" />
          <p className="font-semibold text-[var(--text)]">建議行程已加入計畫！</p>
          <p className="text-sm text-[var(--muted)]">標記為「AI 建議」，可在讀書計畫頁面查看和調整。</p>
          <Button fullWidth onClick={handleClose}>完成</Button>
        </div>
      )}
    </Dialog>
  )
}
