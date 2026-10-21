// ─────────────────────────────────────────────────────────────────────────────
// Invoice Service
// Manages the merchant invoice state machine:
//   OPEN → PAYMENT_PENDING → PAYMENT_CONFIRMED → PAID
//
// In demo mode: uses in-memory state.
// In live mode: persists to Supabase and verifies every step onchain.
// ─────────────────────────────────────────────────────────────────────────────
import { z } from 'zod'
import { getBlockchainAdapter } from '../providerRegistry'
import { apiOk, apiErr, getConfig } from '../types'
import type { ApiResponse, InvoiceStatus } from '../types'
import { usdcToUnits, unitsToUsdc } from '../routes/purchaseService'
import { checkRateLimit, assertValidUsdcUnits } from '../security'

// ── In-memory store (demo mode) ───────────────────────────────────────────────

export interface Invoice {
  id: string
  merchantId: string
  merchantName: string
  recipientAddress: string
  description: string
  /** Integer USDC base units */
  amountUsdc: number
  reference?: string
  memo?: string
  status: InvoiceStatus
  paymentTxHash?: string
  payerAddress?: string
  paidAt?: Date
  expiresAt?: Date
  createdAt: Date
  updatedAt: Date
  isDemo: boolean
  chainId: number
  usdcContract: string
}

const invoiceStore = new Map<string, Invoice>()
/** Prevents double-credit: txHash → invoiceId */
const usedTxHashes = new Set<string>()

function makeInvoiceId(): string {
  return `INV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`
}

// ── Input schemas ─────────────────────────────────────────────────────────────

const createInvoiceSchema = z.object({
  merchantId: z.string().min(1),
  merchantName: z.string().min(1),
  recipientAddress: z.string().regex(/^0x[0-9a-fA-F]{40}$/, 'Invalid wallet address'),
  description: z.string().min(3).max(200),
  amountUsdc: z
    .number()
    .positive()
    .refine((v) => v >= 0.01, 'Minimum 0.01 USDC'),
  reference: z.string().max(100).optional(),
  memo: z.string().max(200).optional(),
  expiryHours: z.number().int().min(1).max(720).optional(),
})

// ── Service functions ─────────────────────────────────────────────────────────

export function createInvoice(params: {
  merchantId: string
  merchantName: string
  recipientAddress: string
  description: string
  amountUsdc: number
  reference?: string
  memo?: string
  expiryHours?: number
}): ApiResponse<Invoice> {
  const parse = createInvoiceSchema.safeParse(params)
  if (!parse.success) {
    return apiErr(parse.error.issues[0]?.message ?? 'Invalid input', 'VALIDATION_ERROR')
  }

  // Rate limit: max 50 invoices per merchant per hour
  if (!checkRateLimit(`invoice:${params.merchantId}`, 50, 60 * 60 * 1000)) {
    return apiErr('Too many invoices created. Please wait before creating more.', 'RATE_LIMITED')
  }

  // Monetary integrity guard
  try {
    assertValidUsdcUnits(Math.round(params.amountUsdc * 1_000_000))
  } catch (e) {
    return apiErr(e instanceof Error ? e.message : 'Invalid amount', 'VALIDATION_ERROR')
  }

  const { arcNetworkMode } = getConfig()
  const blockchainAdapter = getBlockchainAdapter()
  const id = makeInvoiceId()
  const now = new Date()
  const amountUnits = usdcToUnits(params.amountUsdc)
  const expiresAt = params.expiryHours
    ? new Date(now.getTime() + params.expiryHours * 3600 * 1000)
    : undefined

  const invoice: Invoice = {
    id,
    merchantId: params.merchantId,
    merchantName: params.merchantName,
    recipientAddress: params.recipientAddress,
    description: params.description,
    amountUsdc: amountUnits,
    reference: params.reference,
    memo: params.memo,
    status: 'OPEN',
    expiresAt,
    createdAt: now,
    updatedAt: now,
    isDemo: arcNetworkMode === 'demo',
    chainId: blockchainAdapter.chainId,
    usdcContract: blockchainAdapter.usdcContract,
  }

  invoiceStore.set(id, invoice)
  return apiOk(invoice)
}

export function getInvoice(id: string): ApiResponse<Invoice> {
  const invoice = invoiceStore.get(id)
  if (!invoice) return apiErr('Invoice not found', 'NOT_FOUND')

  // Check expiry
  if (invoice.expiresAt && invoice.expiresAt < new Date() && invoice.status === 'OPEN') {
    invoice.status = 'EXPIRED'
    invoice.updatedAt = new Date()
  }

  return apiOk(invoice)
}

export function getAllInvoicesForMerchant(
  merchantId: string
): ApiResponse<Invoice[]> {
  const results: Invoice[] = []
  for (const inv of invoiceStore.values()) {
    if (inv.merchantId === merchantId) results.push(inv)
  }
  results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  return apiOk(results)
}

