import { beforeEach, describe, expect, it, vi } from 'vitest'
import { onlineScreens } from './cloudPresence'
import { toScreensEvent } from './cloudScreens'
import { createLocalScreens } from './localScreens'

vi.mock('@/lib/ids', () => ({ newId: () => 'tab' }))

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

const NO_PRESENCE = { track: () => () => undefined, watch: () => () => undefined }
const SECTION = { screen: 1, section: 2, clientId: 'c1', day: 2, assignedAt: '2026-11-06T10:00:00.000Z' }

describe('local screens (test mode)', () => {
  beforeEach(stubStorage)

  it('keeps screens and sections, with the same rules as the cloud tables', async () => {
    const service = createLocalScreens(NO_PRESENCE)
    expect(await service.load()).toEqual({ screens: [], sections: [] })
    await expect(service.saveSections([SECTION])).rejects.toThrow()
    await service.saveScreens([{ id: 1, name: 'Pantalla 1', sections: 3 }])
    await service.saveSections([SECTION])
    expect(await service.load()).toEqual({ screens: [{ id: 1, name: 'Pantalla 1', sections: 3 }], sections: [SECTION] })
    await service.removeScreen(1)
    expect(await service.load()).toEqual({ screens: [], sections: [] })
  })

  it('creating the defaults never overwrites a screen that exists', async () => {
    const service = createLocalScreens(NO_PRESENCE)
    await service.saveScreens([{ id: 1, name: 'Sala', sections: 5 }])
    await service.saveScreens(
      [
        { id: 1, name: 'Pantalla 1', sections: 3 },
        { id: 2, name: 'Pantalla 2', sections: 3 },
      ],
      true,
    )
    expect((await service.load()).screens).toEqual([
      { id: 1, name: 'Sala', sections: 5 },
      { id: 2, name: 'Pantalla 2', sections: 3 },
    ])
  })

  it('a new number of sections empties the ones it leaves out or brings back, like the database', async () => {
    const service = createLocalScreens(NO_PRESENCE)
    await service.saveScreens([{ id: 1, name: 'P', sections: 3 }])
    await service.saveSections([SECTION, { ...SECTION, section: 3 }])
    await service.saveScreens([{ id: 1, name: 'Sala', sections: 3 }])
    expect((await service.load()).sections).toHaveLength(2)
    await service.saveScreens([{ id: 1, name: 'P', sections: 2 }])
    expect((await service.load()).sections).toEqual([SECTION])
  })

  it('tells every change of the sections, before and after, like the trigger that records the sessions', async () => {
    const changes: Array<[number, number]> = []
    const service = createLocalScreens(NO_PRESENCE, (before, after) => changes.push([before.length, after.length]))
    await service.saveScreens([{ id: 1, name: 'P', sections: 3 }])
    await service.saveSections([SECTION, { ...SECTION, section: 3 }])
    await service.saveScreens([{ id: 1, name: 'P', sections: 2 }])
    await service.removeScreen(1)
    expect(changes).toEqual([
      [0, 0],
      [0, 2],
      [2, 1],
      [1, 0],
    ])
  })
})

describe('cloud screens', () => {
  it('reads live changes, and asks for a reload when a row is not valid', () => {
    expect(toScreensEvent({ table: 'screens', id: '2', row: { id: '2', data: { name: 'B', sections: 4 } } })).toEqual({
      kind: 'screen',
      id: 2,
      screen: { id: 2, name: 'B', sections: 4 },
    })
    expect(toScreensEvent({ table: 'screen_sections', id: '1:2', row: null })).toEqual({ kind: 'section', id: '1:2', section: null })
    expect(toScreensEvent({ table: 'screens', id: '9', row: { id: '9', data: {} } })).toBeNull()
    expect(toScreensEvent({ table: 'screen_sections', id: 'x', row: { id: 'x', data: {} } })).toBeNull()
  })

  it('counts a screen as open when any window says it shows it', () => {
    expect([...onlineScreens({ a: [{ screens: [1] }], b: [{ screens: [2, 'x', 99] }, {}], c: [] })]).toEqual([1, 2])
  })
})
