import { type ReactNode, useCallback, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Input, Textarea } from '@/components/ui/Input'
import { LoadingState } from '@/components/ui/LoadingState'
import { PageHeader } from '@/components/ui/PageHeader'
import { MochiAvatar } from '@/components/mascot/MochiAvatar'
import { useCourse } from '@/features/courses/hooks/useCourses'
import { useCreateNote, useDeleteNote, useNotesByCourse, useUpdateNote } from './hooks/useNotes'
import { summarizeNotes, AINotConfiguredError } from '@/lib/aiGateway'
import { isSupabaseConfigured } from '@/lib/supabase'
import type { Note } from '@/types'

// ─── Simple Markdown renderer ─────────────────────────────────────────────────

function renderInline(text: string): ReactNode[] {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={index} className="bg-[var(--primary-soft)] px-1 rounded text-[var(--primary)] text-sm font-mono">
          {part.slice(1, -1)}
        </code>
      )
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={index}>{part.slice(1, -1)}</em>
    }
    return part
  })
}

function MarkdownPreview({ markdown }: { markdown: string }) {
  const lines = markdown.split('\n')
  const blocks: ReactNode[] = []

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    if (line.startsWith('- ')) {
      const items: string[] = []
      while (index < lines.length && lines[index].startsWith('- ')) {
        items.push(lines[index].slice(2))
        index += 1
      }
      index -= 1
      blocks.push(
        <ul key={`list-${index}`} className="list-disc pl-5 my-2 space-y-1">
          {items.map((item, itemIndex) => (
            <li key={itemIndex} className="text-sm text-[var(--text)]">
              {renderInline(item)}
            </li>
          ))}
        </ul>,
      )
    } else if (line.startsWith('### ')) {
      blocks.push(<h3 key={index} className="text-base font-semibold mt-4 mb-1">{renderInline(line.slice(4))}</h3>)
    } else if (line.startsWith('## ')) {
      blocks.push(<h2 key={index} className="text-lg font-semibold mt-5 mb-1">{renderInline(line.slice(3))}</h2>)
    } else if (line.startsWith('# ')) {
      blocks.push(<h1 key={index} className="text-xl font-bold mt-6 mb-2">{renderInline(line.slice(2))}</h1>)
    } else if (line.trim()) {
      blocks.push(<p key={index} className="text-sm my-1 leading-relaxed">{renderInline(line)}</p>)
    } else {
      blocks.push(<div key={index} className="h-2" aria-hidden="true" />)
    }
  }

  return <div className="text-[var(--text)]">{blocks}</div>
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric', year: 'numeric' })
}

function parseTags(raw: string): string[] {
  return [...new Set(raw
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .map((t) => t.slice(0, 30)))]
    .slice(0, 12)
}

// ─── NoteEditor ───────────────────────────────────────────────────────────────

interface NoteEditorProps {
  courseId: string
  courseTitle: string
  note: Note | null  // null = create new
  onSaved: (note: Note) => void
  onDeleted: () => void
  onBack?: () => void  // mobile only
}

