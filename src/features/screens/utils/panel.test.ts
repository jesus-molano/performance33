import { describe, expect, it } from 'vitest'
import { TV_READABLE_SECTIONS } from '@/config/app'
import type { ScreenView } from '@/features/screens/types'
import { isHardToRead, mergeSectionsUndo, occupiedBeyond, resolveScreenName } from './panel'
import { EMPTY_SECTION } from './sections'

const NOW = '2026-11-06T10:00:00.000Z'
const person = (clientId: string, day = 1) => ({ clientId, day, assignedAt: NOW })
const screen = (contents: ScreenView['contents']): ScreenView => ({ id: 2, name: 'Pantalla 2', sections: contents.length, contents, online: false })

describe('resolveScreenName', () => {
  it('trims the text', () => {
    expect(resolveScreenName('  Sala grande ', 1)).toBe('Sala grande')
  })

  it('falls back to the default name when blank', () => {
    expect(resolveScreenName('   ', 3)).toBe('Pantalla 3')
  })
})

describe('occupiedBeyond', () => {
  it('lists only the sections with someone past the new count', () => {
    const view = screen([person('a'), EMPTY_SECTION, person('c', 2), EMPTY_SECTION, person('e')])
    expect(occupiedBeyond(view, 2)).toEqual([
      { ref: { screen: 2, section: 3 }, content: person('c', 2) },
      { ref: { screen: 2, section: 5 }, content: person('e') },
    ])
  })

  it('is empty when the count grows or stays', () => {
    const view = screen([person('a'), person('b')])
    expect(occupiedBeyond(view, 2)).toEqual([])
    expect(occupiedBeyond(view, 4)).toEqual([])
  })
})

describe('isHardToRead', () => {
  it('warns only above the readable count', () => {
    expect(isHardToRead(TV_READABLE_SECTIONS)).toBe(false)
    expect(isHardToRead(TV_READABLE_SECTIONS + 1)).toBe(true)
  })
})

describe('mergeSectionsUndo', () => {
  const andres = person('andres')
  const laura = person('laura')
  const first = screen([person('a'), laura, andres])

  it('starts from the screen before the change', () => {
    const cleared = occupiedBeyond(first, 2)
    expect(mergeSectionsUndo(null, first, cleared)).toEqual({ original: first, cleared })
  })

  it('3 → 2 → 1: one undo brings back the 3 sections and both people', () => {
    const toTwo = mergeSectionsUndo(null, first, occupiedBeyond(first, 2))
    const second: ScreenView = { ...first, sections: 2 }
    const toOne = mergeSectionsUndo(toTwo, second, occupiedBeyond({ ...second, contents: [person('a'), laura, EMPTY_SECTION] }, 1))
    expect(toOne.original).toBe(first)
    expect(toOne.original.sections).toBe(3)
    expect(toOne.cleared).toEqual([
      { ref: { screen: 2, section: 3 }, content: andres },
      { ref: { screen: 2, section: 2 }, content: laura },
    ])
  })

  it('keeps what a section showed first when it is emptied again', () => {
    const pending = mergeSectionsUndo(null, first, occupiedBeyond(first, 2))
    const again = mergeSectionsUndo(pending, first, [{ ref: { screen: 2, section: 3 }, content: person('otra') }])
    expect(again.cleared).toEqual(pending.cleared)
  })
})
