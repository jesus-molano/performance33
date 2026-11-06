// The class and timetable forms: values, checks and the start a new class gets.

import { BOOKING_LIMITS, gymMinutesOfDay, gymTimeToMs, toGymDate, type GymDate } from '@shared/booking'
import { CLASS_LAST_START_MINUTES, DEFAULT_CLASS_START_MINUTES } from '@/features/classes/config/classes'
import { SCHEDULE_COPY, SLOT_FORM_COPY } from '@/features/classes/config/copy'
import type { ClassTemplate, SlotPatch, SlotSummary } from '@/features/classes/types'

export interface ClassFormValues {
  name: string
  startMinutes: number
  durationMinutes: number
  /** As typed. */
  capacity: string
}

export interface ClassFormErrors {
  name?: string
  capacity?: string
  days?: string
}

export interface ValidClassForm {
  name: string
  startMinutes: number
  durationMinutes: number
  capacity: number
}

/** Whole number within the class limits, or null. */
export function parseCapacity(text: string): number | null {
  const value = Number(text.trim())
  const { min, max } = BOOKING_LIMITS.capacity
  return Number.isInteger(value) && value >= min && value <= max ? value : null
}

/** The places typed leave fewer than the people already in (nobody is taken out: the class just shows over its limit). */
export function capacityBelowBooked(text: string, bookedCount: number): boolean {
  const capacity = parseCapacity(text)
  return capacity !== null && capacity < bookedCount
}

export function validateClassForm(values: ClassFormValues): { errors: ClassFormErrors; valid: ValidClassForm | null } {
  const name = values.name.trim()
  const capacity = parseCapacity(values.capacity)
  const errors: ClassFormErrors = {}
  if (name.length < BOOKING_LIMITS.className.min) errors.name = SLOT_FORM_COPY.nameError
  if (capacity === null) errors.capacity = SLOT_FORM_COPY.capacityError(BOOKING_LIMITS.capacity.min, BOOKING_LIMITS.capacity.max)
  if (errors.name || capacity === null) return { errors, valid: null }
  return { errors, valid: { name, startMinutes: values.startMinutes, durationMinutes: values.durationMinutes, capacity } }
}

/** The timetable form also needs at least one day. */
export function validateDays(days: readonly number[]): string | undefined {
  return days.length ? undefined : SCHEDULE_COPY.daysError
}

/** A class added today starts at the next whole hour (if there is still time); any other day at the usual time. */
export function defaultStartMinutes(date: GymDate, now: number): number {
  if (toGymDate(now) !== date) return DEFAULT_CLASS_START_MINUTES
  const nextHour = (Math.floor(gymMinutesOfDay(now) / 60) + 1) * 60
  return Math.min(nextHour, CLASS_LAST_START_MINUTES)
}

/** The timetable by weekday (index 0 = Monday), each day in start order. */
export function scheduleByWeekday(templates: readonly ClassTemplate[]): ClassTemplate[][] {
  const days: ClassTemplate[][] = Array.from({ length: 7 }, () => [])
  for (const template of templates) days[template.weekday - 1]?.push(template)
  for (const day of days) day.sort((a, b) => a.startMinutes - b.startMinutes || a.name.localeCompare(b.name, 'es'))
  return days
}

/** Only what changed travels (the server keeps the rest). */
export function slotPatchFrom(slot: SlotSummary, values: ValidClassForm): SlotPatch {
  const startsAt = gymTimeToMs(slot.gymDate, values.startMinutes)
  return {
    ...(values.name !== slot.name ? { name: values.name } : {}),
    ...(startsAt !== slot.startsAt ? { startsAt } : {}),
    ...(values.durationMinutes !== slot.durationMinutes ? { durationMinutes: values.durationMinutes } : {}),
    ...(values.capacity !== slot.capacity ? { capacity: values.capacity } : {}),
  }
}
