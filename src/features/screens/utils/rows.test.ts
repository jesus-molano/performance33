import { describe, expect, it } from 'vitest'
import { screenFromRow, screensFromRows, screenToRow, sectionFromRow, sectionsFromRows, sectionToRow } from './rows'

describe('screen rows', () => {
  it('round-trip', () => {
    const screen = { id: 2, name: 'Sala grande', sections: 6 }
    expect(screenToRow(screen)).toEqual({ id: '2', data: { name: 'Sala grande', sections: 6 } })
    expect(screenFromRow(screenToRow(screen))).toEqual(screen)
  })

  it('a damaged row gets its defaults; a row that is not a screen is left out', () => {
    expect(screenFromRow({ id: '3', data: { name: 5, sections: 'x' } })).toEqual({ id: 3, name: 'Pantalla 3', sections: 3 })
    expect(screenFromRow({ id: '3' })).toEqual({ id: 3, name: 'Pantalla 3', sections: 3 })
    expect(screensFromRows([{ id: '9', data: {} }, { id: '2', data: {} }, { id: 'x', data: {} }, { id: '1', data: {} }]).map((s) => s.id)).toEqual([1, 2])
  })
})

describe('section rows', () => {
  it('round-trip, with the screen they belong to', () => {
    const section = { screen: 1, section: 3, clientId: 'c1', day: 2, assignedAt: '2026-11-06T10:00:00.000Z' }
    expect(sectionToRow(section)).toEqual({ id: '1:3', screen_id: '1', data: { clientId: 'c1', day: 2, assignedAt: '2026-11-06T10:00:00.000Z' } })
    expect(sectionFromRow(sectionToRow(section))).toEqual(section)
  })

  it('reads anything odd as an empty section on day 1, and leaves out invalid ids', () => {
    expect(sectionFromRow({ id: '2:1', data: { clientId: '', day: 0, assignedAt: 4 } })).toEqual({ screen: 2, section: 1, clientId: null, day: 1, assignedAt: '' })
    expect(sectionsFromRows([{ id: '1:7', data: {} }, { id: 'x', data: {} }, { id: '1:1', data: {} }]).map((s) => s.section)).toEqual([1])
  })
})
