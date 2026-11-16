import { MochiAvatar } from '@/components/mascot/MochiAvatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { ErrorState } from '@/components/ui/ErrorState'
import { LoadingState } from '@/components/ui/LoadingState'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAttemptsByQuiz, useSubmitAttempt } from '@/features/quizzes/hooks/useAttempts'
import { useQuiz, useQuizQuestions } from '@/features/quizzes/hooks/useQuizzes'
import { cn } from '@/lib/cn'
import { ROUTES } from '@/lib/routes'
import type { MochiMood, QuizQuestion } from '@/types'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

// ─── Difficulty label ─────────────────────────────────────────────────────────

const difficultyLabel: Record<string, string> = {
  easy: '簡單',
  medium: '中等',
  hard: '困難',
}

const difficultyVariant: Record<string, 'success' | 'warning' | 'danger'> = {
  easy: 'success',
  medium: 'warning',
  hard: 'danger',
}

// ─── MCQ option renderer ──────────────────────────────────────────────────────

interface MCQInputProps {
  question: QuizQuestion
  selected: string
  onChange: (val: string) => void
  disabled: boolean
}

function MCQInput({ question, selected, onChange, disabled }: MCQInputProps) {
  const labels = ['A', 'B', 'C', 'D'] as const
  const options = question.options ?? []

  return (
    <div className="flex flex-col gap-2" role="radiogroup" aria-label="選項">
      {labels.map((label, i) => {
        const opt = options[i] ?? ''
        const isSelected = selected === label
        return (
          <label
            key={label}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-[var(--radius-control)] border cursor-pointer transition-colors',
              isSelected
                ? 'border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]'
                : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:border-[var(--primary)]',
              disabled && 'cursor-not-allowed opacity-70',
            )}
          >
            <input
              type="radio"
              name={`q-${question.id}`}
              value={label}
              checked={isSelected}
              onChange={() => onChange(label)}
              disabled={disabled}
              className="sr-only"
            />
            <span
              className={cn(
                'w-7 h-7 rounded-full border flex items-center justify-center text-xs font-bold shrink-0',
                isSelected
                  ? 'bg-[var(--primary)] border-[var(--primary)] text-white'
                  : 'border-[var(--border)] text-[var(--muted)]',
              )}
              aria-hidden="true"
            >
              {label}
            </span>
            <span className="text-sm">{opt}</span>
          </label>
        )
      })}
    </div>
  )
}

// ─── True/False input ─────────────────────────────────────────────────────────

interface TrueFalseInputProps {
  selected: string
  onChange: (val: string) => void
  disabled: boolean
}

