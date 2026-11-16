import { cn } from '@/lib/cn'
import type { HTMLAttributes } from 'react'

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'ai' | 'verified' | 'user'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-[var(--border)] text-[var(--muted)]',
  primary: 'bg-[var(--primary-soft)] text-[var(--primary)]',
  success: 'bg-[var(--success-soft)] text-[var(--success)]',
  warning: 'bg-[var(--yellow)] text-[#9A6B00]',
  danger: 'bg-[var(--danger-soft)] text-[var(--danger)]',
  ai: 'bg-[var(--primary-soft)] text-[var(--primary)]',
  verified: 'bg-[var(--mint)] text-[#2A7A5A]',
  user: 'bg-[var(--peach)] text-[#A0522D]',
}

export function Badge({ variant = 'default', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium leading-tight',
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}

/** Shows source provenance badge for AI grounding */
export function SourceBadge({ status }: { status: 'verified' | 'user_provided' | 'ai_suggested' }) {
  const map = {
    verified: { variant: 'verified' as const, label: '✓ 已確認' },
    user_provided: { variant: 'user' as const, label: '👤 使用者提供' },
    ai_suggested: { variant: 'ai' as const, label: '✨ AI 建議' },
  }
  const { variant, label } = map[status]
  return <Badge variant={variant}>{label}</Badge>
}
