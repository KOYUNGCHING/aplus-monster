import { Dialog } from '@/components/ui/Dialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { LoadingState } from '@/components/ui/LoadingState'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { useCoursesBySemester, useCreateCourse } from '@/features/courses/hooks/useCourses'
import { CourseForm } from '@/features/courses/components/CourseForm'
import type { CourseFormValues } from '@/features/courses/schemas'
import type { Semester } from '@/types'
import { useState } from 'react'
import {
  useArchiveSemester,
  useCreateSemester,
  useDeleteSemester,
  useSemesters,
  useUpdateSemester,
} from './hooks/useSemesters'
import { SemesterCard } from './components/SemesterCard'
import { SemesterForm } from './components/SemesterForm'
import type { SemesterFormValues } from './schemas'

type DialogMode =
  | { type: 'create-semester' }
  | { type: 'edit-semester'; semester: Semester }
  | { type: 'delete-semester'; semester: Semester }
  | { type: 'create-course'; semesterId: string }
  | null

export function SemestersPage() {
  const { data: semesters, isLoading, isError, refetch } = useSemesters()
  const createSemester = useCreateSemester()
  const updateSemester = useUpdateSemester()
  const archiveSemester = useArchiveSemester()
  const deleteSemester = useDeleteSemester()
  const createCourse = useCreateCourse()
  const [dialog, setDialog] = useState<DialogMode>(null)
  const [showArchived, setShowArchived] = useState(false)

  if (isLoading) return <LoadingState message="載入學期資料…" />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  const activeSemesters = semesters?.filter((s) => s.status === 'active') ?? []
  const archivedSemesters = semesters?.filter((s) => s.status === 'archived') ?? []
  const displayList = showArchived ? (semesters ?? []) : activeSemesters

  async function handleCreateSemester(values: SemesterFormValues) {
    await createSemester.mutateAsync(values)
    setDialog(null)
  }

  async function handleEditSemester(values: SemesterFormValues) {
    if (dialog?.type !== 'edit-semester') return
    await updateSemester.mutateAsync({ id: dialog.semester.id, values })
    setDialog(null)
  }

  async function handleDeleteSemester() {
    if (dialog?.type !== 'delete-semester') return
    await deleteSemester.mutateAsync(dialog.semester.id)
    setDialog(null)
  }

  async function handleCreateCourse(values: CourseFormValues) {
    if (dialog?.type !== 'create-course') return
    await createCourse.mutateAsync({ semesterId: dialog.semesterId, values })
    setDialog(null)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="學期管理"
        description="管理你的所有學期和課程"
        actions={
          <div className="flex gap-2">
            {archivedSemesters.length > 0 && (
              <Button size="sm" variant="ghost" onClick={() => setShowArchived((v) => !v)}>
                {showArchived ? '隱藏已封存' : `顯示已封存 (${archivedSemesters.length})`}
              </Button>
            )}
            <Button size="sm" onClick={() => setDialog({ type: 'create-semester' })}>
              ＋ 新增學期
            </Button>
          </div>
        }
      />

      {displayList.length === 0 ? (
        <EmptyState
          icon="📚"
          title="尚未建立學期"
          description="點擊「新增學期」建立第一個學期，然後新增課程開始規劃。"
          action={{ label: '＋ 新增學期', onClick: () => setDialog({ type: 'create-semester' }) }}
        />
      ) : (
        <div className="space-y-5">
          {displayList.map((semester) => (
            <SemesterCourseRow
              key={semester.id}
              semester={semester}
              onEdit={() => setDialog({ type: 'edit-semester', semester })}
              onArchive={() => archiveSemester.mutate(semester.id)}
              onDelete={() => setDialog({ type: 'delete-semester', semester })}
              onAddCourse={() => setDialog({ type: 'create-course', semesterId: semester.id })}
            />
          ))}
        </div>
      )}

      {/* Create semester dialog */}
      <Dialog
        open={dialog?.type === 'create-semester'}
        onClose={() => setDialog(null)}
        title="新增學期"
      >
        <SemesterForm
          onSubmit={handleCreateSemester}
          onCancel={() => setDialog(null)}
          submitLabel="建立學期"
        />
      </Dialog>

      {/* Edit semester dialog */}
      <Dialog
        open={dialog?.type === 'edit-semester'}
        onClose={() => setDialog(null)}
        title="編輯學期"
      >
        {dialog?.type === 'edit-semester' && (
          <SemesterForm
            initial={dialog.semester}
            onSubmit={handleEditSemester}
            onCancel={() => setDialog(null)}
            submitLabel="儲存變更"
          />
        )}
      </Dialog>

      {/* Delete semester confirm dialog */}
      <Dialog
        open={dialog?.type === 'delete-semester'}
        onClose={() => setDialog(null)}
        title="刪除學期"
        description="此動作無法還原，學期內的課程也會一併刪除。"
      >
        {dialog?.type === 'delete-semester' && (
          <div className="space-y-4">
            <p className="text-sm text-[var(--muted)]">
              確定要刪除「<strong className="text-[var(--text)]">{dialog.semester.name}</strong>」嗎？
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setDialog(null)} fullWidth>
                取消
              </Button>
              <Button
                variant="danger"
                fullWidth
                loading={deleteSemester.isPending}
                onClick={handleDeleteSemester}
              >
                確認刪除
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Create course dialog */}
      <Dialog
        open={dialog?.type === 'create-course'}
        onClose={() => setDialog(null)}
        title="新增課程"
      >
        <CourseForm
          onSubmit={handleCreateCourse}
          onCancel={() => setDialog(null)}
          submitLabel="建立課程"
        />
      </Dialog>
    </div>
  )
}

/** Inner component so each card can fetch its own courses */
function SemesterCourseRow({
  semester,
  onEdit,
  onArchive,
  onDelete,
  onAddCourse,
}: {
  semester: Semester
  onEdit: () => void
  onArchive: () => void
  onDelete: () => void
  onAddCourse: () => void
}) {
  const { data: courses = [] } = useCoursesBySemester(semester.id)

  return (
    <SemesterCard
      semester={semester}
      courses={courses}
      onEdit={onEdit}
      onArchive={onArchive}
      onDelete={onDelete}
      onAddCourse={onAddCourse}
    />
  )
}
