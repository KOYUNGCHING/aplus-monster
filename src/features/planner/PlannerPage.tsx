import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Input, Select } from '@/components/ui/Input'
import { LoadingState } from '@/components/ui/LoadingState'
import { PageHeader } from '@/components/ui/PageHeader'
import { MochiAvatar } from '@/components/mascot/MochiAvatar'
import { useAllCourses } from '@/features/courses/hooks/useCourses'
import { useAllDeadlines } from '@/features/courses/hooks/useDeadlines'
import { useSemesters } from '@/features/semesters/hooks/useSemesters'
import { todayISO, toLocalDateISO } from '@/lib/date'
import { ROUTES } from '@/lib/routes'
import { isSupabaseConfigured } from '@/lib/supabase'
import type { CourseColor, StudyPlanDraft, StudySession } from '@/types'
import {
  useCreateSession,
  useDeleteSession,
  useUpdateSessionStatus,
  useWeekSessions,
  type CreateSessionInput,
} from './hooks/useStudySessions'
import { useGeneratePlan, useApprovePlan, AINotConfiguredError } from './hooks/useGeneratePlan'

// ─── Date helpers ─────────────────────────────────────────────────────────────

/** Returns the Monday of the week containing dateStr (YYYY-MM-DD local). */
function getMondayOf(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay() // 0=Sun, 1=Mon, …
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return toDateString(d)
}

/** Returns array of 7 YYYY-MM-DD strings starting from mondayStr. */
function getWeekDays(mondayStr: string): string[] {
  const days: string[] = []
  const d = new Date(mondayStr + 'T00:00:00')
  for (let i = 0; i < 7; i++) {
    days.push(toDateString(d))
    d.setDate(d.getDate() + 1)
  }
  return days
}

function toDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const WEEKDAY_ZH = ['週一', '週二', '週三', '週四', '週五', '週六', '週日']

/** Returns { weekday: '週一', date: '1/15' } */
function formatDayHeader(dateStr: string): { weekday: string; date: string } {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay()
  const idx = day === 0 ? 6 : day - 1
  const month = d.getMonth() + 1
  const date = d.getDate()
  return { weekday: WEEKDAY_ZH[idx], date: `${month}/${date}` }
}

// ─── Course color palette ─────────────────────────────────────────────────────

const COLOR_DOT: Record<CourseColor, string> = {
  lavender: '#8B7BE8',
  mint: '#5AC8A0',
  peach: '#FF9A7A',
  yellow: '#E6C233',
  sky: '#5AB4E8',
  rose: '#E8607B',
}

// ─── Mochi toast ──────────────────────────────────────────────────────────────

function MochiToast({ visible }: { visible: boolean }) {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
      style={{
        transition: 'opacity 0.4s ease, transform 0.4s ease',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
      }}
    >
      <div className="flex items-center gap-3 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-card)] shadow-lg px-4 py-3">
        <MochiAvatar mood="celebrating" size="sm" animate={visible} />
        <p className="text-sm font-medium text-[var(--text)]">太棒了！繼續加油！🎉</p>
      </div>
    </div>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: StudySession['status'] }) {
  if (status === 'completed') {
    return <Badge variant="success">✓ 完成</Badge>
  }
  if (status === 'skipped') {
    return (
      <Badge variant="default" className="line-through">
        略過
      </Badge>
    )
  }
  return <Badge variant="default">計畫中</Badge>
}

// ─── Priority label ───────────────────────────────────────────────────────────

function priorityLabel(p: StudySession['priority']): string {
  return p === 'high' ? '高' : p === 'medium' ? '中' : '低'
}

// ─── Session card ─────────────────────────────────────────────────────────────

interface SessionCardProps {
  session: StudySession
  courseColor: CourseColor | undefined
  onClick: () => void
}

