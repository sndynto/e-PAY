import { useState } from 'react'
import { ArrowDownToLine, Send, FileText, Search, ExternalLink, RefreshCw } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatUSDC, formatDateTime, formatIDR } from '@/lib/format'
import { useAuth } from '@/hooks/useAuth'
import { useTransactions } from '@/hooks/useTransactions'
import { buildTxExplorerUrl } from '@/onchain-facts'
import { getConfig } from '@/server/types'

type TxFilter = 'all' | 'buy' | 'send' | 'invoice_paid' | 'invoice_received'

const DEMO_HISTORY = [
  { id: 'tx-1', type: 'buy' as const, status: 'completed' as const, usdc_amount: 50_000_000, idr_amount: 815_000, description: 'Buy USDC', created_at: new Date(Date.now() - 2 * 3600_000).toISOString(), blockchain_tx: { tx_hash: '0xDEMOabc123', chain_id: 5042002 } },
  { id: 'tx-2', type: 'send' as const, status: 'completed' as const, usdc_amount: 25_000_000, description: 'Sent to 0x1234…abcd', created_at: new Date(Date.now() - 25 * 3600_000).toISOString(), blockchain_tx: null },
  { id: 'tx-3', type: 'invoice_paid' as const, status: 'completed' as const, usdc_amount: 100_000_000, description: 'Invoice INV-001', created_at: new Date(Date.now() - 3 * 86400_000).toISOString(), blockchain_tx: null },
  { id: 'tx-4', type: 'buy' as const, status: 'completed' as const, usdc_amount: 200_000_000, idr_amount: 3_260_000, description: 'Buy USDC', created_at: new Date(Date.now() - 5 * 86400_000).toISOString(), blockchain_tx: null },
]

const typeIcon: Record<string, React.ElementType> = {
  buy: ArrowDownToLine,
  send: Send,
  receive: ArrowDownToLine,
  invoice_paid: FileText,
  invoice_received: FileText,
}

export function TransactionHistoryPage() {
  const { user } = useAuth()
  const { transactions: realTxs, loading, error, isDemo, refresh } = useTransactions(user?.id)
  const [filter, setFilter] = useState<TxFilter>('all')
  const [search, setSearch] = useState('')
  const { arcChainId } = { arcChainId: getConfig().arcChainId }

  const source = isDemo ? DEMO_HISTORY : realTxs

  const filtered = source.filter((tx) => {
    if (filter !== 'all' && tx.type !== filter) return false
    if (search && !tx.description?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-primary tracking-tight mb-0.5" style={{ letterSpacing: '-0.015em' }}>
              Transactions
            </h1>
            <p className="text-sm text-secondary">Your complete payment history</p>
          </div>
          {!isDemo && (
            <Button variant="ghost" size="sm" onClick={refresh}>
              <RefreshCw size={13} />
              Refresh
            </Button>
          )}
        </div>

        {isDemo && (
          <Badge variant="warning" className="mb-5">
            DEMO — Connect Supabase to see real data
          </Badge>
        )}

        {error && (
          <div className="px-3 py-2.5 rounded-lg border border-danger/20 mb-4">
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <Input
            placeholder="Search transactions..."
            prefix={<Search size={14} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:max-w-xs"
          />
          <div className="flex gap-1.5 flex-wrap items-center">
            {(['all', 'buy', 'send', 'invoice_paid'] as TxFilter[]).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                  filter === t
                    ? 'bg-accent text-bg border-accent'
                    : 'bg-elevated text-secondary border-border hover:text-primary'
                }`}
              >
                {t === 'all' ? 'All' : t === 'buy' ? 'Buy' : t === 'send' ? 'Send' : 'Invoices'}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <Card variant="default" padding="none">
          {loading ? (
            <div className="divide-y divide-border">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                  <Skeleton className="w-7 h-7 rounded-md flex-shrink-0" />
                  <div className="flex-1 flex flex-col gap-2">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-3.5 w-20" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <p className="text-sm text-secondary">No transactions found</p>
              <p className="text-xs text-secondary/50 mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((tx) => {
                const Icon = typeIcon[tx.type] ?? FileText
                const isPositive = tx.type !== 'send'
                const usdcDisplay = formatUSDC(tx.usdc_amount / 1_000_000)
                const txHash = tx.blockchain_tx?.tx_hash
                const explorerUrl = txHash && !txHash.startsWith('0xDEMO')
                  ? buildTxExplorerUrl(arcChainId, txHash)
                  : null

                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 px-4 py-3.5 hover:bg-elevated/40 transition-colors group"
                  >
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${
                      isPositive ? 'bg-elevated' : 'bg-danger/10'
                    }`}>
                      <Icon size={13} className={isPositive ? 'text-secondary' : 'text-danger'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-primary truncate">{tx.description}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-secondary">{formatDateTime(tx.created_at)}</p>
                        {explorerUrl && (
                          <a
                            href={explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-secondary/30 hover:text-accent transition-colors opacity-0 group-hover:opacity-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink size={11} />
                          </a>
                        )}
                      </div>
                      {'idr_amount' in tx && tx.idr_amount ? (
                        <p className="text-xs text-secondary/50">{formatIDR(tx.idr_amount)}</p>
                      ) : null}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm font-medium tabular ${isPositive ? 'text-success' : 'text-danger'}`}>
                        {isPositive ? '+' : '-'}{usdcDisplay} USDC
                      </p>
                      <Badge
                        variant={tx.status === 'completed' ? 'success' : tx.status === 'failed' ? 'danger' : 'warning'}
                        className="mt-1"
                      >
                        {tx.status === 'completed' ? 'Confirmed' : tx.status === 'failed' ? 'Failed' : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  )
}
