import { useState, useEffect, useCallback, useRef } from 'react'
import { ArrowRight, Info, RefreshCw, QrCode, CheckCircle2, AlertCircle, Wallet } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { formatIDR } from '@/lib/format'
import { useNavigate } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { ConnectKitButton } from 'connectkit'
import { usePurchaseFlow } from '@/hooks/usePurchaseFlow'
import { unitsToUsdc } from '@/server/routes/purchaseService'

const QUICK_AMOUNTS = [100_000, 250_000, 500_000, 1_000_000]

export function BuyUSDCPage() {
  const navigate = useNavigate()
  const { address, isConnected } = useAccount()
  const [idrAmount, setIdrAmount] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const recipientAddress = address ?? ''
  const { state, fetchQuote, createIntent, simulateDemoPayment, reset } = usePurchaseFlow(recipientAddress)

  const idrNum = Number(idrAmount.replace(/\D/g, '')) || 0

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (idrNum < 10_000) return
    debounceRef.current = setTimeout(() => { void fetchQuote(idrNum) }, 600)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [idrNum, fetchQuote])

  useEffect(() => {
    if (state.stage === 'complete' && state.intent) {
      void navigate('/purchase-status', {
        state: {
          status: 'success',
          intentId: state.intent.id,
          usdcAmount: Number(unitsToUsdc(state.intent.quote.usdcAmount)),
          idrAmount: state.intent.quote.idrAmount,
          txHash: state.intent.fulfillmentTxHash,
          isDemo: state.intent.isDemo,
        },
      })
    }
    if (state.stage === 'error' && state.intent) {
      void navigate('/purchase-status', {
        state: {
          status: 'failed',
          intentId: state.intent.id,
          usdcAmount: Number(unitsToUsdc(state.intent.quote.usdcAmount)),
          idrAmount: state.intent.quote.idrAmount,
          error: state.error,
          isDemo: state.intent.isDemo,
        },
      })
    }
  }, [state.stage, state.intent, navigate, state.error])

  function handleAmount(val: string) {
    const digits = val.replace(/\D/g, '')
    setIdrAmount(digits)
    reset()
  }

  const handleProceed = useCallback(async () => {
    if (!state.quote || !isConnected) return
    await createIntent(state.quote)
  }, [state.quote, isConnected, createIntent])

  const isLoadingQuote = state.stage === 'quoting'
  const hasQuote = state.stage === 'quoted' && state.quote
  const isProcessing = ['creating_intent','awaiting_payment','verifying_payment','fulfilling'].includes(state.stage)

  const quote = state.quote
  const displayUsdc = quote ? unitsToUsdc(quote.usdcAmount) : '0.00'
  const displayFee = quote ? formatIDR(quote.feeIdr) : '—'

  // QRIS checkout inline view
  if (isProcessing && state.intent?.paymentSessionId) {
    const intent = state.intent
    return (
      <AppLayout>
        <div className="max-w-sm mx-auto px-4 sm:px-6 py-8">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-primary tracking-tight mb-1" style={{ letterSpacing: '-0.015em' }}>
              QRIS Payment
            </h1>
            <p className="text-sm text-secondary">
              {state.stage === 'awaiting_payment' ? 'Scan with any QRIS-compatible app' :
               state.stage === 'verifying_payment' ? 'Verifying payment...' :
               'Delivering USDC...'}
            </p>
          </div>

          {intent.isDemo && (
            <Badge variant="warning" className="mb-5">
              DEMO MODE — No real payment processed
            </Badge>
          )}

          {state.stage === 'awaiting_payment' && (
            <>
              <Card variant="default" padding="lg" className="mb-4">
                <div className="flex flex-col items-center gap-4">
                  <div className="bg-white rounded-lg p-3 w-52 h-52 flex items-center justify-center">
                    <svg viewBox="0 0 60 60" width="192" height="192" xmlns="http://www.w3.org/2000/svg">
                      <rect x="2" y="2" width="16" height="16" fill="none" stroke="#090B0A" strokeWidth="2" rx="1"/>
                      <rect x="5" y="5" width="10" height="10" fill="#090B0A" rx="1"/>
                      <rect x="42" y="2" width="16" height="16" fill="none" stroke="#090B0A" strokeWidth="2" rx="1"/>
                      <rect x="45" y="5" width="10" height="10" fill="#090B0A" rx="1"/>
                      <rect x="2" y="42" width="16" height="16" fill="none" stroke="#090B0A" strokeWidth="2" rx="1"/>
                      <rect x="5" y="45" width="10" height="10" fill="#090B0A" rx="1"/>
                      {[[20,4],[24,4],[28,4],[20,8],[26,8],[30,8],[22,6],[28,6],[2,20],[8,20],[14,20],[20,20],[26,20],[32,20],[38,20],[44,20],[50,20],[56,20],[4,24],[10,24],[16,24],[22,24],[28,24],[34,24],[40,24],[46,24],[52,24],[58,24],[2,28],[8,28],[14,28],[20,28],[26,28],[32,28],[38,28],[44,28],[50,28],[56,28],[36,42],[42,42],[48,42],[36,46],[44,46],[50,46],[56,46],[38,50],[44,50],[52,50],[58,50]].map(([x,y])=>(
                        <rect key={`${x}-${y}`} x={x} y={y} width="2" height="2" fill="#090B0A"/>
                      ))}
                      <rect x="24" y="24" width="12" height="12" fill="#C7FF4A" rx="1"/>
                      <text x="30" y="33" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#090B0A">E</text>
                    </svg>
                  </div>
                  <p className="text-xs text-secondary">DEMO — Not a real QRIS code</p>
                </div>

                <div className="mt-4 border-t border-border pt-4 flex flex-col gap-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary">Pay</span>
                    <span className="text-primary">{formatIDR(intent.quote.idrAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary">Receive</span>
                    <span className="text-success tabular">{unitsToUsdc(intent.quote.usdcAmount)} USDC</span>
                  </div>
                </div>
              </Card>

              <div className="flex flex-col gap-2">
                <Button onClick={() => simulateDemoPayment(intent.id)} fullWidth>
                  Simulate payment (demo)
                </Button>
                <Button variant="ghost" onClick={reset} fullWidth>Cancel</Button>
              </div>
            </>
          )}

          {(state.stage === 'verifying_payment' || state.stage === 'fulfilling') && (
            <Card variant="default" padding="lg" className="flex flex-col items-center gap-3 py-12">
              <div className="w-8 h-8 rounded-full border border-accent border-t-transparent animate-spin" />
              <p className="text-sm text-primary">
                {state.stage === 'verifying_payment' ? 'Verifying payment...' : 'Delivering USDC...'}
              </p>
              <p className="text-xs text-secondary text-center">
                {state.stage === 'verifying_payment'
                  ? 'Confirming your QRIS payment with the provider.'
                  : 'Sending USDC to your wallet on Arc Testnet.'}
              </p>
            </Card>
          )}
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-primary tracking-tight mb-1" style={{ letterSpacing: '-0.015em' }}>
            Buy USDC
          </h1>
          <p className="text-sm text-secondary">Convert IDR to USDC via QRIS payment</p>
        </div>

        {!isConnected && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-lg border border-border mb-5">
            <AlertCircle size={15} className="text-secondary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-primary mb-2">Connect a wallet to receive USDC</p>
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

        {state.isDemo && (
          <Badge variant="warning" className="mb-4">
            DEMO MODE — Live rates &amp; real QRIS in production
          </Badge>
        )}

        {/* Amount */}
        <Card variant="default" padding="lg" className="mb-3">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-secondary uppercase tracking-widest">Amount</span>
            <div className="flex items-center gap-1.5 text-xs text-secondary">
              {isLoadingQuote ? (
                <div className="w-3 h-3 rounded-full border border-secondary/40 border-t-transparent animate-spin" />
              ) : (
                <RefreshCw size={11} />
              )}
              {quote ? `1 USDC = ${formatIDR(quote.exchangeRate)}` : 'Enter amount for rate'}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Input
              label="You pay (IDR)"
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={idrNum > 0 ? formatIDR(idrNum).replace('Rp\u00a0', 'Rp ') : ''}
              onChange={(e) => handleAmount(e.target.value)}
              prefix={<span className="text-sm text-secondary">Rp</span>}
            />

            <div className="flex gap-1.5 flex-wrap">
              {QUICK_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  onClick={() => { setIdrAmount(String(amt)); reset() }}
                  className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                    idrNum === amt
                      ? 'bg-accent text-bg border-accent'
                      : 'bg-elevated text-secondary border-border hover:text-primary'
                  }`}
                >
                  {formatIDR(amt)}
                </button>
              ))}
            </div>

            <div className="pt-3 border-t border-border">
              <p className="text-xs text-secondary uppercase tracking-widest mb-2">You receive</p>
              <p className="text-2xl font-semibold text-primary tabular" style={{ letterSpacing: '-0.015em' }}>
                {isLoadingQuote ? (
                  <span className="text-secondary text-base font-normal">Fetching rate...</span>
                ) : (
                  <>
                    {displayUsdc} <span className="text-secondary text-base font-normal">USDC</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </Card>

        {/* Fee breakdown */}
        {(hasQuote || isLoadingQuote) && idrNum > 0 && (
          <Card variant="elevated" padding="md" className="mb-4">
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-secondary">IDR amount</span>
                <span className="text-primary tabular">{formatIDR(idrNum)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary flex items-center gap-1">
                  Processing fee
                  <Info size={11} className="text-secondary/40" />
                </span>
                <span className="text-primary tabular">— {displayFee}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="text-secondary">USDC received</span>
                <span className="text-success tabular">{displayUsdc} USDC</span>
              </div>
              {quote?.expiresAt && (
                <p className="text-xs text-secondary/40 text-right">
                  Rate valid until {new Date(quote.expiresAt).toLocaleTimeString()}
                </p>
              )}
            </div>
          </Card>
        )}

        {/* Error */}
        {state.stage === 'error' && state.error && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg border border-danger/20 mb-4">
            <AlertCircle size={14} className="text-danger flex-shrink-0 mt-0.5" />
            <p className="text-sm text-danger">{state.error}</p>
          </div>
        )}

        {/* QRIS info */}
        <div className="flex items-start gap-2.5 px-3 py-3 rounded-lg border border-border mb-5">
          <QrCode size={15} className="text-secondary flex-shrink-0 mt-0.5" />
          <p className="text-xs text-secondary leading-relaxed">
            A QRIS code will appear after confirming. Scan with GoPay, OVO, Dana, ShopeePay, or any Indonesian bank app.
          </p>
        </div>

        <Button
          onClick={() => void handleProceed()}
          loading={state.stage === 'creating_intent'}
          disabled={!hasQuote || !isConnected || isProcessing}
          fullWidth
          size="lg"
        >
          {state.stage === 'quoting' ? 'Getting rate...' : 'Proceed to payment'}
          {state.stage !== 'quoting' && <ArrowRight size={15} />}
        </Button>

        {idrNum > 0 && idrNum < 10_000 && (
          <p className="text-xs text-danger text-center mt-2">Minimum: {formatIDR(10_000)}</p>
        )}

        {state.stage === 'complete' && (
          <div className="mt-4 flex items-center justify-center gap-2 text-success">
            <CheckCircle2 size={15} />
            <span className="text-sm">USDC delivered!</span>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
