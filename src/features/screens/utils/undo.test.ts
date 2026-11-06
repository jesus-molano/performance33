import { describe, expect, it } from 'vitest'
import type { ScreenSection } from '@/features/screens/types'
import { planSend, previousOf, toSectionMap } from './sections'
import { planUndo } from './undo'

const BEFORE = '2026-11-06T10:00:00.000Z'
const SENT = '2026-11-06T10:05:00.000Z'
const LATER = '2026-11-06T10:06:00.000Z'
const row = (screen: number, section: number, clientId: string | null, assignedAt = BEFORE): ScreenSection => ({
  screen,
  section,
  clientId,
  day: 1,
  assignedAt,
})

describe('planUndo', () => {
  const start = toSectionMap([row(1, 1, 'marta'), row(1, 2, 'laura')])
  const written = planSend(start, { screen: 1, section: 2 }, { clientId: 'marta', day: 1 }, SENT)
  const change = { written, previous: previousOf(start, written) }
  const after = toSectionMap(written.map(({ ref, content }) => ({ ...ref, ...content })))
  const applied = { ...start, ...after }

  it('puts back every section while nothing changed since', () => {
    const plan = planUndo(applied, change)
    expect(plan.skipped).toBe(0)
    expect(plan.writes).toEqual(change.previous)
  })

  it('leaves alone a section another coach changed meanwhile, and says how many', () => {
    const changed = { ...applied, '1:2': row(1, 2, 'andres', LATER) }
    const plan = planUndo(changed, change)
    expect(plan.skipped).toBe(1)
    expect(plan.writes.map((w) => w.ref)).toEqual([{ screen: 1, section: 1 }])
  })
})