function NoteEditor({ courseId, courseTitle, note, onSaved, onDeleted, onBack }: NoteEditorProps) {
  const [tab, setTab] = useState<'edit' | 'preview'>('edit')
  const [title, setTitle] = useState(note?.title ?? '')
  const [bodyMd, setBodyMd] = useState(note?.bodyMd ?? '')
  const [tagsRaw, setTagsRaw] = useState(note?.tags.join(', ') ?? '')
  const [titleError, setTitleError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [aiSummaryOpen, setAiSummaryOpen] = useState(false)

  const createNote = useCreateNote()
  const updateNote = useUpdateNote()
  const deleteNote = useDeleteNote()

  const isNew = note === null
  const isSaving = createNote.isPending || updateNote.isPending

  function validate(): boolean {
    if (!title.trim()) {
      setTitleError('標題為必填')
      return false
    }
    if (title.trim().length > 100) {
      setTitleError('標題不得超過 100 字')
      return false
    }
    setTitleError('')
    return true
  }

  async function handleSave() {
    if (!validate()) return

    const tags = parseTags(tagsRaw)

    if (isNew) {
      const saved = await createNote.mutateAsync({ courseId, title, bodyMd, tags })
      onSaved(saved)
    } else {
      const saved = await updateNote.mutateAsync({ id: note.id, courseId, title, bodyMd, tags })
      onSaved(saved)
    }
  }

  async function handleDelete() {
    if (!note) return
    await deleteNote.mutateAsync({ id: note.id, courseId })
    setConfirmDelete(false)
    onDeleted()
  }

  const saveError = createNote.error ?? updateNote.error
  const deleteError = deleteNote.error

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)] shrink-0">
        {onBack && (
          <button
            onClick={onBack}
            className="text-[var(--muted)] hover:text-[var(--text)] mr-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded"
            aria-label="返回筆記列表"
          >
            ←
          </button>
        )}
        {/* Tab toggle */}
        <div
          role="tablist"
          aria-label="編輯或預覽"
          className="flex gap-1 bg-[var(--bg)] rounded-[var(--radius-control)] p-0.5 border border-[var(--border)]"
        >
          <button
            role="tab"
            aria-selected={tab === 'edit'}
            onClick={() => setTab('edit')}
            className={`px-3 py-1 text-sm rounded-[calc(var(--radius-control)-2px)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] ${
              tab === 'edit'
                ? 'bg-[var(--surface)] text-[var(--text)] font-medium shadow-sm'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            編輯
          </button>
          <button
            role="tab"
            aria-selected={tab === 'preview'}
            onClick={() => setTab('preview')}
            className={`px-3 py-1 text-sm rounded-[calc(var(--radius-control)-2px)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] ${
              tab === 'preview'
                ? 'bg-[var(--surface)] text-[var(--text)] font-medium shadow-sm'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            預覽
          </button>
        </div>

        <div className="flex-1" />

        {!isNew && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirmDelete(true)}
            className="text-[var(--danger)] hover:bg-[var(--danger-soft)] hover:text-[var(--danger)]"
            aria-label="刪除筆記"
          >
            🗑 刪除
          </Button>
        )}
        {isSupabaseConfigured && bodyMd.trim().length > 20 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAiSummaryOpen(true)}
            aria-label="AI 摘要"
          >
            ✨ AI 整理
          </Button>
        )}
      </div>
      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'edit' ? (
          <div className="flex flex-col gap-4">
            <Input
              label="標題"
              required
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (titleError) setTitleError('')
              }}
              error={titleError}
              placeholder="筆記標題…"
              maxLength={100}
            />

            <Textarea
              label="內容（Markdown）"
              value={bodyMd}
              onChange={(e) => setBodyMd(e.target.value)}
              placeholder="支援 **粗體**、*斜體*、`程式碼`、# 標題、- 清單…"
              className="min-h-[280px] font-mono text-sm"
            />

            <Input
              label="標籤"
              value={tagsRaw}
              onChange={(e) => setTagsRaw(e.target.value)}
              placeholder="用逗號分隔，例如：期中考, 重要, 第三章"
              hint="用逗號分隔多個標籤"
            />

            {saveError && (
              <p role="alert" className="text-sm text-[var(--danger)]">
                儲存失敗：{saveError instanceof Error ? saveError.message : '未知錯誤'}
              </p>
            )}

            <div className="flex justify-end">
              <Button onClick={handleSave} loading={isSaving} disabled={isSaving}>
                {isNew ? '建立筆記' : '儲存變更'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="prose-container">
            {title && (
              <h1 className="text-xl font-bold text-[var(--text)] mb-4 pb-2 border-b border-[var(--border)]">
                {title}
              </h1>
            )}
            {parseTags(tagsRaw).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {parseTags(tagsRaw).map((tag) => (
                  <Badge key={tag} variant="primary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            {bodyMd.trim() ? (
              <MarkdownPreview markdown={bodyMd} />
            ) : (
              <p className="text-sm text-[var(--muted)] italic">尚無內容</p>
            )}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-confirm-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
        >
          <div className="bg-[var(--surface)] rounded-[var(--radius-card)] p-6 shadow-xl max-w-sm w-full">
            <h2 id="delete-confirm-title" className="text-base font-semibold text-[var(--text)] mb-2">
              確認刪除
            </h2>
            <p className="text-sm text-[var(--muted)] mb-4">
              確定要刪除筆記「{note?.title}」嗎？此操作無法復原。
            </p>
            {deleteError && (
              <p role="alert" className="text-sm text-[var(--danger)] mb-3">
                刪除失敗：{deleteError instanceof Error ? deleteError.message : '未知錯誤'}
              </p>
            )}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmDelete(false)}
                disabled={deleteNote.isPending}
              >
                取消
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
                loading={deleteNote.isPending}
              >
                刪除
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* AI Summary Dialog */}
      <AISummaryDialog
        open={aiSummaryOpen}
        onClose={() => setAiSummaryOpen(false)}
        courseId={courseId}
        courseTitle={courseTitle}
        sourceBodyMd={bodyMd}
        onApply={(summaryMd) => {
          setBodyMd((prev) => prev + '\n\n---\n\n## ✨ AI 摘要\n\n' + summaryMd)
          setAiSummaryOpen(false)
        }}
      />
    </div>
  )
}

// ─── NoteListItem ─────────────────────────────────────────────────────────────

