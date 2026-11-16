import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import type { DeadlineType } from '@/types'
import { useState } from 'react'

interface DeadlineFormValues {
  title: string
  dueAt: string
  type: DeadlineType
  confirmed: boolean
}

interface DeadlineFormProps {
  courseId: string
  onSubmit: (values: DeadlineFormValues) => Promise<void>
  onCancel: () => void
}

export function DeadlineForm({ onSubmit, onCancel }: DeadlineFormProps) {
  const [form, setForm] = useState<DeadlineFormValues>({
    title: '',
    dueAt: '',
    type: 'assignment',
    confirmed: true,
  })
  const [errors, setErrors] = useState<Partial<Record<keyof DeadlineFormValues, string>>>({})
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs: typeof errors = {}
    if (!form.title.trim()) errs.title = '請輸入截止日名稱'
    if (!form.dueAt) errs.dueAt = '請選擇截止日期'
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    try {
      await onSubmit(form)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Input
        label="名稱"
        placeholder="例：期中考"
        required
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        error={errors.title}
      />
      <Input
        label="截止日期"
        type="datetime-local"
        required
        value={form.dueAt}
        onChange={(e) => setForm({ ...form, dueAt: e.target.value })}
        error={errors.dueAt}
      />
      <Select
        label="類型"
        value={form.type}
        onChange={(e) => setForm({ ...form, type: (e as React.ChangeEvent<HTMLSelectElement>).target.value as DeadlineType })}
      >
        <option value="exam">考試</option>
        <option value="assignment">作業</option>
        <option value="project">專題</option>
        <option value="quiz">小考</option>
        <option value="other">其他</option>
      </Select>
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={form.confirmed}
          onChange={(e) => setForm({ ...form, confirmed: e.target.checked })}
          className="w-4 h-4 accent-[var(--primary)]"
        />
        <span className="text-[var(--text)]">已確認（由老師或課表確認）</span>
      </label>
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>取消</Button>
        <Button type="submit" fullWidth loading={loading}>新增</Button>
      </div>
    </form>
  )
}
