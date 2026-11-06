import { describe, expect, it } from 'vitest'
import { TV_DEFAULT_SECTIONS, TV_MAX_SECTIONS, TV_SCREEN_NAME_MAX_LENGTH } from '@/config/app'
import type { ScreenSection, SectionContent } from '@/features/screens/types'
import {
  applyWrites,
  clampSectionCount,
  defaultScreens,
  EMPTY_SECTION,
  findClientSections,
  firstFreeSection,
  gridFor,
  isScreenEmpty,
  normalizeScreen,
  parseSectionId,
  planAssign,
  planClear,
  planFill,
  planReorder,
  planSend,
  planSwap,
  previousOf,
  screenContents,
  sectionId,
  sectionIdsBeyond,
  toSectionMap,
} from './sections'

const NOW = '2026-11-06T10:00:00.000Z'
const LATER = '2026-11-06T10:05:00.000Z'
const row = (screen: number, section: number, clientId: string | null, day = 1): ScreenSection => ({ screen, section, clientId, day, assignedAt: NOW })
const who = (contents: SectionContent[]) => contents.map((c) => c.clientId)

describe('section ids', () => {
  it('are "screen:section" and only valid ones parse', () => {
    expect(sectionId({ screen: 2, section: 5 })).toBe('2:5')
    expect(parseSectionId('2:5')).toEqual({ screen: 2, section: 5 })
    for (const bad of ['0:1', '9:1', '1:0', `1:${TV_MAX_SECTIONS + 1}`, '1', '1:2:3', 'a:b', ' 1:2']) expect(parseSectionId(bad)).toBeNull()
  })
})

describe('gridFor', () => {
  it('puts 1-3 side by side, 4 in 2 × 2 and 5-6 in 3 × 2', () => {
    expect([1, 2, 3, 4, 5, 6].map(gridFor)).toEqual([
      { columns: 1, rows: 1 },
      { columns: 2, rows: 1 },
      { columns: 3, rows: 1 },
      { columns: 2, rows: 2 },
      { columns: 3, rows: 2 },
      { columns: 3, rows: 2 },
    ])
  })

  it('treats counts out of range as the nearest valid one', () => {
    expect(gridFor(0)).toEqual({ columns: 1, rows: 1 })
    expect(gridFor(9)).toEqual({ columns: 3, rows: 2 })
    expect(clampSectionCount(Number.NaN)).toBe(TV_DEFAULT_SECTIONS)
    expect(clampSectionCount(2.6)).toBe(3)
  })
})

describe('screens', () => {
  it('the gym starts with Pantalla 1 and 2, three sections each', () => {
    expect(defaultScreens()).toEqual([
      { id: 1, name: 'Pantalla 1', sections: 3 },
      { id: 2, name: 'Pantalla 2', sections: 3 },
    ])
  })

  it('a saved screen always has a name and a valid number of sections', () => {
    expect(normalizeScreen({ id: 3, name: '   ', sections: 9 })).toEqual({ id: 3, name: 'Pantalla 3', sections: TV_MAX_SECTIONS })
    expect(normalizeScreen({ id: 1, name: ` ${'a'.repeat(50)} `, sections: 2 }).name).toHaveLength(TV_SCREEN_NAME_MAX_LENGTH)
  })
})

describe('what a screen shows', () => {
  const sections = toSectionMap([row(1, 1, 'a'), row(1, 3, 'b', 2), row(2, 1, 'a'), row(1, 5, 'c')])

  it('lists every section in order, empty ones included', () => {
    expect(who(screenContents(sections, 1, 3))).toEqual(['a', null, 'b'])
    expect(screenContents(sections, 3, 2)).toEqual([EMPTY_SECTION, EMPTY_SECTION])
  })

  it('finds the first free section, or none', () => {
    expect(firstFreeSection(sections, 1, 3)).toBe(2)
    expect(firstFreeSection(toSectionMap([row(1, 1, 'a')]), 1, 1)).toBeNull()
  })

  it('knows where a client is and which rows are past the last section', () => {
    expect(findClientSections(sections, 'a')).toEqual([
      { screen: 1, section: 1 },
      { screen: 2, section: 1 },
    ])
    expect(sectionIdsBeyond(sections, 1, 3)).toEqual(['1:5'])
    expect(isScreenEmpty(sections, 1)).toBe(false)
    expect(isScreenEmpty(toSectionMap([row(1, 1, null)]), 1)).toBe(true)
  })
})

