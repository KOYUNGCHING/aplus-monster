import { MochiAvatar } from '@/components/mascot/MochiAvatar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'

export function TutorPage() {
  return (
    <div className="max-w-3xl mx-auto flex flex-col h-full">
      <PageHeader
        title="AI 導師"
        description="有任何課業問題，都可以問 Mochi"
        actions={<Badge variant="warning">需要 AI 設定</Badge>}
      />

      {/* Chat area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 py-16 text-center">
        <MochiAvatar mood="thinking" size="lg" />
        <p className="text-[var(--muted)] max-w-sm">
          AI 導師功能需要設定 NVIDIA API，將在 Phase 3 啟用。<br />
          屆時你可以選擇課程脈絡，向 Mochi 提問。
        </p>
        <div className="bg-[var(--yellow)] rounded-[var(--radius-control)] px-4 py-3 text-sm text-[#7A6000] text-left max-w-sm">
          <strong>即將開放：</strong>AI 功能將透過安全後端呼叫，API 金鑰不會暴露在瀏覽器。
        </div>
      </div>

      {/* Input (disabled until AI ready) */}
      <div className="flex gap-2 pt-4 border-t border-[var(--border)]">
        <Input
          placeholder="AI 導師功能即將開放…"
          disabled
          className="flex-1"
        />
        <Button disabled>送出</Button>
      </div>
    </div>
  )
}
