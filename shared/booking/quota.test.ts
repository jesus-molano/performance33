import { describe, expect, it } from 'vitest'
import { BOOKING_DEFAULTS } from './constants.ts'
import { countsTowardQuota, hasQuotaLeft, quotaLeft, quotaUsed, weeklyQuotaFor } from './quota.ts'

describe('weeklyQuotaFor', () => {
  it('uses the default classes per week of each plan', () => {
    expect(weeklyQuotaFor('standard', 4)).toBe(2)
    expect(weeklyQuotaFor('plus', 1)).toBe(3)
    expect(weeklyQuotaFor('elite', 4)).toBeNull()
  })

  it('a custom plan uses the client training days', () => {
    expect(weeklyQuotaFor('custom', 5)).toBe(5)
    expect(weeklyQuotaFor('custom', 2.7)).toBe(2)
    expect(weeklyQuotaFor('custom', -1)).toBe(0)
  })

  it('follows edited settings', () => {
    const settings = { weeklyQuota: { ...BOOKING_DEFAULTS.weeklyQuota, standard: 'unlimited' as const, elite: 6 } }
    expect(weeklyQuotaFor('standard', 2, settings)).toBeNull()
    expect(weeklyQuotaFor('elite', 2, settings)).toBe(6)
  })
})

describe('quota usage', () => {
  it('counts held places and late cancellations, not the waitlist nor early cancellations', () => {
    expect(countsTowardQuota('booked')).toBe(true)
    expect(countsTowardQuota('late_cancelled')).toBe(true)
    expect(countsTowardQuota('waitlisted')).toBe(false)
    expect(countsTowardQuota('cancelled')).toBe(false)
    expect(countsTowardQuota('removed')).toBe(false)
    expect(countsTowardQuota('slot_cancelled')).toBe(false)
    expect(quotaUsed(['booked', 'late_cancelled', 'waitlisted', 'cancelled'])).toBe(2)
  })

  it('late cancellations stop counting when the gym turns that off', () => {
    expect(countsTowardQuota('late_cancelled', { lateCancelCounts: false })).toBe(false)
  })

  it('reports what is left at the limit', () => {
    expect(quotaLeft(2, 1)).toBe(1)
    expect(quotaLeft(2, 3)).toBe(0)
    expect(quotaLeft(null, 9)).toBeNull()
    expect(hasQuotaLeft(2, 1)).toBe(true)
    expect(hasQuotaLeft(2, 2)).toBe(false)
    expect(hasQuotaLeft(null, 50)).toBe(true)
  })
})