describe('changes', () => {
  const sections = toSectionMap([row(1, 1, 'a', 2), row(1, 2, 'b'), row(2, 1, 'c')])

  it('assign replaces whoever was there; the same client and day changes nothing', () => {
    expect(planAssign(sections, { screen: 1, section: 1 }, { clientId: 'a', day: 2 }, LATER)).toEqual([])
    expect(planAssign(sections, { screen: 1, section: 1 }, { clientId: 'c', day: 1 }, LATER)).toEqual([
      { ref: { screen: 1, section: 1 }, content: { clientId: 'c', day: 1, assignedAt: LATER } },
    ])
  })

  it('send also takes the client out of the section they were in', () => {
    const writes = planSend(sections, { screen: 2, section: 2 }, { clientId: 'a', day: 3 }, LATER)
    const next = applyWrites(sections, writes)
    expect(who(screenContents(next, 1, 2))).toEqual([null, 'b'])
    expect(screenContents(next, 2, 2)[1]).toEqual({ clientId: 'a', day: 3, assignedAt: LATER })
  })

  it('send to where the client already is only changes the day', () => {
    expect(planSend(sections, { screen: 1, section: 1 }, { clientId: 'a', day: 4 }, LATER)).toHaveLength(1)
  })

  it('clear empties a section once', () => {
    expect(planClear(sections, { screen: 1, section: 2 }, LATER)).toEqual([{ ref: { screen: 1, section: 2 }, content: { ...EMPTY_SECTION, assignedAt: LATER } }])
    expect(planClear(sections, { screen: 1, section: 3 }, LATER)).toEqual([])
  })

  it('swap exchanges two sections as they were, across screens too', () => {
    const next = applyWrites(sections, planSwap(sections, { screen: 1, section: 1 }, { screen: 2, section: 1 }))
    expect(screenContents(next, 1, 1)[0]).toEqual({ clientId: 'c', day: 1, assignedAt: NOW })
    expect(screenContents(next, 2, 1)[0]).toEqual({ clientId: 'a', day: 2, assignedAt: NOW })
    expect(planSwap(sections, { screen: 1, section: 3 }, { screen: 1, section: 4 })).toEqual([])
  })

  it('reorder moves one section and shifts the ones in between, like dragging a column', () => {
    const three = toSectionMap([row(1, 1, 'a'), row(1, 2, 'b'), row(1, 3, 'c')])
    expect(who(screenContents(applyWrites(three, planReorder(three, 1, 3, 1, 3)), 1, 3))).toEqual(['b', 'c', 'a'])
    expect(who(screenContents(applyWrites(three, planReorder(three, 1, 3, 3, 1)), 1, 3))).toEqual(['c', 'a', 'b'])
    expect(planReorder(three, 1, 3, 2, 2)).toEqual([])
    expect(planReorder(three, 1, 3, 0, 2)).toEqual([])
    expect(planReorder(three, 1, 3, 1, 4)).toEqual([])
  })

  it('fill writes only the sections with somebody', () => {
    expect(planFill({}, 3, [{ clientId: 'a', day: 2 }, { clientId: null, day: 1 }, { clientId: 'b', day: 1 }], NOW).map((w) => w.ref)).toEqual([
      { screen: 3, section: 1 },
      { screen: 3, section: 3 },
    ])
  })

  it('previous puts back exactly what was there', () => {
    const writes = planSend(sections, { screen: 1, section: 2 }, { clientId: 'c', day: 1 }, LATER)
    const changed = applyWrites(sections, writes)
    const restored = applyWrites(changed, previousOf(sections, writes))
    expect(screenContents(restored, 1, 2)).toEqual(screenContents(sections, 1, 2))
    expect(screenContents(restored, 2, 1)).toEqual(screenContents(sections, 2, 1))
  })
})
