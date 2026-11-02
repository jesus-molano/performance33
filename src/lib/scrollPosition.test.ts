import { beforeEach, describe, expect, it, vi } from 'vitest'
import { markHistoryEntry } from './scrollPosition'

describe('markHistoryEntry', () => {
  let state: unknown

  beforeEach(() => {
    state = null
    vi.stubGlobal('window', {
      history: {
        get state() {
          return state
        },
        replaceState: (next: unknown) => {
          state = next
        },
      },
    })
  })

  it('tells a page reached for the first time from one come back to', () => {
    expect(markHistoryEntry()).toBe(true)
    expect(markHistoryEntry()).toBe(false)
    state = null
    expect(markHistoryEntry()).toBe(true)
  })

  it('keeps what the entry already had', () => {
    state = { other: 1 }
    markHistoryEntry()
    expect(state).toMatchObject({ other: 1 })
  })
})
