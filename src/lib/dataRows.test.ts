import { describe, expect, it } from 'vitest'
import { createSeedData } from '@/data/seed'
import { applyRowChanges, diffData, hasLocalEdit, type RowChange } from './dataRows'

const seed = createSeedData('2026-10-31')

describe('diffData', () => {
  it('finds nothing between identical data, whatever the key order', () => {
    const [first, ...rest] = seed.clients
    const reordered = Object.fromEntries(Object.entries(first).reverse()) as typeof first
    expect(diffData(seed, { ...seed, clients: [reordered, ...rest] })).toEqual([])
  })

  it('reports only the row that changed', () => {
    const next = { ...seed, clients: seed.clients.map((c, i) => (i === 1 ? { ...c, goal: 'Otro' } : c)) }
    const changes = diffData(seed, next)
    expect(changes).toHaveLength(1)
    expect(changes[0]).toMatchObject({ table: 'clients', id: seed.clients[1].id, row: { goal: 'Otro' } })
    expect(changes[0].previous).toBe(seed.clients[1])
  })

  it('reports deleted rows with row: null', () => {
    const next = { ...seed, notes: seed.notes.slice(1) }
    expect(diffData(seed, next)).toMatchObject([{ table: 'notes', id: seed.notes[0].id, row: null }])
  })

  it('reports branding as the single settings row', () => {
    const next = { ...seed, branding: { ...seed.branding, gymName: 'Nuevo' } }
    expect(diffData(seed, next)).toMatchObject([{ table: 'settings', id: 'main', row: { gymName: 'Nuevo' } }])
  })

  it('writes notes after their client', () => {
    const empty = { ...seed, clients: [], notes: [], programs: [] }
    const tables = diffData(empty, seed).map((c) => c.table)
    expect(tables.lastIndexOf('clients')).toBeLessThan(tables.indexOf('notes'))
  })
})

describe('applyRowChanges', () => {
  it('replaces, adds and removes rows', () => {
    const edited = { ...seed.clients[0], goal: 'Editado' }
    const added = { ...seed.clients[0], id: 'nuevo' }
    const changes: RowChange[] = [
      { table: 'clients', id: edited.id, row: edited },
      { table: 'clients', id: added.id, row: added },
      { table: 'clients', id: seed.clients[1].id, row: null },
    ]
    const next = applyRowChanges(seed, changes)
    expect(next.clients.find((c) => c.id === edited.id)?.goal).toBe('Editado')
    expect(next.clients.some((c) => c.id === 'nuevo')).toBe(true)
    expect(next.clients.some((c) => c.id === seed.clients[1].id)).toBe(false)
    expect(next.programs).toBe(seed.programs)
  })

  it('returns the same data with no changes', () => {
    expect(applyRowChanges(seed, [])).toBe(seed)
  })
})

describe('hasLocalEdit', () => {
  const client = seed.clients[0]
  const incoming = { ...client, goal: 'Remoto' }

  it('is false when the local row is still the last known version', () => {
    expect(hasLocalEdit(seed, { table: 'clients', id: client.id, row: incoming, previous: client })).toBe(false)
  })

  it('is true when the local row was edited and not saved', () => {
    const previous = { ...client, goal: 'Antes' }
    expect(hasLocalEdit(seed, { table: 'clients', id: client.id, row: incoming, previous })).toBe(true)
  })

  it('is false when the previous version is unknown', () => {
    expect(hasLocalEdit(seed, { table: 'clients', id: client.id, row: incoming })).toBe(false)
  })
})
