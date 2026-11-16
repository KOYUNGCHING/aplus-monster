import type { CourseColor } from '@/types'

export const COURSE_COLORS: Record<CourseColor, { bg: string; text: string; border: string; label: string }> = {
  lavender: { bg: '#F0ECFF', text: '#6B5ED4', border: '#C4BAF5', label: '薰衣草' },
  mint:     { bg: '#E6FAF3', text: '#2A7A5A', border: '#BCEBD8', label: '薄荷' },
  peach:    { bg: '#FFF0EB', text: '#A0522D', border: '#FFD6C8', label: '蜜桃' },
  yellow:   { bg: '#FFF8DC', text: '#8A6400', border: '#FFE9A6', label: '陽光' },
  sky:      { bg: '#E8F4FF', text: '#1A6BA0', border: '#B3D9FF', label: '天藍' },
  rose:     { bg: '#FFF0F3', text: '#A0203A', border: '#FFBDCA', label: '玫瑰' },
}

export const DIFFICULTY_LABEL: Record<string, string> = {
  easy: '輕鬆',
  medium: '普通',
  hard: '挑戰',
}

export const DIFFICULTY_COLOR: Record<string, string> = {
  easy: '#2A7A5A',
  medium: '#8A6400',
  hard: '#C44459',
}
