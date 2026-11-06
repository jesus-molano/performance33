import { describe, expect, it } from 'vitest'
import type { TrainingSession } from '@shared/routine'
import type { Client, Day, Program } from '@/types'
import { localSessionContext, nextDayOf, nextDaysByClient, ownProgram } from './nextDay'

const TODAY = '2026-11-06'
const day = (id: string, name: string, label = ''): Day => ({ id, name, label, blocks: [] })
const program = (id: string, clientId: string, days: Day[]): Program => ({
  id,
  clientId,
  name: '',
  startDate: '2026-10-01',
  endDate: '2026-10-28',
  weeks: 4,
  days,
  createdAt: '',
  createdBy: null,
})
const laura = program('p1', 'laura', [day('d1', 'Día 1', 'Pierna'), day('d2', 'Día 2', 'Empuje'), day('d3', 'Día 3')])
const session = (clientId: string, dayId: string, dayNumber: number, gymDate = '2026-11-05', programId = 'p1'): TrainingSession => ({
  clientId,
  gymDate,
  programId,
  dayId,
  dayNumber,
  slotId: null,
  createdAt: 0,
})
const client = (id: string, currentProgramId: string | null, archived = false): Pick<Client, 'id' | 'archived' | 'currentProgramId'> => ({
  id,
  archived,
  currentProgramId,
})

describe('nextDayOf', () => {
  it('gives the next day with its title', () => {
    expect(nextDayOf(laura, session('laura', 'd1', 1), TODAY)).toEqual({ day: 2, reason: 'next', label: 'Día 2 · Empuje' })
    expect(nextDayOf(laura, null, TODAY)).toEqual({ day: 1, reason: 'first', label: 'Día 1 · Pierna' })
  })

  it('nothing without a routine or days', () => {
    expect(nextDayOf(null, null, TODAY)).toBeNull()
    expect(nextDayOf(program('p2', 'x', []), null, TODAY)).toBeNull()
  })
})

describe('nextDaysByClient', () => {
  it('maps everyone with a routine, never the archived', () => {
    const marta = program('p2', 'marta', [day('m1', 'Día 1'), day('m2', 'Día 2')])
    const latest = new Map([['laura', session('laura', 'd3', 3)], ['marta', session('marta', 'm1', 1, TODAY, 'p2')]])
    const days = nextDaysByClient(
      [client('laura', 'p1'), client('marta', 'p2'), client('lucia', null), client('sergio', 'p1', true)],
      [laura, marta],
      latest,
      TODAY,
    )
    expect([...days]).toEqual([
      ['laura', 1],
      ['marta', 1],
    ])
  })
})

describe('localSessionContext', () => {
  it('reads people and their current routine from the local dataset, and the class they are in', () => {
    const now = Date.parse('2026-11-06T18:05:00Z')
    const classes = {
      slots: [{ id: 's18', startsAt: Date.parse('2026-11-06T18:00:00Z'), durationMinutes: 60, status: 'open' as const }],
      bookings: [{ slotId: 's18', clientId: 'laura', status: 'booked' }],
    }
    const ctx = localSessionContext({ clients: [client('laura', 'p1'), client('lucia', null)], programs: [laura] }, classes, now)
    expect(ctx.person('laura')).toEqual({ archived: false, routine: { id: 'p1', dayIds: ['d1', 'd2', 'd3'] } })
    expect(ctx.person('lucia')).toEqual({ archived: false, routine: null })
    expect(ctx.person('ghost')).toBeNull()
    expect(ctx.slotFor('laura')).toBe('s18')
    expect(localSessionContext(null, null, now).slotFor('laura')).toBeNull()
  })
})

describe('a current routine of someone else (stale or imported id)', () => {
  // The SQL trigger joins the routine only when it is the person's own: here the same, or local mode would drift.
  it('is no routine: nothing recorded, no next day', () => {
    const pablo = client('pablo', 'p1')
    expect(localSessionContext({ clients: [pablo], programs: [laura] }, null, 0).person('pablo')).toEqual({ archived: false, routine: null })
    expect([...nextDaysByClient([pablo], [laura], new Map(), TODAY)]).toEqual([])
    expect(ownProgram(laura, 'pablo')).toBeNull()
    expect(ownProgram(laura, 'laura')).toBe(laura)
  })
})
