import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Zap,
  Shield,
  Globe2,
  Banknote,
  QrCode,
  CheckCircle2,
} from 'lucide-react'
import { EPayLogo } from '@/components/ui/EPayLogo'
import { Button } from '@/components/ui/Button'

const features = [
  {
    icon: Banknote,
    title: 'Buy USDC with IDR',
    description:
      'Convert Indonesian Rupiah to USDC instantly. Pay with QRIS and receive stablecoins directly to your wallet.',
  },
  {
    icon: QrCode,
    title: 'QRIS Checkout',
    description:
      'Generate and accept payments via QRIS. Familiar to every Indonesian bank and e-wallet user, now connected to onchain settlement.',
  },
  {
    icon: Zap,
    title: 'Onchain in seconds',
    description:
      'Arc\'s sub-second finality means your USDC lands onchain in moments, not minutes. USDC is the native gas token.',
  },
  {
    icon: Shield,
    title: 'Non-custodial',
    description:
      'Your keys, your coins. E-PAY facilitates the exchange — it never holds your USDC. Connect any EVM wallet you already own.',
  },
  {
    icon: Globe2,
    title: 'Merchant invoicing',
    description:
      'Create hosted invoice pages, share payment links, and accept USDC from customers anywhere in the world.',
  },
  {
    icon: CheckCircle2,
    title: 'Verifiable audit trail',
    description:
      'Every transaction is recorded onchain and surfaced in your dashboard with an explorer link.',
  },
]

const steps = [
  { number: '01', title: 'Sign up', description: 'Create your E-PAY account in under two minutes.' },
  { number: '02', title: 'Connect wallet', description: 'Link any EVM wallet — MetaMask, Coinbase Wallet, and more.' },
  { number: '03', title: 'Buy USDC', description: 'Enter IDR, scan the QRIS code, and USDC lands in your wallet.' },
  { number: '04', title: 'Pay or receive', description: 'Send USDC to any address or share your invoice link.' },
]

export function LandingPage() {
  return (
    <div className="min-h-dvh bg-bg text-primary">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-border bg-bg/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="flex items-center justify-between h-14">
            <EPayLogo size="sm" />
            <nav className="hidden md:flex items-center gap-5">
              {['Features', 'How it works', 'Developers'].map((item) => (
                <Link
                  key={item}
                  to={`/${item.toLowerCase().replace(/\s+/g, '-')}`}
                  className="text-sm text-secondary hover:text-primary transition-colors"
                >
                  {item}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-2">
              <Link to="/sign-in">
                <Button variant="ghost" size="sm">Sign in</Button>
              </Link>
              <Link to="/sign-up">
                <Button size="sm">Get started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-20 pb-24 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-medium text-secondary uppercase tracking-widest mb-5">
            Live on Arc Testnet
          </p>
          <h1 className="text-4xl sm:text-5xl font-semibold text-primary leading-[1.1] tracking-tight mb-5" style={{ letterSpacing: '-0.02em' }}>
            Indonesian payments,<br />settled onchain.
          </h1>
          <p className="text-base text-secondary max-w-xl mb-8 leading-relaxed">
            Buy USDC with IDR via QRIS, make onchain payments, and issue invoices — all in one place.
          </p>
          <div className="flex items-center gap-3">
            <Link to="/sign-up">
              <Button size="lg">
                Start for free
                <ArrowRight size={15} />
              </Button>
            </Link>
            <Link to="/developers">
              <Button variant="outline" size="lg">
                Developer docs
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-5 sm:px-8 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <p className="text-xs font-medium text-secondary uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-2xl font-semibold text-primary tracking-tight" style={{ letterSpacing: '-0.015em' }}>
              Built for Indonesia, open to the world.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="bg-bg p-6 flex flex-col gap-3"
                >
                  <Icon size={18} className="text-secondary" />
                  <h3 className="text-sm font-medium text-primary">{feature.title}</h3>
                  <p className="text-sm text-secondary leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-5 sm:px-8 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12">
            <p className="text-xs font-medium text-secondary uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-2xl font-semibold text-primary tracking-tight" style={{ letterSpacing: '-0.015em' }}>
              From IDR to onchain in four steps.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {steps.map((step) => (
              <div key={step.number} className="flex gap-5">
                <span className="mono text-2xl font-semibold text-border leading-none flex-shrink-0 pt-0.5 w-8">
                  {step.number}
                </span>
                <div>
                  <h3 className="text-sm font-medium text-primary mb-1">{step.title}</h3>
                  <p className="text-sm text-secondary">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-5 sm:px-8 border-t border-border">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-semibold text-primary tracking-tight mb-3" style={{ letterSpacing: '-0.015em' }}>
            Start moving USDC today.
          </h2>
          <p className="text-sm text-secondary mb-7 max-w-lg">
            Free to create an account. No crypto experience required.
          </p>
          <div className="flex items-center gap-3">
            <Link to="/sign-up">
              <Button size="lg">
                Create account
                <ArrowRight size={15} />
              </Button>
            </Link>
            <Link to="/developers">
              <Button variant="ghost" size="lg">
                Read the docs
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10 px-5 sm:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <EPayLogo size="sm" />
          <div className="flex flex-wrap gap-5 text-xs text-secondary">
            {['Privacy', 'Terms', 'Support', 'Developers', 'Status'].map((item) => (
              <Link key={item} to="/" className="hover:text-primary transition-colors">
                {item}
              </Link>
            ))}
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-secondary/50">
          <p>© 2026 E-PAY. Built on Arc, powered by USDC.</p>
          <p>Testnet — not for real funds</p>
        </div>
      </footer>
    </div>
  )
}
