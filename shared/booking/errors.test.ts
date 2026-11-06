import { describe, expect, it } from 'vitest'
import { BOOKING_ERROR_CODES, BOOKING_ERROR_MESSAGES, bookingErrorMessage, isBookingErrorCode, toBookingErrorCode } from './errors.ts'

describe('booking errors', () => {
  it('reads the code a function raised', () => {
    expect(toBookingErrorCode('quota_reached')).toBe('quota_reached')
    expect(toBookingErrorCode(' slot_full\n')).toBe('slot_full')
  })

  it('anything unknown becomes a generic message', () => {
    expect(toBookingErrorCode('duplicate key value')).toBe('unknown')
    expect(toBookingErrorCode('toString')).toBe('unknown')
    expect(toBookingErrorCode(null)).toBe('unknown')
    expect(bookingErrorMessage(42)).toBe(BOOKING_ERROR_MESSAGES.unknown)
  })

  it('every code has a short Spanish message', () => {
    for (const code of BOOKING_ERROR_CODES) {
      expect(isBookingErrorCode(code)).toBe(true)
      expect(bookingErrorMessage(code).length).toBeGreaterThan(0)
      expect(bookingErrorMessage(code).length).toBeLessThan(70)
    }
  })
})