interface NoteListItemProps {
  note: Note
  selected: boolean
  onClick: () => void
}

function NoteListItem({ note, selected, onClick }: NoteListItemProps) {
  const preview = note.bodyMd.replace(/[#*`-]/g, '').trim().slice(0, 60)

  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      className={`w-full text-left px-4 py-3 rounded-[var(--radius-control)] border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] ${
        selected
          ? 'border-[var(--primary)] bg-[var(--primary-soft)]'
          : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)] hover:bg-[#FAF8FF]'
      }`}
    >
      <p className="text-sm font-medium text-[var(--text)] truncate">{note.title}</p>
      {preview && (
        <p className="text-xs text-[var(--muted)] mt-0.5 truncate">{preview}</p>
      )}
      <div className="flex items-center justify-between mt-1.5 gap-2">
        <div className="flex flex-wrap gap-1 overflow-hidden">
          {note.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="primary" className="text-[10px] px-1.5 py-0">
              {tag}
            </Badge>
          ))}
        </div>
        <span className="text-[10px] text-[var(--muted)] shrink-0">{formatDate(note.updatedAt)}</span>
      </div>
    </button>
  )
}

// ─── CourseNotesPage ──────────────────────────────────────────────────────────

export function CourseNotesPage() {
  const { courseId = '' } = useParams()

  const notesQuery = useNotesByCourse(courseId)
  const courseQuery = useCourse(courseId)
  const notes = notesQuery.data ?? []

  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  // Mobile: 'list' or 'editor'
  const [mobileView, setMobileView] = useState<'list' | 'editor'>('list')
  const [search, setSearch] = useState('')

  const selectedNote = selectedNoteId ? (notes.find((n) => n.id === selectedNoteId) ?? null) : null

  const filteredNotes = search.trim()
    ? notes.filter(
        (n) =>
          n.title.toLowerCase().includes(search.toLowerCase()) ||
          n.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())),
      )
    : notes

  function handleSelectNote(note: Note) {
    setSelectedNoteId(note.id)
    setIsCreating(false)
    setMobileView('editor')
  }

  function handleNewNote() {
    setSelectedNoteId(null)
    setIsCreating(true)
    setMobileView('editor')
  }

  const handleSaved = useCallback(
    (note: Note) => {
      setSelectedNoteId(note.id)
      setIsCreating(false)
    },
    [],
  )

  const handleDeleted = useCallback(() => {
    setSelectedNoteId(null)
    setIsCreating(false)
    setMobileView('list')
  }, [])

  const showEditor = isCreating || selectedNoteId !== null
  const editorNote = isCreating ? null : selectedNote

  if (notesQuery.isLoading || courseQuery.isLoading) return <LoadingState message="載入筆記中…" />
  if (notesQuery.isError || courseQuery.isError) {
    return <ErrorState message="無法載入筆記" onRetry={() => { notesQuery.refetch(); courseQuery.refetch() }} />
  }
  if (!courseQuery.data) return <ErrorState title="找不到課程" message="這門課程可能已被刪除。" />

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="課程筆記"
        description={`${courseQuery.data.title} · 在此撰寫、管理你的 Markdown 筆記`}
      />

      {/* Two-panel layout */}
      <div className="flex flex-1 gap-4 min-h-0">

        {/* Left panel: note list */}
        <div
          className={`flex flex-col bg-[var(--surface)] rounded-[var(--radius-card)] border border-[var(--border)] overflow-hidden
            md:flex md:w-1/3
            ${mobileView === 'editor' ? 'hidden' : 'flex w-full'}`}
        >
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] shrink-0">
            <span className="text-sm font-semibold text-[var(--text)]">
              所有筆記 {notes.length > 0 && <span className="text-[var(--muted)] font-normal">({notes.length})</span>}
            </span>
            <Button size="sm" variant="primary" onClick={handleNewNote} aria-label="新增筆記">
              ＋ 新增筆記
            </Button>
          </div>

          {/* Search */}
          <div className="px-3 py-2 border-b border-[var(--border)] shrink-0">
            <Input
              placeholder="搜尋標題或標籤…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="搜尋筆記"
            />
          </div>

          {/* Note list */}
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            {filteredNotes.length === 0 ? (
              search.trim() ? (
                <EmptyState icon="🔍" title="找不到符合的筆記" />
              ) : (
                <EmptyState
                  icon="📝"
                  title="尚無筆記"
                  description="點擊「＋ 新增筆記」開始記錄"
                  action={{ label: '＋ 新增筆記', onClick: handleNewNote }}
                />
              )
            ) : (
              filteredNotes.map((note) => (
                <NoteListItem
                  key={note.id}
                  note={note}
                  selected={note.id === selectedNoteId && !isCreating}
                  onClick={() => handleSelectNote(note)}
                />
              ))
            )}
          </div>
        </div>

        {/* Right panel: editor/viewer */}
        <div
          className={`flex flex-col bg-[var(--surface)] rounded-[var(--radius-card)] border border-[var(--border)] overflow-hidden
            md:flex md:flex-1
            ${mobileView === 'list' ? 'hidden' : 'flex w-full'}`}
        >
          {showEditor ? (
            <NoteEditor
              key={isCreating ? 'new-note' : editorNote?.id}
              courseId={courseId}
              courseTitle={courseQuery.data.title}
              note={editorNote}
              onSaved={handleSaved}
              onDeleted={handleDeleted}
              onBack={mobileView === 'editor' ? () => setMobileView('list') : undefined}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <span className="text-4xl" aria-hidden="true">📋</span>
                <p className="text-sm text-[var(--muted)] mt-3">選擇左側筆記或新增一篇</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

// ─── AI Summary Dialog ────────────────────────────────────────────────────────

interface AISummaryDialogProps {
  open: boolean
  onClose: () => void
  courseId: string
  courseTitle: string
  sourceBodyMd: string
  onApply: (summaryMd: string) => void
}

function AISummaryDialog({ open, onClose, courseTitle, sourceBodyMd, onApply }: AISummaryDialogProps) {
  const [result, setResult] = useState<{ title: string; bodyMd: string; keyPoints: string[] } | null>(null)
  const [step, setStep] = useState<'idle' | 'loading' | 'review' | 'done'>('idle')
  const [aiError, setAiError] = useState('')

  function handleClose() {
    setResult(null)
    setStep('idle')
    setAiError('')
    onClose()
  }

  async function handleGenerate() {
    setAiError('')
    setStep('loading')
    try {
      const res = await summarizeNotes({ courseTitle, noteContent: sourceBodyMd })
      setResult(res.draft)
      setStep('review')
    } catch (err) {
      setAiError(
        err instanceof AINotConfiguredError
          ? 'AI 功能需要設定 Supabase 和 NVIDIA API。'
          : err instanceof Error ? err.message : 'AI 服務暫時無法使用'
      )
      setStep('idle')
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} title="✨ AI 整理筆記">
      {step === 'idle' && (
        <div className="space-y-4">
          <p className="text-sm text-[var(--muted)]">
            AI 會根據你的筆記內容整理出重點摘要。摘要標記為「AI 建議」，確認後才會加入筆記。
          </p>
          <div className="bg-[var(--border)] rounded-[var(--radius-control)] p-3 text-sm text-[var(--muted)]">
            <p className="font-medium text-[var(--text)] mb-1">筆記內容預覽（前 200 字）</p>
            <p className="line-clamp-4">{sourceBodyMd.slice(0, 200)}</p>
          </div>
          {aiError && <p role="alert" className="text-sm text-[var(--danger)]">{aiError}</p>}
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose} fullWidth>取消</Button>
            <Button fullWidth onClick={() => void handleGenerate()}>開始整理</Button>
          </div>
        </div>
      )}
      {step === 'loading' && (
        <div className="flex flex-col items-center gap-4 py-8">
          <MochiAvatar mood="thinking" size="md" />
          <p className="text-sm text-[var(--muted)]">Mochi 正在整理中…</p>
        </div>
      )}
      {step === 'review' && result && (
        <div className="space-y-4">
          <div className="border border-[var(--border)] rounded-[var(--radius-control)] p-4 max-h-64 overflow-y-auto">
            <p className="font-semibold text-[var(--text)] mb-2">{result.title}</p>
            <div className="text-sm text-[var(--muted)] whitespace-pre-wrap">{result.bodyMd}</div>
            {result.keyPoints.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-[var(--text)] mb-1">重點：</p>
                <ul className="list-disc pl-4 space-y-0.5 text-xs text-[var(--muted)]">
                  {result.keyPoints.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </div>
            )}
          </div>
          <div className="bg-[var(--yellow)] rounded-[var(--radius-control)] p-2 text-xs text-[#7A6000]">
            ✨ AI 建議 — 請確認內容正確後再套用
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep('idle')} fullWidth>重新整理</Button>
            <Button fullWidth onClick={() => { onApply(result.bodyMd); setStep('done') }}>
              ✓ 加入筆記
            </Button>
          </div>
        </div>
      )}
      {step === 'done' && (
        <div className="text-center space-y-4">
          <MochiAvatar mood="celebrating" size="lg" className="mx-auto" />
          <p className="font-semibold text-[var(--text)]">摘要已加入筆記！</p>
          <Button fullWidth onClick={handleClose}>完成</Button>
        </div>
      )}
    </Dialog>
  )
}
