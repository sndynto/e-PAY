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
import { signIn } from '@/lib/auth'
import { isSupabaseConfigured } from '@/lib/supabase'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type FormData = z.infer<typeof schema>

export function SignInPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const isDemo = !isSupabaseConfigured()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setAuthError(null)

    if (isDemo) {
      await new Promise<void>((r) => setTimeout(r, 600))
      void navigate('/dashboard')
      return
    }

    const result = await signIn(data.email, data.password)
    if (result.error) {
      setAuthError(result.error.message ?? 'Sign in failed. Check your credentials.')
      return
    }
    void navigate('/dashboard')
  }

  return (
    <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <Link to="/">
            <EPayLogo size="sm" className="mb-6" />
          </Link>
          <h1 className="text-xl font-semibold text-primary tracking-tight mb-1" style={{ letterSpacing: '-0.015em' }}>
            Sign in
          </h1>
          <p className="text-sm text-secondary">Sign in to your E-PAY account</p>
        </div>

        {isDemo && (
          <Badge variant="warning" className="mb-5">
            DEMO MODE — any credentials accepted
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
            label="Email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            autoComplete="current-password"
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

          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-xs text-secondary hover:text-primary transition-colors">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" loading={isSubmitting} fullWidth>
            Sign in
          </Button>
        </form>

        <p className="text-sm text-secondary mt-6">
          No account?{' '}
          <Link to="/sign-up" className="text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
