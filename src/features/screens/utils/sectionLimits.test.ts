import { describe, expect, it } from 'vitest'
import type { ScreenConfig, ScreenSection, SectionWrite } from '@/features/screens/types'
import { sectionsAfterResize, sectionsResizedAway, writableWrites } from './sectionLimits'
import { toSectionMap } from './sections'

const NOW = '2026-11-06T10:00:00.000Z'
const screens: ScreenConfig[] = [
  { id: 1, name: 'Pantalla 1', sections: 3 },
  { id: 2, name: 'Pantalla 2', sections: 6 },
]
const row = (screen: number, section: number): ScreenSection => ({ screen, section, clientId: 'c1', day: 1, assignedAt: NOW })
const write = (screen: number, section: number): SectionWrite => ({ ref: { screen, section }, content: { clientId: 'c1', day: 1, assignedAt: NOW } })
const ids = (sections: readonly ScreenSection[]) => sections.map((s) => `${s.screen}:${s.section}`)

describe('writableWrites', () => {
  it('drops writes to a screen the gym does not have, or past its sections', () => {
    expect(writableWrites(screens, [write(1, 3), write(1, 4), write(2, 6), write(3, 1)]).map((w) => w.ref)).toEqual([
      { screen: 1, section: 3 },
      { screen: 2, section: 6 },
    ])
  })
})

describe('when a screen changes its number of sections', () => {
  const sections = [row(1, 1), row(1, 3), row(2, 2), row(2, 5), row(2, 6)]

  it('the sections past the new count go, and so do hidden ones a larger count would bring back', () => {
    const map = toSectionMap(sections)
    expect(sectionsResizedAway(map, screens, { id: 2, name: 'Pantalla 2', sections: 4 })).toEqual(['2:5', '2:6'])
    expect(sectionsResizedAway(toSectionMap([...sections, row(1, 5)]), screens, { id: 1, name: 'P', sections: 6 })).toEqual(['1:5'])
    expect(sectionsResizedAway(map, screens, { id: 1, name: 'Sala', sections: 3 })).toEqual([])
    expect(sectionsResizedAway(map, screens, { id: 4, name: 'Nueva', sections: 3 })).toEqual([])
  })

  it('local test mode keeps the same rows as the database', () => {
    const after = [screens[0], { ...screens[1], sections: 4 }]
    expect(ids(sectionsAfterResize(sections, screens, after))).toEqual(['1:1', '1:3', '2:2'])
    expect(ids(sectionsAfterResize(sections, screens, screens))).toEqual(ids(sections))
  })
})
