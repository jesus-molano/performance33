import { describe, expect, it } from 'vitest'
import { SEND_COPY } from '@/features/screens/config/copy'
import type { ScreenView, SectionContent } from '@/features/screens/types'
import { buildPickerScreens, movedFromSection, replacedOccupant, resolveLastDestination, screenNameOf, summarizeScreens } from './picker'

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
    expect(second).toMatchObject({ online: false, columns: 4, rows: 1 })
    expect(second.tiles.map((t) => t.ref)).toEqual([1, 2, 3, 4].map((section) => ({ screen: 2, section })))
  })

  it('marks where the person already is, telling the same day from another one, and the last destination', () => {
    const [first, second] = buildPickerScreens(views, names, { clientId: 'laura', day: 1 }, { screen: 2, section: 3 })
    expect(first.tiles.map((t) => t.here)).toEqual([null, null, 'other-day'])
    expect(first.tiles[2].shownDay).toBe(2)
    expect(buildPickerScreens(views, names, { clientId: 'laura', day: 2 }, null)[0].tiles[2].here).toBe('same')
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
  it('reads like an arrow to the section, with the day, who was replaced and where the person came from', () => {
    const where = SEND_COPY.where('Pantalla 2', 2)
    const base = { name: 'Marta', day: 2, where, replaced: null, movedFrom: null }
    expect(SEND_COPY.sent(base)).toBe('Marta · Día 2 → Pantalla 2 · Sección 2')
    expect(SEND_COPY.sent({ ...base, replaced: 'Laura', movedFrom: SEND_COPY.where('Pantalla 1', 1) })).toBe(
      'Marta · Día 2 → Pantalla 2 · Sección 2, en lugar de Laura. Sale de Pantalla 1 · Sección 1',
    )
  })
})

describe('movedFromSection', () => {
  it('finds the other section a send takes the person out of', () => {
    const views = [view(1, [shows('laura'), shows(null)]), view(2, [shows(null), shows('javier')])]
    expect(movedFromSection(views, { screen: 2, section: 1 }, 'laura')).toEqual({ screen: 1, section: 1 })
    expect(movedFromSection(views, { screen: 1, section: 1 }, 'laura')).toBeNull()
    expect(movedFromSection(views, { screen: 1, section: 2 }, 'andres')).toBeNull()
  })
})
