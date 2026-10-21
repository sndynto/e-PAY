import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, ArrowDownToLine, Send, Clock, Settings } from 'lucide-react'
import { cn } from '@/lib/cn'

const tabs = [
  { label: 'Home', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Buy', href: '/buy-usdc', icon: ArrowDownToLine },
  { label: 'Pay', href: '/pay', icon: Send },
  { label: 'History', href: '/history', icon: Clock },
  { label: 'Settings', href: '/settings', icon: Settings },
]

export function BottomNav() {
  const location = useLocation()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-bg/95 backdrop-blur-xl safe-area-inset-bottom">
      <div className="flex items-stretch">
        {tabs.map((tab) => {
          const active = location.pathname === tab.href || location.pathname.startsWith(tab.href + '/')
          const Icon = tab.icon
          return (
            <Link
              key={tab.href}
              to={tab.href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors min-h-[56px]',
                active ? 'text-accent' : 'text-secondary',
              )}
              aria-label={tab.label}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              <span className={cn('text-[10px] font-medium', active ? 'text-accent' : 'text-secondary/70')}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
