// Classes and bookings as the coaches' web uses them (camelCase; the rows of schema.sql are mapped in utils/rows.ts).

import type { BookingSettings, BookingStatus, GymDate, SlotStatus } from '@shared/booking'

/** One entry of the weekly timetable. */
export interface ClassTemplate {
  id: string
  /** 1 = Monday … 7 = Sunday. */
  weekday: number
  /** Minutes since midnight, gym time. */
  startMinutes: number
  durationMinutes: number
  capacity: number
  name: string
  active: boolean
}

/** A new entry has no id yet; undoing a removal saves it back with its old one. */
export type ClassTemplateInput = Omit<ClassTemplate, 'id'> & { id?: string }

export interface ClassSlot {
  id: string
  templateId: string | null
  /** Epoch ms. */
  startsAt: number
  gymDate: GymDate
  durationMinutes: number
  capacity: number
  name: string
  status: SlotStatus
  edited: boolean
}

export interface SlotSummary extends ClassSlot {
  /** People with a place, forced ones included. */
  bookedCount: number
  waitlistCount: number
}

/** A booked or waitlisted booking (the others are history). */
export interface Booking {
  id: string
  slotId: string
  clientId: string
  status: Extract<BookingStatus, 'booked' | 'waitlisted'>
  forced: boolean
  /** Order of arrival: the waitlist goes by it. */
  queueOrder: number
}

/** The classes of one gym day and who holds a place in each. */
export interface ClassDay {
  slots: SlotSummary[]
  bookings: Booking[]
}

export interface ClassSchedule {
  templates: ClassTemplate[]
  settings: BookingSettings
}

export interface WeekUsage {
  used: number
  /** Null = no limit. */
  quota: number | null
}

export interface UpcomingClass {
  bookingId: string
  slot: ClassSlot
  status: Booking['status']
  /** 1 = next to get a place; null with a place. */
  waitlistPosition: number | null
}

/** What the user's page shows: this week's classes and the next ones. */
export interface ClientClasses {
  usage: WeekUsage
  upcoming: UpcomingClass[]
}

export interface AddBookingResult {
  bookingId: string
  forced: boolean
  /** They had already used their classes of that week: added anyway. */
  overQuota: boolean
}

export interface RemoveBookingResult {
  bookingId: string
  slotId: string
  clientId: string
  previousStatus: Booking['status']
  /** People moved in from the waitlist. */
  promoted: number
}

export interface MoveBookingResult extends AddBookingResult {
  promoted: number
}

/** Leave a field out to keep it. */
export interface SlotPatch {
  name?: string
  startsAt?: number
  durationMinutes?: number
  capacity?: number
  status?: SlotStatus
}

export interface UpdateSlotResult {
  status: SlotStatus
  promoted: number
  notified: number
}

export interface NewSlotInput {
  startsAt: number
  durationMinutes: number
  capacity: number
  name: string
}
