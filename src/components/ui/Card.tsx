import { type ReactNode, type HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'ghost' | 'accent'
  padding?: 'sm' | 'md' | 'lg' | 'none'
  interactive?: boolean   // hover + press micro-interactions for clickable cards
  children: ReactNode
}

const variantClasses = {
  default:  'bg-surface border border-border',
  elevated: 'bg-elevated border border-border',
  ghost:    'bg-transparent border border-border',
  accent:   'bg-accent/5 border border-accent/20',
}

const paddingClasses = {
  none: '',
  sm:   'p-3',
  md:   'p-4',
  lg:   'p-5',
}

export function Card({
  variant = 'default',
  padding = 'md',
  interactive = false,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl',
        variantClasses[variant],
        paddingClasses[padding],
        // Interactive micro-interactions: fast border + bg transition, subtle press
        interactive && [
          'cursor-pointer',
          'transition-[border-color,background-color,transform] duration-150',
          'hover:border-border/60 hover:bg-surface-hover',
          'active:scale-[0.995]',
        ],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-xs font-medium text-secondary/70 uppercase tracking-widest', className)}
      {...props}
    >
      {children}
    </h3>
  )
}
