import { describe, expect, it } from 'vitest'
import { activeEntryIndex, buildComboboxEntries, isSelectedEntry, stepIndex, typedActiveIndex } from './combobox'

const startsWith = (options: readonly string[], query: string) => options.filter((o) => o.startsWith(query))

describe('buildComboboxEntries', () => {
  it('puts the clear entry first, then all options without a query', () => {
    expect(buildComboboxEntries(['ana', 'bea'], null, startsWith)).toEqual([null, 'ana', 'bea'])
  })

  it('filters with a query and keeps the clear entry when nothing matches', () => {
    expect(buildComboboxEntries(['ana', 'bea'], 'b', startsWith)).toEqual([null, 'bea'])
    expect(buildComboboxEntries(['ana', 'bea'], 'z', startsWith)).toEqual([null])
  })
})

describe('activeEntryIndex', () => {
  it('drops indexes that no longer point at an entry', () => {
    expect(activeEntryIndex(1, 3)).toBe(1)
    expect(activeEntryIndex(1, 1)).toBe(-1)
    expect(activeEntryIndex(-1, 3)).toBe(-1)
  })
})

describe('stepIndex', () => {
  it('wraps around both ends', () => {
    expect(stepIndex(2, 1, 3)).toBe(0)
    expect(stepIndex(0, -1, 3)).toBe(2)
  })

  it('starts from the right end when nothing is highlighted', () => {
    expect(stepIndex(-1, 1, 3)).toBe(0)
    expect(stepIndex(-1, -1, 3)).toBe(2)
    expect(stepIndex(-1, 1, 0)).toBe(-1)
  })
})

describe('typedActiveIndex', () => {
  it('highlights the first match after typing, the clear entry when emptied', () => {
    expect(typedActiveIndex('lau')).toBe(1)
    expect(typedActiveIndex('')).toBe(0)
  })
})

describe('isSelectedEntry', () => {
  const key = (s: string) => s
  it('compares by key, with null meaning no selection', () => {
    expect(isSelectedEntry('ana', 'ana', key)).toBe(true)
    expect(isSelectedEntry('ana', 'bea', key)).toBe(false)
    expect(isSelectedEntry(null, null, key)).toBe(true)
    expect(isSelectedEntry(null, 'ana', key)).toBe(false)
    expect(isSelectedEntry('ana', null, key)).toBe(false)
  })
})
