import { describe, expect, it } from 'vitest'
import { NO_HIGHLIGHT } from '@/features/editor/config'
import { moveHighlight } from './highlight'

describe('moveHighlight', () => {
  it('moves and wraps around', () => {
    expect(moveHighlight(0, 1, 3)).toBe(1)
    expect(moveHighlight(2, 1, 3)).toBe(0)
    expect(moveHighlight(0, -1, 3)).toBe(2)
  })

  it('starts at either end when nothing is highlighted', () => {
    expect(moveHighlight(NO_HIGHLIGHT, 1, 3)).toBe(0)
    expect(moveHighlight(NO_HIGHLIGHT, -1, 3)).toBe(2)
    expect(moveHighlight(NO_HIGHLIGHT, -1, 1)).toBe(0)
  })

  it('stays without highlight when there are no options', () => {
    expect(moveHighlight(0, 1, 0)).toBe(NO_HIGHLIGHT)
  })
})
