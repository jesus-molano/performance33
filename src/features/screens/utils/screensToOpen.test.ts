import { describe, expect, it } from 'vitest'
import type { SectionWrite } from '@/features/screens/types'
import { screensToOpen } from './screensToOpen'

const write = (screen: number, section: number, clientId: string | null): SectionWrite => ({
  ref: { screen, section },
  content: { clientId, day: 1, assignedAt: '' },
})

const everyTv = () => true

describe('screensToOpen', () => {
  it('opens each screen that got people once, in order', () => {
    expect(screensToOpen([write(2, 1, 'a'), write(1, 1, 'b'), write(2, 2, 'c')], new Set(), everyTv)).toEqual([1, 2])
  })

  it('skips screens already open in this browser', () => {
    expect(screensToOpen([write(1, 1, 'a'), write(2, 1, 'b')], new Set([1]), everyTv)).toEqual([2])
  })

  it('skips screens that were only emptied', () => {
    expect(screensToOpen([write(1, 1, null)], new Set(), everyTv)).toEqual([])
  })

  it('opens nothing for a screen without a TV on this computer', () => {
    expect(screensToOpen([write(1, 1, 'a'), write(2, 1, 'b')], new Set(), (screen) => screen === 2)).toEqual([2])
    expect(screensToOpen([write(1, 1, 'a')], new Set(), () => false)).toEqual([])
  })
})
