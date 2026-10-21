import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { ArrowLeft, Mail } from 'lucide-react'
import { useState } from 'react'
import { EPayLogo } from '@/components/ui/EPayLogo'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
})

type FormData = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(_data: FormData) {
    await new Promise((r) => setTimeout(r, 800))
    setSent(true)
  }

  return (
    <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <Link to="/">
            <EPayLogo size="md" className="justify-center mb-6" />
          </Link>
          <h1 className="display text-2xl font-bold text-primary mb-2">Reset password</h1>
          <p className="text-sm text-secondary">
            {sent
              ? 'Check your email for reset instructions.'
              : "Enter your email and we'll send you a reset link."}
          </p>
        </div>

        <Card variant="default" padding="lg">
          {sent ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                <Mail size={22} className="text-success" />
              </div>
              <p className="text-sm text-secondary text-center">
                We sent a reset link to{' '}
                <span className="text-primary font-medium">{getValues('email')}</span>
              </p>
              <Link to="/sign-in" className="w-full">
                <Button variant="secondary" fullWidth>
                  Back to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="flex flex-col gap-4" noValidate>
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                error={errors.email?.message}
                {...register('email')}
              />
              <Button type="submit" loading={isSubmitting} fullWidth size="lg">
                Send reset link
              </Button>
            </form>
          )}
        </Card>

        <Link
          to="/sign-in"
          className="flex items-center justify-center gap-2 mt-6 text-sm text-secondary hover:text-primary transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Sign In
        </Link>
      </motion.div>
    </div>
  )
}
