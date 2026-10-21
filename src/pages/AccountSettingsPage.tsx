import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { User, Bell, Shield, LogOut, CheckCircle2 } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'

const profileSchema = z.object({
  fullName: z.string().min(2, 'Enter your full name'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().optional(),
})

type ProfileData = z.infer<typeof profileSchema>

export function AccountSettingsPage() {
  const [saved, setSaved] = useState(false)
  const [notifications, setNotifications] = useState({
    txConfirmations: true,
    invoicePaid: true,
    marketing: false,
    security: true,
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: 'Demo User', email: 'demo@example.com' },
  })

  function onSave(_data: ProfileData) {
    setTimeout(() => {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }, 600)
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
        >
          <div className="mb-6">
            <h1 className="display text-2xl font-bold text-primary">Account Settings</h1>
            <p className="text-sm text-secondary mt-1">Manage your profile and preferences</p>
          </div>

          <Badge variant="warning" className="mb-4">DEMO MODE — Supabase Auth connects in Part 2</Badge>

          {/* Profile */}
          <Card variant="default" padding="lg" className="mb-4">
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <User size={16} className="text-secondary" />
            </CardHeader>
            <form onSubmit={(e) => { void handleSubmit(onSave)(e) }} noValidate className="flex flex-col gap-4">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-16 h-16 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent text-2xl font-bold flex-shrink-0">
                  D
                </div>
                <div>
                  <p className="text-sm font-medium text-primary">Demo User</p>
                  <Button variant="ghost" size="sm" type="button">Change avatar</Button>
                </div>
              </div>
              <Input
                label="Full Name"
                error={errors.fullName?.message}
                {...register('fullName')}
              />
              <Input
                label="Email"
                type="email"
                error={errors.email?.message}
                {...register('email')}
              />
              <Input
                label="Phone (optional)"
                type="tel"
                placeholder="+62 8xx xxxx xxxx"
                {...register('phone')}
              />
              <Button
                type="submit"
                variant={saved ? 'secondary' : 'primary'}
                size="md"
                icon={saved ? <CheckCircle2 size={15} className="text-success" /> : undefined}
              >
                {saved ? 'Saved!' : 'Save changes'}
              </Button>
            </form>
          </Card>

          {/* Notifications */}
          <Card variant="default" padding="lg" className="mb-4">
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <Bell size={16} className="text-secondary" />
            </CardHeader>
            <div className="flex flex-col gap-3">
              {[
                { key: 'txConfirmations', label: 'Transaction confirmations', desc: 'When your USDC is received' },
                { key: 'invoicePaid', label: 'Invoice paid', desc: 'When a customer pays your invoice' },
                { key: 'security', label: 'Security alerts', desc: 'New sign-ins and unusual activity' },
                { key: 'marketing', label: 'Product updates', desc: 'News about new E-PAY features' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-primary">{label}</p>
                    <p className="text-xs text-secondary">{desc}</p>
                  </div>
                  <button
                    onClick={() => setNotifications((n) => ({ ...n, [key]: !n[key as keyof typeof n] }))}
                    className={`relative w-10 h-5.5 rounded-full transition-colors flex-shrink-0 ${
                      notifications[key as keyof typeof notifications] ? 'bg-accent' : 'bg-border'
                    }`}
                    role="switch"
                    aria-checked={notifications[key as keyof typeof notifications]}
                    style={{ height: '22px' }}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-bg transition-transform shadow-sm ${
                        notifications[key as keyof typeof notifications] ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </Card>

          {/* Security */}
          <Card variant="default" padding="lg" className="mb-4">
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <Shield size={16} className="text-secondary" />
            </CardHeader>
            <div className="flex flex-col gap-3">
              <Button variant="secondary" fullWidth>Change Password</Button>
              <Button variant="secondary" fullWidth>Enable Two-Factor Authentication</Button>
              <Button variant="secondary" fullWidth>Active Sessions</Button>
            </div>
          </Card>

          {/* Sign out */}
          <Button variant="danger" fullWidth icon={<LogOut size={15} />}>
            Sign out
          </Button>
        </motion.div>
      </div>
    </AppLayout>
  )
}
