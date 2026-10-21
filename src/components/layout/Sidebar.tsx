import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  ArrowDownToLine,
  Send,
  Clock,
  Wallet,
  Settings,
  Store,
  FileText,
  Shield,
  Code2,
} from 'lucide-react'
import { EPayLogo } from '@/components/ui/EPayLogo'
import { cn } from '@/lib/cn'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

const customerNav: NavItem[] = [
  { label: 'Dashboard',      href: '/dashboard',          icon: LayoutDashboard },
  { label: 'Buy USDC',       href: '/buy-usdc',           icon: ArrowDownToLine },
  { label: 'Pay with USDC',  href: '/pay',                icon: Send            },
  { label: 'Transactions',   href: '/history',            icon: Clock           },
  { label: 'Wallet',         href: '/wallet',             icon: Wallet          },
]

const merchantNav: NavItem[] = [
  { label: 'Merchant',       href: '/merchant',           icon: Store    },
  { label: 'Create invoice', href: '/merchant/invoice/new', icon: FileText },
]

const bottomNav: NavItem[] = [
  { label: 'Settings',       href: '/settings',           icon: Settings },
  { label: 'Developers',     href: '/developers',         icon: Code2    },
  { label: 'Admin',          href: '/admin',              icon: Shield   },
]

function NavLink({ item }: { item: NavItem }) {
  const location = useLocation()
  const active = location.pathname === item.href || location.pathname.startsWith(item.href + '/')
  const Icon = item.icon

  return (
    <Link
      to={item.href}
      className={cn(
        'relative flex items-center gap-2.5 px-2.5 py-[7px] rounded-md text-sm select-none',
        // 150ms transition: text color + background
        'transition-[color,background-color] duration-150',
        active
          ? 'text-primary bg-elevated'
          : 'text-secondary hover:text-primary hover:bg-elevated/50',
      )}
    >
      {/* Active accent bar — CSS transition on opacity + scaleY */}
      <span
        aria-hidden="true"
        className={cn(
          'absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-full bg-accent',
          'transition-[opacity,transform] duration-150',
          active ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0',
        )}
      />
      <Icon
        size={15}
        className={cn(
          'flex-shrink-0 transition-colors duration-150',
          active ? 'text-accent' : 'text-secondary',
        )}
      />
      <span className="leading-none">{item.label}</span>
    </Link>
  )
}

interface SidebarProps {
  role?: 'customer' | 'merchant' | 'admin'
}

export function Sidebar({ role = 'customer' }: SidebarProps) {
  return (
    <aside className="hidden lg:flex flex-col w-56 flex-shrink-0 border-r border-border bg-surface min-h-screen sticky top-0 h-screen overflow-y-auto">
      <div className="px-4 h-14 flex items-center border-b border-border">
        <Link to="/dashboard">
          <EPayLogo size="sm" />
        </Link>
      </div>

      <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5">
        {customerNav.map((item) => <NavLink key={item.href} item={item} />)}

        {(role === 'merchant' || role === 'admin') && (
          <>
            <div className="my-3 border-t border-border" />
            <p className="px-2.5 pb-1 text-[10px] font-medium text-secondary/40 uppercase tracking-widest">
              Merchant
            </p>
            {merchantNav.map((item) => <NavLink key={item.href} item={item} />)}
          </>
        )}
      </nav>

      <div className="px-2 py-3 border-t border-border flex flex-col gap-0.5">
        {bottomNav.map((item) => <NavLink key={item.href} item={item} />)}
      </div>
    </aside>
  )
}
