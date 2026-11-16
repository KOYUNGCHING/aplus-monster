import { MochiAvatar } from '@/components/mascot/MochiAvatar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { isSupabaseConfigured } from '@/lib/supabase'
import { ROUTES } from '@/lib/routes'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signInWithEmail, signUpWithEmail } from './hooks/useAuth'

type Mode = 'login' | 'register'

export function LoginPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!email.trim() || !password) { setError('請填寫信箱和密碼'); return }
    if (password.length < 8) { setError('密碼至少 8 個字元'); return }
    setLoading(true)
    try {
      if (mode === 'login') {
        await signInWithEmail(email.trim(), password)
        navigate(ROUTES.app)
      } else {
        await signUpWithEmail(email.trim(), password, displayName.trim())
        setSuccess('註冊成功！請查看信箱完成驗證，然後再登入。')
        setMode('login')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失敗，請再試一次')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <MochiAvatar mood="happy" size="lg" className="mb-4" />
          <h1 className="text-2xl font-bold text-[var(--text)]">A+ Monster</h1>
          <p className="text-sm text-[var(--muted)] mt-1">你的 AI 讀書夥伴</p>
        </div>

        {!isSupabaseConfigured && (
          <div className="bg-[var(--yellow)] border border-[#D4B800]/30 rounded-[var(--radius-control)] p-3 text-sm text-[#7A6000] mb-6">
            <strong>📱 本機示範模式：</strong>Supabase 尚未設定，直接進入本機模式使用。
            <div className="mt-2">
              <Link to={ROUTES.app}>
                <Button size="sm" fullWidth>直接進入（示範模式）</Button>
              </Link>
            </div>
          </div>
        )}

        {isSupabaseConfigured && (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-card)] p-6 shadow-[var(--shadow-card)]">
            <div className="flex gap-1 mb-6 bg-[var(--bg)] rounded-[var(--radius-control)] p-1">
              {(['login', 'register'] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(''); setSuccess('') }}
                  className={`flex-1 py-2 text-sm font-medium rounded-[calc(var(--radius-control)-4px)] transition-colors ${
                    mode === m
                      ? 'bg-[var(--surface)] text-[var(--primary)] shadow-sm'
                      : 'text-[var(--muted)] hover:text-[var(--text)]'
                  }`}
                >
                  {m === 'login' ? '登入' : '註冊'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {mode === 'register' && (
                <Input
                  label="顯示名稱（選填）"
                  placeholder="Mochi"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              )}
              <Input
                label="電子信箱"
                type="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                label="密碼"
                type="password"
                placeholder={mode === 'register' ? '至少 8 個字元' : ''}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {error && <p role="alert" className="text-sm text-[var(--danger)]">{error}</p>}
              {success && <p role="status" className="text-sm text-[var(--success)]">{success}</p>}

              <Button type="submit" fullWidth loading={loading}>
                {mode === 'login' ? '登入' : '建立帳號'}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Link to={ROUTES.app} className="text-xs text-[var(--muted)] hover:text-[var(--primary)]">
                先用本機示範模式看看 →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
