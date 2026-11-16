// Date helpers — no external date library required for MVP

/**
 * Format a date string (YYYY-MM-DD or ISO) to zh-TW display format.
 * e.g. "2025-09-01" → "2025年9月1日"
 */
export function formatDate(dateStr: string, options?: Intl.DateTimeFormatOptions): string {
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  return date.toLocaleDateString('zh-TW', options ?? { year: 'numeric', month: 'long', day: 'numeric' })
}

/**
 * Format an ISO timestamp to zh-TW date + time.
 */
export function formatDateTime(isoStr: string): string {
  const date = new Date(isoStr)
  if (isNaN(date.getTime())) return isoStr
  return date.toLocaleString('zh-TW', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

/**
 * Returns "今天", "明天", or formatted date.
 */
export function formatRelativeDate(dateStr: string): string {
  const today = new Date()
  const target = new Date(dateStr)
  today.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000)
  if (diff === 0) return '今天'
  if (diff === 1) return '明天'
  if (diff === -1) return '昨天'
  return formatDate(dateStr)
}

/**
 * Returns today as YYYY-MM-DD in local timezone.
 */
export function todayISO(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Days remaining until a due date.
 */
export function daysUntil(dateStr: string): number {
  const today = new Date()
  const target = new Date(dateStr)
  today.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}
