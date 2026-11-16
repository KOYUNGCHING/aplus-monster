import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { LoadingState } from '@/components/ui/LoadingState'
import { PageHeader } from '@/components/ui/PageHeader'
import { useCourse } from '@/features/courses/hooks/useCourses'
import { useAttemptsByQuiz } from '@/features/quizzes/hooks/useAttempts'
import {
  useCreateQuiz,
  useDeleteQuiz,
  useQuizQuestions,
  useQuizzesByCourse,
} from '@/features/quizzes/hooks/useQuizzes'
import { cn } from '@/lib/cn'
import { ROUTES } from '@/lib/routes'
import type { Quiz, QuizQuestion, QuestionType } from '@/types'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

// ─── Difficulty helpers ───────────────────────────────────────────────────────

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

// ─── Question draft type ──────────────────────────────────────────────────────

interface QuestionDraft {
  _key: string
  type: QuestionType
  prompt: string
  options: [string, string, string, string]
  answer: string
  explanation: string
}

function emptyQuestion(): QuestionDraft {
  return {
    _key: crypto.randomUUID(),
    type: 'mcq',
    prompt: '',
    options: ['', '', '', ''],
    answer: '',
    explanation: '',
  }
}

// ─── Validation ───────────────────────────────────────────────────────────────

interface FormErrors {
  title?: string
  questions: Record<number, { prompt?: string; options?: string; answer?: string }>
}

function validate(title: string, questions: QuestionDraft[]): FormErrors {
  const errors: FormErrors = { questions: {} }
  if (!title.trim()) errors.title = '請填寫測驗名稱'
  if (title.trim().length > 100) errors.title = '測驗名稱最多 100 字'
  questions.forEach((q, i) => {
    const qErr: FormErrors['questions'][number] = {}
    if (!q.prompt.trim()) qErr.prompt = '請填寫題目內容'
    if (q.type === 'mcq') {
      if (q.options.some((o) => !o.trim())) qErr.options = '請填寫所有選項 (A/B/C/D)'
      const normalizedOptions = q.options.map((option) => option.trim().toLocaleLowerCase())
      if (!q.options.some((option) => !option.trim()) && new Set(normalizedOptions).size !== normalizedOptions.length) {
        qErr.options = '選項內容不得重複'
      }
      if (!q.answer) qErr.answer = '請選擇正確答案'
    }
    if (q.type === 'true_false' && !q.answer) {
      qErr.answer = '請選擇正確答案'
    }
    if (Object.keys(qErr).length > 0) errors.questions[i] = qErr
  })
  return errors
}

function hasErrors(errors: FormErrors): boolean {
  return !!errors.title || Object.keys(errors.questions).length > 0
}

// ─── Single question builder ──────────────────────────────────────────────────

interface QuestionBuilderProps {
  index: number
  draft: QuestionDraft
  onChange: (index: number, next: QuestionDraft) => void
  onRemove: (index: number) => void
  canRemove: boolean
  errors?: FormErrors['questions'][number]
}

function QuestionBuilder({ index, draft, onChange, onRemove, canRemove, errors }: QuestionBuilderProps) {
  const optionLabels = ['A', 'B', 'C', 'D'] as const

  function update(patch: Partial<QuestionDraft>) {
    onChange(index, { ...draft, ...patch })
  }

  function updateOption(i: number, value: string) {
    const next = [...draft.options] as [string, string, string, string]
    next[i] = value
    onChange(index, { ...draft, options: next })
  }

  return (
    <div className="border border-[var(--border)] rounded-[var(--radius-card)] p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[var(--muted)]">第 {index + 1} 題</span>
        {canRemove && (
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => onRemove(index)}
            aria-label={`刪除第 ${index + 1} 題`}
            className="text-[var(--danger)] hover:text-[var(--danger)] hover:bg-[var(--danger-soft)]"
          >
            刪除
          </Button>
        )}
      </div>

      <Select
        label="題型"
        value={draft.type}
        onChange={(e) => update({ type: e.target.value as QuestionType, answer: '' })}
      >
        <option value="mcq">選擇題</option>
        <option value="true_false">是非題</option>
        <option value="short_answer">簡答題</option>
      </Select>

      <Textarea
        label="題目內容"
        required
        value={draft.prompt}
        onChange={(e) => update({ prompt: e.target.value })}
        placeholder="請輸入題目…"
        error={errors?.prompt}
      />

      {draft.type === 'mcq' && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-[var(--text)]">
            選項{' '}
            <span className="text-[var(--danger)]" aria-hidden="true">
              *
            </span>
          </span>
          {optionLabels.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <input
                type="radio"
                name={`answer-${draft._key}`}
                id={`opt-${draft._key}-${label}`}
                value={label}
                checked={draft.answer === label}
                onChange={() => update({ answer: label })}
                className="accent-[var(--primary)] w-4 h-4 shrink-0"
                aria-label={`選項 ${label} 為正確答案`}
              />
              <label
                htmlFor={`opt-${draft._key}-${label}`}
                className="text-sm font-medium text-[var(--muted)] w-5 shrink-0"
              >
                {label}
              </label>
              <input
                type="text"
                value={draft.options[i]}
                onChange={(e) => updateOption(i, e.target.value)}
                placeholder={`選項 ${label}`}
                aria-label={`選項 ${label} 內容`}
                className={cn(
                  'flex-1 px-3 py-1.5 text-sm rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] placeholder:text-[var(--muted)]',
                  'focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent',
                )}
              />
            </div>
          ))}
          {errors?.options && (
            <p role="alert" className="text-xs text-[var(--danger)]">
              {errors.options}
            </p>
          )}
          {errors?.answer && (
            <p role="alert" className="text-xs text-[var(--danger)]">
              {errors.answer}
            </p>
          )}
        </div>
      )}

      {draft.type === 'true_false' && (
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-[var(--text)]">
            正確答案{' '}
            <span className="text-[var(--danger)]" aria-hidden="true">
              *
            </span>
          </span>
          <div className="flex gap-4">
            {(['是', '否'] as const).map((opt) => (
              <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name={`tf-${draft._key}`}
                  value={opt}
                  checked={draft.answer === opt}
                  onChange={() => update({ answer: opt })}
                  className="accent-[var(--primary)] w-4 h-4"
                />
                {opt}
              </label>
            ))}
          </div>
          {errors?.answer && (
            <p role="alert" className="text-xs text-[var(--danger)]">
              {errors.answer}
            </p>
          )}
        </div>
      )}

      {draft.type === 'short_answer' && (
        <Input
          label="參考答案"
          value={draft.answer}
          onChange={(e) => update({ answer: e.target.value })}
          placeholder="輸入參考答案（可留空）"
          hint="簡答題為人工批改，不計入自動評分"
        />
      )}

      <Input
        label="解析（選填）"
        value={draft.explanation}
        onChange={(e) => update({ explanation: e.target.value })}
        placeholder="解析此題…"
      />
    </div>
  )
}

