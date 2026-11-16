import { MochiAvatar } from '@/components/mascot/MochiAvatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input, Select } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { useCreateCourse } from '@/features/courses/hooks/useCourses'
import { useCreateSemester } from '@/features/semesters/hooks/useSemesters'
import { COURSE_ICONS, DEFAULT_COURSE_ICON } from '@/lib/courseIcons'
import { uuid } from '@/lib/id'
import { ROUTES } from '@/lib/routes'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { CourseColor, CourseIcon } from '@/types'

type Step = 'welcome' | 'semester' | 'courses' | 'done'

interface SemesterDraft {
  name: string
  startDate: string
  endDate: string
  timezone: string
}

interface CourseDraft {
  clientId: string
  title: string
  color: CourseColor
  icon: CourseIcon
}

export function OnboardingPage() {
  const [step, setStep] = useState<Step>('welcome')
  const [semesterDraft, setSemesterDraft] = useState<SemesterDraft>({
    name: '',
    startDate: '',
    endDate: '',
    timezone: 'Asia/Taipei',
  })
  const [courseDrafts, setCourseDrafts] = useState<CourseDraft[]>(() => [
    { clientId: uuid(), title: '', color: 'lavender', icon: DEFAULT_COURSE_ICON },
  ])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const createSemester = useCreateSemester()
  const createCourse = useCreateCourse()
  const navigate = useNavigate()

  const steps: Step[] = ['welcome', 'semester', 'courses', 'done']
  const stepIndex = steps.indexOf(step)

  async function handleFinish() {
    setSaving(true)
    setSaveError('')
    try {
      const semester = await createSemester.mutateAsync(semesterDraft)
      const validCourses = courseDrafts.filter((c) => c.title.trim())
      for (const c of validCourses) {
        await createCourse.mutateAsync({
          semesterId: semester.id,
          values: {
            title: c.title,
            code: '',
            color: c.color,
            icon: c.icon,
            targetGrade: '',
            difficulty: 'medium',
            weeklyHours: 3,
          },
        })
      }
      setStep('done')
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : '無法儲存設定，請再試一次。')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="設定學期" description="讓 Mochi 認識你的課程，才能幫你規劃計畫" />

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step === s
                  ? 'bg-[var(--primary)] text-white'
                  : i < stepIndex
                  ? 'bg-[var(--mint)] text-[#2A7A5A]'
                  : 'bg-[var(--border)] text-[var(--muted)]'
              }`}
            >
              {i < stepIndex ? '✓' : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 w-8 transition-colors ${i < stepIndex ? 'bg-[var(--mint)]' : 'bg-[var(--border)]'}`} />
            )}
          </div>
        ))}
      </div>

      {step === 'welcome' && (
        <WelcomeStep onNext={() => setStep('semester')} />
      )}
      {step === 'semester' && (
        <SemesterStep
          draft={semesterDraft}
          onChange={setSemesterDraft}
          onNext={() => setStep('courses')}
          onBack={() => setStep('welcome')}
        />
      )}
      {step === 'courses' && (
        <CoursesStep
          drafts={courseDrafts}
          onChange={setCourseDrafts}
          onNext={handleFinish}
          onBack={() => setStep('semester')}
          saving={saving}
          saveError={saveError}
        />
      )}
      {step === 'done' && (
        <DoneStep onFinish={() => navigate(ROUTES.app)} />
      )}
    </div>
  )
}

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <Card className="text-center space-y-6">
      <MochiAvatar mood="happy" size="lg" className="mx-auto" />
      <div>
        <h2 className="text-xl font-bold text-[var(--text)] mb-2">嗨！我是 Mochi 🎉</h2>
        <p className="text-[var(--muted)] leading-relaxed">
          讓我陪你規劃這個學期！我會幫你整理課程、排讀書計畫、出練習題，全程都是你說了算。
        </p>
      </div>
      <Button onClick={onNext} fullWidth>開始設定 →</Button>
    </Card>
  )
}

function SemesterStep({
  draft,
  onChange,
  onNext,
  onBack,
}: {
  draft: SemesterDraft
  onChange: (d: SemesterDraft) => void
  onNext: () => void
  onBack: () => void
}) {
  const [errors, setErrors] = useState<Partial<Record<keyof SemesterDraft, string>>>({})

  function validate() {
    const e: typeof errors = {}
    if (!draft.name.trim()) e.name = '請輸入學期名稱'
    if (!draft.startDate) e.startDate = '請選擇開始日期'
    if (!draft.endDate) e.endDate = '請選擇結束日期'
    if (draft.startDate && draft.endDate && draft.startDate >= draft.endDate)
      e.endDate = '結束日期必須晚於開始日期'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  return (
    <Card className="space-y-5">
      <h2 className="text-lg font-bold text-[var(--text)]">學期資訊</h2>
      <Input
        label="學期名稱"
        placeholder="例：2025 上學期"
        required
        value={draft.name}
        onChange={(e) => onChange({ ...draft, name: e.target.value })}
        error={errors.name}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="開始日期"
          type="date"
          required
          value={draft.startDate}
          onChange={(e) => onChange({ ...draft, startDate: e.target.value })}
          error={errors.startDate}
        />
        <Input
          label="結束日期"
          type="date"
          required
          value={draft.endDate}
          onChange={(e) => onChange({ ...draft, endDate: e.target.value })}
          error={errors.endDate}
        />
      </div>
      <Select
        label="時區"
        value={draft.timezone}
        onChange={(e) => onChange({ ...draft, timezone: (e as React.ChangeEvent<HTMLSelectElement>).target.value })}
      >
        <option value="Asia/Taipei">台灣 (UTC+8)</option>
        <option value="Asia/Tokyo">日本 (UTC+9)</option>
        <option value="America/New_York">美東 (UTC-5)</option>
        <option value="Europe/London">倫敦 (UTC+0)</option>
      </Select>
      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onBack}>← 上一步</Button>
        <Button fullWidth onClick={() => { if (validate()) onNext() }}>下一步 →</Button>
      </div>
    </Card>
  )
}

