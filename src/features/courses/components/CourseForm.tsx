import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { COURSE_COLORS } from '@/lib/courseColors'
import { COURSE_ICONS, DEFAULT_COURSE_ICON } from '@/lib/courseIcons'
import type { Course, CourseColor, CourseIcon } from '@/types'
import { useState } from 'react'
import { courseFormSchema, type CourseFormValues } from '../schemas'

interface CourseFormProps {
  initial?: Course
  onSubmit: (values: CourseFormValues) => Promise<void>
  onCancel: () => void
  submitLabel?: string
}

const COLOR_OPTIONS: CourseColor[] = ['lavender', 'mint', 'peach', 'yellow', 'sky', 'rose']
const ICON_OPTIONS = Object.keys(COURSE_ICONS) as CourseIcon[]

export function CourseForm({ initial, onSubmit, onCancel, submitLabel = '儲存' }: CourseFormProps) {
  const [form, setForm] = useState<CourseFormValues>({
    title: initial?.title ?? '',
    code: initial?.code ?? '',
    color: initial?.color ?? 'lavender',
    icon: initial?.icon ?? DEFAULT_COURSE_ICON,
    targetGrade: initial?.targetGrade ?? '',
    difficulty: initial?.difficulty ?? 'medium',
    weeklyHours: initial?.weeklyHours ?? 3,
  })
  const [errors, setErrors] = useState<Partial<Record<keyof CourseFormValues, string>>>({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = courseFormSchema.safeParse(form)
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof CourseFormValues, string>> = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof CourseFormValues
        fieldErrors[key] = issue.message
      }
      setErrors(fieldErrors)
      return
    }
    setErrors({})
    setLoading(true)
    setServerError('')
    try {
      await onSubmit(result.data)
    } catch (err) {
      setServerError(err instanceof Error ? err.message : '儲存失敗，請再試一次')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Input
        label="課程名稱"
        placeholder="例：微積分"
        required
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        error={errors.title}
      />
      <Input
        label="課程代碼"
        placeholder="例：MATH101（選填）"
        value={form.code}
        onChange={(e) => setForm({ ...form, code: e.target.value })}
        error={errors.code}
      />

      {/* Color picker */}
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-[var(--text)]">課程顏色</span>
        <div className="flex gap-2 flex-wrap">
          {COLOR_OPTIONS.map((c) => {
            const col = COURSE_COLORS[c]
            return (
              <button
                key={c}
                type="button"
                onClick={() => setForm({ ...form, color: c })}
                aria-label={col.label}
                aria-pressed={form.color === c}
                className="w-8 h-8 rounded-full border-2 transition-all focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{
                  backgroundColor: col.border,
                  borderColor: form.color === c ? col.text : 'transparent',
                  outline: form.color === c ? `2px solid ${col.text}` : undefined,
                  outlineOffset: form.color === c ? '2px' : undefined,
                }}
              />
            )
          })}
        </div>
      </div>

      {/* Icon picker */}
      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-sm font-medium text-[var(--text)]">課程圖示</legend>
        <div className="flex flex-wrap gap-2">
          {ICON_OPTIONS.map((icon) => {
            const option = COURSE_ICONS[icon]
            const selected = form.icon === icon
            return (
              <button
                key={icon}
                type="button"
                onClick={() => setForm({ ...form, icon })}
                aria-label={option.label}
                aria-pressed={selected}
                className={`flex h-10 w-10 items-center justify-center rounded-[var(--radius-control)] border text-lg transition-colors ${
                  selected
                    ? 'border-[var(--primary)] bg-[var(--primary-soft)]'
                    : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)]'
                }`}
              >
                <span aria-hidden="true">{option.emoji}</span>
              </button>
            )
          })}
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="難度"
          value={form.difficulty}
          onChange={(e) =>
            setForm({ ...form, difficulty: (e as React.ChangeEvent<HTMLSelectElement>).target.value as CourseFormValues['difficulty'] })
          }
        >
          <option value="easy">輕鬆</option>
          <option value="medium">普通</option>
          <option value="hard">挑戰</option>
        </Select>
        <Input
          label="每週預計時數"
          type="number"
          min="0.5"
          max="40"
          step="0.5"
          value={String(form.weeklyHours)}
          onChange={(e) => setForm({ ...form, weeklyHours: parseFloat(e.target.value) || 0 })}
          error={errors.weeklyHours}
        />
      </div>

      <Input
        label="目標成績"
        placeholder="例：A、90 分（選填）"
        value={form.targetGrade}
        onChange={(e) => setForm({ ...form, targetGrade: e.target.value })}
      />

      {serverError && (
        <p role="alert" className="text-sm text-[var(--danger)]">{serverError}</p>
      )}
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          取消
        </Button>
        <Button type="submit" fullWidth loading={loading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
