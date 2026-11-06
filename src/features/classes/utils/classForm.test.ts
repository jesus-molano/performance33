import { gymTimeToMs } from '@shared/booking'
import { describe, expect, it } from 'vitest'
import type { ClassTemplate } from '@/features/classes/types'
import { capacityBelowBooked, defaultStartMinutes, parseCapacity, scheduleByWeekday, slotPatchFrom, validateClassForm, validateDays } from './classForm'

const values = { name: ' Fuerza ', startMinutes: 1080, durationMinutes: 60, capacity: '8' }

describe('class form', () => {
  it('accepts a trimmed name and a whole number of places', () => {
    expect(validateClassForm(values)).toEqual({ errors: {}, valid: { name: 'Fuerza', startMinutes: 1080, durationMinutes: 60, capacity: 8 } })
    expect(parseCapacity('0')).toBeNull()
    expect(parseCapacity('101')).toBeNull()
    expect(parseCapacity('7,5')).toBeNull()
    expect(parseCapacity(' 12 ')).toBe(12)
  })

  it('says what is wrong', () => {
    const { errors, valid } = validateClassForm({ ...values, name: '  ', capacity: '' })
    expect(valid).toBeNull()
    expect(errors.name).toBe('Ponle un nombre')
    expect(errors.capacity).toBe('Entre 1 y 100')
    expect(validateDays([])).toBe('Elige al menos un día')
    expect(validateDays([1])).toBeUndefined()
  })

  it('starts a class added today at the next whole hour', () => {
    expect(defaultStartMinutes('2026-11-06', gymTimeToMs('2026-11-06', 9 * 60 + 20))).toBe(600)
    expect(defaultStartMinutes('2026-11-06', gymTimeToMs('2026-11-06', 23 * 60 + 30))).toBe(1380)
    expect(defaultStartMinutes('2026-11-07', gymTimeToMs('2026-11-06', 9 * 60))).toBe(1080)
  })

  it('sends only what changed when a class is edited, on the class day', () => {
    const slot = {
      id: 's1', templateId: 't1', startsAt: gymTimeToMs('2026-11-06', 1080), gymDate: '2026-11-06', durationMinutes: 60, capacity: 8,
      name: 'Entrenamiento', status: 'open' as const, edited: false, bookedCount: 0, waitlistCount: 0,
    }
    const same = { name: 'Entrenamiento', startMinutes: 1080, durationMinutes: 60, capacity: 8 }
    expect(slotPatchFrom(slot, same)).toEqual({})
    expect(slotPatchFrom(slot, { ...same, startMinutes: 1140, capacity: 10 })).toEqual({ startsAt: gymTimeToMs('2026-11-06', 1140), capacity: 10 })
  })

  it('groups the timetable by weekday in start order', () => {
    const t = (id: string, weekday: number, startMinutes: number): ClassTemplate => ({
      id, weekday, startMinutes, durationMinutes: 60, capacity: 8, name: 'Entrenamiento', active: true,
    })
    const days = scheduleByWeekday([t('b', 1, 1080), t('a', 1, 420), t('c', 7, 600)])
    expect(days).toHaveLength(7)
    expect(days[0].map((x) => x.id)).toEqual(['a', 'b'])
    expect(days[6].map((x) => x.id)).toEqual(['c'])
    expect(days[2]).toEqual([])
  })
})

describe('capacityBelowBooked', () => {
  it('warns only for a valid number of places under the people booked', () => {
    expect(capacityBelowBooked('2', 5)).toBe(true)
    expect(capacityBelowBooked('5', 5)).toBe(false)
    expect(capacityBelowBooked('', 5)).toBe(false)
    expect(capacityBelowBooked('0', 5)).toBe(false)
  })
})
