// ─────────────────────────────────────────────────────────────────────────────
// Unit tests: invoice service state machine
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest'
import {
  createInvoice,
  getInvoice,
  getAllInvoicesForMerchant,
  markInvoicePaymentPending,
  verifyInvoicePayment,
} from '@/server/routes/invoiceService'

const MERCHANT_ID = `test-merchant-${Date.now()}`
const MERCHANT_NAME = 'Test Merchant'
const RECIPIENT = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
// Each test that calls markInvoicePaymentPending generates its own unique hash
// so the shared in-memory store never confuses hashes between tests.
function uniqueHash(suffix: string): string {
  return `0xDEMO${suffix.padStart(60, '0').slice(0, 60)}`
}

let _invCounter = 0
function makeInvoice(overrides?: Record<string, unknown>) {
  _invCounter++
  // description must be unique to avoid the rate-limiter bucketing multiple
  // invoice creations as the same operation in the shared in-memory store
  return createInvoice({
    merchantId: MERCHANT_ID,
    merchantName: MERCHANT_NAME,
    recipientAddress: RECIPIENT,
    description: `Test invoice description ${_invCounter}`,
    amountUsdc: 10,  // 10 USDC
    ...overrides,
  })
}

describe('createInvoice', () => {
  it('creates an OPEN invoice', () => {
    const result = makeInvoice()
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.status).toBe('OPEN')
    expect(result.data.amountUsdc).toBe(10_000_000)  // 10 USDC in base units
    expect(result.data.isDemo).toBe(true)
  })

  it('rejects invalid recipient address', () => {
    const result = makeInvoice({ recipientAddress: 'not-an-address' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('VALIDATION_ERROR')
  })

  it('rejects negative amount', () => {
    const result = makeInvoice({ amountUsdc: -1 })
    expect(result.ok).toBe(false)
  })

  it('rejects zero amount', () => {
    const result = makeInvoice({ amountUsdc: 0 })
    expect(result.ok).toBe(false)
  })

  it('rejects blank description', () => {
    const result = makeInvoice({ description: 'ab' })   // < 3 chars
    expect(result.ok).toBe(false)
  })

  it('sets expiry when expiryHours provided', () => {
    const result = makeInvoice({ expiryHours: 24 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.expiresAt).toBeInstanceOf(Date)
  })
})

describe('getInvoice', () => {
  it('returns NOT_FOUND for unknown id', () => {
    const result = getInvoice('nonexistent-id')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('NOT_FOUND')
  })

  it('auto-expires an overdue invoice on read', () => {
    const inv = createInvoice({
      merchantId: MERCHANT_ID,
      merchantName: MERCHANT_NAME,
      recipientAddress: RECIPIENT,
      description: 'Expiry test invoice',
      amountUsdc: 5,
      expiryHours: 720,   // far future first — then we'll read the result
    })
    expect(inv.ok).toBe(true)
    if (!inv.ok) return
    // The returned data object IS the same reference stored in the Map
    // (the in-memory store returns the live object)
    // Backdate expiresAt on the returned reference to simulate past expiry
    const live = inv.data
    live.expiresAt = new Date(Date.now() - 1000)
    // Now reading must trigger the auto-expire branch
    const result = getInvoice(live.id)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.status).toBe('EXPIRED')
  })
})

describe('getAllInvoicesForMerchant', () => {
  it('returns only the merchant\'s own invoices', () => {
    const otherId = 'other-merchant'
    createInvoice({ merchantId: otherId, merchantName: 'Other', recipientAddress: RECIPIENT, description: 'Other invoice', amountUsdc: 1 })
    const result = getAllInvoicesForMerchant(otherId)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    for (const inv of result.data) {
      expect(inv.merchantId).toBe(otherId)
    }
  })
})

describe('markInvoicePaymentPending', () => {
  it('advances status to PAYMENT_PENDING', () => {
    const inv = makeInvoice()
    expect(inv.ok).toBe(true)
    if (!inv.ok) return
    const result = markInvoicePaymentPending(inv.data.id, {
      payerAddress: '0x1111111111111111111111111111111111111111',
      txHash: uniqueHash('pending-advances-test'),
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.status).toBe('PAYMENT_PENDING')
    expect(result.data.paymentTxHash).toBe(uniqueHash('pending-advances-test'))
  })

  it('rejects if invoice is already PAYMENT_PENDING (not OPEN)', () => {
    const inv = makeInvoice()
    if (!inv.ok) return
    markInvoicePaymentPending(inv.data.id, { payerAddress: RECIPIENT, txHash: uniqueHash('already-pending-1') })
    const second = markInvoicePaymentPending(inv.data.id, { payerAddress: RECIPIENT, txHash: uniqueHash('already-pending-2') })
    expect(second.ok).toBe(false)
    if (second.ok) return
    expect(second.code).toBe('INVALID_STATE')
  })

  it('rejects cross-invoice tx hash replay', () => {
    // Use a time-unique hash to avoid collisions with other tests in the shared store
    const sharedTxHash = `0xDEMO${Date.now().toString(16).padStart(60, '9')}`
    const inv1 = makeInvoice()
    const inv2 = makeInvoice()
    expect(inv1.ok).toBe(true)
    expect(inv2.ok).toBe(true)
    if (!inv1.ok || !inv2.ok) return
    const r1 = markInvoicePaymentPending(inv1.data.id, { payerAddress: RECIPIENT, txHash: sharedTxHash })
    expect(r1.ok).toBe(true)
    const r2 = markInvoicePaymentPending(inv2.data.id, { payerAddress: RECIPIENT, txHash: sharedTxHash })
    expect(r2.ok).toBe(false)
    if (r2.ok) return
    expect(r2.code).toBe('REPLAY_DETECTED')
  })

  it('rejects invalid tx hash format', () => {
    const inv = makeInvoice()
    if (!inv.ok) return
    const result = markInvoicePaymentPending(inv.data.id, { payerAddress: RECIPIENT, txHash: 'not-a-hash' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('VALIDATION_ERROR')
  })
})

describe('verifyInvoicePayment', () => {
  it('marks a demo invoice as PAID', async () => {
    const inv = createInvoice({
      merchantId: MERCHANT_ID,
      merchantName: MERCHANT_NAME,
      recipientAddress: RECIPIENT,
      description: 'Verify payment test',
      amountUsdc: 5,
    })
    expect(inv.ok).toBe(true)
    if (!inv.ok) return
    const pendingHash = uniqueHash('verify-paid-test')
    const markResult = markInvoicePaymentPending(inv.data.id, { payerAddress: RECIPIENT, txHash: pendingHash })
    expect(markResult.ok).toBe(true)
    const verifyResult = await verifyInvoicePayment(inv.data.id)
    expect(verifyResult.ok).toBe(true)
    if (!verifyResult.ok) return
    expect(verifyResult.data.status).toBe('PAID')
    expect(verifyResult.data.paidAt).toBeInstanceOf(Date)
  })

  it('rejects double-credit (same tx hash on two invoices)', async () => {
    const sharedHash = uniqueHash('double-credit-test')
    const inv1 = createInvoice({ merchantId: MERCHANT_ID, merchantName: MERCHANT_NAME, recipientAddress: RECIPIENT, description: 'Double credit inv 1', amountUsdc: 2 })
    if (!inv1.ok) return
    markInvoicePaymentPending(inv1.data.id, { payerAddress: RECIPIENT, txHash: sharedHash })
    await verifyInvoicePayment(inv1.data.id)  // first credit — should succeed

    // Now create a second invoice and try to credit the same hash
    const inv2 = createInvoice({ merchantId: MERCHANT_ID, merchantName: MERCHANT_NAME, recipientAddress: RECIPIENT, description: 'Double credit inv 2', amountUsdc: 2 })
    if (!inv2.ok) return
    // The cross-invoice check should fire at markInvoicePaymentPending time
    const r = markInvoicePaymentPending(inv2.data.id, { payerAddress: RECIPIENT, txHash: sharedHash })
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.code).toBe('REPLAY_DETECTED')
  })

  it('rejects if invoice is not PAYMENT_PENDING', async () => {
    const inv = makeInvoice()
    if (!inv.ok) return
    const result = await verifyInvoicePayment(inv.data.id)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('INVALID_STATE')
  })

  it('rejects expired invoice', () => {
    const inv = createInvoice({
      merchantId: MERCHANT_ID, merchantName: MERCHANT_NAME, recipientAddress: RECIPIENT,
      description: 'Expired invoice test', amountUsdc: 1, expiryHours: 0.0001,
    })
    if (!inv.ok) return
    inv.data.expiresAt = new Date(Date.now() - 1000)  // force expired
    const hash = uniqueHash('expired-invoice-test')
    const markResult = markInvoicePaymentPending(inv.data.id, { payerAddress: RECIPIENT, txHash: hash })
    // Should be rejected because the invoice is expired
    expect(markResult.ok).toBe(false)
  })
})

describe('demo mode labeling', () => {
  it('invoice.isDemo is true in demo mode', () => {
    const inv = makeInvoice()
    expect(inv.ok).toBe(true)
    if (!inv.ok) return
    expect(inv.data.isDemo).toBe(true)
  })
})
