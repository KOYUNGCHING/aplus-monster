import type { CourseIcon } from '@/types'

export const DEFAULT_COURSE_ICON: CourseIcon = 'book'

export const COURSE_ICONS: Record<CourseIcon, { emoji: string; label: string }> = {
  book: { emoji: '📚', label: '書本' },
  calculator: { emoji: '🧮', label: '計算' },
  flask: { emoji: '🧪', label: '實驗' },
  code: { emoji: '💻', label: '程式' },
  language: { emoji: '🗣️', label: '語言' },
  palette: { emoji: '🎨', label: '藝術' },
}

export function getCourseIcon(icon?: CourseIcon) {
  return COURSE_ICONS[icon ?? DEFAULT_COURSE_ICON]
}
