import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { LoadingState } from '@/components/ui/LoadingState'
import { PageHeader } from '@/components/ui/PageHeader'
import { COURSE_COLORS, DIFFICULTY_LABEL } from '@/lib/courseColors'
import { getCourseIcon } from '@/lib/courseIcons'
import { formatDate } from '@/lib/date'
import { ROUTES } from '@/lib/routes'
import type { Deadline } from '@/types'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CourseForm } from './components/CourseForm'
import { useArchiveCourse, useCourse, useUpdateCourse } from './hooks/useCourses'
import type { CourseFormValues } from './schemas'
import { useDeadlines, useCreateDeadline, useDeleteDeadline } from './hooks/useDeadlines'
import { DeadlineForm } from './components/DeadlineForm'

type Tab = 'overview' | 'notes' | 'quizzes'

export function CoursePage() {
  const { courseId } = useParams<{ courseId: string }>()
  const { data: course, isLoading, isError } = useCourse(courseId ?? '')
  const updateCourse = useUpdateCourse()
  const archiveCourse = useArchiveCourse()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('overview')
  const [editOpen, setEditOpen] = useState(false)
  const [actionError, setActionError] = useState('')

  if (isLoading) return <LoadingState message="載入課程資料…" />
  if (isError || !course) return <ErrorState message="找不到這門課程。" />

  const colors = COURSE_COLORS[course.color]
  const icon = getCourseIcon(course.icon)

  async function handleUpdate(values: CourseFormValues) {
    await updateCourse.mutateAsync({ id: course!.id, values })
    setEditOpen(false)
  }

  async function handleArchiveToggle() {
    setActionError('')
    try {
      const updated = await archiveCourse.mutateAsync(course!.id)
      if (updated.archivedAt) navigate(ROUTES.semesters)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : '無法更新封存狀態，請再試一次。')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <PageHeader
        title={course.title}
        description={`${icon.emoji} ${course.code || icon.label}`}
        actions={
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              loading={archiveCourse.isPending}
              onClick={handleArchiveToggle}
            >
              {course.archivedAt ? '取消封存' : '封存課程'}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setEditOpen(true)}>
              ✏️ 編輯課程
            </Button>
          </div>
        }
      />

      {actionError && (
        <p role="alert" className="rounded-[var(--radius-control)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
          {actionError}
        </p>
      )}

      {/* Color badge + meta */}
      <div className="flex flex-wrap gap-2">
        <Badge style={{ backgroundColor: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}>
          ● {course.color}
        </Badge>
        <Badge variant="default">
          難度：{DIFFICULTY_LABEL[course.difficulty]}
        </Badge>
        <Badge variant="default">
          每週 {course.weeklyHours} 小時
        </Badge>
        {course.targetGrade && (
          <Badge variant="primary">目標：{course.targetGrade}</Badge>
        )}
        {course.archivedAt && (
          <Badge variant="warning">已封存</Badge>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--border)]">
        {([
          { key: 'overview', label: '總覽' },
          { key: 'notes', label: '筆記' },
          { key: 'quizzes', label: '測驗' },
        ] as { key: Tab; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === key
                ? 'border-[var(--primary)] text-[var(--primary)]'
                : 'border-transparent text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && <CourseOverview courseId={course.id} semesterId={course.semesterId} />}
      {tab === 'notes' && (
        <div>
          <div className="flex justify-end mb-4">
            <Link to={ROUTES.courseNotes(course.id)}>
              <Button size="sm">前往筆記頁面 →</Button>
            </Link>
          </div>
          <EmptyState icon="📝" title="在筆記頁面管理這門課的筆記" />
        </div>
      )}
      {tab === 'quizzes' && (
        <div>
          <div className="flex justify-end mb-4">
            <Link to={ROUTES.courseQuizzes(course.id)}>
              <Button size="sm">前往測驗頁面 →</Button>
            </Link>
          </div>
          <EmptyState icon="🧪" title="在測驗頁面管理這門課的測驗" />
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} title="編輯課程">
        <CourseForm
          initial={course}
          onSubmit={handleUpdate}
          onCancel={() => setEditOpen(false)}
          submitLabel="儲存變更"
        />
      </Dialog>
    </div>
  )
}

function CourseOverview({ courseId }: { courseId: string; semesterId: string }) {
  const { data: deadlines = [], isLoading } = useDeadlines(courseId)
  const createDeadline = useCreateDeadline()
  const deleteDeadline = useDeleteDeadline()
  const [deadlineOpen, setDeadlineOpen] = useState(false)
  const [deadlineToDelete, setDeadlineToDelete] = useState<Deadline | null>(null)

  const upcoming = deadlines
    .filter((d) => new Date(d.dueAt) >= new Date())
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {/* Deadlines */}
      <Card>
        <CardHeader>
          <CardTitle>截止日期</CardTitle>
          <Button size="sm" variant="secondary" onClick={() => setDeadlineOpen(true)}>
            ＋ 新增
          </Button>
        </CardHeader>
        {isLoading ? (
          <LoadingState message="" className="py-4" />
        ) : upcoming.length === 0 ? (
          <EmptyState icon="📅" title="沒有即將到來的截止日" className="py-4" />
        ) : (
          <ul className="space-y-2">
            {upcoming.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between gap-2 px-3 py-2 rounded-[var(--radius-control)] bg-[var(--bg)] border border-[var(--border)]"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--text)]">{d.title}</p>
                  <p className="text-xs text-[var(--muted)]">{formatDate(d.dueAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={d.confirmed ? 'verified' : 'ai'}>
                    {d.confirmed ? '確認' : '未確認'}
                  </Badge>
                  <button
                    onClick={() => setDeadlineToDelete(d)}
                    aria-label="刪除截止日"
                    className="text-[var(--muted)] hover:text-[var(--danger)] transition-colors p-1"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <Dialog open={deadlineOpen} onClose={() => setDeadlineOpen(false)} title="新增截止日期">
          <DeadlineForm
            courseId={courseId}
            onSubmit={async (values) => {
              await createDeadline.mutateAsync({ courseId, values })
              setDeadlineOpen(false)
            }}
            onCancel={() => setDeadlineOpen(false)}
          />
        </Dialog>
        <Dialog
          open={!!deadlineToDelete}
          onClose={() => setDeadlineToDelete(null)}
          title="刪除截止日期"
          description="此動作無法還原，請確認後再刪除。"
        >
          <div className="space-y-4">
            <p className="text-sm text-[var(--muted)]">
              確定要刪除「<strong className="text-[var(--text)]">{deadlineToDelete?.title}</strong>」嗎？
            </p>
            <div className="flex gap-3">
              <Button variant="outline" fullWidth onClick={() => setDeadlineToDelete(null)}>
                取消
              </Button>
              <Button
                variant="danger"
                fullWidth
                loading={deleteDeadline.isPending}
                onClick={async () => {
                  if (!deadlineToDelete) return
                  await deleteDeadline.mutateAsync(deadlineToDelete.id)
                  setDeadlineToDelete(null)
                }}
              >
                確認刪除
              </Button>
            </div>
          </div>
        </Dialog>
      </Card>

      {/* Quick links */}
      <Card>
        <CardHeader>
          <CardTitle>快速連結</CardTitle>
        </CardHeader>
        <div className="space-y-2">
          <Link
            to={ROUTES.courseNotes(courseId)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-control)] border border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--primary-soft)] transition-colors"
          >
            <span>📝</span>
            <span className="text-sm font-medium">課程筆記</span>
          </Link>
          <Link
            to={ROUTES.courseQuizzes(courseId)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-control)] border border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--primary-soft)] transition-colors"
          >
            <span>🧪</span>
            <span className="text-sm font-medium">測驗庫</span>
          </Link>
          <Link
            to={ROUTES.planner}
            className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-control)] border border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--primary-soft)] transition-colors"
          >
            <span>📅</span>
            <span className="text-sm font-medium">讀書計畫</span>
          </Link>
        </div>
      </Card>
    </div>
  )
}