function TrueFalseInput({ selected, onChange, disabled }: TrueFalseInputProps) {
  return (
    <div className="flex gap-3" role="radiogroup" aria-label="是非">
      {(['是', '否'] as const).map((opt) => (
        <button
          key={opt}
          type="button"
          role="radio"
          aria-checked={selected === opt}
          disabled={disabled}
          onClick={() => onChange(opt)}
          className={cn(
            'flex-1 py-4 text-lg font-semibold rounded-[var(--radius-card)] border transition-colors',
            selected === opt
              ? 'border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]'
              : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:border-[var(--primary)]',
            disabled && 'cursor-not-allowed opacity-70',
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

// ─── Question review (submitted state) ───────────────────────────────────────

interface QuestionReviewProps {
  question: QuizQuestion
  userAnswer: string
  isWrong: boolean
}

function QuestionReview({ question, userAnswer, isWrong }: QuestionReviewProps) {
  const isShortAnswer = question.type === 'short_answer'
  const correctAnswer = Array.isArray(question.answer) ? question.answer[0] : question.answer

  // For MCQ, map option letter back to full text
  function resolveOptionText(letter: string): string {
    if (question.type !== 'mcq' || !question.options) return letter
    const idx = ['A', 'B', 'C', 'D'].indexOf(letter)
    return idx >= 0 ? `${letter}. ${question.options[idx]}` : letter
  }

  return (
    <div
      className={cn(
        'rounded-[var(--radius-card)] border p-4 flex flex-col gap-2',
        isShortAnswer
          ? 'border-[var(--yellow)] bg-[#FFFDE8]'
          : isWrong
            ? 'border-[var(--danger)] bg-[var(--danger-soft,#FFF0F3)]'
            : 'border-[var(--border)] bg-[var(--surface)]',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-[var(--text)]">{question.prompt}</p>
        {isShortAnswer ? (
          <Badge variant="warning">待批改</Badge>
        ) : isWrong ? (
          <Badge variant="danger">答錯</Badge>
        ) : (
          <Badge variant="success">答對</Badge>
        )}
      </div>

      <div className="flex flex-col gap-1 text-xs text-[var(--muted)]">
        <span>
          <span className="font-medium">你的答案：</span>
          {isShortAnswer ? (
            <span className="italic">{userAnswer || '（未作答）'}</span>
          ) : (
            <span className={isWrong ? 'text-[var(--danger)] font-medium' : ''}>
              {resolveOptionText(userAnswer) || '（未作答）'}
            </span>
          )}
        </span>
        {!isShortAnswer && (
          <span>
            <span className="font-medium">正確答案：</span>
            <span className="text-[var(--success,#3DB57A)] font-medium">
              {resolveOptionText(correctAnswer)}
            </span>
          </span>
        )}
        {question.explanation && (
          <p className="mt-1 pt-1 border-t border-[var(--border)] text-[var(--muted)]">
            <span className="font-medium">解析：</span>
            {question.explanation}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Mochi mood based on score ────────────────────────────────────────────────

function moodFromScore(score: number): MochiMood {
  if (score >= 80) return 'celebrating'
  if (score >= 60) return 'happy'
  return 'thinking'
}

function scoreMessage(score: number): string {
  if (score >= 80) return '太棒了！繼續保持！'
  if (score >= 60) return '不錯喔！還有進步空間！'
  return '沒關係，多複習幾次就會進步的！'
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type PageState = 'idle' | 'in_progress' | 'submitted'

export function QuizAttemptPage() {
  const { quizId = '' } = useParams()
  const navigate = useNavigate()

  const { data: quiz, isLoading: quizLoading, isError: quizError } = useQuiz(quizId)
  const { data: questions, isLoading: qLoading, isError: qError } = useQuizQuestions(quizId)
  const { data: attempts } = useAttemptsByQuiz(quizId)
  const submitAttempt = useSubmitAttempt()

  const [pageState, setPageState] = useState<PageState>('idle')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [startedAt, setStartedAt] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [result, setResult] = useState<{ score: number | null; wrongIds: string[] } | null>(null)

  const isLoading = quizLoading || qLoading
  const isError = quizError || qError

  // ── Loading / error ─────────────────────────────────────────────────────────

  if (isLoading) return <LoadingState message="載入測驗中…" />
  if (isError || !quiz) {
    return (
      <ErrorState
        title="測驗不存在"
        description="找不到此測驗，請返回測驗庫。"
      />
    )
  }

  const questionList = questions ?? []

  // Check if all required questions (mcq/true_false) are answered
  const requiredQs = questionList.filter((q) => q.type !== 'short_answer')
  const allAnswered = requiredQs.every((q) => !!answers[q.id])

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleStart() {
    setAnswers({})
    setResult(null)
    setStartedAt(new Date().toISOString())
    setPageState('in_progress')
  }

  function handleAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  async function handleSubmit() {
    setConfirmOpen(false)
    try {
      const res = await submitAttempt.mutateAsync({
        quizId,
        startedAt: startedAt ?? new Date().toISOString(),
        answersJson: answers,
        questions: questionList,
      })
      setResult({ score: res.score, wrongIds: res.wrongIds })
      setPageState('submitted')
    } catch {
      // Error shown via submitAttempt.isError
    }
  }

  // ── Idle state ───────────────────────────────────────────────────────────────

  if (pageState === 'idle') {
    return (
      <div className="max-w-3xl mx-auto">
        <PageHeader
          title={quiz.title}
          actions={
            <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
              返回測驗庫
            </Button>
          }
        />

        <Card padding="lg" className="flex flex-col gap-4 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant={difficultyVariant[quiz.difficulty] ?? 'default'}>
              {difficultyLabel[quiz.difficulty] ?? quiz.difficulty}
            </Badge>
            <span className="text-sm text-[var(--muted)]">{questionList.length} 題</span>
          </div>

          <div className="flex justify-center py-4">
            <MochiAvatar mood="studying" size="lg" />
          </div>

          <Button variant="primary" size="lg" fullWidth onClick={handleStart} disabled={questionList.length === 0}>
            開始作答
          </Button>

          {questionList.length === 0 && (
            <p className="text-xs text-center text-[var(--muted)]">此測驗尚未包含題目</p>
          )}
        </Card>

        {attempts && attempts.length > 0 && (
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-[var(--muted)]">作答紀錄</h2>
            {attempts.map((attempt) => (
              <Card key={attempt.id} padding="sm" className="flex items-center justify-between">
                <span className="text-sm text-[var(--text)]">
                  {attempt.submittedAt
                    ? new Date(attempt.submittedAt).toLocaleString('zh-TW')
                    : '未完成'}
                </span>
                {attempt.score !== undefined ? (
                  <Badge variant="primary">{attempt.score} 分</Badge>
                ) : (
                  <Badge variant="warning">待人工批改</Badge>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── In progress ───────────────────────────────────────────────────────────────

  if (pageState === 'in_progress') {
    return (
      <div className="max-w-3xl mx-auto">
        <PageHeader
          title={quiz.title}
          description={`作答中 — ${questionList.length} 題`}
        />

        <div className="flex flex-col gap-4 mb-6">
          {questionList.map((q, idx) => (
            <Card key={q.id} padding="md" className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-[var(--text)]">
                  <span className="text-[var(--muted)] mr-2">第 {idx + 1} / {questionList.length} 題</span>
                  {q.prompt}
                </p>
                {q.type === 'short_answer' && (
                  <Badge variant="default">簡答</Badge>
                )}
              </div>

              {q.type === 'mcq' && (
                <MCQInput
                  question={q}
                  selected={answers[q.id] ?? ''}
                  onChange={(val) => handleAnswer(q.id, val)}
                  disabled={false}
                />
              )}

              {q.type === 'true_false' && (
                <TrueFalseInput
                  selected={answers[q.id] ?? ''}
                  onChange={(val) => handleAnswer(q.id, val)}
                  disabled={false}
                />
              )}

              {q.type === 'short_answer' && (
                <textarea
                  value={answers[q.id] ?? ''}
                  onChange={(e) => handleAnswer(q.id, e.target.value)}
                  placeholder="請輸入你的答案…"
                  aria-label={`第 ${idx + 1} 題的答案`}
                  rows={3}
                  className="w-full px-3 py-2 text-sm rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] placeholder:text-[var(--muted)] resize-y focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                />
              )}
            </Card>
          ))}
        </div>

        {submitAttempt.isError && (
          <p role="alert" className="text-sm text-[var(--danger)] mb-3">
            提交失敗，請再試一次。
          </p>
        )}

        <div className="flex justify-end">
          <Button
            variant="primary"
            size="lg"
            onClick={() => setConfirmOpen(true)}
            disabled={!allAnswered}
            aria-disabled={!allAnswered}
          >
            提交答案
          </Button>
        </div>

        {!allAnswered && (
          <p className="text-xs text-[var(--muted)] text-right mt-1">
            請完成所有選擇題與是非題再提交
          </p>
        )}

        <Dialog
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          title="確認提交"
          description="提交後無法修改答案，確定要提交嗎？"
        >
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmOpen(false)}>
              繼續作答
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={submitAttempt.isPending}
              onClick={handleSubmit}
            >
              確認提交
            </Button>
          </div>
        </Dialog>
      </div>
    )
  }

  // ── Submitted ─────────────────────────────────────────────────────────────────

  if (pageState === 'submitted' && result) {
    const mood = result.score === null ? 'thinking' : moodFromScore(result.score)
    const wrongSet = new Set(result.wrongIds)

    return (
      <div className="max-w-3xl mx-auto">
        <PageHeader
          title="測驗結果"
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigate(ROUTES.courseQuizzes(quiz.courseId))
              }}
            >
              返回測驗庫
            </Button>
          }
        />

        {/* Score card */}
        <Card padding="lg" className="flex flex-col items-center gap-4 mb-6 text-center">
          <MochiAvatar mood={mood} size="xl" />
          <div>
            {result.score === null ? (
              <p className="text-2xl font-bold text-[var(--primary)]">待人工批改</p>
            ) : (
              <p
                className="text-5xl font-bold"
                style={{ color: result.score >= 60 ? 'var(--success, #3DB57A)' : 'var(--danger)' }}
              >
                {result.score} 分
              </p>
            )}
            <p className="text-sm text-[var(--muted)] mt-1">
              {result.score === null ? '此測驗沒有可自動評分的題目。' : scoreMessage(result.score)}
            </p>
          </div>
          <div className="flex gap-3 text-sm text-[var(--muted)]">
            <span>答對 {questionList.filter((q) => q.type !== 'short_answer' && !wrongSet.has(q.id)).length} 題</span>
            <span>答錯 {result.wrongIds.length} 題</span>
            {questionList.filter((q) => q.type === 'short_answer').length > 0 && (
              <span>
                待批改 {questionList.filter((q) => q.type === 'short_answer').length} 題
              </span>
            )}
          </div>
        </Card>

        {/* Per-question review */}
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-[var(--muted)]">逐題檢討</h2>
          {questionList.map((q) => (
            <QuestionReview
              key={q.id}
              question={q}
              userAnswer={answers[q.id] ?? ''}
              isWrong={wrongSet.has(q.id)}
            />
          ))}
        </div>
      </div>
    )
  }

  return null
}
