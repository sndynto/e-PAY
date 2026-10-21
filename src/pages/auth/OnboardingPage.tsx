import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { CheckCircle2, Wallet, ArrowRight, QrCode, Zap } from 'lucide-react'
import { EPayLogo } from '@/components/ui/EPayLogo'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

const steps = [
  {
    icon: CheckCircle2,
    title: 'Account created',
    description: 'Your E-PAY account is ready. Next, let\'s get you set up for onchain payments.',
    action: 'Continue',
  },
  {
    icon: Wallet,
    title: 'Connect your wallet',
    description:
      'Link an EVM wallet to send and receive USDC. MetaMask, Coinbase Wallet, Rainbow, and more are supported.',
    action: 'Connect Wallet',
    skipLabel: 'Skip for now',
  },
  {
    icon: QrCode,
    title: 'How to buy USDC',
    description:
      'Enter the IDR amount you want to convert. E-PAY generates a QRIS code. Pay with any QRIS-compatible app. USDC arrives in your wallet on Arc.',
    action: 'Got it',
  },
  {
    icon: Zap,
    title: "You're all set!",
    description:
      'Your account is ready. Head to the dashboard to buy USDC, send payments, or create merchant invoices.',
    action: 'Go to Dashboard',
  },
]

export function OnboardingPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)

  function next() {
    if (step < steps.length - 1) {
      setStep((s) => s + 1)
    } else {
      void navigate('/dashboard')
    }
  }

  const current = steps[step]
  const Icon = current.icon

  return (
    <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-4 py-12">
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, #C7FF4A 0%, transparent 70%)' }}
      />

      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <EPayLogo size="md" className="justify-center mb-6" />
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`transition-all duration-300 rounded-full ${
                i === step ? 'w-6 h-2 bg-accent' : i < step ? 'w-2 h-2 bg-accent/40' : 'w-2 h-2 bg-border'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.22 }}
          >
            <Card variant="default" padding="lg" className="text-center">
              <div className="flex justify-center mb-5">
                <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                  <Icon size={28} className="text-accent" />
                </div>
              </div>
              <h2 className="display text-xl font-bold text-primary mb-3">{current.title}</h2>
              <p className="text-sm text-secondary text-pretty leading-relaxed mb-6">{current.description}</p>

              <div className="flex flex-col gap-3">
                <Button onClick={next} fullWidth size="lg">
                  {current.action}
                  {step < steps.length - 1 && <ArrowRight size={16} />}
                </Button>
                {current.skipLabel && (
                  <Button
                    variant="ghost"
                    onClick={() => setStep((s) => s + 1)}
                    fullWidth
                  >
                    {current.skipLabel}
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>

        <p className="text-center text-xs text-secondary/50 mt-6">
          Step {step + 1} of {steps.length}
        </p>
      </div>
    </div>
  )
}
