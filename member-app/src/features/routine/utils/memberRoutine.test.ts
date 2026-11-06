import { describe, expect, it } from 'vitest'
import type { MyRoutineSession } from '@shared/booking/memberRpc.ts'
import { demoProgram } from '@/services/backend/demoData'
import { buildMemberRoutine } from './memberRoutine'

const program = demoProgram('2026-11-02', '2026-11-29')

const session = (gymDate: string, dayIndex: number): MyRoutineSession => ({
  client_id: program.clientId,
  gym_date: gymDate,
  program_id: program.id,
  day_id: program.days[dayIndex].id,
  day_number: dayIndex + 1,
  slot_id: null,
  created_at: `${gymDate}T18:00:00Z`,
})

describe('buildMemberRoutine', () => {
  it('is null without a routine', () => {
    expect(buildMemberRoutine({ program: null, sessions: [] }, '2026-11-09')).toBeNull()
  })

  it('formats the days like the screens, with the week that applies', () => {
    const result = buildMemberRoutine({ program, sessions: [] }, '2026-11-09')
    expect(result?.routine.weekLabel).toBe('Semana 2 de 4')
    expect(result?.routine.days[0].title).toBe('Día 1 · Pierna')
    // Week 2 of the progression: 62,5 kg instead of the base 60.
    expect(result?.routine.days[0].blocks[1].exercises[0].load).toBe('62,5 kg')
    expect(result?.next).toEqual({ day: 1, reason: 'first' })
  })

  it('goes on from the last day done, and repeats it on the same day', () => {
    const sessions = [session('2026-11-05', 0), session('2026-11-07', 1)]
    expect(buildMemberRoutine({ program, sessions }, '2026-11-09')?.next).toEqual({ day: 3, reason: 'next' })
    expect(buildMemberRoutine({ program, sessions }, '2026-11-07')?.next).toEqual({ day: 2, reason: 'today' })
  })

  it('never carries private fields', () => {
    const text = JSON.stringify(buildMemberRoutine({ program, sessions: [] }, '2026-11-09'))
    expect(text).not.toContain('internalNote')
    expect(text).not.toContain('createdBy')
  })
})
