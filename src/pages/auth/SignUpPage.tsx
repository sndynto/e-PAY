import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { EPayLogo } from '@/components/ui/EPayLogo'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { signUp } from '@/lib/auth'
import { isSupabaseConfigured } from '@/lib/supabase'

const schema = z.object({
  fullName: z.string().min(2, 'Enter your full name'),
  email: z.string().email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Include at least one uppercase letter')
    .regex(/[0-9]/, 'Include at least one number'),
  agree: z.literal(true).refine((v) => v === true, { message: 'You must accept the terms' }),
})

type FormData = z.infer<typeof schema>

export function SignUpPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const isDemo = !isSupabaseConfigured()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const password = watch('password', '')
  const strength = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ]
  const strengthCount = strength.filter(Boolean).length

  async function onSubmit(data: FormData) {
    setAuthError(null)
    if (isDemo) {
      await new Promise<void>((r) => setTimeout(r, 900))
      void navigate('/onboarding')
      return
    }

    const result = await signUp(data.email, data.password, data.fullName)
    if (result.error) {
      setAuthError(result.error.message ?? 'Sign up failed. Please try again.')
      return
    }
    void navigate('/onboarding')
  }

  return (
    <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <Link to="/">
            <EPayLogo size="sm" className="mb-6" />
          </Link>
          <h1 className="text-xl font-semibold text-primary tracking-tight mb-1" style={{ letterSpacing: '-0.015em' }}>
            Create account
          </h1>
          <p className="text-sm text-secondary">Join E-PAY — your USDC payment hub</p>
        </div>

        {isDemo && (
          <Badge variant="warning" className="mb-5">
            DEMO MODE — Set VITE_SUPABASE_URL to enable real auth
          </Badge>
        )}

        <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="flex flex-col gap-4" noValidate>
          {authError && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-danger/10 border border-danger/20">
              <AlertCircle size={14} className="text-danger flex-shrink-0 mt-0.5" />
              <p className="text-sm text-danger">{authError}</p>
            </div>
          )}

          <Input
            label="Full name"
            type="text"
            placeholder="Budi Santoso"
            autoComplete="name"
            error={errors.fullName?.message}
            {...register('fullName')}
          />
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <div className="flex flex-col gap-1.5">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="new-password"
              error={errors.password?.message}
              suffix={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-secondary hover:text-primary transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              }
              {...register('password')}
            />
            {password.length > 0 && (
              <div className="flex gap-1 mt-0.5">
                {strength.map((ok, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-0.5 rounded-full transition-colors ${
                      ok
                        ? strengthCount <= 1 ? 'bg-danger'
                        : strengthCount <= 2 ? 'bg-warning'
                        : 'bg-success'
                        : 'bg-border'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5 accent-accent"
              {...register('agree')}
            />
            <span className="text-xs text-secondary leading-relaxed">
              I agree to the{' '}
              <a href="#" className="text-primary hover:underline">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-primary hover:underline">Privacy Policy</a>
            </span>
          </label>
          {errors.agree && (
            <p className="text-xs text-danger -mt-2">{errors.agree.message as string}</p>
          )}

          <Button type="submit" loading={isSubmitting} fullWidth>
            Create account
          </Button>
        </form>

        <p className="text-sm text-secondary mt-6">
          Already have an account?{' '}
          <Link to="/sign-in" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
