import { describe, expect, it } from 'vitest'
import { createUndoGrouper, groupKey } from './undoGroup'

describe('createUndoGrouper', () => {
  it('merges edits of the same field within the window', () => {
    let now = 0
    const grouper = createUndoGrouper(1000, () => now)
    const key = groupKey('exercise', 'ex1', { name: 'a' })
    expect(grouper.shouldMerge(key)).toBe(false)
    now = 500
    expect(grouper.shouldMerge(key)).toBe(true)
    now = 2000
    expect(grouper.shouldMerge(key)).toBe(false)
  })

  it('never merges after a reset, a different field or an ungrouped change', () => {
    const grouper = createUndoGrouper(1000, () => 0)
    const name = groupKey('exercise', 'ex1', { name: 'a' })
    grouper.shouldMerge(name)
    grouper.reset()
    expect(grouper.shouldMerge(name)).toBe(false)
    expect(grouper.shouldMerge(groupKey('exercise', 'ex1', { reps: '8' }))).toBe(false)
    expect(grouper.shouldMerge(undefined)).toBe(false)
  })
})