function SessionCard({ session, courseColor, onClick }: SessionCardProps) {
  const dot = courseColor ? COLOR_DOT[courseColor] : '#8B7BE8'
  const title =
    session.title.length > 20 ? session.title.slice(0, 20) + '…' : session.title
  const isSkipped = session.status === 'skipped'

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-control)] p-2 hover:border-[var(--primary)] hover:shadow-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
      style={{ opacity: isSkipped ? 0.6 : 1 }}
      aria-label={`${session.title}，${session.durationMinutes} 分鐘`}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: dot }}
          aria-hidden="true"
        />
        <span
          className={`text-xs font-medium text-[var(--text)] truncate leading-tight ${isSkipped ? 'line-through' : ''}`}
        >
          {title}
        </span>
      </div>
      <div className="flex items-center justify-between gap-1">
        <span className="text-xs text-[var(--muted)]">{session.durationMinutes} 分鐘</span>
        <StatusBadge status={session.status} />
      </div>
    </button>
  )
}

// ─── Session detail dialog ────────────────────────────────────────────────────

interface SessionDetailDialogProps {
  session: StudySession | null
  open: boolean
  onClose: () => void
  courseTitle: string | undefined
  onComplete: () => void
  onSkip: () => void
  onDelete: () => void
  isUpdating: boolean
  isDeleting: boolean
}

