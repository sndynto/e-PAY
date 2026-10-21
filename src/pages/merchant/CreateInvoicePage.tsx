import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link2, Copy, CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { formatUSDC } from '@/lib/format'
import { buildShareLink } from '@/lib/share'
import { useMerchant } from '@/hooks/useMerchant'
import { QRCodeSVG } from 'qrcode.react'
import type { Invoice } from '@/server/routes/invoiceService'
import { unitsToUsdc } from '@/server/routes/purchaseService'

const schema = z.object({
  description: z.string().min(3, 'Enter a description').max(200),
  amount: z
    .string()
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 0.01, 'Minimum 0.01 USDC'),
  recipientAddress: z
    .string()
    .regex(/^0x[0-9a-fA-F]{40}$/, 'Enter a valid EVM wallet address'),
  expiryHours: z.string().optional(),
  memo: z.string().max(200).optional(),
})

type FormData = z.infer<typeof schema>

interface CreatedState {
  invoice: Invoice
  link: string
}

export function CreateInvoicePage() {
  const { createNewInvoice, isDemo } = useMerchant()
  const [created, setCreated] = useState<CreatedState | null>(null)
  const [copied, setCopied] = useState(false)
  const [creating, setCreating] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const amount = watch('amount', '')
  const description = watch('description', '')

  async function onSubmit(data: FormData): Promise<void> {
    setCreating(true)
    setServerError(null)
    const invoice = createNewInvoice({
      recipientAddress: data.recipientAddress,
      description: data.description,
      amountUsdc: Number(data.amount),
      expiryHours: data.expiryHours ? Number(data.expiryHours) : undefined,
      memo: data.memo,
    })
    if (!invoice) {
      setServerError('Failed to create invoice. Please try again.')
      setCreating(false)
      return
    }
    const link = await buildShareLink(`/invoice/${invoice.id}`)
    setCreated({ invoice, link })
    setCreating(false)
  }

  function copyLink() {
    if (!created) return
    void navigator.clipboard.writeText(created.link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <AppLayout role="merchant">
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-8">
        {!created ? (
          <>
            <div className="mb-6">
              <h1 className="text-xl font-semibold text-primary tracking-tight mb-1" style={{ letterSpacing: '-0.015em' }}>
                Create invoice
              </h1>
              <p className="text-sm text-secondary">Generate a hosted payment link for your customers</p>
            </div>

            {isDemo && (
              <Badge variant="warning" className="mb-5">
                DEMO MODE — Invoices stored in memory, not persisted
              </Badge>
            )}

            {serverError && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg border border-danger/20 mb-4">
                <AlertCircle size={14} className="text-danger flex-shrink-0 mt-0.5" />
                <p className="text-sm text-danger">{serverError}</p>
              </div>
            )}

            <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} noValidate>
              <Card variant="default" padding="lg" className="mb-4">
                <div className="flex flex-col gap-4">
                  <Input
                    label="Description"
                    placeholder="Website design services"
                    error={errors.description?.message}
                    {...register('description')}
                  />
                  <Input
                    label="Amount (USDC)"
                    type="number"
                    inputMode="decimal"
                    placeholder="0.00"
                    step="0.01"
                    error={errors.amount?.message}
                    suffix={<span className="text-xs text-secondary">USDC</span>}
                    {...register('amount')}
                  />
                  <Input
                    label="Your wallet address"
                    placeholder="0x..."
                    error={errors.recipientAddress?.message}
                    hint="USDC will be sent directly to this address"
                    className="mono text-sm"
                    {...register('recipientAddress')}
                  />
                  <Input
                    label="Expires in (hours)"
                    type="number"
                    placeholder="72"
                    hint="Leave blank for no expiry"
                    {...register('expiryHours')}
                  />
                  <Input
                    label="Memo (optional)"
                    placeholder="Additional notes for the customer"
                    {...register('memo')}
                  />
                </div>
              </Card>

              {amount && description && !errors.amount && !errors.description && (
                <div className="border-l-2 border-accent pl-4 py-1 mb-4">
                  <p className="text-sm text-primary">{description}</p>
                  <p className="text-lg font-semibold text-primary tabular mt-0.5" style={{ letterSpacing: '-0.015em' }}>
                    {formatUSDC(Number(amount))} USDC
                  </p>
                </div>
              )}

              <Button type="submit" loading={creating} fullWidth>
                Create invoice
                <ArrowRight size={15} />
              </Button>
            </form>
          </>
        ) : (
          <>
            <div className="mb-6">
              <div className="w-9 h-9 rounded-full bg-success/10 flex items-center justify-center mb-4">
                <CheckCircle2 size={17} className="text-success" />
              </div>
              <h1 className="text-xl font-semibold text-primary tracking-tight mb-1" style={{ letterSpacing: '-0.015em' }}>
                Invoice created
              </h1>
              <p className="text-sm text-secondary">Share the link below with your customer.</p>
            </div>

            <Card variant="default" padding="lg" className="mb-5">
              <div className="flex flex-col gap-2 text-sm mb-5">
                <div className="flex justify-between">
                  <span className="text-secondary">Invoice ID</span>
                  <span className="mono text-xs text-primary">{created.invoice.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Amount</span>
                  <span className="text-primary tabular">
                    {formatUSDC(Number(unitsToUsdc(created.invoice.amountUsdc)))} USDC
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Description</span>
                  <span className="text-primary">{created.invoice.description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Status</span>
                  <Badge variant="warning" dot>Open</Badge>
                </div>
              </div>

              <div className="border-t border-border pt-5 mb-5">
                <p className="text-xs text-secondary uppercase tracking-widest mb-2">Payment link</p>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-elevated border border-border">
                  <Link2 size={13} className="text-secondary flex-shrink-0" />
                  <span className="text-xs text-secondary flex-1 truncate">{created.link}</span>
                  <button onClick={copyLink} className="text-secondary hover:text-primary transition-colors flex-shrink-0" aria-label="Copy link">
                    {copied ? <CheckCircle2 size={13} className="text-success" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>

              <div className="border-t border-border pt-5">
                <p className="text-xs text-secondary uppercase tracking-widest mb-3">QR code</p>
                <div className="flex justify-center">
                  <div className="bg-white rounded-lg p-3">
                    <QRCodeSVG value={created.link} size={160} bgColor="#ffffff" fgColor="#090B0A" level="M" />
                  </div>
                </div>
                <p className="text-xs text-secondary text-center mt-2">E-PAY invoice QR — not an official QRIS code</p>
              </div>

              {isDemo && (
                <p className="text-xs text-warning mt-4">DEMO MODE — invoice stored in memory only</p>
              )}
            </Card>

            <div className="flex flex-col gap-2">
              <Button onClick={copyLink} variant="secondary" fullWidth>
                <Copy size={14} />
                {copied ? 'Copied!' : 'Copy payment link'}
              </Button>
              <Link to="/merchant" className="w-full">
                <Button fullWidth>
                  Back to merchant <ArrowRight size={15} />
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}
