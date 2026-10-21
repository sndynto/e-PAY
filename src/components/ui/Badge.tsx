import { type ReactNode } from 'react'
import { cn } from '@/lib/cn'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'accent' | 'muted'

interface BadgeProps {
  variant?: BadgeVariant
  children: ReactNode
  className?: string
  dot?: boolean
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'text-secondary border-border',
  success: 'text-success border-success/20',
  warning: 'text-warning border-warning/20',
  danger:  'text-danger  border-danger/20',
  accent:  'text-accent  border-accent/20',
  muted:   'text-secondary/50 border-border',
}

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-secondary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger:  'bg-danger',
  accent:  'bg-accent',
  muted:   'bg-secondary/40',
}

export function Badge({ variant = 'default', dot = false, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded',
        'text-xs font-medium border',
        variantClasses[variant],
        className,
      )}
    >
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0 pulse-dot', dotColors[variant])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  )
}
