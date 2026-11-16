import { MochiAvatar } from '@/components/mascot/MochiAvatar'
import { Button } from '@/components/ui/Button'
import { ROUTES } from '@/lib/routes'
import { Link } from 'react-router-dom'

const features = [
  { icon: '📅', title: '智慧學習計畫', desc: '根據你的課綱、考試日程與可用時間，自動生成個人化讀書計畫。' },
  { icon: '📝', title: '課程筆記管理', desc: '撰寫 Markdown 筆記，AI 協助整理重點，所有內容都有來源標記。' },
  { icon: '🧪', title: '練習測驗', desc: '依課程、主題、難度生成測驗，錯誤自動記入錯題本。' },
  { icon: '📊', title: '學習進度追蹤', desc: '清楚看到每門課的進度、弱點分析，以及 Mochi 的陪伴鼓勵。' },
]

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 md:px-12 py-4 border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-sm font-bold">
            A+
          </div>
          <span className="font-bold text-[var(--text)] text-lg">A+ Monster</span>
        </div>
        <Link to={ROUTES.app}>
          <Button variant="secondary" size="sm">開始使用</Button>
        </Link>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="flex flex-col items-center justify-center gap-8 px-6 py-16 md:py-24 text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-[var(--primary-soft)] rounded-full blur-3xl opacity-40 scale-150" aria-hidden="true" />
            <MochiAvatar mood="happy" size="xl" className="relative z-10" />
          </div>

          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold text-[var(--text)] mb-4 leading-tight">
              讓 <span className="text-[var(--primary)]">Mochi</span> 陪你拚高分
            </h1>
            <p className="text-lg text-[var(--muted)] mb-8 leading-relaxed">
              A+ Monster 是你的 AI 讀書夥伴。輸入課程資訊，自動規劃讀書進度、生成練習題、追蹤學習弱點，全程透明可控。
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to={ROUTES.onboarding}>
                <Button size="lg">立即開始設定 →</Button>
              </Link>
              <Link to={ROUTES.app}>
                <Button size="lg" variant="outline">直接進入儀表板</Button>
              </Link>
            </div>
          </div>

          {/* Demo mode notice */}
          <div className="bg-[var(--yellow)] border border-[#D4B800]/30 rounded-[var(--radius-control)] px-4 py-3 text-sm text-[#7A6000] max-w-md">
            <strong>📱 目前為本機示範模式：</strong>資料存於瀏覽器，不會上傳雲端，重裝或清除瀏覽器資料後將遺失。
          </div>
        </section>

        {/* Features */}
        <section className="px-6 md:px-12 py-16 max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-[var(--text)] mb-10">功能一覽</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-card)] p-5 shadow-[var(--shadow-card)]"
              >
                <span className="text-3xl" aria-hidden="true">{f.icon}</span>
                <h3 className="font-semibold text-[var(--text)] mt-3 mb-2">{f.title}</h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[var(--primary-soft)] px-6 py-16 text-center">
          <MochiAvatar mood="studying" size="md" className="mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-[var(--text)] mb-4">準備好了嗎？</h2>
          <p className="text-[var(--muted)] mb-8">Mochi 等你一起衝刺！</p>
          <Link to={ROUTES.onboarding}>
            <Button size="lg">開始設定學期課程 →</Button>
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="px-6 py-6 text-center text-xs text-[var(--muted)] border-t border-[var(--border)]">
        A+ Monster · 學習是目標，A+ 是努力的結果，不是保證。
      </footer>
    </div>
  )
}
