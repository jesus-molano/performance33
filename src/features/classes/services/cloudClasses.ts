// Classes in the cloud: the staff functions of schema.sql for every change to classes and bookings, the tables read
// directly (staff may), and the timetable and rules written directly by admins (the database refuses anyone else).

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  ACTIVE_BOOKING_STATUSES,
  BOOKING_DEFAULTS,
  BOOKING_RPC,
  BOOKING_TABLES,
  bookingSettingsFromRow,
  bookingSettingsToRow,
  toBookingErrorCode,
  toGymDate,
  type BookingRow,
  type BookingRpcs,
  type BookingSettingsRow,
  type ClassTemplateRow,
} from '@shared/booking'
import { subscribeTableRows } from '@/persistence/supabaseGateway'
import { CLASSES_CHANNEL } from '@/features/classes/config/classes'
import { bookingFromRow, slotSummaryFromRow, templateFromRow, templateToRow } from '@/features/classes/utils/rows'
import { ClassesError, type ClassesService } from './types'
import { upcomingFrom, type CloudUpcomingRow } from './cloudUpcoming'

type RpcName = keyof BookingRpcs

const BOOKING_COLUMNS = 'id,slot_id,client_id,status,forced,queue_order'
const SLOT_COLUMNS = 'id,template_id,starts_at,gym_date,duration_minutes,capacity,name,status,edited'
/** A class lasts at most this long (BOOKING_LIMITS.durationMinutes.max): classes started earlier have surely ended. */
const LONGEST_CLASS_MS = 240 * 60_000

function fail(error: { message: string } | null): void {
  if (error) throw new ClassesError(toBookingErrorCode(error.message))
}

export function createCloudClasses(client: SupabaseClient): ClassesService {
  async function call<N extends RpcName>(name: N, args: BookingRpcs[N]['args']): Promise<BookingRpcs[N]['result']> {
    const { data, error } = await client.rpc(name, args)
    fail(error)
    return data as BookingRpcs[N]['result']
  }
  const first = async <N extends Exclude<RpcName, 'staff_create_slot'>>(name: N, args: BookingRpcs[N]['args']) => {
    const [row] = (await call(name, args)) as BookingRpcs[N]['result']
    if (!row) throw new ClassesError('unknown')
    return row as BookingRpcs[N]['result'][number]
  }

  return {
    async loadDay(date) {
      const slots = (await call(BOOKING_RPC.classSlotsFor, { p_from: date, p_to: date })).map(slotSummaryFromRow)
      if (!slots.length) return { slots, bookings: [] }
      const { data, error } = await client
        .from(BOOKING_TABLES.bookings)
        .select(BOOKING_COLUMNS)
        .in('slot_id', slots.map((s) => s.id))
        .in('status', [...ACTIVE_BOOKING_STATUSES])
      fail(error)
      return { slots, bookings: ((data ?? []) as BookingRow[]).flatMap((row) => bookingFromRow(row) ?? []) }
    },

    async loadSchedule() {
      const [templates, settings] = await Promise.all([
        client.from(BOOKING_TABLES.templates).select('*').order('weekday').order('start_time'),
        client.from(BOOKING_TABLES.settings).select('*').eq('id', 'main').maybeSingle(),
      ])
      fail(templates.error)
      fail(settings.error)
      return {
        templates: ((templates.data ?? []) as ClassTemplateRow[]).map(templateFromRow),
        settings: settings.data ? bookingSettingsFromRow(settings.data as BookingSettingsRow) : BOOKING_DEFAULTS,
      }
    },

    async loadClient(clientId) {
      const now = Date.now()
      const [own, usage] = await Promise.all([
        client
          .from(BOOKING_TABLES.bookings)
          .select(`${BOOKING_COLUMNS},${BOOKING_TABLES.slots}!inner(${SLOT_COLUMNS})`)
          .eq('client_id', clientId)
          .in('status', [...ACTIVE_BOOKING_STATUSES])
          .gte(`${BOOKING_TABLES.slots}.starts_at`, new Date(now - LONGEST_CLASS_MS).toISOString()),
        first(BOOKING_RPC.staffWeekUsage, { p_client_id: clientId, p_week: toGymDate(now) }),
      ])
      fail(own.error)
      const rows = (own.data ?? []) as unknown as CloudUpcomingRow[]
      const waiting = rows.filter((row) => row.status === 'waitlisted').map((row) => row.slot_id)
      let queue: Pick<BookingRow, 'slot_id' | 'queue_order'>[] = []
      if (waiting.length) {
        const { data, error } = await client.from(BOOKING_TABLES.bookings).select('slot_id,queue_order').in('slot_id', waiting).eq('status', 'waitlisted')
        fail(error)
        queue = (data ?? []) as typeof queue
      }
      return { usage: { used: usage.used, quota: usage.quota }, upcoming: upcomingFrom(rows, queue, now) }
    },

    async addBooking(slotId, clientId, force) {
      const row = await first(BOOKING_RPC.staffAddBooking, { p_slot_id: slotId, p_client_id: clientId, p_force: force })
      return { bookingId: row.booking_id, forced: row.forced, overQuota: row.over_quota }
    },

    async removeBooking(bookingId) {
      const row = await first(BOOKING_RPC.staffRemoveBooking, { p_booking_id: bookingId })
      return { bookingId: row.booking_id, slotId: row.slot_id, clientId: row.client_id, previousStatus: row.previous_status, promoted: row.promoted }
    },

    async moveBooking(bookingId, toSlotId, force) {
      const row = await first(BOOKING_RPC.staffMoveBooking, { p_booking_id: bookingId, p_to_slot_id: toSlotId, p_force: force })
      return { bookingId: row.booking_id, forced: row.forced, overQuota: row.over_quota, promoted: row.promoted }
    },

    async updateSlot(slotId, patch) {
      const row = await first(BOOKING_RPC.staffUpdateSlot, {
        p_slot_id: slotId,
        p_name: patch.name ?? null,
        p_starts_at: patch.startsAt === undefined ? null : new Date(patch.startsAt).toISOString(),
        p_duration_minutes: patch.durationMinutes ?? null,
        p_capacity: patch.capacity ?? null,
        p_status: patch.status ?? null,
      })
      return { status: row.status, promoted: row.promoted, notified: row.notified }
    },

    createSlot: (input) =>
      call(BOOKING_RPC.staffCreateSlot, {
        p_starts_at: new Date(input.startsAt).toISOString(),
        p_duration_minutes: input.durationMinutes,
        p_capacity: input.capacity,
        p_name: input.name,
      }),

    async saveTemplates(templates) {
      const rows = templates.map(templateToRow)
      const updates = rows.filter((row) => row.id)
      const inserts = rows.filter((row) => !row.id)
      for (const { id, ...values } of updates) fail((await client.from(BOOKING_TABLES.templates).update(values).eq('id', id ?? '')).error)
      if (inserts.length) fail((await client.from(BOOKING_TABLES.templates).insert(inserts)).error)
    },

    async removeTemplate(id) {
      fail((await client.from(BOOKING_TABLES.templates).delete().eq('id', id)).error)
    },

    async saveSettings(settings) {
      fail((await client.from(BOOKING_TABLES.settings).update(bookingSettingsToRow(settings)).eq('id', 'main')).error)
    },

    // Any change to these tables reloads what is on screen (their rows have real columns, so the event carries no `data`).
    subscribe: (onChange) =>
      subscribeTableRows(client, CLASSES_CHANNEL, Object.values(BOOKING_TABLES), onChange, onChange),
  }
}