function SessionDetailDialog({
  session,
  open,
  onClose,
  courseTitle,
  onComplete,
  onSkip,
  onDelete,
  isUpdating,
  isDeleting,
}: SessionDetailDialogProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    setConfirmDelete(false)
  }, [session?.id, open])

  if (!session) return null

  const startTime = new Date(session.startsAt).toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
  })
  const startDate = new Date(session.startsAt).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <Dialog open={open} onClose={onClose} title="讀書行程詳情">
      <div className="space-y-4">
        <div>
          <p className="text-lg font-semibold text-[var(--text)]">{session.title}</p>
          {courseTitle && (
            <p className="text-sm text-[var(--muted)] mt-0.5">{courseTitle}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-[var(--bg)] rounded-[var(--radius-control)] p-3">
            <p className="text-xs text-[var(--muted)] mb-1">日期時間</p>
            <p className="font-medium text-[var(--text)]">
              {startDate} {startTime}
            </p>
          </div>
          <div className="bg-[var(--bg)] rounded-[var(--radius-control)] p-3">
            <p className="text-xs text-[var(--muted)] mb-1">時長</p>
            <p className="font-medium text-[var(--text)]">
              {session.durationMinutes} 分鐘
            </p>
          </div>
          <div className="bg-[var(--bg)] rounded-[var(--radius-control)] p-3">
            <p className="text-xs text-[var(--muted)] mb-1">優先度</p>
            <p className="font-medium text-[var(--text)]">
              {priorityLabel(session.priority)}
            </p>
          </div>
          <div className="bg-[var(--bg)] rounded-[var(--radius-control)] p-3">
            <p className="text-xs text-[var(--muted)] mb-1">狀態</p>
            <div>
              <StatusBadge status={session.status} />
            </div>
          </div>
        </div>

        {session.rationale && (
          <div className="bg-[var(--bg)] rounded-[var(--radius-control)] p-3">
            <p className="text-xs text-[var(--muted)] mb-1">備注</p>
            <p className="text-sm text-[var(--text)]">{session.rationale}</p>
          </div>
        )}

        <div className="flex flex-col gap-2 pt-2">
          {session.status !== 'completed' && (
            <Button
              variant="primary"
              fullWidth
              onClick={onComplete}
              loading={isUpdating}
              disabled={isUpdating || isDeleting}
            >
              ✓ 標記完成
            </Button>
          )}
          {session.status !== 'skipped' && (
            <Button
              variant="secondary"
              fullWidth
              onClick={onSkip}
              loading={isUpdating}
              disabled={isUpdating || isDeleting}
            >
              略過此行程
            </Button>
          )}
          {confirmDelete ? (
            <div className="rounded-[var(--radius-control)] bg-[var(--danger-soft)] p-3">
              <p className="mb-3 text-sm text-[var(--danger)]">
                刪除後無法復原，確定要刪除此行程嗎？
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => setConfirmDelete(false)}
                  disabled={isDeleting}
                >
                  取消
                </Button>
                <Button
                  variant="danger"
                  fullWidth
                  onClick={onDelete}
                  loading={isDeleting}
                  disabled={isUpdating || isDeleting}
                >
                  確認刪除
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="danger"
              fullWidth
              onClick={() => setConfirmDelete(true)}
              disabled={isUpdating || isDeleting}
            >
              刪除行程
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  )
}

// ─── Create session dialog ────────────────────────────────────────────────────

interface CreateFormState {
  courseId: string
  title: string
  date: string
  time: string
  durationMinutes: number
  priority: 'low' | 'medium' | 'high'
}

interface CreateSessionDialogProps {
  open: boolean
  defaultDate: string
  onClose: () => void
  courses: Array<{ id: string; title: string; color: CourseColor }>
  onSubmit: (input: CreateSessionInput) => void
  isLoading: boolean
  errorMessage?: string
}

const DURATION_OPTIONS = [
  { value: 25, label: '25 分鐘（番茄鐘）' },
  { value: 30, label: '30 分鐘' },
  { value: 45, label: '45 分鐘' },
  { value: 60, label: '60 分鐘' },
  { value: 90, label: '90 分鐘' },
  { value: 120, label: '120 分鐘' },
]

function CreateSessionDialog({
  open,
  defaultDate,
  onClose,
  courses,
  onSubmit,
  isLoading,
  errorMessage,
}: CreateSessionDialogProps) {
  const [form, setForm] = useState<CreateFormState>({
    courseId: courses[0]?.id ?? '',
    title: '',
    date: defaultDate,
    time: '09:00',
    durationMinutes: 60,
    priority: 'medium',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof CreateFormState, string>>>({})

  // Sync default date and first course when dialog re-opens
  useEffect(() => {
    if (open) {
      setForm({
        date: defaultDate,
        courseId: courses[0]?.id ?? '',
        title: '',
        time: '09:00',
        durationMinutes: 60,
        priority: 'medium',
      })
      setErrors({})
    }
  }, [open, defaultDate, courses])

  function validate(): boolean {
    const e: typeof errors = {}
    if (!form.courseId) e.courseId = '請選擇課程'
    if (!form.title.trim()) e.title = '請輸入標題'
    if (form.title.length > 60) e.title = '標題最多 60 字'
    if (!form.date) e.date = '請選擇日期'
    if (!form.time) e.time = '請選擇時間'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    const startsAt = new Date(`${form.date}T${form.time}:00`).toISOString()
    onSubmit({
      courseId: form.courseId,
      title: form.title.trim(),
      startsAt,
      durationMinutes: form.durationMinutes,
      priority: form.priority,
    })
  }

  return (
    <Dialog open={open} onClose={onClose} title="新增讀書行程">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Course */}
        <Select
          label="課程"
          required
          value={form.courseId}
          onChange={(e) => setForm((p) => ({ ...p, courseId: e.target.value }))}
          error={errors.courseId}
        >
          <option value="" disabled>
            選擇課程…
          </option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </Select>

        {errorMessage && (
          <p role="alert" className="text-sm text-[var(--danger)]">{errorMessage}</p>
        )}

        {/* Title */}
        <Input
          label="標題"
          required
          placeholder="例：複習第三章"
          maxLength={60}
          value={form.title}
          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          error={errors.title}
        />

        {/* Date + Time row */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="日期"
            type="date"
            required
            value={form.date}
            onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
            error={errors.date}
          />
          <Input
            label="開始時間"
            type="time"
            required
            value={form.time}
            onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
            error={errors.time}
          />
        </div>

        {/* Duration */}
        <Select
          label="時長"
          value={form.durationMinutes}
          onChange={(e) =>
            setForm((p) => ({ ...p, durationMinutes: Number(e.target.value) }))
          }
        >
          {DURATION_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>

        {/* Priority */}
        <Select
          label="優先度"
          value={form.priority}
          onChange={(e) =>
            setForm((p) => ({
              ...p,
              priority: e.target.value as 'low' | 'medium' | 'high',
            }))
          }
        >
          <option value="low">低</option>
          <option value="medium">中</option>
          <option value="high">高</option>
        </Select>

        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            fullWidth
            onClick={onClose}
            disabled={isLoading}
          >
            取消
          </Button>
          <Button type="submit" variant="primary" fullWidth loading={isLoading}>
            新增
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

// ─── Weekly summary bar ───────────────────────────────────────────────────────

function WeeklySummaryBar({ sessions }: { sessions: StudySession[] }) {
  const totalPlanned = sessions
    .filter((s) => s.status !== 'skipped')
    .reduce((acc, s) => acc + s.durationMinutes, 0)
  const totalCompleted = sessions
    .filter((s) => s.status === 'completed')
    .reduce((acc, s) => acc + s.durationMinutes, 0)
  const pct = totalPlanned > 0 ? Math.min(100, (totalCompleted / totalPlanned) * 100) : 0

  const fmtHours = (mins: number) => {
    if (mins < 60) return `${mins} 分鐘`
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return m > 0 ? `${h} 小時 ${m} 分鐘` : `${h} 小時`
  }

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-card)] p-4 mt-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-[var(--text)]">本週進度</p>
        <p className="text-sm text-[var(--muted)]">
          {fmtHours(totalCompleted)} / {fmtHours(totalPlanned)}
        </p>
      </div>
      <div
        className="h-2 rounded-full overflow-hidden"
        style={{ background: 'var(--border)' }}
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`本週學習進度 ${Math.round(pct)}%`}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: 'var(--mint)' }}
        />
      </div>
      <p className="text-xs text-[var(--muted)] mt-1">{Math.round(pct)}% 完成</p>
    </div>
  )
}

