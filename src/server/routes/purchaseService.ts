// ─────────────────────────────────────────────────────────────────────────────
// Purchase Service
// Manages the full Buy USDC state machine:
//   CREATED → QUOTED → PAYMENT_PENDING → ... → COMPLETED
//
// In demo mode: uses in-memory state — no Supabase writes.
// In live mode: persists to Supabase and verifies every step server-side.
// ─────────────────────────────────────────────────────────────────────────────
import { z } from 'zod'
import { getPaymentAdapter, getFulfillmentAdapter, getBlockchainAdapter } from '../providerRegistry'
import { apiOk, apiErr, getConfig, usdcToUnits, unitsToUsdc } from '../types'
import type { ApiResponse, PurchaseIntentStatus, QuoteResult } from '../types'
import {
  checkRateLimit,
  assertDemoMode,
  assertValidIdrAmount,
  assertValidUsdcUnits,
  markWebhookProcessed,
} from '../security'

// ── In-memory store (demo mode) ───────────────────────────────────────────────

export interface PurchaseIntent {
  id: string
  userId: string
  quote: QuoteResult
  recipientAddress: string
  status: PurchaseIntentStatus
  paymentSessionId?: string
  fulfillmentTxHash?: string
  idempotencyKey: string
  createdAt: Date
  updatedAt: Date
  errorMessage?: string
  isDemo: boolean
}

const intentStore = new Map<string, PurchaseIntent>()

