import { useParams, Link } from 'react-router-dom'
import { Wallet, CheckCircle2, XCircle, ArrowRight, AlertCircle, ExternalLink, Clock } from 'lucide-react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId, useSwitchChain } from 'wagmi'
import { ConnectKitButton } from 'connectkit'
import { type Address } from 'viem'
import { PublicLayout } from '@/components/layout/AppLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EPayLogo } from '@/components/ui/EPayLogo'
import { formatUSDC, formatDateTime } from '@/lib/format'
import { getUsdc, buildTxExplorerUrl } from '@/onchain-facts'
import { getConfig } from '@/server/types'
import { useInvoice } from '@/hooks/useInvoice'
import { unitsToUsdc } from '@/server/routes/purchaseService'
import { useState, useEffect } from 'react'

const ERC20_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const

export function InvoicePage() {
  const { id } = useParams<{ id: string }>()
  const { isConnected, address } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const config = getConfig()
  const arcChainId = config.arcChainId
  const usdcFact = getUsdc(arcChainId)
  const isDemo = config.arcNetworkMode === 'demo'
  const isOnArc = chainId === arcChainId

  const { invoice, stage, error, pay } = useInvoice(id)
  const { writeContractAsync } = useWriteContract()
  const [pendingHash, setPendingHash] = useState<`0x${string}` | undefined>()
  const { data: receipt } = useWaitForTransactionReceipt({ hash: pendingHash, confirmations: 1 })

  useEffect(() => {
    if (receipt && address && stage === 'pending') {
      void pay({ payerAddress: address, txHash: receipt.transactionHash })
    }
  }, [receipt, address, stage, pay])

  async function handlePay() {
    if (!invoice || !address || !usdcFact) return
    if (isDemo) {
      const demoHash = `0xDEMO${Date.now().toString(16).padStart(60, '0')}`
      await pay({ payerAddress: address, txHash: demoHash })
      return
    }
    try {
      const hash = await writeContractAsync({
        address: usdcFact.address as Address,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [invoice.recipientAddress as Address, BigInt(invoice.amountUsdc)],
        chainId: arcChainId,
      })
      setPendingHash(hash)
    } catch (err) {
      console.error('[E-PAY] invoice pay error:', err)
    }
  }

  const displayAmount = invoice ? unitsToUsdc(invoice.amountUsdc) : '—'
  const isPaid = stage === 'paid'
  const isExpired = invoice?.status === 'EXPIRED'

  return (
    <PublicLayout>
      <div className="max-w-sm mx-auto px-4 py-12">
        <div className="mb-8">
          <EPayLogo size="sm" />
        </div>

        {/* Loading */}
        {stage === 'loading' && (
          <div className="flex items-center gap-3 py-8">
            <div className="w-5 h-5 rounded-full border border-accent border-t-transparent animate-spin flex-shrink-0" />
            <p className="text-sm text-secondary">Loading invoice...</p>
          </div>
        )}

        {/* Not found */}
        {stage === 'not_found' && (
          <div className="py-8">
            <XCircle size={24} className="text-danger mb-3" />
            <h2 className="text-lg font-semibold text-primary mb-2">Invoice not found</h2>
            <p className="text-sm text-secondary">This invoice does not exist or has been removed.</p>
          </div>
        )}

        {/* Paid */}
        {isPaid && invoice && (
          <div className="py-4">
            <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center mb-4">
              <CheckCircle2 size={18} className="text-success" />
            </div>
            <h2 className="text-lg font-semibold text-primary mb-1">Payment received</h2>
            <p className="text-sm text-secondary mb-5">
              {formatUSDC(Number(displayAmount))} USDC delivered to {invoice.merchantName}.
            </p>
            {isDemo && <Badge variant="warning" className="mb-4">DEMO MODE — No real funds moved</Badge>}
            {invoice.paidAt && (
              <p className="text-xs text-secondary mb-4">Paid {formatDateTime(invoice.paidAt)}</p>
            )}
            {invoice.paymentTxHash && !isDemo && (
              <a
                href={buildTxExplorerUrl(invoice.chainId, invoice.paymentTxHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-accent hover:underline mb-5"
              >
                <ExternalLink size={12} />
                View on explorer
              </a>
            )}
            <Link to="/dashboard">
              <Button fullWidth>Back to dashboard</Button>
            </Link>
          </div>
        )}

        {/* Open invoice */}
        {invoice && !isPaid && stage !== 'loading' && stage !== 'not_found' && (
          <Card variant="default" padding="lg">
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-xs text-secondary uppercase tracking-widest mb-0.5">Invoice</p>
                <p className="mono text-xs text-secondary">{invoice.id}</p>
                {invoice.reference && (
                  <p className="text-xs text-secondary/50 mt-0.5">Ref: {invoice.reference}</p>
                )}
              </div>
              <Badge
                variant={
                  isExpired ? 'danger'
                  : invoice.status === 'OPEN' ? 'warning'
                  : invoice.status === 'PAYMENT_PENDING' ? 'muted'
                  : 'success'
                }
                dot={invoice.status === 'OPEN'}
              >
                {isExpired ? 'Expired' : invoice.status === 'OPEN' ? 'Awaiting payment' : invoice.status}
              </Badge>
            </div>

            {/* Amount */}
            <div className="mb-5">
              <p className="text-3xl font-semibold text-primary tabular" style={{ letterSpacing: '-0.02em' }}>
                {formatUSDC(Number(displayAmount))}{' '}
                <span className="text-secondary text-xl font-normal">USDC</span>
              </p>
            </div>

            {/* Details */}
            <div className="flex flex-col gap-2 mb-5 border-t border-border pt-4">
              {[
                { label: 'Merchant', value: invoice.merchantName },
                { label: 'For', value: invoice.description },
                { label: 'To', value: `${invoice.recipientAddress.slice(0, 10)}…${invoice.recipientAddress.slice(-6)}` },
                { label: 'Network', value: 'Arc Testnet' },
                ...(invoice.expiresAt ? [{ label: 'Expires', value: formatDateTime(invoice.expiresAt) }] : []),
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-secondary">{label}</span>
                  <span className={`text-primary ${label === 'To' ? 'mono text-xs' : ''}`}>{value}</span>
                </div>
              ))}
              {invoice.memo && (
                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-secondary mb-1">Memo</p>
                  <p className="text-sm text-primary">{invoice.memo}</p>
                </div>
              )}
            </div>

            {isDemo && <Badge variant="warning" className="mb-4">DEMO MODE — Not a real transaction</Badge>}

            {error && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg border border-danger/20 mb-4">
                <AlertCircle size={13} className="text-danger flex-shrink-0 mt-0.5" />
                <p className="text-sm text-danger">{error}</p>
              </div>
            )}

            {!isExpired && (
              <>
                {!isConnected ? (
                  <ConnectKitButton.Custom>
                    {({ show }) => (
                      <Button onClick={show} fullWidth>
                        <Wallet size={15} />
                        Connect wallet to pay
                      </Button>
                    )}
                  </ConnectKitButton.Custom>
                ) : !isOnArc && !isDemo ? (
                  <Button onClick={() => switchChain({ chainId: arcChainId })} fullWidth variant="secondary">
                    Switch to Arc Testnet
                  </Button>
                ) : stage === 'pending' || stage === 'verifying' ? (
                  <div className="flex items-center gap-3 py-4">
                    <div className="w-5 h-5 rounded-full border border-accent border-t-transparent animate-spin flex-shrink-0" />
                    <p className="text-sm text-secondary">
                      {stage === 'pending' ? 'Transaction submitted...' : 'Verifying onchain...'}
                    </p>
                  </div>
                ) : (
                  <Button onClick={() => void handlePay()} fullWidth>
                    Pay {formatUSDC(Number(displayAmount))} USDC
                    <ArrowRight size={15} />
                  </Button>
                )}
              </>
            )}

            {isExpired && (
              <div className="flex items-center gap-2 py-3 text-sm text-danger">
                <Clock size={14} />
                This invoice has expired
              </div>
            )}
          </Card>
        )}

        <p className="text-xs text-secondary/40 mt-6">
          Secured by E-PAY · Powered by Arc &amp; USDC
        </p>
      </div>
    </PublicLayout>
  )
}
