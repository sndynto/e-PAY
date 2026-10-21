// ─────────────────────────────────────────────────────────────────────────────
// E-PAY Server Types
// Shared types for state machines, adapter interfaces, and API contracts.
// RPC and contract addresses are always read from environment or onchain-facts.
// ─────────────────────────────────────────────────────────────────────────────

// ── Purchase intent state machine ────────────────────────────────────────────

export type PurchaseIntentStatus =
  | 'CREATED'
  | 'QUOTED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_CONFIRMED'
  | 'FULFILLMENT_PENDING'
  | 'FULFILLMENT_SUBMITTED'
  | 'FULFILLMENT_CONFIRMED'
  | 'COMPLETED'
  | 'EXPIRED'
  | 'PAYMENT_FAILED'
  | 'FULFILLMENT_FAILED'
  | 'REQUIRES_REVIEW'

export const TERMINAL_PURCHASE_STATES: readonly PurchaseIntentStatus[] = [
  'COMPLETED', 'EXPIRED', 'PAYMENT_FAILED', 'FULFILLMENT_FAILED', 'REQUIRES_REVIEW',
]

export function isPurchaseTerminal(s: PurchaseIntentStatus): boolean {
  return (TERMINAL_PURCHASE_STATES as readonly string[]).includes(s)
}

// ── Invoice state machine ─────────────────────────────────────────────────────

export type InvoiceStatus =
  | 'DRAFT'
  | 'OPEN'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_CONFIRMED'
  | 'PAID'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'UNDERPAID'
  | 'OVERPAID'
  | 'REQUIRES_REVIEW'

export const TERMINAL_INVOICE_STATES: readonly InvoiceStatus[] = [
  'PAID', 'EXPIRED', 'CANCELLED', 'REQUIRES_REVIEW',
]

export function isInvoiceTerminal(s: InvoiceStatus): boolean {
  return (TERMINAL_INVOICE_STATES as readonly string[]).includes(s)
}

// ── Monetary units ────────────────────────────────────────────────────────────

/** IDR minor units (integer — 1 IDR = 1 unit) */
export type IDRUnits = number

/** USDC base units (integer — 1 USDC = 1_000_000 units, 6 decimals) */
export type USDCUnits = number

/** Convert decimal USDC display value to integer base units (no floats) */
export function usdcToUnits(amount: number | string): USDCUnits {
  const str = String(amount)
  const [whole = '0', frac = ''] = str.split('.')
  const padded = frac.padEnd(6, '0').slice(0, 6)
  return parseInt(whole, 10) * 1_000_000 + parseInt(padded, 10)
}

/** Convert USDC base units to decimal display string */
export function unitsToUsdc(units: number): string {
  const str = String(Math.round(units)).padStart(7, '0')
  const whole = str.slice(0, -6) || '0'
  const frac = str.slice(-6).replace(/0+$/, '') || '0'
  return `${whole}.${frac}`
}

// ── Quote provider interface ──────────────────────────────────────────────────

export interface QuoteResult {
  provider: string
  /** Integer IDR */
  idrAmount: number
  /** Integer USDC base units */
  usdcAmount: number
  /** Integer IDR fee */
  feeIdr: number
  /** IDR per 1 USDC — for display only */
  exchangeRate: number
  expiresAt: Date
  providerRef?: string
}

export interface QuoteProviderAdapter {
  readonly name: string
  getQuote(idrAmount: number): Promise<QuoteResult>
}

// ── Payment provider interface ────────────────────────────────────────────────

export interface PaymentSessionResult {
  provider: string
  sessionId: string
  /** Hosted checkout URL, if the provider supports it */
  sessionUrl?: string
  /** Raw QRIS EMV string (set only when provider returns one) */
  qrisPayload?: string
  /** Provider-hosted QR image URL */
  qrisImageUrl?: string
  expiresAt: Date
}

export interface PaymentStatusResult {
  sessionId: string
  status: 'PENDING' | 'CONFIRMED' | 'FAILED' | 'EXPIRED' | 'REFUNDED'
  /** Integer IDR paid amount, present when status=CONFIRMED */
  paidAmount?: number
  providerRef?: string
  confirmedAt?: Date
}

export interface PaymentProviderAdapter {
  readonly name: string
  createSession(params: {
    intentId: string
    idrAmount: number
    description: string
    expiresAt: Date
  }): Promise<PaymentSessionResult>
  getStatus(sessionId: string): Promise<PaymentStatusResult>
  verifyWebhookSignature(payload: string, signature: string): boolean
  parseWebhookEvent(payload: string): PaymentStatusResult
}

// ── Fulfillment provider interface ────────────────────────────────────────────

export interface FulfillmentResult {
  provider: string
  txHash: string
  status: 'SUBMITTED' | 'CONFIRMED' | 'FAILED'
  submittedAt: Date
}

export interface FulfillmentProviderAdapter {
  readonly name: string
  sendUsdc(params: {
    toAddress: string
    /** Integer USDC base units */
    usdcAmount: number
    intentId: string
  }): Promise<FulfillmentResult>
  getStatus(txHash: string): Promise<{ status: FulfillmentResult['status']; confirmedAt?: Date }>
}

// ── Blockchain adapter interface ──────────────────────────────────────────────

export interface VerifiedTransfer {
  txHash: string
  blockNumber: number
  fromAddress: string
  toAddress: string
  tokenContract: string
  /** Integer USDC base units */
  amount: number
  confirmedAt: Date
}

export interface BlockchainAdapterInterface {
  readonly chainId: number
  /** Checksummed USDC contract address — read from onchain-facts, never hard-coded */
  readonly usdcContract: string
  verifyTransfer(
    txHash: string,
    expectedTo: string,
    /** Integer USDC base units */
    expectedAmount: number
  ): Promise<VerifiedTransfer>
  getTransactionStatus(txHash: string): Promise<'PENDING' | 'CONFIRMED' | 'FAILED'>
}

// ── API response shapes ───────────────────────────────────────────────────────

export interface ApiSuccess<T = unknown> {
  ok: true
  data: T
}

export interface ApiError {
  ok: false
  error: string
  code?: string
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError

export function apiOk<T>(data: T): ApiSuccess<T> {
  return { ok: true, data }
}

export function apiErr(error: string, code?: string): ApiError {
  return { ok: false, error, code }
}

// ── Runtime config (read from import.meta.env, validated lazily) ─────────────

export interface EPayConfig {
  paymentProviderMode: 'demo' | 'midtrans' | 'xendit'
  quoteProviderMode: 'demo' | 'coingecko' | 'binance'
  fulfillmentProviderMode: 'demo' | 'hot_wallet'
  arcNetworkMode: 'demo' | 'live'
  arcChainId: number
}

export function getConfig(): EPayConfig {
  return {
    paymentProviderMode: ((import.meta.env.VITE_PAYMENT_PROVIDER_MODE as string | undefined) ?? 'demo') as EPayConfig['paymentProviderMode'],
    quoteProviderMode: ((import.meta.env.VITE_QUOTE_PROVIDER_MODE as string | undefined) ?? 'demo') as EPayConfig['quoteProviderMode'],
    fulfillmentProviderMode: ((import.meta.env.VITE_FULFILLMENT_PROVIDER_MODE as string | undefined) ?? 'demo') as EPayConfig['fulfillmentProviderMode'],
    arcNetworkMode: ((import.meta.env.VITE_ARC_NETWORK_MODE as string | undefined) ?? 'demo') as EPayConfig['arcNetworkMode'],
    arcChainId: Number((import.meta.env.VITE_ARC_CHAIN_ID as string | undefined) ?? '5042002'),
  }
}
