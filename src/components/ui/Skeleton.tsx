import { cn } from '@/lib/cn'

interface SkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
  rounded?: string
}

export function Skeleton({ className, width, height, rounded = 'rounded-lg' }: SkeletonProps) {
  return (
    <div
      className={cn('skeleton', rounded, className)}
      style={{ width, height }}
      aria-hidden="true"
    />
  )
}

export function SkeletonText({ lines = 1, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn('skeleton h-4 rounded-lg', i === lines - 1 && lines > 1 ? 'w-3/5' : 'w-full')}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}