// ─── Quiz card ────────────────────────────────────────────────────────────────

interface QuizCardProps {
  quiz: Quiz
  onDelete: (quizId: string) => Promise<void>
  deleting: boolean
}

function QuizCard({ quiz, onDelete, deleting }: QuizCardProps) {
  const navigate = useNavigate()
  const { data: attempts } = useAttemptsByQuiz(quiz.id)
  const { data: questions } = useQuizQuestions(quiz.id)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const scoredAttempts = attempts
    ?.map((attempt) => attempt.score)
    .filter((score): score is number => score !== undefined)
    ?? []
  const highestScore = scoredAttempts.length > 0 ? Math.max(...scoredAttempts) : undefined
  const hasAttempts = (attempts?.length ?? 0) > 0
  const questionCount = questions?.length ?? 0
  const [deleteError, setDeleteError] = useState('')

  async function handleConfirmDelete() {
    setDeleteError('')
    try {
      await onDelete(quiz.id)
      setConfirmDelete(false)
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : '刪除失敗，請再試一次。')
    }
  }

  return (
    <>
      <Card padding="md" className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1 min-w-0">
            <h3 className="text-base font-semibold text-[var(--text)] truncate">{quiz.title}</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={difficultyVariant[quiz.difficulty] ?? 'default'}>
                {difficultyLabel[quiz.difficulty] ?? quiz.difficulty}
              </Badge>
              <span className="text-xs text-[var(--muted)]">{questionCount} 題</span>
              {highestScore !== undefined && (
                <Badge variant="primary">最高分 {highestScore} 分</Badge>
              )}
              {hasAttempts && <Badge variant="verified">保留作答歷史</Badge>}
            </div>
          </div>
          <span className="text-xs text-[var(--muted)] shrink-0">
            {new Date(quiz.createdAt).toLocaleDateString('zh-TW')}
          </span>
        </div>

        <div className="flex gap-2 justify-end">
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => setConfirmDelete(true)}
            disabled={hasAttempts}
            title={hasAttempts ? '已有作答紀錄，無法刪除' : undefined}
            className="text-[var(--danger)] hover:text-[var(--danger)] hover:bg-[var(--danger-soft)]"
            aria-label={`刪除測驗 ${quiz.title}`}
          >
            刪除
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="button"
            onClick={() => navigate(ROUTES.quiz(quiz.id))}
            aria-label={`開始作答 ${quiz.title}`}
          >
            開始作答
          </Button>
        </div>
      </Card>

      <Dialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="刪除測驗"
        description={`確定要刪除「${quiz.title}」嗎？此操作無法復原。`}
      >
        {deleteError && (
          <p role="alert" className="mb-3 text-sm text-[var(--danger)]">{deleteError}</p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)}>
            取消
          </Button>
          <Button variant="danger" size="sm" loading={deleting} onClick={handleConfirmDelete}>
            確認刪除
          </Button>
        </div>
      </Dialog>
    </>
  )
}

// ─── Create quiz dialog ───────────────────────────────────────────────────────

const MAX_QUESTIONS = 20

