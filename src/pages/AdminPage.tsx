import { motion } from 'framer-motion'
import {
  Shield,
  Users,
  Activity,
  AlertTriangle,
  DollarSign,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

const DEMO_FLAGS = [
  { id: 1, user: 'user@example.com', action: 'Large QRIS purchase — Rp 50,000,000', severity: 'high', time: '10m ago' },
  { id: 2, user: 'demo2@example.com', action: 'Multiple failed payment attempts', severity: 'medium', time: '1h ago' },
  { id: 3, user: 'demo3@example.com', action: 'New device sign-in from unknown IP', severity: 'low', time: '3h ago' },
]

export function AdminPage() {
  return (
    <AppLayout role="admin">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-danger/10 flex items-center justify-center">
              <Shield size={16} className="text-danger" />
            </div>
            <div>
              <h1 className="display text-2xl font-bold text-primary">Admin Operations</h1>
              <p className="text-sm text-secondary">Protected — authorized users only</p>
            </div>
            <Badge variant="danger" className="ml-auto">Protected</Badge>
          </div>

          <Badge variant="warning" className="mb-4">DEMO MODE — In production, access is enforced server-side via Supabase RLS <code>is_admin()</code> policy. The UI alone never grants access.</Badge>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total users', value: '—', icon: Users, color: 'text-accent' },
              { label: 'Volume (24h)', value: '—', icon: DollarSign, color: 'text-success' },
              { label: 'Transactions', value: '—', icon: Activity, color: 'text-warning' },
              { label: 'Flags', value: '3', icon: AlertTriangle, color: 'text-danger' },
            ].map(({ label, value, icon: Icon, color }) => (
              <Card key={label} variant="default" padding="md">
                <Icon size={16} className={`${color} mb-2`} />
                <p className={`text-2xl font-bold tabular ${color}`}>{value}</p>
                <p className="text-xs text-secondary mt-0.5">{label}</p>
              </Card>
            ))}
          </div>

          {/* Flags */}
          <Card variant="default" padding="lg" className="mb-4">
            <CardHeader>
              <CardTitle>Risk Flags</CardTitle>
              <Button variant="ghost" size="sm" icon={<RefreshCw size={13} />}>
                Refresh
              </Button>
            </CardHeader>
            <div className="flex flex-col gap-2">
              {DEMO_FLAGS.map((flag) => (
                <div key={flag.id} className="flex items-start gap-3 px-3 py-3 rounded-xl bg-elevated border border-border">
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${
                      flag.severity === 'high'
                        ? 'bg-danger'
                        : flag.severity === 'medium'
                          ? 'bg-warning'
                          : 'bg-secondary'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary truncate">{flag.action}</p>
                    <p className="text-xs text-secondary">{flag.user} · {flag.time}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-1.5 rounded-lg hover:bg-success/10 text-secondary hover:text-success transition-colors" aria-label="Approve">
                      <CheckCircle2 size={14} />
                    </button>
                    <button className="p-1.5 rounded-lg hover:bg-danger/10 text-secondary hover:text-danger transition-colors" aria-label="Reject">
                      <XCircle size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Operations */}
          <Card variant="default" padding="lg">
            <CardHeader>
              <CardTitle>Operations</CardTitle>
            </CardHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                'Pause QRIS intake',
                'Pause USDC delivery',
                'Freeze user account',
                'Manual USDC fulfillment',
                'Export transaction report',
                'System health check',
              ].map((op) => (
                <Button key={op} variant="secondary" fullWidth>
                  {op}
                </Button>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  )
}
