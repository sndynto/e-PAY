// ─────────────────────────────────────────────────────────────────────────────
// Quote Service
// Validates input, calls the configured quote adapter, and returns
// a structured result. Called client-side in a Vite+React app.
// ─────────────────────────────────────────────────────────────────────────────
import { z } from 'zod'
import { getQuoteAdapter } from '../providerRegistry'
import { apiOk, apiErr, getConfig } from '../types'
import type { ApiResponse, QuoteResult } from '../types'

const quoteSchema = z.object({
  idrAmount: z
    .number()
    .int('IDR amount must be an integer')
    .min(10_000, 'Minimum amount is Rp 10,000')
    .max(100_000_000, 'Maximum amount is Rp 100,000,000'),
})

export async function requestQuote(
  idrAmount: number
): Promise<ApiResponse<QuoteResult & { isDemo: boolean }>> {
  const parse = quoteSchema.safeParse({ idrAmount })
  if (!parse.success) {
    return apiErr(parse.error.issues[0]?.message ?? 'Invalid amount', 'VALIDATION_ERROR')
  }

  try {
    const adapter = getQuoteAdapter()
    const result = await adapter.getQuote(parse.data.idrAmount)
    const { quoteProviderMode } = getConfig()
    return apiOk({ ...result, isDemo: quoteProviderMode === 'demo' })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to get quote'
    console.error('[E-PAY] requestQuote error:', err)
    return apiErr(msg, 'QUOTE_ERROR')
  }
}
