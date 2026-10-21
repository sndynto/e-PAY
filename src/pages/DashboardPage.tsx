import { Link } from 'react-router-dom'
import {
  ArrowDownToLine,
  Send,
  Clock,
  Wallet,
  Copy,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react'
import { useState } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { shortAddress, formatUSDC, formatDateTime } from '@/lib/format'
import { useAccount, useReadContract, useChainId } from 'wagmi'
import { ConnectKitButton } from 'connectkit'
import { useAuth } from '@/hooks/useAuth'
import { useTransactions } from '@/hooks/useTransactions'
import { getUsdc, requireChain, buildAddressExplorerUrl } from '@/onchain-facts'
import { getConfig } from '@/server/types'

const ERC20_BALANCE_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

const DEMO_TXS = [
  { id: '1', type: 'buy', label: 'Buy USDC', amount: '+50.00 USDC', sub: 'Rp 815,000', status: 'completed', time: '2h ago' },
  { id: '2', type: 'send', label: 'Sent USDC', amount: '-25.00 USDC', sub: '0x1234…abcd', status: 'completed', time: '1d ago' },
  { id: '3', type: 'invoice', label: 'Invoice paid', amount: '+100.00 USDC', sub: 'Invoice #INV-001', status: 'completed', time: '3d ago' },
]

export function DashboardPage() {
  const { address, isConnected } = useAccount()
  const connectedChainId = useChainId()
  const [copied, setCopied] = useState(false)
  const { user, isDemoMode } = useAuth()
  const { transactions, loading: txLoading, isDemo: txIsDemo } = useTransactions(user?.id)

  const config = getConfig()
  const arcChainId = config.arcChainId
  const usdcFact = getUsdc(arcChainId)
  const arcChain = requireChain(arcChainId)
  const isOnArc = connectedChainId === arcChainId

  const { data: rawBalance, isLoading: balanceLoading } = useReadContract({
    address: usdcFact?.address as `0x${string}` | undefined,
    abi: ERC20_BALANCE_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: arcChainId,
    query: { enabled: Boolean(isConnected && address && usdcFact && isOnArc) },
  })

  const usdcBalance = rawBalance !== undefined && usdcFact
    ? formatUSDC(Number(rawBalance) / Math.pow(10, usdcFact.decimals))
    : null

  function copyAddress() {
    if (!address) return
    void navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const explorerUrl = address ? buildAddressExplorerUrl(arcChainId, address) : null

  const recentTxs = txIsDemo
    ? DEMO_TXS
    : transactions.slice(0, 5).map((tx) => ({
        id: tx.id,
        type: tx.type,
        label: tx.description ?? tx.type,
        amount: `${tx.type === 'send' ? '-' : '+'}${formatUSDC(tx.usdc_amount / 1_000_000)} USDC`,
        sub: formatDateTime(tx.created_at),
        status: tx.status,
        time: formatDateTime(tx.created_at),
      }))

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Balance */}
        <div className="mb-6">
          <p className="text-xs text-secondary uppercase tracking-widest mb-4">
            {isDemoMode ? 'Demo mode' : arcChain.name}
          </p>
          {isConnected && isOnArc ? (
            balanceLoading ? (
              <Skeleton className="h-12 w-44 mb-1" />
            ) : (
              <p className="text-4xl font-semibold text-primary tabular tracking-tight" style={{ letterSpacing: '-0.02em' }}>
                {usdcBalance ?? '—'} <span className="text-secondary text-2xl font-normal">USDC</span>
              </p>
            )
          ) : isConnected && !isOnArc ? (
            <p className="text-sm text-warning">Switch to {arcChain.name} to view balance</p>
          ) : (
            <p className="text-2xl font-semibold text-secondary/40 tabular">— USDC</p>
          )}

          {isConnected && address ? (
            <div className="flex items-center gap-2 mt-3">
              <span className="mono text-xs text-secondary">{shortAddress(address)}</span>
              <button onClick={copyAddress} className="text-secondary/40 hover:text-secondary transition-colors" aria-label="Copy address">
                {copied ? <CheckCircle2 size={12} className="text-success" /> : <Copy size={12} />}
              </button>
              {explorerUrl && (
                <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="text-secondary/40 hover:text-secondary transition-colors" aria-label="View on explorer">
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          ) : (
            <div className="mt-4">
              <ConnectKitButton.Custom>
                {({ show }) => (
                  <Button onClick={show} variant="secondary" size="md">
                    <Wallet size={14} />
                    Connect wallet
                  </Button>
                )}
              </ConnectKitButton.Custom>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2 mb-8">
          {[
            { label: 'Buy USDC', icon: ArrowDownToLine, href: '/buy-usdc', accent: true },
            { label: 'Pay', icon: Send, href: '/pay' },
            { label: 'History', icon: Clock, href: '/history' },
            { label: 'Wallet', icon: Wallet, href: '/wallet' },
          ].map(({ label, icon: Icon, href, accent }) => (
            <Link key={href} to={href}>
              <button
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                  accent
                    ? 'bg-accent text-bg border-accent hover:bg-accent-dim'
                    : 'border-border text-secondary hover:text-primary hover:border-border/80 bg-transparent'
                }`}
              >
                <Icon size={13} />
                {label}
              </button>
            </Link>
          ))}
        </div>

        {/* Recent transactions */}
        <Card variant="default" padding="none">
          <div className="px-4 pt-4 pb-3 flex items-center justify-between">
            <CardTitle>Recent transactions</CardTitle>
            <Link to="/history">
              <Button variant="ghost" size="sm">View all</Button>
            </Link>
          </div>

          {isConnected ? (
            <div>
              {txIsDemo && (
                <div className="px-4 pb-2">
                  <Badge variant="warning">DEMO — Connect Supabase for real data</Badge>
                </div>
              )}
              {txLoading ? (
                [1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 border-t border-border">
                    <Skeleton className="w-7 h-7 rounded-md flex-shrink-0" />
                    <div className="flex-1 flex flex-col gap-1.5">
                      <Skeleton className="h-3.5 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-3.5 w-20" />
                  </div>
                ))
              ) : recentTxs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center border-t border-border">
                  <p className="text-sm text-secondary">No transactions yet</p>
                  <Link to="/buy-usdc" className="mt-2">
                    <Button variant="ghost" size="sm">Buy USDC</Button>
                  </Link>
                </div>
              ) : (
                recentTxs.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 px-4 py-3 border-t border-border hover:bg-elevated/40 transition-colors"
                  >
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${
                      tx.type === 'send' ? 'bg-danger/10' : 'bg-elevated'
                    }`}>
                      {tx.type === 'send' ? (
                        <Send size={13} className="text-danger" />
                      ) : (
                        <ArrowDownToLine size={13} className="text-secondary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-primary">{tx.label}</p>
                      <p className="text-xs text-secondary truncate">{tx.sub}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm font-medium tabular ${tx.amount.startsWith('+') ? 'text-success' : 'text-danger'}`}>
                        {tx.amount}
                      </p>
                      <p className="text-xs text-secondary">{tx.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center border-t border-border">
              <p className="text-sm text-secondary">Connect your wallet to see transactions</p>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  )
}
