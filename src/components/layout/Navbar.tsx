import { Link, useLocation } from 'react-router-dom'
import { Bell, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { EPayLogo } from '@/components/ui/EPayLogo'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'

const navLinks = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Buy USDC', href: '/buy-usdc' },
  { label: 'Pay', href: '/pay' },
  { label: 'History', href: '/history' },
]

interface NavbarProps {
  authenticated?: boolean
}

export function Navbar({ authenticated = false }: NavbarProps) {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <EPayLogo size="sm" />
          </Link>

          {/* Desktop nav */}
          {authenticated ? (
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    location.pathname === link.href
                      ? 'bg-elevated text-primary'
                      : 'text-secondary hover:text-primary hover:bg-elevated',
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          ) : (
            <nav className="hidden md:flex items-center gap-6">
              {['Features', 'Pricing', 'Developers', 'About'].map((item) => (
                <Link
                  key={item}
                  to={`/${item.toLowerCase()}`}
                  className="text-sm text-secondary hover:text-primary transition-colors"
                >
                  {item}
                </Link>
              ))}
            </nav>
          )}

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {authenticated ? (
              <>
                <button
                  className="relative p-2 rounded-lg text-secondary hover:text-primary hover:bg-elevated transition-colors"
                  aria-label="Notifications"
                >
                  <Bell size={18} />
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-accent rounded-full" />
                </button>
                <Link to="/settings">
                  <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent text-sm font-semibold">
                    U
                  </div>
                </Link>
              </>
            ) : (
              <>
                <Link to="/sign-in" className="hidden md:block">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link to="/sign-up">
                  <Button size="sm">Get Started</Button>
                </Link>
              </>
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 rounded-lg text-secondary hover:text-primary hover:bg-elevated transition-colors"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-border overflow-hidden"
          >
            <nav className="px-4 py-3 flex flex-col gap-1 bg-bg">
              {(authenticated ? navLinks : [
                { label: 'Features', href: '/features' },
                { label: 'Pricing', href: '/pricing' },
                { label: 'Developers', href: '/developers' },
                { label: 'Sign In', href: '/sign-in' },
              ]).map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                    location.pathname === link.href
                      ? 'bg-elevated text-primary'
                      : 'text-secondary hover:text-primary hover:bg-elevated',
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