// ─── Desktop week grid ────────────────────────────────────────────────────────

interface WeekGridProps {
  weekDays: string[]
  today: string
  sessions: StudySession[]
  courseMap: Map<string, { title: string; color: CourseColor }>
  onAddClick: (date: string) => void
  onSessionClick: (session: StudySession) => void
}

function WeekGrid({
  weekDays,
  today,
  sessions,
  courseMap,
  onAddClick,
  onSessionClick,
}: WeekGridProps) {
  return (
    <div className="hidden md:grid md:grid-cols-7 gap-2">
      {weekDays.map((day) => {
        const { weekday, date } = formatDayHeader(day)
        const isToday = day === today
        const daySessions = sessions
          .filter((s) => toLocalDateISO(s.startsAt) === day)
          .sort((a, b) => a.startsAt.localeCompare(b.startsAt))

        return (
          <div
            key={day}
            className="rounded-[var(--radius-card)] border border-[var(--border)] overflow-hidden"
            style={{
              background: isToday ? 'var(--primary-soft)' : 'var(--surface)',
            }}
          >
            {/* Day header */}
            <div
              className="px-2 py-2 text-center border-b border-[var(--border)]"
              style={{
                background: isToday ? 'var(--primary-soft)' : 'var(--bg)',
              }}
            >
              <p
                className="text-xs font-semibold"
                style={{
                  color: isToday ? 'var(--primary)' : 'var(--muted)',
                }}
              >
                {weekday}
              </p>
              <p
                className="text-sm font-bold"
                style={{
                  color: isToday ? 'var(--primary)' : 'var(--text)',
                }}
              >
                {date}
              </p>
            </div>

            {/* Sessions */}
            <div className="p-1.5 flex flex-col gap-1.5 min-h-[120px]">
              {daySessions.map((s) => (
                <SessionCard
                  key={s.id}
                  session={s}
                  courseColor={courseMap.get(s.courseId)?.color}
                  onClick={() => onSessionClick(s)}
                />
              ))}
            </div>

            {/* Add button */}
            <div className="px-1.5 pb-1.5">
              <button
                type="button"
                onClick={() => onAddClick(day)}
                className="w-full text-center text-xs text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--primary-soft)] rounded-[var(--radius-control)] py-1 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                aria-label={`在 ${weekday} 新增行程`}
              >
                ＋
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Mobile single-day view ───────────────────────────────────────────────────

interface MobileDayViewProps {
  weekDays: string[]
  today: string
  selectedDay: string
  onSelectDay: (day: string) => void
  sessions: StudySession[]
  courseMap: Map<string, { title: string; color: CourseColor }>
  onAddClick: (date: string) => void
  onSessionClick: (session: StudySession) => void
}

function MobileDayView({
  weekDays,
  today,
  selectedDay,
  onSelectDay,
  sessions,
  courseMap,
  onAddClick,
  onSessionClick,
}: MobileDayViewProps) {
  const daySessions = sessions
    .filter((s) => toLocalDateISO(s.startsAt) === selectedDay)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))

  return (
    <div className="md:hidden">
      {/* Day tabs */}
      <div
        className="flex overflow-x-auto gap-1 pb-2 scrollbar-hide"
        role="tablist"
        aria-label="選擇日期"
      >
        {weekDays.map((day) => {
          const { weekday, date } = formatDayHeader(day)
          const isSelected = day === selectedDay
          const isToday = day === today
          return (
            <button
              key={day}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => onSelectDay(day)}
              className="shrink-0 flex flex-col items-center px-3 py-2 rounded-[var(--radius-control)] text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
              style={{
                background: isSelected
                  ? 'var(--primary)'
                  : isToday
                  ? 'var(--primary-soft)'
                  : 'transparent',
                color: isSelected ? 'white' : isToday ? 'var(--primary)' : 'var(--muted)',
              }}
            >
              <span>{weekday}</span>
              <span className="font-bold">{date}</span>
            </button>
          )
        })}
      </div>

      {/* Sessions for selected day */}
      <div className="mt-3 flex flex-col gap-2">
        {daySessions.length === 0 ? (
          <p className="text-sm text-[var(--muted)] text-center py-6">今天沒有排程</p>
        ) : (
          daySessions.map((s) => (
            <SessionCard
              key={s.id}
              session={s}
              courseColor={courseMap.get(s.courseId)?.color}
              onClick={() => onSessionClick(s)}
            />
          ))
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAddClick(selectedDay)}
          className="mt-1"
        >
          ＋ 新增讀書行程
        </Button>
      </div>
    </div>
  )
}

// ─── PlannerPage ──────────────────────────────────────────────────────────────

export function PlannerPage() {
  const navigate = useNavigate()
  const today = todayISO()

  // Week navigation
  const [weekStart, setWeekStart] = useState(() => getMondayOf(today))
  const [selectedDay, setSelectedDay] = useState(today)
  const weekDays = getWeekDays(weekStart)

  // Dialogs
  const [createDialogDate, setCreateDialogDate] = useState<string | null>(null)
  const [detailSession, setDetailSession] = useState<StudySession | null>(null)
  const [aiPlanOpen, setAiPlanOpen] = useState(false)

  // Mochi toast
  const [showToast, setShowToast] = useState(false)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Data
  const coursesQuery = useAllCourses()
  const sessionsQuery = useWeekSessions(weekStart)
  const createSession = useCreateSession()
  const updateStatus = useUpdateSessionStatus()
  const deleteSession = useDeleteSession()

  // Derived course map
  const courseMap = new Map<string, { title: string; color: CourseColor }>(
    (coursesQuery.data ?? []).map((c) => [c.id, { title: c.title, color: c.color }]),
  )

  // Helpers
  function prevWeek() {
    const d = new Date(weekStart + 'T00:00:00')
    d.setDate(d.getDate() - 7)
    setWeekStart(toDateString(d))
  }
  function nextWeek() {
    const d = new Date(weekStart + 'T00:00:00')
    d.setDate(d.getDate() + 7)
    setWeekStart(toDateString(d))
  }
  function thisWeek() {
    setWeekStart(getMondayOf(today))
  }

  function openCreate(date: string) {
    setCreateDialogDate(date)
  }
  function closeCreate() {
    setCreateDialogDate(null)
  }

  function handleCreate(input: CreateSessionInput) {
    createSession.mutate(input, {
      onSuccess: () => {
        closeCreate()
      },
    })
  }

  function handleComplete() {
    if (!detailSession) return
    updateStatus.mutate(
      { id: detailSession.id, status: 'completed' },
      {
        onSuccess: () => {
          setDetailSession(null)
          fireToast()
        },
      },
    )
  }

  function handleSkip() {
    if (!detailSession) return
    updateStatus.mutate(
      { id: detailSession.id, status: 'skipped' },
      {
        onSuccess: () => setDetailSession(null),
      },
    )
  }

  function handleDelete() {
    if (!detailSession) return
    deleteSession.mutate(detailSession.id, {
      onSuccess: () => setDetailSession(null),
    })
  }

  const fireToast = useCallback(() => {
    setShowToast(true)
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setShowToast(false), 2800)
  }, [])

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    }
  }, [])

  // Ensure selectedDay tracks week changes on mobile
  useEffect(() => {
    if (!weekDays.includes(selectedDay)) {
      setSelectedDay(weekDays.includes(today) ? today : weekDays[0])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart])

  // ── Render: no courses ──
  if (!coursesQuery.isLoading && (coursesQuery.data ?? []).length === 0) {
    return (
      <div className="max-w-5xl mx-auto">
        <PageHeader title="讀書計畫" description="查看和管理你的學習排程" />
        <EmptyState
          icon="📚"
          title="尚無課程"
          description="請先建立學期和課程，才能安排讀書行程。"
          action={{
            label: '前往學期管理',
            onClick: () => navigate(ROUTES.semesters),
          }}
        />
      </div>
    )
  }

  // ── Render: loading ──
  if (coursesQuery.isLoading || sessionsQuery.isLoading) {
    return (
      <div className="max-w-5xl mx-auto">
        <PageHeader title="讀書計畫" />
        <LoadingState message="載入計畫中…" />
      </div>
    )
  }

  // ── Render: error ──
  if (coursesQuery.isError || sessionsQuery.isError) {
    return (
      <div className="max-w-5xl mx-auto">
        <PageHeader title="讀書計畫" />
        <ErrorState
          message="無法載入讀書計畫，請重新整理。"
          onRetry={() => {
            coursesQuery.refetch()
            sessionsQuery.refetch()
          }}
        />
      </div>
    )
  }

  const sessions = sessionsQuery.data ?? []
  const courses = coursesQuery.data ?? []

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="讀書計畫"
        description="管理你的每週學習排程"
        actions={
          <div className="flex items-center gap-2">
            {isSupabaseConfigured && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setAiPlanOpen(true)}
                title="使用 AI 生成讀書計畫草稿"
              >
                ✨ AI 生成計畫
              </Button>
            )}
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={prevWeek} aria-label="上週">←</Button>
              <Button variant="secondary" size="sm" onClick={thisWeek}>本週</Button>
              <Button variant="ghost" size="sm" onClick={nextWeek} aria-label="下週">→</Button>
            </div>
          </div>
        }
      />

      {/* Week label */}
      <p className="text-sm text-[var(--muted)] mb-4">
        {weekDays[0].replace(/-/g, '/')} – {weekDays[6].replace(/-/g, '/')}
      </p>

      {/* Desktop grid */}
      <WeekGrid
        weekDays={weekDays}
        today={today}
        sessions={sessions}
        courseMap={courseMap}
        onAddClick={openCreate}
        onSessionClick={setDetailSession}
      />

      {/* Mobile day view */}
      <MobileDayView
        weekDays={weekDays}
        today={today}
        selectedDay={selectedDay}
        onSelectDay={setSelectedDay}
        sessions={sessions}
        courseMap={courseMap}
        onAddClick={openCreate}
        onSessionClick={setDetailSession}
      />

      {/* Weekly summary */}
      <WeeklySummaryBar sessions={sessions} />

      {/* Create dialog */}
      <CreateSessionDialog
        open={createDialogDate !== null}
        defaultDate={createDialogDate ?? today}
        onClose={closeCreate}
        courses={courses}
        onSubmit={handleCreate}
        isLoading={createSession.isPending}
        errorMessage={createSession.isError ? '無法新增行程，請再試一次。' : undefined}
      />

      {/* Detail dialog */}
      <SessionDetailDialog
        session={detailSession}
        open={detailSession !== null}
        onClose={() => setDetailSession(null)}
        courseTitle={
          detailSession ? courseMap.get(detailSession.courseId)?.title : undefined
        }
        onComplete={handleComplete}
        onSkip={handleSkip}
        onDelete={handleDelete}
        isUpdating={updateStatus.isPending}
        isDeleting={deleteSession.isPending}
      />

      {/* Mochi toast */}
      <MochiToast visible={showToast} />

      {/* AI Plan Dialog */}
      <AIPlanDialog
        open={aiPlanOpen}
        onClose={() => setAiPlanOpen(false)}
      />
    </div>
  )
}


