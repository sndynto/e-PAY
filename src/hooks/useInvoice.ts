// ─────────────────────────────────────────────────────────────────────────────
// useInvoice
// Loads an invoice and manages the Pay with USDC flow for a customer.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react'
import {
  getInvoice,
  markInvoicePaymentPending,
  verifyInvoicePayment,
} from '@/server/routes/invoiceService'
import type { Invoice } from '@/server/routes/invoiceService'

export type InvoicePayStage = 'loading' | 'ready' | 'pending' | 'verifying' | 'paid' | 'error' | 'not_found'

export interface UseInvoiceReturn {
  invoice: Invoice | null
  stage: InvoicePayStage
  error: string | null
  pay: (params: { payerAddress: string; txHash: string }) => Promise<void>
}

export function useInvoice(invoiceId: string | undefined): UseInvoiceReturn {
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [stage, setStage] = useState<InvoicePayStage>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!invoiceId) {
      queueMicrotask(() => setStage('not_found'))
      return
    }
    const result = getInvoice(invoiceId)
    queueMicrotask(() => {
      if (!result.ok) {
        setStage('not_found')
        return
      }
      setInvoice(result.data)
      const s = result.data.status
      if (s === 'PAID' || s === 'OVERPAID') setStage('paid')
      else if (s === 'OPEN') setStage('ready')
      else if (s === 'PAYMENT_PENDING') setStage('pending')
      else setStage('error')
    })
  }, [invoiceId])

  const pay = useCallback(
    async (params: { payerAddress: string; txHash: string }) => {
      if (!invoice) return
      setStage('pending')
      setError(null)

      const pendingResult = markInvoicePaymentPending(invoice.id, params)
      if (!pendingResult.ok) {
        setStage('error')
        setError(pendingResult.error)
        return
      }
      setInvoice(pendingResult.data)
      setStage('verifying')

      // Verify onchain
      const verifyResult = await verifyInvoicePayment(invoice.id)
      if (!verifyResult.ok) {
        setStage('error')
        setError(verifyResult.error)
        return
      }
      setInvoice(verifyResult.data)
      setStage('paid')
    },
    [invoice],
  )

  return { invoice, stage, error, pay }
}
