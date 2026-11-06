import { describe, expect, it } from 'vitest'
import { latestSessions, sessionFromRow, type TrainingSession } from './sessions.ts'

const session = (clientId: string, gymDate: string, dayNumber = 1): TrainingSession => ({
  clientId,
  gymDate,
  programId: 'p1',
  dayId: `d${dayNumber}`,
  dayNumber,
  slotId: null,
  createdAt: 0,
})

describe('sessions', () => {
  it('reads a row as PostgREST sends it', () => {
    expect(
      sessionFromRow({
        client_id: 'c1',
        gym_date: '2026-11-06',
        program_id: 'p1',
        day_id: 'd2',
        day_number: 2,
        slot_id: null,
        created_at: '2026-11-06T18:01:00+00:00',
      }),
    ).toEqual({ clientId: 'c1', gymDate: '2026-11-06', programId: 'p1', dayId: 'd2', dayNumber: 2, slotId: null, createdAt: Date.parse('2026-11-06T18:01:00Z') })
  })

  it('keeps the latest session of each person, in any order', () => {
    const latest = latestSessions([session('a', '2026-11-04', 1), session('b', '2026-11-01'), session('a', '2026-11-06', 2), session('a', '2026-11-05', 3)])
    expect(latest.get('a')?.dayNumber).toBe(2)
    expect(latest.get('b')?.gymDate).toBe('2026-11-01')
    expect(latest.has('c')).toBe(false)
  })
})
