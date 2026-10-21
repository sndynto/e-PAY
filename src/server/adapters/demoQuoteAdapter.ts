// ─────────────────────────────────────────────────────────────────────────────
// Demo Quote Adapter
// Returns a plausible static IDR/USDC rate with a short TTL.
// Clearly labeled — never used for real transactions.
// Replace with a live FX API (CoinGecko, Binance, etc.) for production.
// ─────────────────────────────────────────────────────────────────────────────
import type { QuoteProviderAdapter, QuoteResult } from '../types'

// Static reference rate: 1 USDC ≈ Rp 16,200 (mid-2026 demo value)
// Do NOT use for live transactions — fetch a real rate from a verified provider.
const DEMO_RATE_IDR_PER_USDC = 16_200
const DEMO_FEE_RATE = 0.005   // 0.5 %
const TTL_SECONDS = 300

export class DemoQuoteAdapter implements QuoteProviderAdapter {
  readonly name = 'demo'

  async getQuote(idrAmount: number): Promise<QuoteResult> {
    if (!Number.isInteger(idrAmount) || idrAmount <= 0) {
      throw new Error('idrAmount must be a positive integer')
    }
    const MIN_IDR = 10_000
    const MAX_IDR = 100_000_000
    if (idrAmount < MIN_IDR) throw new Error(`Minimum amount is Rp ${MIN_IDR.toLocaleString('id-ID')}`)
    if (idrAmount > MAX_IDR) throw new Error(`Maximum amount is Rp ${MAX_IDR.toLocaleString('id-ID')}`)

    const feeIdr = Math.floor(idrAmount * DEMO_FEE_RATE)
    const netIdr = idrAmount - feeIdr
    // Integer USDC base units: (netIdr / rate) * 1_000_000, rounded down
    const usdcAmount = Math.floor((netIdr / DEMO_RATE_IDR_PER_USDC) * 1_000_000)

    const expiresAt = new Date(Date.now() + TTL_SECONDS * 1000)

    // Artificial latency to simulate a real network round-trip
    await new Promise<void>((r) => setTimeout(r, 120))

    return {
      provider: this.name,
      idrAmount,
      usdcAmount,
      feeIdr,
      exchangeRate: DEMO_RATE_IDR_PER_USDC,
      expiresAt,
      providerRef: `demo-quote-${Date.now()}`,
    }
  }
}
