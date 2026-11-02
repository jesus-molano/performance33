import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSeedData } from '@/data/seed'
import type { LibraryExercise } from '@/types'
import { applyRemoteRows, hydrateData, undo, watchLatestUndoStep } from './history'
import { useAppStore } from './appStore'

const seed = createSeedData('2026-10-31')
const actions = () => useAppStore.getState()
const edited = (id: string, goal: string) => {
  const client = actions().data.clients.find((c) => c.id === id)
  if (!client) throw new Error('missing client')
  return { ...client, goal }
}

describe('watchLatestUndoStep', () => {
  const [first, second] = seed.clients

  beforeEach(() => {
    hydrateData(seed)
    actions().updateClient(first.id, { goal: 'Mía' })
  })

  it('a change from another coach to another client leaves the step in place', () => {
    const onGone = vi.fn()
    const watch = watchLatestUndoStep(onGone)
    applyRemoteRows([{ table: 'clients', id: second.id, row: edited(second.id, 'Suya') }])
    expect(onGone).not.toHaveBeenCalled()
    expect(watch.isCurrent()).toBe(true)
    watch.stop()
  })

  it('a further local change ends it', () => {
    const onGone = vi.fn()
    const watch = watchLatestUndoStep(onGone)
    actions().updateClient(second.id, { goal: 'Otra mía' })
    expect(onGone).toHaveBeenCalled()
    watch.stop()
  })

  it('a remote change that cancels the step ends it', () => {
    const onGone = vi.fn()
    const watch = watchLatestUndoStep(onGone)
    applyRemoteRows([{ table: 'clients', id: first.id, row: edited(first.id, 'Suya') }])
    expect(onGone).toHaveBeenCalled()
    expect(watch.isCurrent()).toBe(false)
    watch.stop()
  })
})

describe('day names', () => {
  it('stay as typed until the field is left, then go back to automatic', () => {
    hydrateData(seed)
    const program = seed.programs.find((p) => p.days.length > 1)
    if (!program) throw new Error('missing program')
    const dayId = program.days[1].id
    const nameOf = () => actions().data.programs.find((p) => p.id === program.id)?.days[1].name
    actions().updateDay(dayId, { name: '' })
    expect(nameOf()).toBe('')
    actions().settleDayNames(dayId)
    expect(nameOf()).toBe('Día 2')
  })
})

describe('loadDemoData', () => {
  it('deleting a library exercise leaves its routines as free text, and undo brings both back', () => {
    const [program] = seed.programs
    const entry = program.days[0].blocks.flatMap((block) => block.exercises).find((exercise) => exercise.libraryId)
    if (!entry?.libraryId) throw new Error('missing linked exercise')
    hydrateData(seed)
    useAppStore.getState().deleteLibraryExercise(entry.libraryId)
    const row = () => useAppStore.getState().data.programs[0].days[0].blocks.flatMap((block) => block.exercises).find((exercise) => exercise.id === entry.id)
    expect(row()).toMatchObject({ libraryId: null, name: entry.name })
    undo()
    expect(row()?.libraryId).toBe(entry.libraryId)
    expect(useAppStore.getState().data.library.some((exercise) => exercise.id === entry.libraryId)).toBe(true)
  })

  it('fills an empty database and keeps the branding and the library', () => {
    const custom: LibraryExercise = { id: 'x1', name: 'Propio', muscle: 'Core', type: 'Fuerza', equipment: [], defaultMeasure: 'reps', createdAt: '' }
    hydrateData({ ...seed, clients: [], programs: [], notes: [], branding: { ...seed.branding, gymName: 'Mi gym' }, library: [custom] })
    actions().loadDemoData()
    const { data } = actions()
    expect(data.clients.length).toBeGreaterThan(0)
    expect(data.branding.gymName).toBe('Mi gym')
    expect(data.library).toHaveLength(1)
  })
})
