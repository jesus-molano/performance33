import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readAutomaticTvDisplaysRaw, saveAutomaticTvDisplays, subscribeAutomaticTvDisplays } from './tvDisplayStore'
import { parseTvDisplayMap } from './tvDisplays'

function stubStorage() {
  const store = new Map<string, string>()
  vi.stubGlobal('window', {
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    localStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
    },
  })
}

describe('what the automatic screens got', () => {
  beforeEach(stubStorage)

  it('is kept for every window of this computer (a window opened again reads it), not in one window only', () => {
    saveAutomaticTvDisplays({ 1: 'Derecha', 2: 'Izquierda' })
    expect(parseTvDisplayMap(readAutomaticTvDisplaysRaw())).toEqual({ 1: 'Derecha', 2: 'Izquierda' })
  })

  it('writing the same map again tells nobody, so windows writing what they resolved do not wake each other up', () => {
    const listener = vi.fn()
    const stop = subscribeAutomaticTvDisplays(listener)
    saveAutomaticTvDisplays({ 1: 'A' })
    saveAutomaticTvDisplays({ 1: 'A' })
    expect(listener).toHaveBeenCalledTimes(1)
    saveAutomaticTvDisplays({ 1: 'B' })
    expect(listener).toHaveBeenCalledTimes(2)
    stop()
  })
})
