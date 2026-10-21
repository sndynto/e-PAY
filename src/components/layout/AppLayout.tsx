import { type ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { Navbar } from './Navbar'
import { cn } from '@/lib/cn'

interface AppLayoutProps {
  children: ReactNode
  role?: 'customer' | 'merchant' | 'admin'
  hideBottomNav?: boolean
  className?: string
}

export function AppLayout({ children, role = 'customer', hideBottomNav = false, className }: AppLayoutProps) {
  return (
    <div className="min-h-dvh bg-bg flex">
      <Sidebar role={role} />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-40">
          <Navbar authenticated />
        </div>
        <main className={cn('flex-1 pb-20 lg:pb-0', className)}>
          {children}
        </main>
      </div>
      {!hideBottomNav && <BottomNav />}
    </div>
  )
}

interface PublicLayoutProps {
  children: ReactNode
  className?: string
  authenticated?: boolean
}

export function PublicLayout({ children, className, authenticated = false }: PublicLayoutProps) {
  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      <Navbar authenticated={authenticated} />
      <main className={cn('flex-1', className)}>
        {children}
      </main>
    </div>
  )
}
