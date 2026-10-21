import { cn } from '@/lib/cn'

interface EPayLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'full' | 'icon' | 'wordmark'
  className?: string
}

const sizes = {
  xs: { icon: 20, text: 'text-sm' },
  sm: { icon: 24, text: 'text-base' },
  md: { icon: 32, text: 'text-xl' },
  lg: { icon: 40, text: 'text-2xl' },
  xl: { icon: 56, text: 'text-4xl' },
}

export function EPayLogo({ size = 'md', variant = 'full', className }: EPayLogoProps) {
  const s = sizes[size]

  const icon = (
    <svg
      width={s.icon}
      height={s.icon}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Background rounded square */}
      <rect width="32" height="32" rx="8" fill="#C7FF4A" />
      {/* E glyph — three horizontal bars forming a stylised E */}
      <rect x="7" y="8" width="13" height="3.5" rx="1.75" fill="#090B0A" />
      <rect x="7" y="14.25" width="10" height="3.5" rx="1.75" fill="#090B0A" />
      <rect x="7" y="20.5" width="13" height="3.5" rx="1.75" fill="#090B0A" />
      {/* Accent dot — right side */}
      <circle cx="24.5" cy="16" r="2.5" fill="#090B0A" />
    </svg>
  )

  if (variant === 'icon') return <span className={cn('inline-flex', className)}>{icon}</span>

  if (variant === 'wordmark') {
    return (
      <span className={cn('inline-flex items-center font-bold tracking-tight', s.text, className)}>
        <span className="text-accent">E</span>
        <span className="text-primary">-PAY</span>
      </span>
    )
  }

  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      {icon}
      <span
        className={cn(
          'font-bold tracking-tight leading-none',
          s.text,
        )}
        style={{ letterSpacing: '-0.02em' }}
      >
        <span className="text-accent">E</span>
        <span className="text-primary">-PAY</span>
      </span>
    </span>
  )
}
