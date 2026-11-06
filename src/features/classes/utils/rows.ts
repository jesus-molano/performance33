// Rows of the booking tables and functions (snake_case, as the server sends them) ⇄ what the web uses.

import {
  toMs,
  type BookingRow,
  type ClassSlotListRow,
  type ClassSlotRow,
  type ClassTemplateInput as ClassTemplateRowInput,
  type ClassTemplateRow,
} from '@shared/booking'
import type { Booking, ClassSlot, ClassTemplate, ClassTemplateInput, SlotSummary } from '@/features/classes/types'

const pad = (n: number) => String(n).padStart(2, '0')

/** 'HH:MM' or 'HH:MM:SS' → minutes since midnight (0 when it cannot be read). */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return Number.isFinite(hours) && Number.isFinite(minutes) ? hours * 60 + minutes : 0
}

/** Minutes since midnight → 'HH:MM:00', as Postgres takes a time. */
export function minutesToTime(minutes: number): string {
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}:00`
}

export function templateFromRow(row: ClassTemplateRow): ClassTemplate {
  return {
    id: row.id,
    weekday: row.weekday,
    startMinutes: timeToMinutes(row.start_time),
    durationMinutes: row.duration_minutes,
    capacity: row.capacity,
    name: row.name,
    active: row.active,
  }
}

export function templateToRow(template: ClassTemplateInput): ClassTemplateRowInput & { id?: string } {
  return {
    ...(template.id ? { id: template.id } : {}),
    weekday: template.weekday,
    start_time: minutesToTime(template.startMinutes),
    duration_minutes: template.durationMinutes,
    capacity: template.capacity,
    name: template.name.trim(),
    active: template.active,
  }
}

type SlotFields = Pick<ClassSlotRow, 'id' | 'template_id' | 'starts_at' | 'gym_date' | 'duration_minutes' | 'capacity' | 'name' | 'status' | 'edited'>

export function slotFromRow(row: SlotFields): ClassSlot {
  return {
    id: row.id,
    templateId: row.template_id,
    startsAt: toMs(row.starts_at),
    gymDate: row.gym_date,
    durationMinutes: row.duration_minutes,
    capacity: row.capacity,
    name: row.name,
    status: row.status,
    edited: row.edited,
  }
}

export function slotSummaryFromRow(row: ClassSlotListRow): SlotSummary {
  return { ...slotFromRow(row), bookedCount: row.booked_count, waitlistCount: row.waitlist_count }
}

/** Null for a booking that no longer holds a place (cancelled, removed…). */
export function bookingFromRow(row: Pick<BookingRow, 'id' | 'slot_id' | 'client_id' | 'status' | 'forced' | 'queue_order'>): Booking | null {
  if (row.status !== 'booked' && row.status !== 'waitlisted') return null
  return {
    id: row.id,
    slotId: row.slot_id,
    clientId: row.client_id,
    status: row.status,
    forced: row.forced,
    queueOrder: Number(row.queue_order),
  }
}