interface CreateQuizDialogProps {
  courseId: string
  open: boolean
  onClose: () => void
}

function CreateQuizDialog({ courseId, open, onClose }: CreateQuizDialogProps) {
  const [title, setTitle] = useState('')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [questions, setQuestions] = useState<QuestionDraft[]>([
    emptyQuestion(),
    emptyQuestion(),
    emptyQuestion(),
  ])
  const [errors, setErrors] = useState<FormErrors>({ questions: {} })
  const [submitted, setSubmitted] = useState(false)

  const createQuiz = useCreateQuiz()

  function handleQuestionChange(index: number, next: QuestionDraft) {
    setQuestions((prev) => prev.map((q, i) => (i === index ? next : q)))
  }

  function handleRemove(index: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== index))
  }

  function handleAddQuestion() {
    if (questions.length >= MAX_QUESTIONS) return
    setQuestions((prev) => [...prev, emptyQuestion()])
  }

  function handleClose() {
    setTitle('')
    setDifficulty('medium')
    setQuestions([emptyQuestion(), emptyQuestion(), emptyQuestion()])
    setErrors({ questions: {} })
    setSubmitted(false)
    onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate(title, questions)
    setErrors(errs)
    setSubmitted(true)
    if (hasErrors(errs)) return

    const questionsPayload: Omit<QuizQuestion, 'id' | 'quizId' | 'createdAt'>[] = questions.map(
      (q) => ({
        type: q.type,
        prompt: q.prompt.trim(),
        options: q.type === 'mcq' ? q.options.map((option) => option.trim()) : undefined,
        answer: q.answer.trim(),
        explanation: q.explanation.trim(),
        difficulty,
        topicIds: [],
        sourceStatus: 'user_provided' as const,
      }),
    )

    try {
      await createQuiz.mutateAsync({ courseId, title: title.trim(), difficulty, questions: questionsPayload })
      handleClose()
    } catch {
      // Error shown via createQuiz.isError
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} title="新增測驗" className="max-w-2xl w-full">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-1">
        <Input
          label="測驗名稱"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例如：期中考複習"
          maxLength={100}
          error={submitted ? errors.title : undefined}
        />

        <Select
          label="難度"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
        >
          <option value="easy">簡單</option>
          <option value="medium">中等</option>
          <option value="hard">困難</option>
        </Select>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[var(--text)]">
              題目 ({questions.length}/{MAX_QUESTIONS})
            </span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAddQuestion}
              disabled={questions.length >= MAX_QUESTIONS}
            >
              ＋ 新增題目
            </Button>
          </div>

          {questions.map((q, i) => (
            <QuestionBuilder
              key={q._key}
              index={i}
              draft={q}
              onChange={handleQuestionChange}
              onRemove={handleRemove}
              canRemove={questions.length > 1}
              errors={submitted ? errors.questions[i] : undefined}
            />
          ))}
        </div>

        {createQuiz.isError && (
          <p role="alert" className="text-sm text-[var(--danger)]">
            儲存失敗，請再試一次。
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
          <Button type="button" variant="outline" size="sm" onClick={handleClose}>
            取消
          </Button>
          <Button type="submit" variant="primary" size="sm" loading={createQuiz.isPending}>
            儲存測驗
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function CourseQuizzesPage() {
  const { courseId = '' } = useParams()
  const [createOpen, setCreateOpen] = useState(false)

  const courseQuery = useCourse(courseId)
  const course = courseQuery.data
  const { data: quizzes, isLoading, isError } = useQuizzesByCourse(courseId)
  const deleteQuiz = useDeleteQuiz()

  async function handleDelete(quizId: string) {
    await deleteQuiz.mutateAsync({ quizId, courseId })
  }

  if (courseQuery.isLoading) return <LoadingState message="載入課程中…" />
  if (courseQuery.isError || !course) {
    return <ErrorState title="找不到課程" message="無法建立或讀取此課程的測驗。" />
  }

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="測驗庫"
        description={course ? `${course.title} 的測驗` : undefined}
        actions={
          <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
            ＋ 新增測驗
          </Button>
        }
      />

      {isLoading && <LoadingState message="載入測驗中…" />}

      {isError && (
        <ErrorState
          title="載入失敗"
          message="無法載入測驗列表，請重新整理後再試。"
        />
      )}

      {!isLoading && !isError && quizzes?.length === 0 && (
        <EmptyState
          icon="🧪"
          title="尚無測驗"
          description="點擊「＋ 新增測驗」建立第一個測驗吧！"
          action={{ label: '＋ 新增測驗', onClick: () => setCreateOpen(true) }}
        />
      )}

      {!isLoading && !isError && quizzes && quizzes.length > 0 && (
        <div className="flex flex-col gap-3">
          {quizzes.map((quiz) => (
            <QuizCard
              key={quiz.id}
              quiz={quiz}
              onDelete={handleDelete}
              deleting={deleteQuiz.isPending && deleteQuiz.variables?.quizId === quiz.id}
            />
          ))}
        </div>
      )}

      <CreateQuizDialog
        courseId={courseId}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </div>
  )
}
