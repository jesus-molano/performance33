import { describe, expect, it } from 'vitest'
import type { Client } from '@/types'
import { countOnScreen, EMPTY_CLIENT_FILTERS, filterClients, hasActiveFilters } from './filterClients'

const client = (id: string, firstName: string, archived = false): Client =>
  ({ id, firstName, lastName: '', plan: 'standard', archived }) as unknown as Client

const clients = [client('a', 'Ana'), client('b', 'Bea'), client('c', 'Carla', true)]
const onScreen = new Set(['a', 'c'])

describe('filterClients with En pantalla', () => {
  it('shows everyone active without the filter', () => {
    expect(filterClients(clients, EMPTY_CLIENT_FILTERS, onScreen).map((c) => c.id)).toEqual(['a', 'b'])
  })

  it('shows only the people on a TV with it', () => {
    expect(filterClients(clients, { ...EMPTY_CLIENT_FILTERS, onScreen: true }, onScreen).map((c) => c.id)).toEqual(['a'])
  })

  it('combines with the search', () => {
    expect(filterClients(clients, { ...EMPTY_CLIENT_FILTERS, onScreen: true, query: 'bea' }, onScreen)).toEqual([])
  })

  it('shows nobody with the filter and nobody on a TV', () => {
    expect(filterClients(clients, { ...EMPTY_CLIENT_FILTERS, onScreen: true })).toEqual([])
  })

  it('counts as a filter', () => {
    expect(hasActiveFilters(EMPTY_CLIENT_FILTERS)).toBe(false)
    expect(hasActiveFilters({ ...EMPTY_CLIENT_FILTERS, onScreen: true })).toBe(true)
  })
})

describe('countOnScreen', () => {
  it('counts the active people on a TV, never the archived', () => {
    expect(countOnScreen(clients, onScreen)).toBe(1)
    expect(countOnScreen(clients, new Set())).toBe(0)
  })
})
