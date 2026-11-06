import { describe, expect, it } from 'vitest'
import type { ScreenSection } from '@/features/screens/types'
import { createPendingWrites, screenKey, sectionKey } from './pendingWrites'
import { toSectionMap } from './sections'
import { applyEvent, mergeSnapshot, type ScreensData } from './snapshot'

const row = (id: string, clientId: string | null, day = 1): ScreenSection => {
  const [screen, section] = id.split(':').map(Number)
  return { screen, section, clientId, day, assignedAt: '' }
}

const local: ScreensData = {
  screens: [{ id: 1, name: 'Pantalla 1', sections: 3 }],
  sections: toSectionMap([row('1:1', 'mine'), row('1:2', 'old')]),
}

describe('pending writes', () => {
  it('ignore other copies until the server sends back what was written, or the time runs out', () => {
    let now = 0
    const pending = createPendingWrites(1000, () => now)
    pending.mark('k', { a: 1 })
    expect(pending.accept('k', { a: 0 })).toBe(false)
    expect(pending.accept('k', { a: 1 })).toBe(true)
    expect(pending.accept('k', { a: 0 })).toBe(true)
    pending.mark('k', { a: 2 })
    now = 1001
    expect(pending.accept('k', { a: 0 })).toBe(true)
  })

  it('a failed write stops the wait only if no later write of the same row is waiting', () => {
    const pending = createPendingWrites(1000, () => 0)
    pending.mark('k', { a: 1 })
    pending.mark('k', { a: 2 })
    pending.forget('k', { a: 1 })
    expect(pending.accept('k', { a: 1 })).toBe(false)
    pending.forget('k', { a: 2 })
    expect(pending.accept('k', { a: 1 })).toBe(true)
  })
})

describe('mergeSnapshot', () => {
  it('takes what the server has, removed rows included', () => {
    const merged = mergeSnapshot(local, { screens: [{ id: 2, name: 'B', sections: 2 }], sections: [row('2:1', 'x')] }, () => true)
    expect(merged.screens.map((s) => s.id)).toEqual([2])
    expect(Object.keys(merged.sections)).toEqual(['2:1'])
  })

  it('keeps what this window wrote and the server has not confirmed yet', () => {
    const pending = createPendingWrites(1000)
    pending.mark(sectionKey('1:1'), row('1:1', 'mine'))
    pending.mark(screenKey(1), local.screens[0])
    const merged = mergeSnapshot(local, { screens: [], sections: [row('1:1', 'older'), row('1:2', 'theirs')] }, pending.accept)
    expect(merged.screens).toEqual(local.screens)
    expect(merged.sections['1:1'].clientId).toBe('mine')
    expect(merged.sections['1:2'].clientId).toBe('theirs')
  })
})

describe('applyEvent', () => {
  it('applies a section change or delete', () => {
    expect(applyEvent(local, { kind: 'section', id: '1:3', section: row('1:3', 'new') }, () => true).sections['1:3'].clientId).toBe('new')
    expect(applyEvent(local, { kind: 'section', id: '1:2', section: null }, () => true).sections['1:2']).toBeUndefined()
  })

  it('a removed screen takes its sections with it', () => {
    const next = applyEvent(local, { kind: 'screen', id: 1, screen: null }, () => true)
    expect(next).toEqual({ screens: [], sections: {} })
  })

  it('an older echo of a pending write is ignored', () => {
    const pending = createPendingWrites(1000)
    pending.mark(sectionKey('1:1'), row('1:1', 'mine', 2))
    expect(applyEvent(local, { kind: 'section', id: '1:1', section: row('1:1', 'mine', 1) }, pending.accept)).toBe(local)
  })
})
