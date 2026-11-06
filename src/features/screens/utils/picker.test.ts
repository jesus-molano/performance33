import { describe, expect, it } from 'vitest'
import { SEND_COPY } from '@/features/screens/config/copy'
import type { ScreenView, SectionContent } from '@/features/screens/types'
import { buildPickerScreens, replacedOccupant, resolveLastDestination, screenNameOf, summarizeScreens } from './picker'

const shows = (clientId: string | null, day = 1): SectionContent => ({ clientId, day, assignedAt: clientId ? '2026-11-06T10:00:00.000Z' : '' })
const view = (id: number, contents: SectionContent[], online = true, name = `Pantalla ${id}`): ScreenView => ({
  id,
  name,
  sections: contents.length,
  contents,
  online,
})
const names = new Map([
  ['laura', 'Laura'],
  ['javier', 'Javier'],
])

describe('buildPickerScreens', () => {
  const views = [view(1, [shows('javier'), shows(null), shows('laura', 2)]), view(2, [shows(null), shows(null), shows(null), shows(null)], false)]

  it('draws each screen in its TV grid with the first name of who each section shows or nobody', () => {
    const [first, second] = buildPickerScreens(views, names, { clientId: 'laura', day: 1 }, null)
    expect(first).toMatchObject({ id: 1, name: 'Pantalla 1', online: true, columns: 3, rows: 1 })
    expect(first.tiles.map((t) => t.occupant)).toEqual(['Javier', null, 'Laura'])
    expect(second).toMatchObject({ online: false, columns: 2, rows: 2 })
    expect(second.tiles.map((t) => t.ref)).toEqual([1, 2, 3, 4].map((section) => ({ screen: 2, section })))
  })

  it('marks where the person already is (any day) and the last destination', () => {
    const [first, second] = buildPickerScreens(views, names, { clientId: 'laura', day: 1 }, { screen: 2, section: 3 })
    expect(first.tiles.map((t) => t.isTarget)).toEqual([false, false, true])
    expect(second.tiles.map((t) => t.isLast)).toEqual([false, false, true, false])
  })

  it('shows a client that no longer exists as free', () => {
    const [screen] = buildPickerScreens([view(1, [shows('gone')])], names, { clientId: 'laura', day: 1 }, null)
    expect(screen.tiles[0].occupant).toBeNull()
  })
})

describe('resolveLastDestination', () => {
  const views = [view(1, [shows(null), shows(null)])]

  it('keeps a stored section that the screen still has', () => {
    expect(resolveLastDestination('1:2', views)).toEqual({ screen: 1, section: 2 })
  })

  it('drops it when the screen is gone, has fewer sections now, or the value is not valid', () => {
    expect(resolveLastDestination('1:3', views)).toBeNull()
    expect(resolveLastDestination('2:1', views)).toBeNull()
    expect(resolveLastDestination('basura', views)).toBeNull()
    expect(resolveLastDestination(null, views)).toBeNull()
  })
})

describe('replacedOccupant', () => {
  const views = [view(1, [shows('javier'), shows(null), shows('laura')])]

  it('names who a send replaces', () => {
    expect(replacedOccupant(views, { screen: 1, section: 1 }, 'laura', names)).toBe('Javier')
  })

  it('is null for a free section, for the same person and for a screen not known', () => {
    expect(replacedOccupant(views, { screen: 1, section: 2 }, 'laura', names)).toBeNull()
    expect(replacedOccupant(views, { screen: 1, section: 3 }, 'laura', names)).toBeNull()
    expect(replacedOccupant(views, { screen: 5, section: 1 }, 'laura', names)).toBeNull()
  })
})

describe('screenNameOf', () => {
  it('uses the saved name, or the default one', () => {
    expect(screenNameOf([view(1, [shows(null)], true, 'Sala grande')], 1)).toBe('Sala grande')
    expect(screenNameOf([], 3)).toBe('Pantalla 3')
  })
})

describe('summarizeScreens', () => {
  it('counts the screens whose TV window is open', () => {
    expect(summarizeScreens([view(1, []), view(2, [])])).toEqual({ tone: 'all', open: 2, total: 2, closed: [] })
    expect(summarizeScreens([view(1, []), view(2, [], false)])).toEqual({ tone: 'some', open: 1, total: 2, closed: ['Pantalla 2'] })
    expect(summarizeScreens([view(1, [], false), view(2, [], false)])).toMatchObject({ tone: 'none', open: 0 })
  })

  it('is null for a gym without screens', () => {
    expect(summarizeScreens([])).toBeNull()
  })
})

describe('send toast', () => {
  it('reads like an arrow to the section, naming who was replaced', () => {
    const where = SEND_COPY.where('Pantalla 1', 2)
    expect(SEND_COPY.sent('Laura', where, null)).toBe('Laura → Pantalla 1 · Sección 2')
    expect(SEND_COPY.sent('Laura', where, 'Javier')).toBe('Laura → Pantalla 1 · Sección 2 (antes: Javier)')
  })
})
