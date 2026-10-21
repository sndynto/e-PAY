// ─────────────────────────────────────────────────────────────────────────────
// E-PAY Security helpers
//
// ▸ Input sanitisation guards that mirror server-side validation.
// ▸ Safe URL redirect guard: only allows relative paths (never external redirects).
// ▸ Webhook idempotency key store (in-memory for demo; replace with DB in live).
// ▸ Rate-limiter shim: tracks call counts per key; prevents burst abuse.
// ▸ Demo-mode guard: throws if non-demo code paths are called in demo mode.
// ─────────────────────────────────────────────────────────────────────────────

// ── Safe redirect ─────────────────────────────────────────────────────────────

/** Only allow relative paths as post-auth redirect destinations. */
export function sanitizeRedirectPath(raw: string | null | undefined): string {
  if (!raw) return '/dashboard'
  // Must start with / and must NOT contain // (open redirect via //evil.com)
  // and must not contain protocol characters
  if (/^\/[^/]/.test(raw) && !/^\/\//u.test(raw) && !/[:\x00-\x1f]/u.test(raw)) {
    return raw
  }
  return '/dashboard'
}

// ── Idempotency store (in-memory — swap for Supabase provider_events in live) ─

const processedWebhookKeys = new Set<string>()

/**
 * Mark a webhook event as processed. Returns true if this is a new event,
 * false if it was already processed (duplicate/replay).
 */
export function markWebhookProcessed(key: string): boolean {
  if (processedWebhookKeys.has(key)) return false
  processedWebhookKeys.add(key)
  return true
}

export function isWebhookProcessed(key: string): boolean {
  return processedWebhookKeys.has(key)
}

// ── In-memory rate limiter (demo only; use Redis in production) ───────────────

interface RateLimitEntry {
  count: number
  windowStart: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

/**
 * Returns true if the action is allowed; false if the rate limit is exceeded.
 * @param key      Unique key per (user + action) e.g. "quote:demo-user-local"
 * @param limit    Max calls per window
 * @param windowMs Window duration in milliseconds
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = rateLimitStore.get(key)
  if (!entry || now - entry.windowStart > windowMs) {
    rateLimitStore.set(key, { count: 1, windowStart: now })
    return true
  }
  if (entry.count >= limit) return false
  entry.count++
  return true
}

// ── Demo mode guard ───────────────────────────────────────────────────────────

/**
 * Throw if the caller is trying to run live-only code while demo mode is active.
 * Use at the top of any function that must not run in demo mode.
 */
export function assertNotDemo(isDemo: boolean, context: string): void {
  if (isDemo) {
    throw new Error(`[E-PAY] "${context}" must not run in demo mode`)
  }
}

/**
 * Throw if the caller is trying to expose the demo simulate path while live
 * mode is active.
 */
export function assertDemoMode(isDemo: boolean, context: string): void {
  if (!isDemo) {
    throw new Error(`[E-PAY] "${context}" is only available in demo mode`)
  }
}

// ── Monetary safe-guard ───────────────────────────────────────────────────────

const MAX_IDR_SINGLE = 100_000_000   // Rp 100 million
const MIN_IDR_SINGLE = 10_000        // Rp 10 thousand
const MAX_USDC_UNITS = 100_000 * 1_000_000   // 100,000 USDC base units

export function assertValidIdrAmount(amount: number): void {
  if (!Number.isInteger(amount)) throw new Error('IDR amount must be an integer')
  if (amount < MIN_IDR_SINGLE) throw new Error(`IDR amount below minimum (${MIN_IDR_SINGLE})`)
  if (amount > MAX_IDR_SINGLE) throw new Error(`IDR amount exceeds maximum (${MAX_IDR_SINGLE})`)
}

export function assertValidUsdcUnits(units: number): void {
  if (!Number.isInteger(units)) throw new Error('USDC units must be an integer')
  if (units <= 0) throw new Error('USDC amount must be positive')
  if (units > MAX_USDC_UNITS) throw new Error('USDC amount exceeds maximum (100,000 USDC)')
}

// ── Error message sanitisation ────────────────────────────────────────────────

/**
 * Return a generic user-facing message for internal errors.
 * Never expose raw provider error payloads or internal state labels to the UI.
 */
export function safeUserError(code: string | undefined): string {
  switch (code) {
    case 'NOT_FOUND':       return 'The requested record was not found.'
    case 'VALIDATION_ERROR':return 'Please check your input and try again.'
    case 'REPLAY_DETECTED': return 'This transaction has already been processed.'
    case 'TOKEN_MISMATCH':  return 'The payment used an unsupported token. Please contact support.'
    case 'UNDERPAID':       return 'The amount received was less than the invoice amount.'
    case 'INVALID_STATE':   return 'This action is not available for the current status.'
    default:                return 'An unexpected error occurred. Please try again or contact support.'
  }
}
