import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: ReactNode
  iconRight?: ReactNode
  fullWidth?: boolean
}

// Micro-interaction: 150ms color/brightness, scale-98 on active press
const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-bg font-semibold ' +
    'hover:brightness-95 active:brightness-90 ' +
    'focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-1 focus-visible:ring-offset-bg',
  secondary:
    'bg-elevated text-primary font-medium border border-border ' +
    'hover:bg-elevated-hover hover:border-[#3a4238] ' +
    'focus-visible:ring-2 focus-visible:ring-border focus-visible:ring-offset-1 focus-visible:ring-offset-bg',
  ghost:
    'bg-transparent text-secondary font-medium ' +
    'hover:bg-elevated hover:text-primary ' +
    'focus-visible:ring-2 focus-visible:ring-border focus-visible:ring-offset-1 focus-visible:ring-offset-bg',
  danger:
    'bg-transparent text-danger font-medium border border-danger/25 ' +
    'hover:bg-danger/8 hover:border-danger/40 ' +
    'focus-visible:ring-2 focus-visible:ring-danger/30 focus-visible:ring-offset-1 focus-visible:ring-offset-bg',
  outline:
    'bg-transparent text-primary font-medium border border-border ' +
    'hover:border-primary/30 ' +
    'focus-visible:ring-2 focus-visible:ring-border focus-visible:ring-offset-1 focus-visible:ring-offset-bg',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs rounded-lg gap-1.5',
  md: 'h-9 px-4 text-sm rounded-lg gap-2',
  lg: 'h-11 px-5 text-sm rounded-lg gap-2',
  xl: 'h-12 px-6 text-sm rounded-lg gap-2',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconRight,
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          // Base — transition covers color, opacity, transform, brightness
          'inline-flex items-center justify-center select-none cursor-pointer',
          'transition-[color,background-color,border-color,opacity,transform,filter]',
          'duration-150',
          // Press scale — applied to non-disabled buttons only
          'active:scale-[0.98]',
          // Disabled
          'disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          className,
        )}
        {...props}
      >
        {loading ? (
          // Spinner inherits text color via `currentColor`
          <span
            className="inline-block rounded-full spinner"
            style={{ width: '0.875rem', height: '0.875rem' }}
            aria-hidden="true"
          />
        ) : (
          icon
        )}
        {children && <span>{children}</span>}
        {!loading && iconRight}
      </button>
    )
  },
)
Button.displayName = 'Button'