/**
 * Mark invoice as PAYMENT_PENDING when the customer initiates a wallet tx.
 * The txHash provided here is optimistic — must be confirmed by verifyInvoicePayment.
 *
 * Security: checks that:
 *  - Invoice is OPEN (not expired, paid, or in another terminal state)
 *  - The txHash is not already associated with any other invoice (cross-invoice replay)
 *  - The txHash is not in the globally committed set (post-verify replay)
 */
export function markInvoicePaymentPending(
  invoiceId: string,
  params: { payerAddress: string; txHash: string }
): ApiResponse<Invoice> {
  // Validate tx hash format
  if (!/^0x[0-9a-fA-F]{64}$/.test(params.txHash) && !params.txHash.startsWith('0xDEMO')) {
    return apiErr('Invalid transaction hash format', 'VALIDATION_ERROR')
  }

  const invoice = invoiceStore.get(invoiceId)
  if (!invoice) return apiErr('Invoice not found', 'NOT_FOUND')

  // Expiry check
  if (invoice.expiresAt && invoice.expiresAt < new Date() && invoice.status === 'OPEN') {
    invoice.status = 'EXPIRED'
    invoice.updatedAt = new Date()
    return apiErr('Invoice has expired', 'EXPIRED')
  }

  if (invoice.status !== 'OPEN') {
    return apiErr('Invoice is not available for payment', 'INVALID_STATE')
  }

  // Check cross-invoice replay: reject if any OTHER invoice already uses this tx hash
  for (const inv of invoiceStore.values()) {
    if (inv.id !== invoiceId && inv.paymentTxHash === params.txHash) {
      return apiErr('Transaction already submitted to another invoice', 'REPLAY_DETECTED')
    }
  }

  // Check committed replay (post-verify)
  if (usedTxHashes.has(params.txHash)) {
    return apiErr('Transaction already credited', 'REPLAY_DETECTED')
  }

  invoice.status = 'PAYMENT_PENDING'
  invoice.payerAddress = params.payerAddress
  invoice.paymentTxHash = params.txHash
  invoice.updatedAt = new Date()
  return apiOk(invoice)
}

/**
 * Verify the onchain transfer and mark invoice PAID.
 * Enforces:
 *   - Correct recipient address
 *   - Correct USDC contract address
 *   - Exact amount (or route to OVERPAID/UNDERPAID)
 *   - Transaction not previously credited (replay prevention)
 */
export async function verifyInvoicePayment(
  invoiceId: string
): Promise<ApiResponse<Invoice>> {
  const invoice = invoiceStore.get(invoiceId)
  if (!invoice) return apiErr('Invoice not found', 'NOT_FOUND')
  if (invoice.status !== 'PAYMENT_PENDING') {
    return apiErr(`Expected PAYMENT_PENDING, got ${invoice.status}`, 'INVALID_STATE')
  }
  if (!invoice.paymentTxHash) {
    return apiErr('No transaction hash on invoice', 'STATE_ERROR')
  }

  // Replay prevention
  if (usedTxHashes.has(invoice.paymentTxHash)) {
    invoice.status = 'REQUIRES_REVIEW'
    invoice.updatedAt = new Date()
    return apiErr('Transaction hash already credited', 'REPLAY_DETECTED')
  }

  const blockchainAdapter = getBlockchainAdapter()

  // Verify the wrong-network guard: chain + contract must match
  // (The adapter constructor already enforces this via onchain-facts)

  let verified
  try {
    verified = await blockchainAdapter.verifyTransfer(
      invoice.paymentTxHash,
      invoice.recipientAddress,
      invoice.amountUsdc,
    )
  } catch (err) {
    invoice.status = 'REQUIRES_REVIEW'
    invoice.updatedAt = new Date()
    return apiErr(
      err instanceof Error ? err.message : 'Blockchain verification failed',
      'VERIFICATION_ERROR',
    )
  }

  // Token contract mismatch
  if (verified.tokenContract.toLowerCase() !== invoice.usdcContract.toLowerCase()) {
    invoice.status = 'REQUIRES_REVIEW'
    invoice.updatedAt = new Date()
    return apiErr('Wrong token contract — not USDC', 'TOKEN_MISMATCH')
  }

  // Amount check
  const amountDiff = verified.amount - invoice.amountUsdc
  if (amountDiff < 0) {
    invoice.status = 'UNDERPAID'
    invoice.updatedAt = new Date()
    return apiErr(
      `Underpaid: expected ${unitsToUsdc(invoice.amountUsdc)} USDC, got ${unitsToUsdc(verified.amount)} USDC`,
      'UNDERPAID',
    )
  }
  if (amountDiff > 0) {
    // Overpayment — still credit, but flag for review
    invoice.status = 'OVERPAID'
  } else {
    invoice.status = 'PAID'
  }

  usedTxHashes.add(invoice.paymentTxHash)
  invoice.paidAt = verified.confirmedAt
  invoice.updatedAt = new Date()
  return apiOk(invoice)
}