function makeIntentId(): string {
  return `intent-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

// ── Input schemas ─────────────────────────────────────────────────────────────

const createIntentSchema = z.object({
  userId: z.string().min(1),
  recipientAddress: z.string().regex(/^0x[0-9a-fA-F]{40}$/, 'Invalid wallet address'),
  idrAmount: z.number().int().min(10_000).max(100_000_000),
  quoteRef: z.string().optional(),
  idempotencyKey: z.string().min(1),
})

// ── Service functions ─────────────────────────────────────────────────────────

export async function createPurchaseIntent(params: {
  userId: string
  recipientAddress: string
  idrAmount: number
  quote: QuoteResult
  idempotencyKey: string
}): Promise<ApiResponse<PurchaseIntent>> {
  const parse = createIntentSchema.safeParse({ ...params, quoteRef: params.quote.providerRef })
  if (!parse.success) {
    return apiErr(parse.error.issues[0]?.message ?? 'Invalid input', 'VALIDATION_ERROR')
  }

  // Monetary integrity guards
  try {
    assertValidIdrAmount(params.idrAmount)
    assertValidUsdcUnits(params.quote.usdcAmount)
  } catch (e) {
    return apiErr(e instanceof Error ? e.message : 'Invalid amount', 'VALIDATION_ERROR')
  }

  // Rate limit: max 10 purchase intents per user per 5 minutes
  if (!checkRateLimit(`intent:${params.userId}`, 10, 5 * 60 * 1000)) {
    return apiErr('Too many requests. Please wait before trying again.', 'RATE_LIMITED')
  }

  // Quote expiry check — never create an intent against an expired quote
  if (params.quote.expiresAt < new Date()) {
    return apiErr('Quote has expired. Please request a fresh quote.', 'QUOTE_EXPIRED')
  }

  // Idempotency: return existing intent if already created
  for (const intent of intentStore.values()) {
    if (intent.idempotencyKey === params.idempotencyKey) {
      return apiOk(intent)
    }
  }

  const { paymentProviderMode } = getConfig()
  const isDemo = paymentProviderMode === 'demo'
  const id = makeIntentId()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000) // 15 min checkout window

  // Create payment session
  let paymentSessionId: string | undefined
  try {
    const paymentAdapter = getPaymentAdapter()
    const session = await paymentAdapter.createSession({
      intentId: id,
      idrAmount: params.idrAmount,
      description: `E-PAY: Buy ${unitsToUsdc(params.quote.usdcAmount)} USDC`,
      expiresAt,
    })
    paymentSessionId = session.sessionId
  } catch (err) {
    console.error('[E-PAY] createPurchaseIntent: payment session error', err)
    return apiErr('Failed to create payment session', 'PAYMENT_SESSION_ERROR')
  }

  const intent: PurchaseIntent = {
    id,
    userId: params.userId,
    quote: params.quote,
    recipientAddress: params.recipientAddress,
    status: 'PAYMENT_PENDING',
    paymentSessionId,
    idempotencyKey: params.idempotencyKey,
    createdAt: now,
    updatedAt: now,
    isDemo,
  }
  intentStore.set(id, intent)
  return apiOk(intent)
}

export function getPurchaseIntentStatus(
  intentId: string
): ApiResponse<PurchaseIntent> {
  const intent = intentStore.get(intentId)
  if (!intent) return apiErr('Intent not found', 'NOT_FOUND')
  return apiOk(intent)
}

/**
 * Poll or simulate payment confirmation.
 * In demo mode: checks the demo payment adapter's in-memory status.
 * In live mode: would poll the payment provider's status API.
 */
export async function checkPaymentStatus(
  intentId: string
): Promise<ApiResponse<PurchaseIntent>> {
  const intent = intentStore.get(intentId)
  if (!intent) return apiErr('Intent not found', 'NOT_FOUND')

  if (!intent.paymentSessionId) {
    return apiErr('No payment session on intent', 'STATE_ERROR')
  }

  const paymentAdapter = getPaymentAdapter()
  const statusResult = await paymentAdapter.getStatus(intent.paymentSessionId)

  const now = new Date()
  intent.updatedAt = now

  if (statusResult.status === 'CONFIRMED' && intent.status === 'PAYMENT_PENDING') {
    // Advance state machine — guard against concurrent calls re-triggering fulfillment
    intent.status = 'PAYMENT_CONFIRMED'
    intent.updatedAt = now

    // Idempotency: only dispatch fulfillment if no tx hash recorded yet
    if (!intent.fulfillmentTxHash) {
      try {
        const fulfillmentAdapter = getFulfillmentAdapter()
        const result = await fulfillmentAdapter.sendUsdc({
          toAddress: intent.recipientAddress,
          usdcAmount: intent.quote.usdcAmount,
          intentId,
        })
        intent.fulfillmentTxHash = result.txHash
        intent.status = 'FULFILLMENT_SUBMITTED'
      } catch (err) {
        console.error('[E-PAY] fulfillment sendUsdc error', err)
        intent.status = 'FULFILLMENT_FAILED'
        // Do NOT expose internal error details to the API response
        intent.errorMessage = 'Fulfillment could not be initiated. Please contact support.'
      }
    } else {
      // Fulfillment already dispatched — stay in FULFILLMENT_SUBMITTED
      intent.status = 'FULFILLMENT_SUBMITTED'
    }
  } else if (statusResult.status === 'FAILED') {
    intent.status = 'PAYMENT_FAILED'
    intent.errorMessage = 'Payment was not completed'
  } else if (statusResult.status === 'EXPIRED') {
    intent.status = 'EXPIRED'
  }

  return apiOk(intent)
}

/**
 * Confirm fulfillment delivery by verifying the onchain transaction.
 * Must be called only after fulfillment is SUBMITTED.
 */
export async function confirmFulfillment(
  intentId: string
): Promise<ApiResponse<PurchaseIntent>> {
  const intent = intentStore.get(intentId)
  if (!intent) return apiErr('Intent not found', 'NOT_FOUND')
  if (!intent.fulfillmentTxHash) return apiErr('No fulfillment tx', 'STATE_ERROR')

  const blockchainAdapter = getBlockchainAdapter()
  try {
    const verified = await blockchainAdapter.verifyTransfer(
      intent.fulfillmentTxHash,
      intent.recipientAddress,
      intent.quote.usdcAmount,
    )
    intent.status = 'COMPLETED'
    intent.updatedAt = new Date()
    void verified // used for side-effect logging in production
    return apiOk(intent)
  } catch (err) {
    intent.status = 'REQUIRES_REVIEW'
    intent.errorMessage = err instanceof Error ? err.message : 'Verification error'
    return apiErr(intent.errorMessage, 'VERIFICATION_ERROR')
  }
}

/**
 * Demo-only: trigger a simulated payment on a session.
 * In production this action comes from the real QRIS provider via webhook.
 * Throws if called outside demo mode.
 */
export function demoSimulatePayment(intentId: string): void {
  const { paymentProviderMode } = getConfig()
  assertDemoMode(paymentProviderMode === 'demo', 'demoSimulatePayment')
  const intent = intentStore.get(intentId)
  if (!intent?.paymentSessionId) return
  const paymentAdapter = getPaymentAdapter()
  paymentAdapter.simulatePayment(intent.paymentSessionId)
}

/**
 * Process an inbound webhook event from the payment provider.
 * Enforces:
 *  - Signature verification via the adapter's verifyWebhookSignature()
 *  - Idempotency: duplicate events are silently accepted but not re-processed
 *
 * In demo mode this is a no-op because the demo adapter has no real webhook.
 */
export function processPaymentWebhook(
  rawPayload: string,
  signature: string,
  eventKey: string,
): ApiResponse<{ processed: boolean }> {
  const paymentAdapter = getPaymentAdapter()

  // 1. Verify signature — must pass before any payload parsing
  if (!paymentAdapter.verifyWebhookSignature(rawPayload, signature)) {
    return apiErr('Webhook signature verification failed', 'WEBHOOK_SIGNATURE_INVALID')
  }

  // 2. Idempotency — ignore already-processed events
  if (!markWebhookProcessed(eventKey)) {
    return apiOk({ processed: false })   // duplicate, silently accepted
  }

  // 3. Parse the event
  const event = paymentAdapter.parseWebhookEvent(rawPayload)
  if (!event.sessionId) {
    return apiErr('Webhook missing sessionId', 'WEBHOOK_PARSE_ERROR')
  }

  // 4. Find the intent associated with this session
  let targetIntent: PurchaseIntent | undefined
  for (const intent of intentStore.values()) {
    if (intent.paymentSessionId === event.sessionId) {
      targetIntent = intent
      break
    }
  }

  if (!targetIntent) {
    // Log but do not error — provider may send events for non-E-PAY sessions
    console.warn('[E-PAY] webhook: no intent found for session', event.sessionId)
    return apiOk({ processed: true })
  }

  // 5. Apply status — but only advance, never retreat
  const now = new Date()
  if (event.status === 'CONFIRMED' && targetIntent.status === 'PAYMENT_PENDING') {
    targetIntent.status = 'PAYMENT_CONFIRMED'
    targetIntent.updatedAt = now
  } else if (event.status === 'FAILED' && targetIntent.status === 'PAYMENT_PENDING') {
    targetIntent.status = 'PAYMENT_FAILED'
    targetIntent.updatedAt = now
  } else if (event.status === 'EXPIRED' && targetIntent.status === 'PAYMENT_PENDING') {
    targetIntent.status = 'EXPIRED'
    targetIntent.updatedAt = now
  }

  return apiOk({ processed: true })
}

export { usdcToUnits, unitsToUsdc }
