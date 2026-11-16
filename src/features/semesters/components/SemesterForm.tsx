import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import type { Semester } from '@/types'
import { useState } from 'react'
import { semesterFormSchema, type SemesterFormValues } from '../schemas'

interface SemesterFormProps {
  initial?: Semester
  onSubmit: (values: SemesterFormValues) => Promise<void>
  onCancel: () => void
  submitLabel?: string
}

export function SemesterForm({ initial, onSubmit, onCancel, submitLabel = '儲存' }: SemesterFormProps) {
  const [form, setForm] = useState<SemesterFormValues>({
    name: initial?.name ?? '',
    startDate: initial?.startDate ?? '',
    endDate: initial?.endDate ?? '',
    timezone: initial?.timezone ?? 'Asia/Taipei',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof SemesterFormValues, string>>>({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = semesterFormSchema.safeParse(form)
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof SemesterFormValues, string>> = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof SemesterFormValues
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
        label="學期名稱"
        placeholder="例：2025 上學期"
        required
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        error={errors.name}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="開始日期"
          type="date"
          required
          value={form.startDate}
          onChange={(e) => setForm({ ...form, startDate: e.target.value })}
          error={errors.startDate}
        />
        <Input
          label="結束日期"
          type="date"
          required
          value={form.endDate}
          onChange={(e) => setForm({ ...form, endDate: e.target.value })}
          error={errors.endDate}
        />
      </div>
      <Select
        label="時區"
        value={form.timezone}
        onChange={(e) => setForm({ ...form, timezone: (e as React.ChangeEvent<HTMLSelectElement>).target.value })}
      >
        <option value="Asia/Taipei">台灣 (UTC+8)</option>
        <option value="Asia/Tokyo">日本 (UTC+9)</option>
        <option value="America/New_York">美東 (UTC-5)</option>
        <option value="Europe/London">倫敦 (UTC+0)</option>
      </Select>
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
