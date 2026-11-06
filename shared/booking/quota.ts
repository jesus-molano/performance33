// How many classes a person may book per gym week, and how many they have left.

import { BOOKING_DEFAULTS, type BookingPlanId, type BookingSettings, type BookingStatus } from './constants.ts'

/** Classes per week for that plan; null = no limit. */
export function weeklyQuotaFor(
  plan: BookingPlanId,
  trainingDays: number,
  settings: Pick<BookingSettings, 'weeklyQuota'> = BOOKING_DEFAULTS,
): number | null {
  const rule = settings.weeklyQuota[plan]
  if (rule === 'unlimited') return null
  if (rule === 'training_days') return Math.max(0, Math.floor(trainingDays))
  return rule
}

/** Uses a class of the week: a held place, or a cancellation too late when those count. */
export function countsTowardQuota(
  status: BookingStatus,
  settings: Pick<BookingSettings, 'lateCancelCounts'> = BOOKING_DEFAULTS,
): boolean {
  return status === 'booked' || (status === 'late_cancelled' && settings.lateCancelCounts)
}

/** Classes used in the week from that week's booking statuses. */
export function quotaUsed(
  statuses: readonly BookingStatus[],
  settings: Pick<BookingSettings, 'lateCancelCounts'> = BOOKING_DEFAULTS,
): number {
  return statuses.filter((status) => countsTowardQuota(status, settings)).length
}

/** Classes left this week; null = no limit. */
export function quotaLeft(quota: number | null, used: number): number | null {
  return quota === null ? null : Math.max(0, quota - used)
}

export function hasQuotaLeft(quota: number | null, used: number): boolean {
  return quota === null || used < quota
}
