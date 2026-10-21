// ─────────────────────────────────────────────────────────────────────────────
// usePurchaseFlow
// Manages the Buy USDC state machine from the React side.
// Calls the server-side services (which use demo adapters until configured).
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useCallback, useRef } from 'react'
import { requestQuote } from '@/server/routes/quoteService'
import {
  createPurchaseIntent,
  checkPaymentStatus,
  confirmFulfillment,
  demoSimulatePayment,
} from '@/server/routes/purchaseService'
import type { PurchaseIntent } from '@/server/routes/purchaseService'
import type { QuoteResult } from '@/server/types'

export type PurchaseFlowStage =
  | 'idle'
  | 'quoting'
  | 'quoted'
  | 'creating_intent'
  | 'awaiting_payment'
  | 'verifying_payment'
  | 'fulfilling'
  | 'complete'
  | 'error'

export interface PurchaseFlowState {
  stage: PurchaseFlowStage
  quote: (QuoteResult & { isDemo: boolean }) | null
  intent: PurchaseIntent | null
  error: string | null
  isDemo: boolean
}

const DEMO_USER_ID = 'demo-user-local'

export function usePurchaseFlow(recipientAddress: string) {
  const [state, setState] = useState<PurchaseFlowState>({
    stage: 'idle',
    quote: null,
    intent: null,
    error: null,
    isDemo: true,
  })

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }, [])

  /** Step 1: Request a quote for a given IDR amount */
  const fetchQuote = useCallback(async (idrAmount: number) => {
    setState((s) => ({ ...s, stage: 'quoting', error: null, quote: null }))
    const result = await requestQuote(idrAmount)
    if (!result.ok) {
      setState((s) => ({ ...s, stage: 'error', error: result.error }))
      return
    }
    setState((s) => ({ ...s, stage: 'quoted', quote: result.data }))
  }, [])

  /** Poll for payment confirmation — defined before createIntent to avoid immutability lint */
  function startPollingPayment(intentId: string) {
    pollingRef.current = setInterval(() => {
      void (async () => {
        const result = await checkPaymentStatus(intentId)
        if (!result.ok) return

        const intent = result.data
        const { status } = intent

        if (status === 'FULFILLMENT_SUBMITTED' || status === 'FULFILLMENT_CONFIRMED') {
          stopPolling()
          setState((s) => ({ ...s, stage: 'fulfilling', intent }))
          const confirmResult = await confirmFulfillment(intentId)
          if (confirmResult.ok) {
            setState((s) => ({ ...s, stage: 'complete', intent: confirmResult.data }))
          } else {
            setState((s) => ({ ...s, stage: 'error', error: confirmResult.error, intent }))
          }
        } else if (status === 'PAYMENT_FAILED' || status === 'EXPIRED' || status === 'FULFILLMENT_FAILED') {
          stopPolling()
          setState((s) => ({ ...s, stage: 'error', error: intent.errorMessage ?? status, intent }))
        } else if (status === 'PAYMENT_CONFIRMED') {
          setState((s) => ({ ...s, stage: 'verifying_payment', intent }))
        }
      })()
    }, 2000)
  }

  /** Step 2: Create a purchase intent and payment session */
  const createIntent = useCallback(async (quote: QuoteResult & { isDemo: boolean }) => {
    if (!recipientAddress) {
      setState((s) => ({ ...s, stage: 'error', error: 'No recipient wallet address' }))
      return
    }
    setState((s) => ({ ...s, stage: 'creating_intent', error: null }))
    const idempotencyKey = `buy-${quote.idrAmount}-${Date.now()}`
    const result = await createPurchaseIntent({
      userId: DEMO_USER_ID,
      recipientAddress,
      idrAmount: quote.idrAmount,
      quote,
      idempotencyKey,
    })
    if (!result.ok) {
      setState((s) => ({ ...s, stage: 'error', error: result.error }))
      return
    }
    setState((s) => ({
      ...s,
      stage: 'awaiting_payment',
      intent: result.data,
      isDemo: result.data.isDemo,
    }))
    startPollingPayment(result.data.id)
  }, [recipientAddress]) // eslint-disable-line react-hooks/exhaustive-deps

  /** Demo-only: simulate the user scanning and paying the QRIS code */
  const simulateDemoPayment = useCallback((intentId: string) => {
    demoSimulatePayment(intentId)
  }, [])

  const reset = useCallback(() => {
    stopPolling()
    setState({ stage: 'idle', quote: null, intent: null, error: null, isDemo: true })
  }, [stopPolling])

  return { state, fetchQuote, createIntent, simulateDemoPayment, reset, stopPolling }
}
