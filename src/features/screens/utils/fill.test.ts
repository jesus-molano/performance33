import { describe, expect, it } from 'vitest'
import type { ScreenConfig, ScreenSection, SectionWrite } from '@/features/screens/types'
import { FILL_COPY } from '@/features/screens/config/fill'
import { planClearAll, planFillFromClass, type FillPerson } from './fill'
import { sectionId, toSectionMap } from './sections'

const NOW = '2026-11-06T18:00:00.000Z'
const screens: ScreenConfig[] = [
  { id: 2, name: 'Pantalla 2', sections: 2 },
  { id: 1, name: 'Pantalla 1', sections: 3 },
]
const row = (screen: number, section: number, clientId: string | null, day = 1): ScreenSection => ({ screen, section, clientId, day, assignedAt: NOW })
const person = (clientId: string, day: number | null = 1): FillPerson => ({ clientId, name: clientId, day })
const where = (writes: readonly SectionWrite[]) => writes.map((w) => `${sectionId(w.ref)}=${w.content.clientId}:${w.content.day}`)
const names = (people: readonly FillPerson[]) => people.map((p) => p.clientId)
const none = new Set<string>()

describe('planFillFromClass', () => {
  it('fills the free sections in order, Pantalla 1 first, each person on their next day', () => {
    const sections = toSectionMap([row(1, 2, 'laura')])
    const plan = planFillFromClass(sections, screens, [person('ana', 2), person('luis', 3), person('marta', 1)], none, NOW)
    expect(where(plan.writes)).toEqual(['1:1=ana:2', '1:3=luis:3', '2:1=marta:1'])
    expect(names(plan.placed)).toEqual(['ana', 'luis', 'marta'])
    expect(plan.writes.every((w) => w.content.assignedAt === NOW)).toBe(true)
  })

  it('never overwrites anyone, and says who did not fit', () => {
    const sections = toSectionMap([row(1, 1, 'a'), row(1, 2, 'b'), row(1, 3, 'c'), row(2, 1, 'd')])
    const plan = planFillFromClass(sections, screens, [person('ana'), person('luis'), person('eva')], none, NOW)
    expect(where(plan.writes)).toEqual(['2:2=ana:1'])
    expect(names(plan.notFitted)).toEqual(['luis', 'eva'])
  })

  it('a section showing an archived person counts as free', () => {
    const sections = toSectionMap([row(1, 1, 'sergio'), row(1, 2, 'b'), row(1, 3, 'c'), row(2, 1, 'd'), row(2, 2, 'e')])
    const plan = planFillFromClass(sections, screens, [person('ana')], new Set(['sergio']), NOW)
    expect(where(plan.writes)).toEqual(['1:1=ana:1'])
  })

  it('leaves people already on a screen where they are', () => {
    const sections = toSectionMap([row(2, 2, 'ana', 3)])
    const plan = planFillFromClass(sections, screens, [person('ana', 1), person('luis')], none, NOW)
    expect(names(plan.alreadyShown)).toEqual(['ana'])
    expect(where(plan.writes)).toEqual(['1:1=luis:1'])
  })

  it('people without a routine take no section', () => {
    const plan = planFillFromClass({}, screens, [person('marta', null), person('luis')], none, NOW)
    expect(names(plan.noRoutine)).toEqual(['marta'])
    expect(where(plan.writes)).toEqual(['1:1=luis:1'])
  })

  it('each person once, and rows past a screen’s sections are not free places', () => {
    const plan = planFillFromClass(toSectionMap([row(2, 3, null)]), [{ id: 2, name: 'P2', sections: 1 }], [person('ana'), person('ana'), person('luis')], none, NOW)
    expect(where(plan.writes)).toEqual(['2:1=ana:1'])
    expect(names(plan.notFitted)).toEqual(['luis'])
  })

  it('nothing to do with nobody, or with no screens', () => {
    expect(planFillFromClass({}, screens, [], none, NOW).writes).toEqual([])
    expect(names(planFillFromClass({}, [], [person('ana')], none, NOW).notFitted)).toEqual(['ana'])
  })
})

describe('planClearAll', () => {
  it('empties every section showing someone, on every screen, and nothing else', () => {
    const sections = toSectionMap([row(1, 1, 'ana'), row(1, 2, null), row(2, 2, 'sergio'), row(2, 5, 'ghost')])
    const writes = planClearAll(sections, screens, NOW)
    expect(writes.map((w) => sectionId(w.ref))).toEqual(['1:1', '2:2'])
    expect(writes.every((w) => w.content.clientId === null && w.content.assignedAt === NOW)).toBe(true)
  })

  it('nothing when they are all empty', () => {
    expect(planClearAll({}, screens, NOW)).toEqual([])
  })
})

describe('FILL_COPY.done', () => {
  const people = (...ids: string[]) => ids.map((id) => person(id))

  it('says how many went, who did not fit and who has no routine', () => {
    const plan = { placed: people('a', 'b', 'c', 'd', 'e', 'f'), notFitted: people('Ana', 'Luis'), noRoutine: people('Marta'), alreadyShown: [] }
    expect(FILL_COPY.done(plan)).toBe('6 en pantalla · No caben: Ana, Luis · Sin rutina: Marta')
  })

  it('says when everybody was already there', () => {
    expect(FILL_COPY.done({ placed: [], notFitted: [], noRoutine: [], alreadyShown: people('a') })).toBe('Ya estaban todos en pantalla')
    expect(FILL_COPY.done({ placed: [], notFitted: [], noRoutine: people('Marta'), alreadyShown: [] })).toBe('Nadie en pantalla · Sin rutina: Marta')
  })
})

describe('FILL_COPY.done with nobody placed', () => {
  const people = (...ids: string[]) => ids.map((id) => person(id))

  it('says the screens are full, not that nobody is on screen', () => {
    expect(FILL_COPY.done({ placed: [], notFitted: people('Ana', 'Luis'), noRoutine: [], alreadyShown: [] })).toBe('Pantallas llenas · No caben: Ana, Luis')
    expect(FILL_COPY.done({ placed: [], notFitted: people('Ana'), noRoutine: [], alreadyShown: people('b') })).toBe('Pantallas llenas · No caben: Ana')
  })

  it('says "todos" only when everybody really was there', () => {
    expect(FILL_COPY.done({ placed: [], notFitted: [], noRoutine: people('Lucía'), alreadyShown: people('a') })).toBe('Ya estaban en pantalla · Sin rutina: Lucía')
  })
})