// ─── AI Plan Dialog ───────────────────────────────────────────────────────────

interface AIPlanDialogProps {
  open: boolean
  onClose: () => void
}

function AIPlanDialog({ open, onClose }: AIPlanDialogProps) {
  const { data: semesters } = useSemesters()
  const { data: courses } = useAllCourses()
  const { data: allDeadlines } = useAllDeadlines()

  const activeSemester = semesters?.find((s) => s.status === 'active')

  const [weeklyHours, setWeeklyHours] = useState('15')
  const [draft, setDraft] = useState<StudyPlanDraft | null>(null)
  const [step, setStep] = useState<'config' | 'draft' | 'done'>('config')
  const [aiError, setAiError] = useState('')
  const [approveMsg, setApproveMsg] = useState('')

  const generatePlan = useGeneratePlan()
  const approvePlan = useApprovePlan()

  function handleClose() {
    setDraft(null)
    setStep('config')
    setAiError('')
    setApproveMsg('')
    onClose()
  }

  async function handleGenerate() {
    if (!activeSemester || !courses?.length) return
    setAiError('')
    try {
      const deadlines = (allDeadlines ?? []).map((d) => ({
        courseId: d.courseId,
        title: d.title,
        dueAt: d.dueAt,
        type: d.type,
      }))
      const result = await generatePlan.mutateAsync({
        semesterId: activeSemester.id,
        courses: (courses ?? []).map((c) => ({
          id: c.id,
          title: c.title,
          difficulty: c.difficulty,
          weeklyHours: c.weeklyHours,
        })),
        deadlines,
        availableHoursPerWeek: parseFloat(weeklyHours) || 15,
        semesterStart: activeSemester.startDate,
        semesterEnd: activeSemester.endDate,
      })
      setDraft(result)
      setStep('draft')
    } catch (err) {
      const isNotConfigured = err instanceof AINotConfiguredError
      setAiError(
        isNotConfigured
          ? 'AI 功能需要設定 Supabase 和 NVIDIA API。請參考 README 完成設定。'
          : err instanceof Error ? err.message : 'AI 服務暫時無法使用'
      )
    }
  }

  async function handleApprove() {
    if (!draft) return
    setAiError('')
    try {
      const count = await approvePlan.mutateAsync(draft)
      setApproveMsg(`已將 ${count} 筆讀書行程加入計畫！`)
      setStep('done')
    } catch (err) {
      setAiError(err instanceof Error ? err.message : '儲存失敗')
    }
  }

  const courseMap = new Map((courses ?? []).map((c) => [c.id, c.title]))

  return (
    <Dialog open={open} onClose={handleClose} title="✨ AI 生成讀書計畫">
      {step === 'config' && (
        <div className="space-y-4">
          <p className="text-sm text-[var(--muted)]">
            AI 會根據你目前的課程、截止日和每週可用時數，生成一份讀書計畫草稿，你審核後才會儲存。
          </p>
          {!activeSemester && (
            <div className="bg-[var(--yellow)] rounded-[var(--radius-control)] p-3 text-sm text-[#7A6000]">
              ⚠️ 尚無進行中的學期，請先建立學期再生成計畫。
            </div>
          )}
          {activeSemester && (
            <div className="bg-[var(--primary-soft)] rounded-[var(--radius-control)] p-3 text-sm text-[var(--primary)]">
              📅 學期：{activeSemester.name}（{activeSemester.startDate} ～ {activeSemester.endDate}）
              <br />
              📚 課程：{(courses ?? []).length} 門
            </div>
          )}
          <Input
            label="每週可讀書時數"
            type="number"
            min="1"
            max="80"
            value={weeklyHours}
            onChange={(e) => setWeeklyHours(e.target.value)}
            hint="AI 會根據此數字分配各科讀書時間"
          />
          <div className="bg-[var(--yellow)] rounded-[var(--radius-control)] p-3 text-xs text-[#7A6000]">
            <strong>AI grounding 說明：</strong>生成的計畫標記為「AI 建議」，不會虛構課程事實或已確認的考試日期。你可以在審核時調整任何細節。
          </div>
          {aiError && <p role="alert" className="text-sm text-[var(--danger)]">{aiError}</p>}
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose} fullWidth>取消</Button>
            <Button
              fullWidth
              loading={generatePlan.isPending}
              onClick={() => void handleGenerate()}
              disabled={!activeSemester || !courses?.length}
            >
              生成草稿
            </Button>
          </div>
        </div>
      )}

      {step === 'draft' && draft && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MochiAvatar mood="studying" size="sm" animate={false} />
            <p className="text-sm font-medium text-[var(--text)]">草稿已生成，請審核後再套用</p>
          </div>
          {draft.assumptions.length > 0 && (
            <div className="bg-[var(--primary-soft)] rounded-[var(--radius-control)] p-3 text-sm text-[var(--primary)]">
              <p className="font-medium mb-1">AI 假設：</p>
              <ul className="list-disc pl-4 space-y-0.5">
                {draft.assumptions.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          )}
          {draft.warnings.length > 0 && (
            <div className="bg-[var(--yellow)] rounded-[var(--radius-control)] p-3 text-sm text-[#7A6000]">
              <p className="font-medium mb-1">注意事項：</p>
              <ul className="list-disc pl-4 space-y-0.5">
                {draft.warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}
          <div className="max-h-64 overflow-y-auto space-y-2 border border-[var(--border)] rounded-[var(--radius-control)] p-3">
            <p className="text-xs text-[var(--muted)] mb-2">共 {draft.sessions.length} 筆行程（預覽）</p>
            {draft.sessions.slice(0, 20).map((s) => (
              <div key={s.clientId} className="flex items-center justify-between gap-2 text-sm py-1 border-b border-[var(--border)] last:border-0">
                <div>
                  <span className="font-medium text-[var(--text)]">{s.title}</span>
                  <span className="text-[var(--muted)] ml-2 text-xs">{courseMap.get(s.courseId) ?? s.courseId}</span>
                </div>
                <div className="shrink-0 text-right text-xs text-[var(--muted)]">
                  <div>{s.date}</div>
                  <div>{s.durationMinutes} 分鐘</div>
                </div>
              </div>
            ))}
            {draft.sessions.length > 20 && (
              <p className="text-xs text-[var(--muted)] text-center pt-1">…還有 {draft.sessions.length - 20} 筆</p>
            )}
          </div>
          {aiError && <p role="alert" className="text-sm text-[var(--danger)]">{aiError}</p>}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep('config')} fullWidth>重新生成</Button>
            <Button
              fullWidth
              loading={approvePlan.isPending}
              onClick={() => void handleApprove()}
            >
              ✓ 確認套用
            </Button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="space-y-4 text-center">
          <MochiAvatar mood="celebrating" size="lg" className="mx-auto" />
          <p className="text-base font-semibold text-[var(--text)]">{approveMsg}</p>
          <p className="text-sm text-[var(--muted)]">行程已標記為「AI 建議」，你可以隨時調整或刪除。</p>
          <Button fullWidth onClick={handleClose}>完成</Button>
        </div>
      )}
    </Dialog>
  )
}
