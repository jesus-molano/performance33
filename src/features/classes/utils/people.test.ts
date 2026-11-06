import { describe, expect, it } from 'vitest'
import { findAddablePeople } from './people'

const person = (id: string, firstName: string, lastName: string, archived = false) => ({
  id, firstName, lastName, archived, color: '#000', plan: 'standard' as const, trainingDays: 2,
})

const clients = [person('c1', 'Laura', 'Martín'), person('c2', 'Lucía', 'González'), person('c3', 'Ángel', 'Ruiz'), person('c4', 'Sergio', 'Navarro', true)]

describe('findAddablePeople', () => {
  it('leaves out archived people and those already in the class, sorted by name', () => {
    const { results, allIn } = findAddablePeople(clients, new Set(['c2']), '', 10)
    expect(results.map((p) => p.name)).toEqual(['Ángel Ruiz', 'Laura Martín'])
    expect(allIn).toBe(false)
  })

  it('finds by any part of the name, without accents, up to the maximum', () => {
    expect(findAddablePeople(clients, new Set(), 'lu gonz', 10).results.map((p) => p.client.id)).toEqual(['c2'])
    expect(findAddablePeople(clients, new Set(), 'angel', 10).results.map((p) => p.client.id)).toEqual(['c3'])
    expect(findAddablePeople(clients, new Set(), '', 1).results).toHaveLength(1)
  })

  it('says when everybody is already in', () => {
    expect(findAddablePeople(clients, new Set(['c1', 'c2', 'c3']), 'x', 10)).toEqual({ results: [], allIn: true })
  })
})
