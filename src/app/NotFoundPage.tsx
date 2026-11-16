import { MochiAvatar } from '@/components/mascot/MochiAvatar'
import { Button } from '@/components/ui/Button'
import { ROUTES } from '@/lib/routes'
import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <main id="main-content" className="min-h-dvh bg-[var(--bg)] flex flex-col items-center justify-center gap-6 px-4 text-center">
      <MochiAvatar mood="thinking" size="lg" />
      <div>
        <h1 className="text-5xl font-bold text-[var(--primary)] mb-2">404</h1>
        <h2 className="text-xl font-semibold text-[var(--text)] mb-2">找不到頁面</h2>
        <p className="text-[var(--muted)]">這個頁面不存在，讓 Mochi 帶你回去吧！</p>
      </div>
      <Link to={ROUTES.app}>
        <Button>回到儀表板</Button>
      </Link>
    </main>
  )
}
