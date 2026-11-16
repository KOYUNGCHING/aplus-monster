import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { getCourseIcon } from '@/lib/courseIcons'
import { formatDate } from '@/lib/date'
import { ROUTES } from '@/lib/routes'
import type { Course, Semester } from '@/types'
import { Link } from 'react-router-dom'

interface SemesterCardProps {
  semester: Semester
  courses: Course[]
  onEdit: () => void
  onArchive: () => void
  onAddCourse: () => void
  onRestoreCourse: (courseId: string) => void
}

export function SemesterCard({
  semester,
  courses,
  onEdit,
  onArchive,
  onAddCourse,
  onRestoreCourse,
}: SemesterCardProps) {
  const activeCourses = courses.filter((c) => !c.archivedAt)
  const archivedCourses = courses.filter((c) => c.archivedAt)
  const isArchived = semester.status === 'archived'

  return (
    <Card className={isArchived ? 'opacity-60' : ''}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-bold text-[var(--text)]">{semester.name}</h2>
            {isArchived && <Badge variant="default">已封存</Badge>}
          </div>
          <p className="text-sm text-[var(--muted)]">
            {formatDate(semester.startDate)} ～ {formatDate(semester.endDate)}
          </p>
        </div>
        <div className="flex gap-1 shrink-0">
          <Button size="sm" variant="ghost" onClick={onEdit} aria-label="編輯學期">
            ✏️
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onArchive}
            aria-label={isArchived ? '取消封存' : '封存學期'}
          >
            {isArchived ? '📂' : '🗂️'}
          </Button>
        </div>
      </div>

      {/* Courses */}
      <div className="space-y-2 mb-4">
        {activeCourses.length === 0 ? (
          <p className="text-sm text-[var(--muted)] py-2">尚無課程</p>
        ) : (
          activeCourses.map((course) => (
            <Link
              key={course.id}
              to={ROUTES.course(course.id)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-control)] border border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--primary-soft)] transition-colors group"
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base"
                style={{ backgroundColor: getCourseColorHex(course.color) }}
                aria-hidden="true"
              >
                {getCourseIcon(course.icon).emoji}
              </div>
              <span className="text-sm font-medium text-[var(--text)] group-hover:text-[var(--primary)] flex-1 truncate">
                {course.title}
              </span>
              {course.code && (
                <span className="text-xs text-[var(--muted)]">{course.code}</span>
              )}
              <span className="text-xs text-[var(--muted)] opacity-0 group-hover:opacity-100 transition-opacity">
                →
              </span>
            </Link>
          ))
        )}
      </div>

      {archivedCourses.length > 0 && (
        <details className="mb-4 rounded-[var(--radius-control)] border border-[var(--border)] px-3 py-2">
          <summary className="cursor-pointer text-sm font-medium text-[var(--muted)]">
            已封存課程（{archivedCourses.length}）
          </summary>
          <ul className="mt-2 space-y-2">
            {archivedCourses.map((course) => (
              <li key={course.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-[var(--muted)]">
                  <span aria-hidden="true" className="mr-2">{getCourseIcon(course.icon).emoji}</span>
                  {course.title}
                </span>
                <Button size="sm" variant="ghost" onClick={() => onRestoreCourse(course.id)}>
                  取消封存
                </Button>
              </li>
            ))}
          </ul>
        </details>
      )}

      {/* Add course */}
      {!isArchived && (
        <Button size="sm" variant="secondary" onClick={onAddCourse} fullWidth>
          ＋ 新增課程
        </Button>
      )}
    </Card>
  )
}

function getCourseColorHex(color: string): string {
  const map: Record<string, string> = {
    lavender: '#8B7BE8',
    mint: '#3DB57A',
    peach: '#FF8C66',
    yellow: '#D4A800',
    sky: '#2E9FD8',
    rose: '#D4204A',
  }
  return map[color] ?? '#8B7BE8'
}
