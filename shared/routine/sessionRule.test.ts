import { describe, expect, it } from 'vitest'
import { DAY_MS, MINUTE_MS } from '../booking/constants.ts'
import { addGymDays, toGymDate } from '../booking/week.ts'
import { SESSION_CASE_PEOPLE, SESSION_CASES, type SessionCaseSections, type SessionCasePerson } from './sessionCases.ts'
import { applySessionRule, sessionSlotFor, type SessionContext, type ShownSection } from './sessionRule.ts'
import type { TrainingSession } from './sessions.ts'

/** Noon in the gym, so "a few minutes ago" is the same gym day. */
const NOW = Date.parse('2026-11-06T12:00:00Z')
const TODAY = toGymDate(NOW)

const rowsOf = (sections: SessionCaseSections): ShownSection[] =>
  Object.entries(sections).map(([id, [clientId, day]]) => ({ id, clientId, day }))

const context = (slotFor: SessionContext['slotFor'] = () => null): SessionContext => ({
  now: NOW,
  person: (id) => SESSION_CASE_PEOPLE[id as SessionCasePerson] ?? null,
  slotFor,
})

const session = (clientId: SessionCasePerson, dayNumber: number, daysAgo = 0, minutesAgo = 0): TrainingSession => {
  const routine = SESSION_CASE_PEOPLE[clientId].routine
  return {
    clientId,
    gymDate: addGymDays(TODAY, -daysAgo),
    programId: routine?.id ?? '',
    dayId: routine?.dayIds[dayNumber - 1] ?? null,
    dayNumber,
    slotId: null,
    createdAt: NOW - minutesAgo * MINUTE_MS,
  }
}

const summary = (sessions: readonly TrainingSession[]) =>
  sessions
    .map((s) => ({ clientId: s.clientId, dayNumber: s.dayNumber, gymDate: s.gymDate }))
    .sort((a, b) => `${a.clientId}${a.gymDate}`.localeCompare(`${b.clientId}${b.gymDate}`))

describe('applySessionRule: the same cases as the SQL trigger', () => {
  for (const testCase of SESSION_CASES) {
    it(testCase.name, () => {
      const existing = (testCase.existing ?? []).map((s) => session(s.clientId, s.dayNumber, s.daysAgo, s.minutesAgo))
      const result = applySessionRule(existing, rowsOf(testCase.before), rowsOf(testCase.after), context())
      const expected = testCase.expected.map((s) => session(s.clientId, s.dayNumber, s.daysAgo))
      expect(summary(result)).toEqual(summary(expected))
    })
  }
})

describe('applySessionRule: what each session keeps', () => {
  it('records the routine, the day id and the class held now', () => {
    const [recorded] = applySessionRule([], [], [{ id: '1:1', clientId: 'laura', day: 2 }], context(() => 'slot-18'))
    expect(recorded).toEqual({ clientId: 'laura', gymDate: TODAY, programId: 'p-laura', dayId: 'l2', dayNumber: 2, slotId: 'slot-18', createdAt: NOW })
  })

  it('sending again keeps when it was first recorded and the class it had', () => {
    const first = { ...session('laura', 1, 0, 30), slotId: 'slot-18' }
    const [again] = applySessionRule([first], [{ id: '1:1', clientId: 'laura', day: 1 }], [{ id: '1:1', clientId: 'laura', day: 3 }], context())
    expect(again).toMatchObject({ dayNumber: 3, dayId: 'l3', createdAt: first.createdAt, slotId: 'slot-18' })
  })

  it('a section written again with the same person and day records nothing new', () => {
    const rows = [{ id: '1:1', clientId: 'laura', day: 2 }]
    expect(applySessionRule([], rows, rows, context())).toEqual([])
  })

  it('a person nobody knows is never recorded', () => {
    expect(applySessionRule([], [], [{ id: '1:1', clientId: 'ghost', day: 1 }], context())).toEqual([])
  })
})

describe('sessionSlotFor', () => {
  const slot = (id: string, startsInMinutes: number, status: 'open' | 'cancelled' = 'open') => ({
    id,
    startsAt: NOW + startsInMinutes * MINUTE_MS,
    durationMinutes: 60,
    status,
  })
  const booked = (slotId: string, status = 'booked') => ({ slotId, clientId: 'laura', status })

  it('is the class under way, or starting within 15 minutes, that the person has a place in', () => {
    expect(sessionSlotFor([slot('now', -30)], [booked('now')], 'laura', NOW)).toBe('now')
    expect(sessionSlotFor([slot('soon', 15)], [booked('soon')], 'laura', NOW)).toBe('soon')
    expect(sessionSlotFor([slot('later', 16)], [booked('later')], 'laura', NOW)).toBeNull()
    expect(sessionSlotFor([slot('over', -60)], [booked('over')], 'laura', NOW)).toBeNull()
  })

  it('never a waitlist, someone else, or a cancelled class', () => {
    expect(sessionSlotFor([slot('a', 0)], [booked('a', 'waitlisted')], 'laura', NOW)).toBeNull()
    expect(sessionSlotFor([slot('a', 0)], [booked('a')], 'marta', NOW)).toBeNull()
    expect(sessionSlotFor([slot('a', 0, 'cancelled')], [booked('a')], 'laura', NOW)).toBeNull()
  })

  it('with two at once, the one that started last', () => {
    expect(sessionSlotFor([slot('early', -50), slot('late', 10)], [booked('early'), booked('late')], 'laura', NOW)).toBe('late')
  })

  it('works a day later too', () => {
    expect(sessionSlotFor([slot('a', 0)], [booked('a')], 'laura', NOW + DAY_MS)).toBeNull()
  })
})
