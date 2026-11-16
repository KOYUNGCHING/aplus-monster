import { MochiAvatar } from '@/components/mascot/MochiAvatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAllCourses } from '@/features/courses/hooks/useCourses'
import { AINotConfiguredError, tutorReply, type TutorResponse } from '@/lib/aiGateway'
import { isSupabaseConfigured } from '@/lib/supabase'
import { cn } from '@/lib/cn'
import { useRef, useState } from 'react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  disclaimer?: string
  error?: boolean
}

export function TutorPage() {
  const { data: courses = [] } = useAllCourses()
  const [selectedCourseId, setSelectedCourseId] = useState<string>('')
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const selectedCourse = courses.find((c) => c.id === selectedCourseId)

  async function handleSend() {
    const question = input.trim()
    if (!question || loading) return

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: question }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const history = messages.slice(-6).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))
      const res: TutorResponse = await tutorReply({
        courseTitle: selectedCourse?.title ?? '未指定課程',
        question,
        conversationHistory: history,
      })
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: res.reply, disclaimer: res.disclaimer },
      ])
    } catch (err) {
      const isNotConfigured = err instanceof AINotConfiguredError
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: isNotConfigured
            ? 'AI 導師需要設定 Supabase 和 NVIDIA API 才能啟用。目前為本機示範模式，請參考 README 完成設定。'
            : (err instanceof Error ? err.message : 'AI 服務暫時無法使用，請稍後再試。'),
          error: true,
        },
      ])
    } finally {
      setLoading(false)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-var(--topbar-height)-3rem)] md:h-[calc(100vh-var(--topbar-height)-6rem)]">
      <PageHeader
        title="AI 導師"
        description="有任何課業問題，都可以問 Mochi"
        actions={
          !isSupabaseConfigured
            ? <Badge variant="warning">本機示範模式</Badge>
            : <Badge variant="success">AI 已連線</Badge>
        }
      />

      {/* Course selector */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setSelectedCourseId('')}
          className={cn(
            'px-3 py-1.5 rounded-full text-sm font-medium transition-colors border',
            !selectedCourseId
              ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
              : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--primary)] hover:text-[var(--primary)]',
          )}
        >
          一般問題
        </button>
        {courses.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCourseId(c.id)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium transition-colors border',
              selectedCourseId === c.id
                ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--primary)] hover:text-[var(--primary)]',
            )}
          >
            {c.title}
          </button>
        ))}
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <MochiAvatar mood="thinking" size="lg" />
            <p className="text-[var(--muted)] text-sm max-w-sm">
              {selectedCourse
                ? `你在問關於「${selectedCourse.title}」的問題，我會盡力幫你！`
                : '選擇一門課程來限定範圍，或直接問我任何學習問題。'}
            </p>
            {!isSupabaseConfigured && (
              <div className="bg-[var(--yellow)] rounded-[var(--radius-control)] px-4 py-3 text-sm text-[#7A6000] text-left max-w-sm">
                <strong>設定提醒：</strong>在 <code>.env.local</code> 加入 Supabase 設定，並部署 AI Gateway Edge Function，即可啟用真實 AI 回應。
              </div>
            )}
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn('flex gap-3', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
          >
            {msg.role === 'assistant' && (
              <div className="shrink-0 mt-1">
                <MochiAvatar mood={msg.error ? 'thinking' : 'happy'} size="sm" animate={false} />
              </div>
            )}
            <div className={cn('max-w-[80%] flex flex-col gap-1', msg.role === 'user' ? 'items-end' : 'items-start')}>
              <Card
                padding="sm"
                className={cn(
                  'text-sm leading-relaxed whitespace-pre-wrap',
                  msg.role === 'user'
                    ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                    : msg.error
                    ? 'bg-[var(--yellow)] border-[#D4B800]/30 text-[#7A6000]'
                    : '',
                )}
              >
                {msg.content}
              </Card>
              {msg.disclaimer && (
                <p className="text-xs text-[var(--muted)] px-1">{msg.disclaimer}</p>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <MochiAvatar mood="thinking" size="sm" animate={true} />
            <Card padding="sm" className="text-sm text-[var(--muted)]">
              Mochi 正在思考中…
            </Card>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 items-end border-t border-[var(--border)] pt-4">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isSupabaseConfigured ? '輸入問題（Enter 送出，Shift+Enter 換行）…' : 'AI 導師需要設定後才能使用…'}
          disabled={loading}
          rows={2}
          aria-label="問題輸入"
          className="flex-1 px-3 py-2 text-sm rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] placeholder:text-[var(--muted)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent disabled:opacity-50"
        />
        <Button
          onClick={() => void handleSend()}
          disabled={!input.trim() || loading}
          loading={loading}
          aria-label="送出問題"
        >
          送出
        </Button>
      </div>
    </div>
  )
}
