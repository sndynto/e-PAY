// ─────────────────────────────────────────────────────────────────────────────
// useTransactions
// Loads transaction history from Supabase (if configured) or returns
// an empty list with an isDemo flag so the UI can show the right state.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase'

export interface TransactionRecord {
  id: string
  type: 'buy' | 'send' | 'receive' | 'invoice_paid' | 'invoice_received'
  status: 'pending' | 'completed' | 'failed' | 'requires_review'
  usdc_amount: number
  idr_amount?: number
  description?: string
  reference_id?: string
  reference_type?: string
  blockchain_tx?: { tx_hash: string; chain_id: number } | null
  created_at: string
}

export interface UseTransactionsReturn {
  transactions: TransactionRecord[]
  loading: boolean
  error: string | null
  isDemo: boolean
  refresh: () => void
}

export function useTransactions(userId?: string): UseTransactionsReturn {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rev, setRev] = useState(0)

  const isDemo = !isSupabaseConfigured() || !userId

  useEffect(() => {
    if (isDemo) {
      queueMicrotask(() => setLoading(false))
      return
    }

    queueMicrotask(() => setLoading(true))
    const supabase = getSupabaseClient()
    void supabase
      .from('transaction_records')
      .select(`
        id,
        type,
        status,
        usdc_amount,
        idr_amount,
        description,
        reference_id,
        reference_type,
        created_at,
        blockchain_transactions (
          tx_hash,
          chain_id
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data, error: err }) => {
        queueMicrotask(() => {
          setLoading(false)
          if (err) {
            setError(err.message)
            return
          }
          setTransactions((data) ?? [])
        })
      })
  }, [userId, isDemo, rev])

  return {
    transactions,
    loading,
    error,
    isDemo,
    refresh: () => setRev((r) => r + 1),
  }
}
