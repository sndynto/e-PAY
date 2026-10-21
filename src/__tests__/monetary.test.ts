// ─────────────────────────────────────────────────────────────────────────────
// Unit tests: monetary utilities
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest'
import { usdcToUnits, unitsToUsdc } from '@/server/types'
import { assertValidIdrAmount, assertValidUsdcUnits } from '@/server/security'

describe('usdcToUnits', () => {
  it('converts whole number', () => {
    expect(usdcToUnits(1)).toBe(1_000_000)
  })

  it('converts decimal', () => {
    expect(usdcToUnits('0.5')).toBe(500_000)
  })

  it('handles 6 decimal places', () => {
    expect(usdcToUnits('1.123456')).toBe(1_123_456)
  })

  it('truncates beyond 6 decimal places', () => {
    expect(usdcToUnits('1.1234567')).toBe(1_123_456)
  })

  it('handles zero', () => {
    expect(usdcToUnits(0)).toBe(0)
  })

  it('handles large whole number', () => {
    expect(usdcToUnits(100_000)).toBe(100_000_000_000)
  })
})

describe('unitsToUsdc', () => {
  it('converts 1 USDC', () => {
    expect(unitsToUsdc(1_000_000)).toBe('1.0')
  })

  it('converts fractional', () => {
    expect(unitsToUsdc(500_000)).toBe('0.5')
  })

  it('converts exact 6-decimal value', () => {
    expect(unitsToUsdc(1_123_456)).toBe('1.123456')
  })

  it('handles zero', () => {
    expect(unitsToUsdc(0)).toBe('0.0')
  })
})

describe('assertValidIdrAmount', () => {
  it('accepts minimum (10,000)', () => {
    expect(() => assertValidIdrAmount(10_000)).not.toThrow()
  })

  it('accepts maximum (100,000,000)', () => {
    expect(() => assertValidIdrAmount(100_000_000)).not.toThrow()
  })

  it('rejects below minimum', () => {
    expect(() => assertValidIdrAmount(9_999)).toThrow(/minimum/i)
  })

  it('rejects above maximum', () => {
    expect(() => assertValidIdrAmount(100_000_001)).toThrow(/maximum/i)
  })

  it('rejects non-integer', () => {
    expect(() => assertValidIdrAmount(10_000.5)).toThrow(/integer/i)
  })
})

describe('assertValidUsdcUnits', () => {
  it('accepts valid positive integer units', () => {
    expect(() => assertValidUsdcUnits(1_000_000)).not.toThrow()
  })

  it('rejects zero', () => {
    expect(() => assertValidUsdcUnits(0)).toThrow(/positive/i)
  })

  it('rejects negative', () => {
    expect(() => assertValidUsdcUnits(-1)).toThrow(/positive/i)
  })

  it('rejects non-integer', () => {
    expect(() => assertValidUsdcUnits(1.5)).toThrow(/integer/i)
  })

  it('rejects above maximum (100,000 USDC)', () => {
    expect(() => assertValidUsdcUnits(100_001 * 1_000_000)).toThrow(/maximum/i)
  })
})
