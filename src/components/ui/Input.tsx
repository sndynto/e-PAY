import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string
  error?: string
  hint?: string
  prefix?: ReactNode
  suffix?: ReactNode
  fullWidth?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, prefix, suffix, fullWidth = true, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className={cn('flex flex-col gap-1', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-secondary"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {prefix && (
            <span className="absolute left-3 text-secondary pointer-events-none select-none">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              // Layout
              'w-full bg-elevated text-sm text-primary',
              'placeholder:text-secondary/35',
              // Geometry
              'rounded-lg border px-3 py-2.5',
              // Transition — smooth border + ring
              'transition-[border-color,box-shadow] duration-150',
              // Default border
              error ? 'border-danger/50' : 'border-border',
              // Focus
              error
                ? 'focus:outline-none focus:border-danger/70 focus:ring-2 focus:ring-danger/15'
                : 'focus:outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/10',
              // Prefix/suffix padding
              prefix  && 'pl-9',
              suffix  && 'pr-9',
              className,
            )}
            {...props}
          />
          {suffix && (
            <span className="absolute right-3 text-secondary">{suffix}</span>
          )}
        </div>
        {/* Error and hint share the same slot — error takes priority */}
        {error ? (
          <p className="text-xs text-danger animate-fade-up">{error}</p>
        ) : hint ? (
          <p className="text-xs text-secondary/60">{hint}</p>
        ) : null}
      </div>
    )
  },
)
Input.displayName = 'Input'
