import { Link } from 'react-router-dom'
import { Plus, FileText, ArrowRight } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatUSDC, formatDateTime } from '@/lib/format'

const DEMO_INVOICES = [
  { id: 'INV-001', description: 'Website design services', amount: 250, status: 'paid', date: new Date(Date.now() - 86400 * 2 * 1000), customer: '0x1234…abcd' },
  { id: 'INV-002', description: 'Monthly hosting fee', amount: 50, status: 'pending', date: new Date(Date.now() - 3600 * 3 * 1000), customer: null },
  { id: 'INV-003', description: 'Logo design package', amount: 150, status: 'expired', date: new Date(Date.now() - 86400 * 7 * 1000), customer: null },
]

const statusBadge: Record<string, { variant: 'success' | 'warning' | 'danger' | 'muted'; label: string }> = {
  paid: { variant: 'success', label: 'Paid' },
  pending: { variant: 'warning', label: 'Pending' },
  expired: { variant: 'danger', label: 'Expired' },
}

export function MerchantDashboardPage() {
  return (
    <AppLayout role="merchant">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-primary tracking-tight mb-0.5" style={{ letterSpacing: '-0.015em' }}>
              Merchant
            </h1>
            <p className="text-sm text-secondary">Invoices and payments</p>
          </div>
          <Link to="/merchant/invoice/new">
            <Button size="sm">
              <Plus size={13} />
              New invoice
            </Button>
          </Link>
        </div>

        <Badge variant="warning" className="mb-5">DEMO MODE — Connect backend to see real data</Badge>

        {/* Summary row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="border border-border rounded-lg p-3">
            <p className="text-xs text-secondary uppercase tracking-widest mb-1.5">Earned</p>
            <p className="text-base font-semibold text-success tabular">450.00 USDC</p>
          </div>
          <div className="border border-border rounded-lg p-3">
            <p className="text-xs text-secondary uppercase tracking-widest mb-1.5">Pending</p>
            <p className="text-base font-semibold text-warning tabular">50.00 USDC</p>
          </div>
          <div className="border border-border rounded-lg p-3">
            <p className="text-xs text-secondary uppercase tracking-widest mb-1.5">Invoices</p>
            <p className="text-base font-semibold text-primary tabular">3</p>
          </div>
        </div>

        {/* Invoices */}
        <Card variant="default" padding="none">
          <div className="px-4 pt-4 pb-3 flex items-center justify-between">
            <CardTitle>Recent invoices</CardTitle>
            <Link to="/history">
              <Button variant="ghost" size="sm">
                View all <ArrowRight size={12} />
              </Button>
            </Link>
          </div>

          <div className="divide-y divide-border">
            {DEMO_INVOICES.map((inv) => {
              const s = statusBadge[inv.status]
              return (
                <Link
                  key={inv.id}
                  to={`/invoice/${inv.id}`}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-elevated/40 transition-colors group"
                >
                  <div className="w-7 h-7 rounded-md bg-elevated flex items-center justify-center flex-shrink-0">
                    <FileText size={13} className="text-secondary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-primary truncate">{inv.description}</p>
                    <p className="text-xs text-secondary">{formatDateTime(inv.date)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-sm tabular text-primary">{formatUSDC(inv.amount)} USDC</span>
                    <Badge variant={s.variant}>{s.label}</Badge>
                  </div>
                </Link>
              )
            })}
          </div>
        </Card>
      </div>
    </AppLayout>
  )
}
