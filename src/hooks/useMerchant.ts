// ─────────────────────────────────────────────────────────────────────────────
// useMerchant
// Loads all invoices for the current merchant and provides create helpers.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react'
import {
  getAllInvoicesForMerchant,
  createInvoice,
} from '@/server/routes/invoiceService'
import type { Invoice } from '@/server/routes/invoiceService'

const DEMO_MERCHANT_ID = 'demo-merchant'
const DEMO_MERCHANT_NAME = 'My Business'

export interface UseMerchantReturn {
  invoices: Invoice[]
  loading: boolean
  error: string | null
  isDemo: boolean
  createNewInvoice: (params: {
    recipientAddress: string
    description: string
    amountUsdc: number
    reference?: string
    memo?: string
    expiryHours?: number
  }) => Invoice | null
  refresh: () => void
}

export function useMerchant(): UseMerchantReturn {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rev, setRev] = useState(0)

  useEffect(() => {
    const result = getAllInvoicesForMerchant(DEMO_MERCHANT_ID)
    queueMicrotask(() => {
      setLoading(false)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setInvoices(result.data)
    })
  }, [rev])

  const createNewInvoice = useCallback(
    (params: {
      recipientAddress: string
      description: string
      amountUsdc: number
      reference?: string
      memo?: string
      expiryHours?: number
    }): Invoice | null => {
      const result = createInvoice({
        merchantId: DEMO_MERCHANT_ID,
        merchantName: DEMO_MERCHANT_NAME,
        ...params,
      })
      if (!result.ok) {
        setError(result.error)
        return null
      }
      setRev((r) => r + 1)
      return result.data
    },
    [],
  )

  return {
    invoices,
    loading,
    error,
    isDemo: true,
    createNewInvoice,
    refresh: () => setRev((r) => r + 1),
  }
}
