import { MochiAvatar } from '@/components/mascot/MochiAvatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input, Select } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { ROUTES } from '@/lib/routes'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

type Step = 'welcome' | 'semester' | 'courses' | 'availability' | 'done'

export function OnboardingPage() {
  const [step, setStep] = useState<Step>('welcome')
  const navigate = useNavigate()

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="設定學期" description="讓 Mochi 認識你的課程，才能幫你規劃計畫" />

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {(['welcome', 'semester', 'courses', 'availability', 'done'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step === s
                  ? 'bg-[var(--primary)] text-white'
                  : ['welcome', 'semester', 'courses', 'availability', 'done'].indexOf(s) <
                    ['welcome', 'semester', 'courses', 'availability', 'done'].indexOf(step)
                  ? 'bg-[var(--mint)] text-[#2A7A5A]'
                  : 'bg-[var(--border)] text-[var(--muted)]'
              }`}
            >
              {i + 1}
            </div>
            {i < 4 && <div className="flex-1 h-0.5 bg-[var(--border)] w-6" />}
          </div>
        ))}
      </div>

      {step === 'welcome' && <WelcomeStep onNext={() => setStep('semester')} />}
      {step === 'semester' && <SemesterStep onNext={() => setStep('courses')} onBack={() => setStep('welcome')} />}
      {step === 'courses' && <CoursesStep onNext={() => setStep('availability')} onBack={() => setStep('semester')} />}
      {step === 'availability' && <AvailabilityStep onNext={() => setStep('done')} onBack={() => setStep('courses')} />}
      {step === 'done' && <DoneStep onFinish={() => navigate(ROUTES.app)} />}
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

function SemesterStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [form, setForm] = useState({ name: '', startDate: '', endDate: '', timezone: 'Asia/Taipei' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = '請輸入學期名稱'
    if (!form.startDate) e.startDate = '請選擇開始日期'
    if (!form.endDate) e.endDate = '請選擇結束日期'
    if (form.startDate && form.endDate && form.startDate >= form.endDate) e.endDate = '結束日期必須晚於開始日期'
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
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        error={errors.name}
      />
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
      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onBack}>← 上一步</Button>
        <Button
          fullWidth
          onClick={() => {
            if (validate()) onNext()
          }}
        >
          下一步 →
        </Button>
      </div>
    </Card>
  )
}

function CoursesStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  return (
    <Card className="space-y-5">
      <h2 className="text-lg font-bold text-[var(--text)]">新增課程</h2>
      <p className="text-sm text-[var(--muted)]">
        課程管理在「學期」頁面完整提供，這裡先跳過，之後隨時可以新增。
      </p>
      <div className="bg-[var(--primary-soft)] rounded-[var(--radius-control)] p-4 text-sm text-[var(--primary)]">
        💡 建議：進入儀表板後，到「學期」頁面新增課程，並設定課綱、考試日期。
      </div>
      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onBack}>← 上一步</Button>
        <Button fullWidth onClick={onNext}>下一步 →</Button>
      </div>
    </Card>
  )
}

function AvailabilityStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [weeklyHours, setWeeklyHours] = useState('15')

  return (
    <Card className="space-y-5">
      <h2 className="text-lg font-bold text-[var(--text)]">每週可用時數</h2>
      <p className="text-sm text-[var(--muted)]">AI 會用這個數字規劃讀書進度，你之後還可以調整。</p>
      <Input
        label="每週可讀書時數（小時）"
        type="number"
        min="1"
        max="80"
        required
        value={weeklyHours}
        onChange={(e) => setWeeklyHours(e.target.value)}
        hint="包含上課時間以外的自習時間"
      />
      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onBack}>← 上一步</Button>
        <Button fullWidth onClick={onNext}>完成設定 →</Button>
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
          Mochi 已經記下你的設定。接下來到儀表板新增課程，就能開始規劃讀書計畫了！
        </p>
      </div>
      <Button onClick={onFinish} fullWidth>進入儀表板 →</Button>
    </Card>
  )
}
