import { beforeEach, describe, expect, it, vi } from 'vitest'
import { toGymDate } from '@shared/booking'
import type { SessionContext } from '@shared/routine'
import { createLocalSessions } from './localSessions'

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

const context = (now: number): SessionContext => ({
  now,
  person: (id) => (id === 'laura' ? { archived: false, routine: { id: 'p1', dayIds: ['d1', 'd2'] } } : null),
  slotFor: () => null,
})

describe('local sessions (test mode)', () => {
  beforeEach(stubStorage)

  it('records what the screens show, tells this window at once, and reads it back from a day on', async () => {
    const service = createLocalSessions(context)
    const heard = vi.fn()
    const stop = service.subscribe(heard)
    service.record([], [{ id: '1:1', clientId: 'laura', day: 2 }])
    expect(heard).toHaveBeenCalledTimes(1)
    const today = toGymDate(Date.now())
    expect(await service.load(today)).toEqual([expect.objectContaining({ clientId: 'laura', gymDate: today, dayId: 'd2', dayNumber: 2 })])
    expect(await service.load('9999-01-01')).toEqual([])
    stop()
  })

  it('a change that records nothing writes nothing and tells nobody', () => {
    const service = createLocalSessions(context)
    const heard = vi.fn()
    service.subscribe(heard)
    service.record([], [{ id: '1:1', clientId: 'ghost', day: 1 }])
    expect(heard).not.toHaveBeenCalled()
  })
})
