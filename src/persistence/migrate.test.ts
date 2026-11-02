import { describe, expect, it } from 'vitest'
import { DEFAULT_BRANDING, LEGACY_ACCENT_COLOR } from '@/config/branding'
import { EXERCISE_LIBRARY, EXERCISES_ADDED_IN_V2 } from '@/data/exercises'
import { createSeedData } from '@/data/seed'
import { SCHEMA_VERSION } from '@/types'
import { normalizeAppData } from './migrate'

describe('normalizeAppData', () => {
  it('round-trips valid data and the export envelope', () => {
    const data = createSeedData('2026-10-31')
    expect(normalizeAppData(data)).toEqual(data)
    expect(normalizeAppData({ app: 'performance33-rutinas', data })).toEqual(data)
  })

  it('fills missing nested collections so the editor and TV cannot crash', () => {
    const raw = {
      clients: [],
      programs: [{ id: 'p1', clientId: 'x', days: [{ id: 'd1', blocks: [{ id: 'b1', type: 'emom' }] }, { id: 'd2' }] }],
    }
    const data = normalizeAppData(raw)
    const [day1, day2] = data?.programs[0].days ?? []
    expect(day1.blocks[0].exercises).toEqual([])
    expect(day1.blocks[0].params).toBeTypeOf('object')
    expect(day2.blocks).toEqual([])
    expect(data?.programs[0].weeks).toBeGreaterThan(0)
  })

  it('rejects data without clients, drops items without id and ignores old coach lists', () => {
    expect(normalizeAppData({ programs: [] })).toBeNull()
    const data = normalizeAppData({ coaches: [{ id: 'c1' }], clients: [{ firstName: 'x' }, { id: 'c2' }] })
    expect(data?.clients).toHaveLength(1)
    expect(data).not.toHaveProperty('coaches')
  })

  it('fills params only when a block has none: a cleared value stays cleared', () => {
    const raw = { clients: [], programs: [{ id: 'p', days: [{ id: 'd', blocks: [{ id: 'a', type: 'superset', params: {} }, { id: 'b', type: 'superset' }] }] }] }
    const [cleared, missing] = normalizeAppData(raw)?.programs[0].days[0].blocks ?? []
    expect(cleared.params).toEqual({})
    expect(Object.keys(missing.params).length).toBeGreaterThan(0)
  })

  it('keeps day names as they are', () => {
    const raw = { clients: [], programs: [{ id: 'p', days: [{ id: 'd1', name: '' }, { id: 'd2', name: 'Día 7' }] }] }
    expect(normalizeAppData(raw)?.programs[0].days.map((d) => d.name)).toEqual(['', 'Día 7'])
  })

  it('data from before the library was editable keeps its own exercises and gets the initial ones', () => {
    const own = { id: 'custom_1', name: 'Propio', category: 'Core', equipment: [], defaultMeasure: 'reps', custom: true, createdAt: 'x' }
    const library = normalizeAppData({ clients: [], customExercises: [own] })?.library ?? []
    expect(library.length).toBe(EXERCISE_LIBRARY.length + 1)
    expect(library[0]).toEqual({ id: 'custom_1', name: 'Propio', muscle: 'Core', type: 'Fuerza', equipment: [], defaultMeasure: 'reps', createdAt: 'x' })
  })

  it('a library from the previous version gets its tags and, once, the exercises added since', () => {
    const old = { id: 'press-banca', name: 'Press de la casa', category: 'Empuje', equipment: ['Barra'], defaultMeasure: 'reps' }
    const library = normalizeAppData({ clients: [], schemaVersion: 1, library: [old] })?.library ?? []
    expect(library[0]).toMatchObject({ id: 'press-banca', name: 'Press de la casa', muscle: 'Pecho', type: 'Fuerza', equipment: ['Barra'] })
    expect(library[0]).not.toHaveProperty('category')
    expect(library).toHaveLength(1 + EXERCISES_ADDED_IN_V2.size)
    expect(normalizeAppData({ clients: [], schemaVersion: SCHEMA_VERSION, library: [library[0]] })?.library).toEqual([library[0]])
  })

  it('an empty library stays empty: nobody deleted it by accident', () => {
    expect(normalizeAppData({ clients: [], library: [] })?.library).toEqual([])
  })

  it('migrates the old low-contrast accent colour', () => {
    const data = normalizeAppData({ clients: [], branding: { accentColor: LEGACY_ACCENT_COLOR } })
    expect(data?.branding.accentColor).toBe(DEFAULT_BRANDING.accentColor)
  })
})
