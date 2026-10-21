// ─────────────────────────────────────────────────────────────────────────────
// Unit tests: security helpers
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest'
import {
  sanitizeRedirectPath,
  checkRateLimit,
  assertNotDemo,
  assertDemoMode,
  safeUserError,
  markWebhookProcessed,
  isWebhookProcessed,
} from '@/server/security'

describe('sanitizeRedirectPath', () => {
  it('accepts a simple relative path', () => {
    expect(sanitizeRedirectPath('/dashboard')).toBe('/dashboard')
  })

  it('accepts a nested relative path', () => {
    expect(sanitizeRedirectPath('/merchant/invoice/new')).toBe('/merchant/invoice/new')
  })

  it('rejects an absolute URL (open redirect)', () => {
    expect(sanitizeRedirectPath('https://evil.com')).toBe('/dashboard')
  })

  it('rejects a protocol-relative URL', () => {
    expect(sanitizeRedirectPath('//evil.com')).toBe('/dashboard')
  })

  it('rejects null/undefined', () => {
    expect(sanitizeRedirectPath(null)).toBe('/dashboard')
    expect(sanitizeRedirectPath(undefined)).toBe('/dashboard')
  })

  it('rejects empty string', () => {
    expect(sanitizeRedirectPath('')).toBe('/dashboard')
  })

  it('rejects URL with null byte', () => {
    expect(sanitizeRedirectPath('/path\x00evil')).toBe('/dashboard')
  })
})

describe('checkRateLimit', () => {
  it('allows calls within limit', () => {
    const key = `rl-test-${Date.now()}`
    expect(checkRateLimit(key, 3, 60_000)).toBe(true)
    expect(checkRateLimit(key, 3, 60_000)).toBe(true)
    expect(checkRateLimit(key, 3, 60_000)).toBe(true)
  })

  it('blocks calls that exceed limit', () => {
    const key = `rl-block-${Date.now()}`
    checkRateLimit(key, 2, 60_000)
    checkRateLimit(key, 2, 60_000)
    expect(checkRateLimit(key, 2, 60_000)).toBe(false)
  })

  it('resets after window expires', async () => {
    const key = `rl-reset-${Date.now()}`
    checkRateLimit(key, 1, 10)   // 10ms window
    await new Promise((r) => setTimeout(r, 20))
    expect(checkRateLimit(key, 1, 10)).toBe(true)  // new window
  })
})

describe('assertNotDemo', () => {
  it('does not throw when not in demo mode', () => {
    expect(() => assertNotDemo(false, 'liveOp')).not.toThrow()
  })

  it('throws when in demo mode', () => {
    expect(() => assertNotDemo(true, 'liveOp')).toThrow(/demo mode/)
  })
})

describe('assertDemoMode', () => {
  it('does not throw when in demo mode', () => {
    expect(() => assertDemoMode(true, 'demoOp')).not.toThrow()
  })

  it('throws when NOT in demo mode', () => {
    expect(() => assertDemoMode(false, 'demoOp')).toThrow(/demo mode/)
  })
})

describe('markWebhookProcessed / isWebhookProcessed', () => {
  it('returns true for a new event', () => {
    const key = `wh-${Date.now()}-new`
    expect(markWebhookProcessed(key)).toBe(true)
  })

  it('returns false for a duplicate event', () => {
    const key = `wh-${Date.now()}-dup`
    markWebhookProcessed(key)
    expect(markWebhookProcessed(key)).toBe(false)
  })

  it('isWebhookProcessed detects processed events', () => {
    const key = `wh-${Date.now()}-check`
    expect(isWebhookProcessed(key)).toBe(false)
    markWebhookProcessed(key)
    expect(isWebhookProcessed(key)).toBe(true)
  })
})

describe('safeUserError', () => {
  it('maps NOT_FOUND to a generic message', () => {
    expect(safeUserError('NOT_FOUND')).toMatch(/not found/i)
  })

  it('maps REPLAY_DETECTED without leaking technical details', () => {
    expect(safeUserError('REPLAY_DETECTED')).not.toMatch(/replay/i)
    expect(safeUserError('REPLAY_DETECTED')).toMatch(/already been processed/i)
  })

  it('returns generic message for unknown codes', () => {
    expect(safeUserError('SOME_INTERNAL_CODE')).toMatch(/unexpected error/i)
  })
})
