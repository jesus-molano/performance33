import { describe, expect, it } from 'vitest'
import {
  morePlacements,
  NO_PLACEMENTS,
  placementLabel,
  placementsByClient,
  placementShort,
  placementsLabel,
  placementsOf,
} from './screenPlacements'

const empty = { clientId: null, day: 1, assignedAt: '' }
const at = (clientId: string, day: number, assignedAt: string) => ({ clientId, day, assignedAt })

const screens = [
  { id: 1, name: 'Pantalla 1', contents: [at('ana', 1, '2026-11-06T10:00:00.000Z'), empty, at('luis', 3, '2026-11-06T10:05:00.000Z')] },
  { id: 2, name: 'Sala grande', contents: [empty, at('marta', 2, '2026-11-06T09:00:00.000Z')] },
]

describe('placementsByClient', () => {
  it('maps each section to the user it shows, with screen, section (1-based) and day', () => {
    const map = placementsByClient(screens)
    expect([...map.keys()].sort()).toEqual(['ana', 'luis', 'marta'])
    expect(placementsOf(map, 'luis')).toEqual([{ screen: 1, screenName: 'Pantalla 1', section: 3, day: 3, assignedAt: '2026-11-06T10:05:00.000Z' }])
    expect(placementsOf(map, 'marta')[0]).toMatchObject({ screen: 2, screenName: 'Sala grande', section: 2, day: 2 })
  })

  it('keeps every section of someone shown twice, the one sent last first', () => {
    const twice = [
      { id: 1, name: 'Pantalla 1', contents: [at('ana', 1, '2026-11-06T10:00:00.000Z')] },
      { id: 2, name: 'Pantalla 2', contents: [empty, at('ana', 4, '2026-11-06T11:00:00.000Z')] },
    ]
    expect(placementsOf(placementsByClient(twice), 'ana').map((p) => [p.screen, p.section])).toEqual([
      [2, 2],
      [1, 1],
    ])
  })

  it('orders ties by screen and section', () => {
    const tie = [
      { id: 2, name: 'Pantalla 2', contents: [at('ana', 1, '')] },
      { id: 1, name: 'Pantalla 1', contents: [empty, at('ana', 1, '')] },
    ]
    expect(placementsOf(placementsByClient(tie), 'ana').map((p) => p.screen)).toEqual([1, 2])
  })

  it('leaves out people not included (archived ones show as nobody)', () => {
    const map = placementsByClient(screens, new Set(['ana', 'marta']))
    expect(map.has('luis')).toBe(false)
    expect(map.size).toBe(2)
  })

  it('gives nothing for empty screens or someone on none', () => {
    expect(placementsByClient([{ id: 1, name: 'Pantalla 1', contents: [empty, empty] }]).size).toBe(0)
    expect(placementsOf(placementsByClient(screens), 'nadie')).toBe(NO_PLACEMENTS)
  })
})

describe('placement labels', () => {
  const [luis] = placementsOf(placementsByClient(screens), 'luis')
  const [marta] = placementsOf(placementsByClient(screens), 'marta')

  it('says screen, section and day, short on narrow places', () => {
    expect(placementLabel(luis)).toBe('Pantalla 1 · Sección 3 · Día 3')
    expect(placementShort(luis)).toBe('Pantalla 1')
    expect(placementLabel(marta)).toBe('Sala grande · Sección 2 · Día 2')
    expect(placementShort(marta)).toBe('Sala grande')
  })

  it('joins several places and counts the extra ones', () => {
    expect(placementsLabel([luis, marta])).toBe('Pantalla 1 · Sección 3 · Día 3 y Sala grande · Sección 2 · Día 2')
    expect(morePlacements([luis, marta])).toBe('+1')
    expect(morePlacements([luis])).toBeNull()
  })
})
