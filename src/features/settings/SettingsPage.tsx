import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'

export function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader title="設定" description="帳號、偏好與資料管理" />

      {/* Demo mode notice */}
      <div className="bg-[var(--yellow)] border border-[#D4B800]/30 rounded-[var(--radius-control)] px-4 py-3 text-sm text-[#7A6000]">
        <strong>📱 本機示範模式：</strong>目前資料儲存在瀏覽器本地端，不會上傳雲端。Phase 3 將支援 Supabase 雲端帳號同步。
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>個人資料</CardTitle>
        </CardHeader>
        <div className="space-y-4">
          <Input label="顯示名稱" placeholder="你的名字" />
          <Input label="電子信箱" placeholder="尚未登入" disabled hint="登入後可設定" />
          <Button variant="secondary" disabled>儲存（需登入）</Button>
        </div>
      </Card>

      {/* Data */}
      <Card>
        <CardHeader>
          <CardTitle>資料管理</CardTitle>
          <Badge variant="warning">本機模式</Badge>
        </CardHeader>
        <div className="space-y-3">
          <p className="text-sm text-[var(--muted)]">
            匯出功能可下載你所有的學期、課程、筆記、測驗記錄為 JSON 檔案。
          </p>
          <Button variant="outline" size="sm" disabled>匯出資料（即將開放）</Button>
          <div className="pt-2 border-t border-[var(--border)]">
            <p className="text-sm text-[var(--muted)] mb-3">刪除所有本地資料，此動作無法還原。</p>
            <Button variant="danger" size="sm" disabled>清除所有資料（即將開放）</Button>
          </div>
        </div>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle>關於 A+ Monster</CardTitle>
        </CardHeader>
        <div className="space-y-1 text-sm text-[var(--muted)]">
          <p>版本：0.1.0（Phase 1 骨架）</p>
          <p>目前狀態：P0 — 專案骨架與 UI 系統</p>
          <p className="pt-1">A+ 是目標，不是保證。學習是你的，Mochi 只是陪伴。</p>
        </div>
      </Card>
    </div>
  )
}
