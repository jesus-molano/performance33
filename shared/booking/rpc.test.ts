import { describe, expect, it } from 'vitest'
import { BOOKING_DEFAULTS, type BookingSettings } from './constants.ts'
import { bookingSettingsFromRow, bookingSettingsToRow } from './rpc.ts'

describe('booking settings row', () => {
  it('stores each kind of weekly rule in its two columns', () => {
    const row = bookingSettingsToRow(BOOKING_DEFAULTS)
    expect(row).toMatchObject({
      quota_standard_rule: 'fixed',
      quota_standard: 2,
      quota_plus_rule: 'fixed',
      quota_plus: 3,
      quota_elite_rule: 'unlimited',
      quota_elite: null,
      quota_custom_rule: 'training_days',
      quota_custom: null,
      horizon_days: 14,
      cancel_until_minutes: 120,
      late_cancel_counts: true,
      waitlist_enabled: true,
      promote_until_minutes: 30,
    })
  })

  it('reads back what it writes', () => {
    const custom: BookingSettings = {
      ...BOOKING_DEFAULTS,
      weeklyQuota: { standard: 'unlimited', plus: 'training_days', elite: 5, custom: 1 },
      waitlistEnabled: false,
    }
    expect(bookingSettingsFromRow(bookingSettingsToRow(custom))).toEqual(custom)
    expect(bookingSettingsFromRow(bookingSettingsToRow(BOOKING_DEFAULTS))).toEqual(BOOKING_DEFAULTS)
  })

  it('a fixed rule without a number reads as no limit', () => {
    const row = { ...bookingSettingsToRow(BOOKING_DEFAULTS), quota_standard: null }
    expect(bookingSettingsFromRow(row).weeklyQuota.standard).toBe('unlimited')
  })
})