const COLOR_OPTIONS: { value: CourseColor; label: string; hex: string }[] = [
  { value: 'lavender', label: '薰衣草', hex: '#C4BAF5' },
  { value: 'mint', label: '薄荷', hex: '#BCEBD8' },
  { value: 'peach', label: '蜜桃', hex: '#FFD6C8' },
  { value: 'yellow', label: '陽光', hex: '#FFE9A6' },
  { value: 'sky', label: '天藍', hex: '#B3D9FF' },
  { value: 'rose', label: '玫瑰', hex: '#FFBDCA' },
]

function CoursesStep({
  drafts,
  onChange,
  onNext,
  onBack,
  saving,
  saveError,
}: {
  drafts: CourseDraft[]
  onChange: (d: CourseDraft[]) => void
  onNext: () => void
  onBack: () => void
  saving: boolean
  saveError: string
}) {
  function addCourse() {
    const nextColor = COLOR_OPTIONS[drafts.length % COLOR_OPTIONS.length].value
    onChange([
      ...drafts,
      { clientId: uuid(), title: '', color: nextColor, icon: DEFAULT_COURSE_ICON },
    ])
  }

  function removeCourse(i: number) {
    onChange(drafts.filter((_, idx) => idx !== i))
  }

  return (
    <Card className="space-y-5">
      <h2 className="text-lg font-bold text-[var(--text)]">新增課程</h2>
      <p className="text-sm text-[var(--muted)]">輸入課程名稱，之後可以在學期管理頁面繼續補充。</p>
      <div className="space-y-3">
        {drafts.map((course, i) => (
          <div key={course.clientId} className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
            {/* Color dot */}
            <div className="flex gap-1 shrink-0">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => {
                    const updated = [...drafts]
                    updated[i] = { ...updated[i], color: c.value }
                    onChange(updated)
                  }}
                  aria-label={c.label}
                  className={`w-5 h-5 rounded-full border-2 transition-all ${course.color === c.value ? 'border-[var(--text)] scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
            <select
              aria-label={`課程 ${i + 1} 圖示`}
              value={course.icon}
              onChange={(event) => {
                const updated = [...drafts]
                updated[i] = { ...updated[i], icon: event.target.value as CourseIcon }
                onChange(updated)
              }}
              className="h-10 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] px-2 text-sm text-[var(--text)]"
            >
              {Object.entries(COURSE_ICONS).map(([value, option]) => (
                <option key={value} value={value}>{option.emoji} {option.label}</option>
              ))}
            </select>
            <Input
              placeholder={`課程 ${i + 1}，例：微積分`}
              value={course.title}
              onChange={(e) => {
                const updated = [...drafts]
                updated[i] = { ...updated[i], title: e.target.value }
                onChange(updated)
              }}
              className="flex-1"
            />
            {drafts.length > 1 && (
              <button
                type="button"
                onClick={() => removeCourse(i)}
                aria-label="移除課程"
                className="text-[var(--muted)] hover:text-[var(--danger)] transition-colors p-1"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
      {saveError && (
        <p role="alert" className="rounded-[var(--radius-control)] bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">
          {saveError}
        </p>
      )}
      <Button variant="ghost" size="sm" onClick={addCourse}>＋ 再加一門課</Button>
      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onBack} disabled={saving}>← 上一步</Button>
        <Button fullWidth onClick={onNext} loading={saving}>完成設定 →</Button>
      </div>
    </Card>
  )
}

function DoneStep({ onFinish }: { onFinish: () => void }) {
  return (
    <Card className="text-center space-y-6">
      <MochiAvatar mood="celebrating" size="lg" className="mx-auto" />
      <div>
        <h2 className="text-xl font-bold text-[var(--text)] mb-2">設定完成！🎉</h2>
        <p className="text-[var(--muted)]">
          Mochi 已記下你的學期和課程。接下來到儀表板查看，或繼續在學期管理頁面補充課程細節！
        </p>
      </div>
      <Button onClick={onFinish} fullWidth>進入儀表板 →</Button>
    </Card>
  )
}
