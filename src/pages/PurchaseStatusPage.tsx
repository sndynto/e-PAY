import { useLocation, Link } from 'react-router-dom'
import { CheckCircle2, XCircle, Clock, ExternalLink, ArrowRight, Download } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatIDR, formatUSDC, formatDateTime } from '@/lib/format'
import { getConfig } from '@/server/types'

type PurchaseStatus = 'success' | 'failed' | 'pending'

const PAGE_RECEIPT_NO = `EPY-${Date.now().toString(36).toUpperCase()}`
const PAGE_NOW = new Date()

export function PurchaseStatusPage() {
  const location = useLocation()
  const { arcExplorerUrl } = { arcExplorerUrl: getConfig().arcNetworkMode === 'live'
    ? import.meta.env.VITE_ARC_EXPLORER_URL as string
    : 'https://explorer.testnet.arc.io' }

  const state = location.state as {
    status: PurchaseStatus
    usdcAmount: number
    idrAmount: number
    txHash?: string
    intentId?: string
    error?: string
    isDemo?: boolean
  } | null

  if (!state) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <div>
            <p className="text-secondary text-sm mb-4">No transaction found.</p>
            <Link to="/dashboard"><Button>Go to dashboard</Button></Link>
          </div>
        </div>
      </AppLayout>
    )
  }

  const isSuccess = state.status === 'success'
  const isPending = state.status === 'pending'
  const isFailed = state.status === 'failed'

  return (
    <AppLayout>
      <div className="max-w-sm mx-auto px-4 sm:px-6 py-8">
        {/* Status header */}
        <div className="mb-6">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 ${
            isSuccess ? 'bg-success/10' : isPending ? 'bg-warning/10' : 'bg-danger/10'
          }`}>
            {isSuccess ? (
              <CheckCircle2 size={18} className="text-success" />
            ) : isPending ? (
              <Clock size={18} className="text-warning" />
            ) : (
              <XCircle size={18} className="text-danger" />
            )}
          </div>
          <h1 className="text-xl font-semibold text-primary tracking-tight mb-1" style={{ letterSpacing: '-0.015em' }}>
            {isSuccess ? 'USDC delivered' : isPending ? 'Processing...' : 'Transaction failed'}
          </h1>
          <p className="text-sm text-secondary">
            {isSuccess
              ? 'Your USDC has been sent to your wallet.'
              : isPending
                ? 'Your payment is being verified.'
                : state.error ?? 'Something went wrong. Please try again.'}
          </p>
        </div>

        {/* Receipt */}
        <Card variant="default" padding="lg" className="mb-5">
          {isSuccess && (
            <>
              <div className="mb-4">
                <p className="text-3xl font-semibold text-success tabular" style={{ letterSpacing: '-0.02em' }}>
                  +{formatUSDC(state.usdcAmount)}
                  <span className="text-secondary text-xl font-normal"> USDC</span>
                </p>
              </div>

              {state.isDemo && (
                <Badge variant="warning" className="mb-4">DEMO MODE — No real funds moved</Badge>
              )}

              <div className="flex flex-col gap-2 text-sm border-t border-border pt-4">
                {[
                  { label: 'Receipt', value: PAGE_RECEIPT_NO },
                  { label: 'Date', value: formatDateTime(PAGE_NOW) },
                  { label: 'IDR paid', value: formatIDR(state.idrAmount) },
                  { label: 'USDC received', value: `${formatUSDC(state.usdcAmount)} USDC` },
                  { label: 'Network', value: 'Arc Testnet' },
                  ...(state.txHash ? [{ label: 'Tx hash', value: `${state.txHash.slice(0,10)}…${state.txHash.slice(-6)}` }] : []),
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-secondary">{label}</span>
                    <span className={`text-primary ${label === 'Tx hash' ? 'mono text-xs' : ''} tabular`}>{value}</span>
                  </div>
                ))}
              </div>

              {state.txHash && !state.isDemo && (
                <a
                  href={`${arcExplorerUrl}/tx/${state.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center gap-1.5 text-xs text-accent hover:underline"
                >
                  <ExternalLink size={12} />
                  View on Arc Explorer
                </a>
              )}
            </>
          )}

          {isPending && (
            <div className="flex items-center gap-3 py-4">
              <div className="w-5 h-5 rounded-full border border-accent border-t-transparent animate-spin flex-shrink-0" />
              <p className="text-sm text-secondary">
                Verifying payment. USDC delivery can take up to 60 seconds.
              </p>
            </div>
          )}

          {isFailed && (
            <p className="text-sm text-secondary py-4">
              {state.error ?? 'Payment could not be processed. Your IDR has not been charged.'}
            </p>
          )}
        </Card>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {isSuccess && (
            <>
              <button
                onClick={() => void navigator.clipboard.writeText(PAGE_RECEIPT_NO)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border text-xs text-secondary hover:text-primary transition-colors"
              >
                <Download size={13} />
                Copy receipt ID
              </button>
              <Link to="/dashboard">
                <Button fullWidth>
                  Dashboard <ArrowRight size={14} />
                </Button>
              </Link>
            </>
          )}
          {(isFailed || isPending) && (
            <Link to="/buy-usdc">
              <Button fullWidth>Try again</Button>
            </Link>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
