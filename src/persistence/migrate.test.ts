import { describe, expect, it } from 'vitest'
import { DEFAULT_BRANDING, LEGACY_ACCENT_COLOR } from '@/config/branding'
import { createSeedData } from '@/data/seed'
import { normalizeAppData } from './migrate'

describe('normalizeAppData', () => {
  it('round-trips valid data and the export envelope', () => {
    const data = createSeedData('2026-10-31')
    expect(normalizeAppData(data)).toEqual(data)
    expect(normalizeAppData({ app: 'performance33-rutinas', data })).toEqual(data)
  })

  it('fills missing nested collections so the editor and TV cannot crash', () => {
    const raw = {
      coaches: [{ id: 'c1', name: 'Carla', color: '#000000' }],
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

  it('rejects data without coaches and drops items without id', () => {
    expect(normalizeAppData({ coaches: [], clients: [] })).toBeNull()
    const data = normalizeAppData({ coaches: [{ id: 'c1' }, { name: 'sin id' }], clients: [{ firstName: 'x' }] })
    expect(data?.coaches).toHaveLength(1)
    expect(data?.clients).toHaveLength(0)
  })

  it('migrates the old low-contrast accent colour', () => {
    const data = normalizeAppData({ coaches: [{ id: 'c1' }], clients: [], branding: { accentColor: LEGACY_ACCENT_COLOR } })
    expect(data?.branding.accentColor).toBe(DEFAULT_BRANDING.accentColor)
  })
})
