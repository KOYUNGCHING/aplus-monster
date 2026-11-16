import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { useState } from 'react'
import { downloadLocalDemoData } from './services/exportLocalDemoData'

export function SettingsPage() {
  const [exporting, setExporting] = useState(false)
  const [exportMessage, setExportMessage] = useState('')

  async function handleExport() {
    setExporting(true)
    setExportMessage('')
    try {
      await downloadLocalDemoData()
      setExportMessage('備份檔已下載。請妥善保存，檔案可能包含你的學習內容。')
    } catch (error) {
      setExportMessage(error instanceof Error ? error.message : '匯出失敗，請再試一次。')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader title="設定" description="帳號、偏好與資料管理" />

      {/* Demo mode notice */}
      <div className="bg-[var(--yellow)] border border-[#D4B800]/30 rounded-[var(--radius-control)] px-4 py-3 text-sm text-[#7A6000]">
        <strong>📱 本機示範模式：</strong>目前資料只儲存在這台裝置的瀏覽器 IndexedDB，不會上傳或同步雲端。清除瀏覽器資料前請先匯出備份。Phase 4 規劃支援 Supabase 雲端帳號同步。
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>個人資料</CardTitle>
        </CardHeader>
        <div className="space-y-4">
          <Input label="顯示名稱" placeholder="本機模式尚未提供個人資料" disabled hint="雲端帳號功能將於 Phase 4 提供" />
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
          <Button variant="outline" size="sm" loading={exporting} onClick={handleExport}>
            匯出 JSON 備份
          </Button>
          {exportMessage && (
            <p aria-live="polite" className="text-sm text-[var(--muted)]">{exportMessage}</p>
          )}
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
          <p>版本：0.2.0（Phase 2 本機資料）</p>
          <p>目前狀態：M1 — IndexedDB、學期／課程管理與 Dashboard</p>
          <p className="pt-1">A+ 是目標，不是保證。學習是你的，Mochi 只是陪伴。</p>
        </div>
      </Card>
    </div>
  )
}
