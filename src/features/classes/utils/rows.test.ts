import { describe, expect, it } from 'vitest'
import { bookingFromRow, minutesToTime, slotSummaryFromRow, templateFromRow, templateToRow, timeToMinutes } from './rows'

describe('booking rows', () => {
  it('reads and writes times of day', () => {
    expect(timeToMinutes('07:30:00')).toBe(450)
    expect(timeToMinutes('18:05')).toBe(1085)
    expect(timeToMinutes('nope')).toBe(0)
    expect(minutesToTime(450)).toBe('07:30:00')
    expect(minutesToTime(1260)).toBe('21:00:00')
  })

  it('maps a template both ways, trimming the name and keeping the id only when there is one', () => {
    const template = templateFromRow({
      id: 't1', weekday: 2, start_time: '18:00:00', duration_minutes: 60, capacity: 8, name: 'Entrenamiento', active: true,
      created_at: '', updated_at: '', updated_by: null,
    })
    expect(template).toEqual({ id: 't1', weekday: 2, startMinutes: 1080, durationMinutes: 60, capacity: 8, name: 'Entrenamiento', active: true })
    expect(templateToRow({ ...template, name: '  Fuerza ' })).toEqual({
      id: 't1', weekday: 2, start_time: '18:00:00', duration_minutes: 60, capacity: 8, name: 'Fuerza', active: true,
    })
    const { id: _id, ...fresh } = template
    expect(templateToRow(fresh)).not.toHaveProperty('id')
  })

  it('reads a listed class with its counts and the start as epoch ms', () => {
    const slot = slotSummaryFromRow({
      id: 's1', template_id: null, starts_at: '2026-11-06T18:00:00+00:00', gym_date: '2026-11-06', duration_minutes: 60,
      capacity: 10, name: 'Entrenamiento', status: 'open', edited: true, booked_count: 8, waitlist_count: 2, my_status: null,
    })
    expect(slot.startsAt).toBe(Date.UTC(2026, 10, 6, 18))
    expect(slot).toMatchObject({ bookedCount: 8, waitlistCount: 2, templateId: null, edited: true })
  })

  it('keeps only bookings that hold a place or a waitlist spot', () => {
    const base = { id: 'b1', slot_id: 's1', client_id: 'c1', forced: false, queue_order: 3 }
    expect(bookingFromRow({ ...base, status: 'waitlisted' })).toEqual({ id: 'b1', slotId: 's1', clientId: 'c1', status: 'waitlisted', forced: false, queueOrder: 3 })
    expect(bookingFromRow({ ...base, status: 'removed' })).toBeNull()
  })
})
