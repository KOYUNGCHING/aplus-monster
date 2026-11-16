import { Card } from '@/components/ui/Card'
import type { MascotProgress, MochiMood } from '@/types'
import { MochiAvatar } from './MochiAvatar'

interface MochiWidgetProps {
  mood?: MochiMood
  message?: string
  progress?: MascotProgress
}

export function MochiWidget({
  mood = 'default',
  message = '今天也一起加油吧！',
  progress,
}: MochiWidgetProps) {
  const level = progress?.level ?? 1
  const xp = progress?.xp ?? 0
  const xpForNext = level * 100
  const xpPercent = Math.min((xp % xpForNext) / xpForNext * 100, 100)

  return (
    <Card className="flex flex-col items-center gap-3 text-center">
      <MochiAvatar mood={mood} size="md" />
      <p className="text-sm text-[var(--text)] font-medium leading-snug max-w-[180px]">
        {message}
      </p>
      {progress && (
        <div className="w-full">
          <div className="flex justify-between text-xs text-[var(--muted)] mb-1">
            <span>Lv. {level}</span>
            <span>{xp % xpForNext} / {xpForNext} XP</span>
          </div>
          <div
            className="w-full h-2 bg-[var(--border)] rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={Math.round(xpPercent)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Mochi 經驗值 ${Math.round(xpPercent)}%`}
          >
            <div
              className="h-full bg-[var(--primary)] rounded-full transition-all duration-500"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>
      )}
    </Card>
  )
}
