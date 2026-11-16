import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { useAuthContext } from '@/features/auth/AuthContext'
import { signOut } from '@/features/auth/hooks/useAuth'
import { isSupabaseConfigured } from '@/lib/supabase'
import { ROUTES } from '@/lib/routes'
import { exportAllData, downloadJSON } from './services/exportLocalDemoData'
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

export function SettingsPage() {
  const { user, mode } = useAuthContext()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportDone, setExportDone] = useState(false)
  const [exportError, setExportError] = useState('')
  const [clearConfirm, setClearConfirm] = useState(false)
  const [clearing, setClearing] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    await signOut()
    navigate(ROUTES.login)
  }

  async function handleExport() {
    setExporting(true)
    setExportError('')
    setExportDone(false)
    try {
      const data = await exportAllData()
      downloadJSON(data)
      setExportDone(true)
      setTimeout(() => setExportDone(false), 3000)
    } catch (err) {
      setExportError(err instanceof Error ? err.message : '匯出失敗')
    } finally {
      setExporting(false)
    }
  }

  async function handleClearData() {
    setClearing(true)
    try {
      // Clear IndexedDB by deleting and recreating the database
      await new Promise<void>((resolve, reject) => {
        const req = indexedDB.deleteDatabase('aplus-monster')
        req.onsuccess = () => resolve()
        req.onerror = () => reject(new Error('清除失敗'))
      })
      // Reload to reinitialize DB
      window.location.reload()
    } catch {
      setClearing(false)
      setClearConfirm(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader title="設定" description="帳號、偏好與資料管理" />

      {/* Demo mode notice */}
      {mode === 'local-demo' && (
        <div className="bg-[var(--yellow)] border border-[#D4B800]/30 rounded-[var(--radius-control)] px-4 py-3 text-sm text-[#7A6000]">
          <strong>📱 本機示範模式：</strong>目前資料儲存在瀏覽器本地端，不會上傳雲端。
          設定 Supabase 後可啟用雲端帳號同步。
        </div>
      )}

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle>帳號</CardTitle>
          <Badge variant={mode === 'cloud' ? 'success' : 'warning'}>
            {mode === 'cloud' ? '☁️ 雲端' : '📱 本機'}
          </Badge>
        </CardHeader>
        <div className="space-y-4">
          {user && mode === 'cloud' ? (
            <>
              <Input label="電子信箱" value={user.email ?? ''} disabled hint="信箱無法在此修改" />
              <Input label="顯示名稱" value={user.displayName ?? ''} disabled hint="顯示名稱修改功能即將開放" />
              <Button variant="danger" size="sm" loading={signingOut} onClick={() => void handleSignOut()}>
                登出
              </Button>
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-[var(--muted)]">
                {isSupabaseConfigured
                  ? '目前未登入。登入後資料可跨裝置同步。'
                  : 'Supabase 尚未設定，目前使用本機示範模式。'}
              </p>
              {isSupabaseConfigured && (
                <Link to={ROUTES.login}><Button size="sm">登入 / 註冊</Button></Link>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Data export */}
      <Card>
        <CardHeader>
          <CardTitle>資料匯出</CardTitle>
          <Badge variant="default">JSON</Badge>
        </CardHeader>
        <div className="space-y-3">
          <p className="text-sm text-[var(--muted)]">
            下載所有學期、課程、筆記、測驗記錄為 JSON 檔案，可用於備份或遷移。
          </p>
          {exportError && <p role="alert" className="text-sm text-[var(--danger)]">{exportError}</p>}
          {exportDone && <p role="status" className="text-sm text-[var(--success)]">✓ 已下載匯出檔案</p>}
          <Button
            variant="outline"
            size="sm"
            loading={exporting}
            onClick={() => void handleExport()}
          >
            📥 匯出所有資料
          </Button>
        </div>
      </Card>

      {/* Data deletion */}
      <Card>
        <CardHeader>
          <CardTitle>清除本機資料</CardTitle>
          <Badge variant="danger">危險操作</Badge>
        </CardHeader>
        <div className="space-y-3">
          <p className="text-sm text-[var(--muted)]">
            刪除瀏覽器中所有的 A+ Monster 資料。此動作無法還原，建議先匯出備份。
          </p>
          {!clearConfirm ? (
            <Button variant="danger" size="sm" onClick={() => setClearConfirm(true)}>
              🗑 清除所有本機資料
            </Button>
          ) : (
            <div className="bg-[var(--danger-soft)] border border-[var(--danger)]/30 rounded-[var(--radius-control)] p-4 space-y-3">
              <p className="text-sm font-medium text-[var(--danger)]">確定要清除所有資料嗎？此動作無法還原。</p>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" onClick={() => setClearConfirm(false)} disabled={clearing}>取消</Button>
                <Button variant="danger" size="sm" loading={clearing} onClick={() => void handleClearData()}>
                  確認清除
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* AI */}
      <Card>
        <CardHeader>
          <CardTitle>AI 功能</CardTitle>
          <Badge variant={isSupabaseConfigured ? 'success' : 'default'}>
            {isSupabaseConfigured ? '已設定' : '未設定'}
          </Badge>
        </CardHeader>
        <div className="text-sm text-[var(--muted)] space-y-2">
          <p>AI 功能需要 Supabase 和 NVIDIA API Key，透過安全後端呼叫，不會暴露在瀏覽器。</p>
          <p>設定方式：複製 <code className="bg-[var(--border)] px-1 rounded text-xs">.env.example</code> 為 <code className="bg-[var(--border)] px-1 rounded text-xs">.env.local</code>，填入正確的值。</p>
          <p className="pt-1 text-xs border-t border-[var(--border)] mt-2">
            AI 請求會將選定的課程內容傳送給 NVIDIA 托管的模型服務。使用 AI 功能即表示你同意此資料傳輸。
          </p>
        </div>
      </Card>

      {/* About */}
      <Card>
        <CardHeader><CardTitle>關於 A+ Monster</CardTitle></CardHeader>
        <div className="space-y-1 text-sm text-[var(--muted)]">
          <p>版本：0.5.0（P1–P5 完成）</p>
          <p>A+ 是目標，不是保證。學習是你的，Mochi 只是陪伴。</p>
        </div>
      </Card>
    </div>
  )
}
