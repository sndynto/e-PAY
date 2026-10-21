import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowRight, Wallet, AlertCircle, CheckCircle2, ExternalLink, XCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId, useSwitchChain } from 'wagmi'
import { ConnectKitButton } from 'connectkit'
import { parseUnits, type Address } from 'viem'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { formatUSDC } from '@/lib/format'
import { getUsdc, requireChain, buildTxExplorerUrl } from '@/onchain-facts'
import { getConfig } from '@/server/types'

const ERC20_TRANSFER_ABI = [
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

const schema = z.object({
  recipient: z
    .string()
    .regex(/^0x[0-9a-fA-F]{40}$/, 'Enter a valid EVM wallet address'),
  amount: z
    .string()
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Enter a valid amount')
    .refine((v) => Number(v) >= 0.01, 'Minimum 0.01 USDC'),
  memo: z.string().max(100, 'Max 100 characters').optional(),
})

type FormData = z.infer<typeof schema>
type TxStage = 'idle' | 'signing' | 'confirming' | 'success' | 'error'

export function PayWithUSDCPage() {
  const { isConnected, address } = useAccount()
  const navigate = useNavigate()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const [txStage, setTxStage] = useState<TxStage>('idle')
  const [txError, setTxError] = useState<string | null>(null)
  const [submittedHash, setSubmittedHash] = useState<`0x${string}` | undefined>()
  const [verifiedHash, setVerifiedHash] = useState<string | undefined>()
  const [isDemo] = useState(() => getConfig().arcNetworkMode === 'demo')

  const { writeContractAsync } = useWriteContract()
  const { data: receipt } = useWaitForTransactionReceipt({ hash: submittedHash, confirmations: 1 })

  const config = getConfig()
  const arcChainId = config.arcChainId
  const usdcFact = getUsdc(arcChainId)
  const arcChain = requireChain(arcChainId)
  const isOnArcChain = chainId === arcChainId

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const amount = watch('amount', '')
  const recipient = watch('recipient', '')

  if (receipt && txStage === 'confirming' && !verifiedHash) {
    setVerifiedHash(receipt.transactionHash)
    setTxStage('success')
  }

  const onSubmit = useCallback(async (data: FormData) => {
    if (!usdcFact) {
      setTxError('USDC contract not found for this chain')
      setTxStage('error')
      return
    }
    if (isDemo) {
      setTxStage('signing')
      await new Promise<void>((r) => setTimeout(r, 800))
      setTxStage('confirming')
      await new Promise<void>((r) => setTimeout(r, 1200))
      setVerifiedHash(`0xDEMO${Date.now().toString(16).padStart(60, '0')}`)
      setTxStage('success')
      return
    }

    setTxStage('signing')
    setTxError(null)
    try {
      const amountUnits = parseUnits(data.amount, usdcFact.decimals)
      const hash = await writeContractAsync({
        address: usdcFact.address as Address,
        abi: ERC20_TRANSFER_ABI,
        functionName: 'transfer',
        args: [data.recipient as Address, amountUnits],
        chainId: arcChainId,
      })
      setSubmittedHash(hash)
      setTxStage('confirming')
    } catch (err) {
      const msg = err instanceof Error
        ? err.message.includes('User rejected') ? 'Transaction rejected in wallet' : err.message
        : 'Transaction failed'
      setTxError(msg)
      setTxStage('error')
    }
  }, [usdcFact, isDemo, writeContractAsync, arcChainId])

  function resetForm() {
    setTxStage('idle')
    setTxError(null)
    setSubmittedHash(undefined)
    setVerifiedHash(undefined)
  }

  // Success
  if (txStage === 'success' && verifiedHash) {
    const explorerUrl = isDemo ? null : buildTxExplorerUrl(arcChainId, verifiedHash)

    return (
      <AppLayout>
        <div className="max-w-sm mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mb-4">
              <CheckCircle2 size={22} className="text-success" />
            </div>
            <h1 className="text-xl font-semibold text-primary tracking-tight mb-1" style={{ letterSpacing: '-0.015em' }}>Sent</h1>
            <p className="text-sm text-secondary">
              {formatUSDC(Number(amount))} USDC to {recipient.slice(0, 8)}…{recipient.slice(-6)}
            </p>
          </div>

          {isDemo && <Badge variant="warning" className="mb-5">DEMO MODE — No real funds moved</Badge>}

          <Card variant="default" padding="md" className="mb-5">
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-secondary">Amount</span>
                <span className="text-primary tabular">{formatUSDC(Number(amount))} USDC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Network</span>
                <span className="text-primary">{arcChain.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Tx hash</span>
                <span className="mono text-xs text-secondary">{verifiedHash.slice(0, 10)}…{verifiedHash.slice(-6)}</span>
              </div>
            </div>
            {explorerUrl && (
              <a href={explorerUrl} target="_blank" rel="noopener noreferrer"
                className="mt-3 flex items-center gap-1.5 text-xs text-accent hover:underline">
                <ExternalLink size={12} />
                View on explorer
              </a>
            )}
          </Card>

          <div className="flex flex-col gap-2">
            <Button onClick={resetForm} variant="secondary" fullWidth>Send another</Button>
            <Button onClick={() => void navigate('/history')} fullWidth>
              View history <ArrowRight size={14} />
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-primary tracking-tight mb-1" style={{ letterSpacing: '-0.015em' }}>
            Pay with USDC
          </h1>
          <p className="text-sm text-secondary">Send USDC to any wallet on {arcChain.name}</p>
        </div>

        {!isConnected && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-lg border border-border mb-5">
            <AlertCircle size={15} className="text-secondary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-primary mb-2">Connect a wallet to send USDC</p>
              <ConnectKitButton.Custom>
                {({ show }) => (
                  <Button onClick={show} size="sm" variant="secondary">
                    <Wallet size={13} />
                    Connect wallet
                  </Button>
                )}
              </ConnectKitButton.Custom>
            </div>
          </div>
        )}

        {isDemo && <Badge variant="warning" className="mb-4">DEMO MODE — Transactions are simulated</Badge>}

        {isConnected && !isOnArcChain && !isDemo && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-lg border border-border mb-5">
            <AlertCircle size={15} className="text-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-primary mb-2">Switch to {arcChain.name} to send USDC</p>
              <Button size="sm" variant="secondary" onClick={() => switchChain({ chainId: arcChainId })}>
                Switch network
              </Button>
            </div>
          </div>
        )}

        {(txStage === 'signing' || txStage === 'confirming') && (
          <Card variant="elevated" padding="md" className="mb-4 flex items-center gap-3">
            <div className="w-6 h-6 rounded-full border border-accent border-t-transparent animate-spin flex-shrink-0" />
            <div>
              <p className="text-sm text-primary">
                {txStage === 'signing' ? 'Confirm in wallet...' : 'Confirming onchain...'}
              </p>
              <p className="text-xs text-secondary">
                {txStage === 'signing' ? 'Approve the transaction in your wallet.' : 'Waiting for Arc Testnet confirmation.'}
              </p>
            </div>
          </Card>
        )}

        {txStage === 'error' && txError && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg border border-danger/20 mb-4">
            <XCircle size={14} className="text-danger flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-danger">{txError}</p>
              <button onClick={resetForm} className="text-xs text-secondary hover:text-primary mt-1 underline">
                Try again
              </button>
            </div>
          </div>
        )}

        <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} noValidate className="flex flex-col gap-4">
          <Card variant="default" padding="lg">
            <div className="flex flex-col gap-4">
              <Input
                label="Recipient address"
                type="text"
                placeholder="0x..."
                error={errors.recipient?.message}
                hint={`EVM address on ${arcChain.name}`}
                className="mono text-sm"
                {...register('recipient')}
              />
              <Input
                label="Amount (USDC)"
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                step="0.01"
                min="0.01"
                error={errors.amount?.message}
                suffix={<span className="text-xs text-secondary">USDC</span>}
                {...register('amount')}
              />
              <Input
                label="Memo (optional)"
                type="text"
                placeholder="Payment for..."
                error={errors.memo?.message}
                {...register('memo')}
              />
            </div>
          </Card>

          {amount && recipient && !errors.amount && !errors.recipient && (
            <Card variant="elevated" padding="md">
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-secondary">Amount</span>
                  <span className="text-primary tabular">{formatUSDC(Number(amount))} USDC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Network fee</span>
                  <span className="text-success text-xs">Paid in USDC</span>
                </div>
                {address && (
                  <div className="flex justify-between">
                    <span className="text-secondary">From</span>
                    <span className="mono text-xs text-secondary">{address.slice(0, 8)}…{address.slice(-6)}</span>
                  </div>
                )}
              </div>
            </Card>
          )}

          <Button
            type="submit"
            loading={txStage === 'signing' || txStage === 'confirming'}
            disabled={!isConnected || txStage === 'signing' || txStage === 'confirming'}
            fullWidth
            size="lg"
          >
            {isConnected ? (isDemo ? 'Send USDC (demo)' : 'Send USDC') : 'Connect wallet to send'}
            {isConnected && <ArrowRight size={15} />}
          </Button>
        </form>
      </div>
    </AppLayout>
  )
}
