import { describe, expect, it } from 'vitest'
import { createDay } from '@/lib/factories'
import type { Program } from '@/types'
import type { ScreenView, SectionContent } from '@/features/screens/types'
import { buildRemotePeople, buildRemoteScreens, dayLabelOf, findRemotePeople, placesByPerson, startDayFor } from './remote'

const program = (id: string, clientId: string, labels: string[]): Program => ({
  id,
  clientId,
  name: '',
  startDate: '2026-11-01',
  endDate: '2026-11-28',
  weeks: 4,
  days: labels.map((label, i) => createDay(i, { label })),
  createdAt: '2026-11-01T10:00:00.000Z',
  createdBy: null,
})

const client = (id: string, firstName: string, lastName: string, currentProgramId: string | null, archived = false) => ({
  id,
  firstName,
  lastName,
  color: '#123456',
  archived,
  currentProgramId,
})

const clients = [
  client('laura', 'Laura', 'Martín', 'p-laura'),
  client('javier', 'Javier', 'Ruiz', 'p-javier'),
  client('ana', 'Ana', 'Sanz', null),
  client('old', 'Olga', 'Vieja', 'p-old', true),
]
const programs = [program('p-laura', 'laura', ['Pierna', 'Empuje']), program('p-javier', 'javier', ['']), program('p-old', 'old', ['Todo'])]

const shows = (clientId: string | null, day = 1, assignedAt = '2026-11-06T10:00:00.000Z'): SectionContent => ({
  clientId,
  day,
  assignedAt: clientId ? assignedAt : '',
})
const view = (id: number, contents: SectionContent[], online = true): ScreenView => ({ id, name: `Pantalla ${id}`, sections: contents.length, contents, online })

describe('buildRemotePeople', () => {
  it('lists the active people by full name with the days of their current routine', () => {
    const people = buildRemotePeople(clients, programs)
    expect(people.map((p) => p.fullName)).toEqual(['Ana Sanz', 'Javier Ruiz', 'Laura Martín'])
    expect(people[2].days).toEqual([
      { day: 1, label: 'Día 1 · Pierna' },
      { day: 2, label: 'Día 2 · Empuje' },
    ])
    expect(people[0].days).toEqual([])
  })
})

describe('findRemotePeople', () => {
  const people = buildRemotePeople(clients, programs)

  it('offers only people with a routine', () => {
    expect(findRemotePeople(people, '').map((p) => p.id)).toEqual(['javier', 'laura'])
  })

  it('finds by any part of the name, without accents or case', () => {
    expect(findRemotePeople(people, 'lau MARTIN').map((p) => p.id)).toEqual(['laura'])
    expect(findRemotePeople(people, 'ruiz').map((p) => p.id)).toEqual(['javier'])
    expect(findRemotePeople(people, 'ana')).toEqual([])
  })
})

describe('buildRemoteScreens', () => {
  const people = buildRemotePeople(clients, programs)

  it('draws each screen in its TV grid with who each section shows and which day', () => {
    const [first, second] = buildRemoteScreens(
      [view(1, [shows('laura', 2), shows(null), shows('javier')]), view(2, [shows(null), shows(null), shows(null), shows(null), shows(null)], false)],
      people,
    )
    expect(first).toMatchObject({ id: 1, name: 'Pantalla 1', online: true, sections: 3, columns: 3, rows: 1 })
    expect(first.tiles.map((t) => [t.where, t.person?.firstName ?? null, t.dayLabel])).toEqual([
      ['Pantalla 1 · Sección 1', 'Laura', 'Día 2 · Empuje'],
      ['Pantalla 1 · Sección 2', null, null],
      ['Pantalla 1 · Sección 3', 'Javier', 'Día 1'],
    ])
    expect(second).toMatchObject({ online: false, columns: 3, rows: 2 })
    expect(second.tiles.map((t) => t.ref)).toEqual([1, 2, 3, 4, 5].map((section) => ({ screen: 2, section })))
  })

  it('shows an archived or deleted person as free, like the TV does', () => {
    const [screen] = buildRemoteScreens([view(1, [shows('old'), shows('gone')])], people)
    expect(screen.tiles.map((t) => t.person)).toEqual([null, null])
  })

  it('says the day number when the routine no longer has that day', () => {
    const [screen] = buildRemoteScreens([view(1, [shows('laura', 5)])], people)
    expect(screen.tiles[0].dayLabel).toBe('Día 5')
    expect(dayLabelOf({ days: [] }, 3)).toBe('Día 3')
  })
})

describe('placesByPerson', () => {
  it('says where each person shows, the first section when there are several', () => {
    const people = buildRemotePeople(clients, programs)
    const screens = buildRemoteScreens([view(1, [shows(null), shows('laura')]), view(2, [shows('laura'), shows('javier')])], people)
    expect(placesByPerson(screens)).toEqual(
      new Map([
        ['laura', 'Pantalla 1 · Sección 2'],
        ['javier', 'Pantalla 2 · Sección 2'],
      ]),
    )
  })
})

describe('startDayFor', () => {
  const laura = buildRemotePeople(clients, programs).find((p) => p.id === 'laura')!

  it('keeps the day the person shows elsewhere now', () => {
    expect(startDayFor(laura, [view(1, [shows('laura', 2)])])).toBe(2)
  })

  it('starts on Día 1 when the person shows nowhere, or on a day the routine no longer has', () => {
    expect(startDayFor(laura, [view(1, [shows(null)])])).toBe(1)
    expect(startDayFor(laura, [view(1, [shows('laura', 4)])])).toBe(1)
  })
})
