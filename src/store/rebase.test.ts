import { describe, expect, it } from 'vitest'
import { createSeedData } from '@/data/seed'
import { applyRowChanges, diffData, type RowChange } from '@/lib/dataRows'
import type { AppData } from '@/types'
import { useAppStore } from './appStore'
import { applyRemoteRows, hydrateData, redo, undo } from './history'
import { rebaseSnapshots } from './rebase'

const seed = createSeedData('2026-10-31')
const [laura, javier] = seed.clients

const withGoal = (data: AppData, id: string, goal: string): AppData => ({
  ...data,
  clients: data.clients.map((c) => (c.id === id ? { ...c, goal } : c)),
})
const goalOf = (data: AppData | undefined, id: string) => data?.clients.find((c) => c.id === id)?.goal

describe('rebaseSnapshots', () => {
  it("puts the other coach's row in every snapshot", () => {
    const change: RowChange = { table: 'clients', id: javier.id, row: { ...javier, goal: 'De otro monitor' } }
    const step1 = withGoal(seed, laura.id, 'Uno')
    const current = applyRowChanges(withGoal(step1, laura.id, 'Dos'), [change])
    const rebased = rebaseSnapshots([{ data: seed }, { data: step1 }], [change], current)
    expect(rebased).toHaveLength(2)
    for (const snapshot of rebased) expect(goalOf(snapshot.data, javier.id)).toBe('De otro monitor')
    expect(goalOf(rebased[0].data, laura.id)).toBe(laura.goal)
    expect(goalOf(rebased[1].data, laura.id)).toBe('Uno')
  })

  it('adds a row created elsewhere and removes a row deleted elsewhere', () => {
    const changes: RowChange[] = [
      { table: 'clients', id: 'nuevo', row: { ...javier, id: 'nuevo' } },
      { table: 'notes', id: seed.notes[0].id, row: null },
    ]
    const current = applyRowChanges(withGoal(seed, laura.id, 'Dos'), changes)
    const [snapshot] = rebaseSnapshots([{ data: seed }], changes, current)
    expect(snapshot.data?.clients.some((c) => c.id === 'nuevo')).toBe(true)
    expect(snapshot.data?.notes.some((n) => n.id === seed.notes[0].id)).toBe(false)
  })

  it('drops steps left with nothing to undo', () => {
    const change: RowChange = { table: 'clients', id: laura.id, row: { ...laura, goal: 'De otro monitor' } }
    const current = applyRowChanges(seed, [change])
    expect(rebaseSnapshots([{ data: seed }, { data: withGoal(seed, laura.id, 'Mío') }], [change], current)).toEqual([])
  })
})

describe('undo with a second coach (store)', () => {
  const data = () => useAppStore.getState().data
  const { updateClient } = useAppStore.getState()

  it('undo only reverts my own edit, never the remote one', () => {
    hydrateData(seed)
    updateClient(laura.id, { goal: 'Mi cambio' })
    applyRemoteRows([{ table: 'clients', id: javier.id, row: { ...javier, goal: 'De otro monitor' }, previous: javier }])
    expect(goalOf(data(), javier.id)).toBe('De otro monitor')
    const beforeUndo = data()

    undo()
    expect(goalOf(data(), laura.id)).toBe(laura.goal)
    expect(goalOf(data(), javier.id)).toBe('De otro monitor')
    // What a save would send after the undo: only my row.
    expect(diffData(beforeUndo, data()).map((c) => c.id)).toEqual([laura.id])

    redo()
    expect(goalOf(data(), laura.id)).toBe('Mi cambio')
    expect(goalOf(data(), javier.id)).toBe('De otro monitor')
  })

  it('keeps unsaved local edits on the same row, and undo goes to the remote version', () => {
    hydrateData(seed)
    updateClient(laura.id, { goal: 'Sin guardar' })
    applyRemoteRows([{ table: 'clients', id: laura.id, row: { ...laura, goal: 'De otro monitor' }, previous: laura }])
    expect(goalOf(data(), laura.id)).toBe('Sin guardar')
    undo()
    expect(goalOf(data(), laura.id)).toBe('De otro monitor')
  })

  it('a remote change never adds an undo step', () => {
    hydrateData(seed)
    applyRemoteRows([{ table: 'clients', id: javier.id, row: { ...javier, goal: 'X' }, previous: javier }])
    expect(useAppStore.temporal.getState().pastStates).toHaveLength(0)
  })
})
