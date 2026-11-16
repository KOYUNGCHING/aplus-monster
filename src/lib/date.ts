// Date helpers — no external date library required for MVP

function parseDate(dateStr: string): Date {
  // Date-only strings are otherwise interpreted as UTC and may display one day
  // early in negative UTC offsets. Treat course calendar dates as local dates.
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
    ? new Date(`${dateStr}T00:00:00`)
    : new Date(dateStr)
}

/**
 * Format a date string (YYYY-MM-DD or ISO) to zh-TW display format.
 * e.g. "2025-09-01" → "2025年9月1日"
 */
export function formatDate(dateStr: string, options?: Intl.DateTimeFormatOptions): string {
  const date = parseDate(dateStr)
  if (isNaN(date.getTime())) return dateStr
  return date.toLocaleDateString('zh-TW', options ?? { year: 'numeric', month: 'long', day: 'numeric' })
}

/**
 * Format an ISO timestamp to zh-TW date + time.
 */
export function formatDateTime(isoStr: string): string {
  const date = parseDate(isoStr)
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
  const target = parseDate(dateStr)
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
  const target = parseDate(dateStr)
  today.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}
