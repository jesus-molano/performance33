import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EXERCISE_CATEGORY_OPTIONS } from '@/config/exerciseCategories'
import { createSeedData } from '@/data/seed'
import type { CustomExercise } from '@/types'
import { applyRemoteRows, hydrateData, watchLatestUndoStep } from './history'
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
  it('fills an empty database and keeps the branding and the library', () => {
    const custom: CustomExercise = { id: 'x1', name: 'Propio', category: EXERCISE_CATEGORY_OPTIONS[0].value, equipment: [], defaultMeasure: 'reps', custom: true, createdAt: '' }
    hydrateData({ ...seed, clients: [], programs: [], notes: [], branding: { ...seed.branding, gymName: 'Mi gym' }, customExercises: [custom] })
    actions().loadDemoData()
    const { data } = actions()
    expect(data.clients.length).toBeGreaterThan(0)
    expect(data.branding.gymName).toBe('Mi gym')
    expect(data.customExercises).toHaveLength(1)
  })
})
