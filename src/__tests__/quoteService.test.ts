// ─────────────────────────────────────────────────────────────────────────────
// Unit tests: quote service
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect, vi } from 'vitest'
import { requestQuote } from '@/server/routes/quoteService'

describe('requestQuote', () => {
  it('returns a valid quote for a typical IDR amount', async () => {
    const result = await requestQuote(100_000)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.idrAmount).toBe(100_000)
    expect(result.data.usdcAmount).toBeGreaterThan(0)
    expect(result.data.feeIdr).toBeGreaterThanOrEqual(0)
    expect(result.data.exchangeRate).toBeGreaterThan(0)
    expect(result.data.expiresAt).toBeInstanceOf(Date)
    expect(result.data.isDemo).toBe(true)
  })

  it('returns usdcAmount as a positive integer', async () => {
    const result = await requestQuote(50_000)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(Number.isInteger(result.data.usdcAmount)).toBe(true)
    expect(result.data.usdcAmount).toBeGreaterThan(0)
  })

  it('rejects below minimum (< 10,000)', async () => {
    const result = await requestQuote(9_999)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('VALIDATION_ERROR')
  })

  it('rejects above maximum (> 100,000,000)', async () => {
    const result = await requestQuote(100_000_001)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('VALIDATION_ERROR')
  })

  it('rejects non-integer IDR', async () => {
    const result = await requestQuote(15_000.5)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('VALIDATION_ERROR')
  })

  it('quote expires in the future', async () => {
    const before = new Date()
    const result = await requestQuote(20_000)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.expiresAt.getTime()).toBeGreaterThan(before.getTime())
  })

  it('fee is not negative', async () => {
    const result = await requestQuote(100_000)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.feeIdr).toBeGreaterThanOrEqual(0)
  })

  it('labels result as demo', async () => {
    const result = await requestQuote(10_000)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.isDemo).toBe(true)
  })
})
