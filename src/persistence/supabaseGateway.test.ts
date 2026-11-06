import type { RealtimePostgresChangesPayload, SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import { createSupabaseGateway, subscribeTableRows, toTableEvent } from './supabaseGateway'

vi.mock('@/lib/ids', () => ({ newId: () => 'tab' }))

type Payload = RealtimePostgresChangesPayload<Record<string, unknown>>
type Handler = (payload: Payload) => void

function fakeClient() {
  const topics: string[] = []
  const tables: string[] = []
  const handlers: Handler[] = []
  let onStatus: (status: string) => void = () => undefined
  const channel = {
    on: (_type: string, filter: { table: string }, handler: Handler) => {
      tables.push(filter.table)
      handlers.push(handler)
      return channel
    },
    subscribe: (listener: (status: string) => void) => {
      onStatus = listener
      return channel
    },
  }
  const client = {
    channel: (topic: string) => {
      topics.push(topic)
      return channel
    },
    removeChannel: vi.fn(),
  }
  return { client: client as unknown as SupabaseClient, topics, tables, handlers, status: (status: string) => onStatus(status) }
}

const payload = (fields: Partial<Payload> & Record<string, unknown>): Payload => ({ errors: [], old: {}, new: {}, ...fields }) as unknown as Payload

describe('createSupabaseGateway.subscribe', () => {
  it('never reuses a channel name: a channel being removed would swallow the new subscription', () => {
    const { client, topics } = fakeClient()
    const gateway = createSupabaseGateway(client)
    gateway.subscribe(() => undefined, () => undefined)()
    gateway.subscribe(() => undefined, () => undefined)
    expect(topics).toHaveLength(2)
    expect(topics[0]).not.toBe(topics[1])
  })
})

describe('toTableEvent', () => {
  it('reads changed rows and deletes', () => {
    expect(toTableEvent('screens', payload({ eventType: 'UPDATE', new: { id: '1', data: { name: 'P' } } }))).toEqual({
      table: 'screens',
      id: '1',
      row: { id: '1', data: { name: 'P' } },
    })
    expect(toTableEvent('screens', payload({ eventType: 'DELETE', old: { id: '1' } }))).toEqual({ table: 'screens', id: '1', row: null })
  })

  it('gives nothing for an event with errors or without its row (too big to carry): the caller reloads', () => {
    expect(toTableEvent('screens', payload({ eventType: 'INSERT', errors: ['x'] as unknown as Payload['errors'], new: { id: '1', data: {} } }))).toBeNull()
    expect(toTableEvent('screens', payload({ eventType: 'INSERT', new: { id: '1' } }))).toBeNull()
    expect(toTableEvent('screens', payload({ eventType: 'DELETE', old: {} }))).toBeNull()
  })
})

describe('subscribeTableRows', () => {
  it('follows every table asked for on one channel, and catches up when connected', () => {
    const fake = fakeClient()
    const onEvent = vi.fn()
    const onMissed = vi.fn()
    const stop = subscribeTableRows(fake.client, 'p33-screens', ['screens', 'screen_sections'], onEvent, onMissed)
    expect(fake.tables).toEqual(['screens', 'screen_sections'])
    expect(fake.topics[0]).toMatch(/^p33-screens-/)

    fake.handlers[1](payload({ eventType: 'INSERT', new: { id: '1:2', data: { day: 1 } } }))
    expect(onEvent).toHaveBeenCalledWith({ table: 'screen_sections', id: '1:2', row: { id: '1:2', data: { day: 1 } } })
    fake.handlers[0](payload({ eventType: 'INSERT', new: { id: '1' } }))
    expect(onMissed).toHaveBeenCalledTimes(1)
    fake.status('SUBSCRIBED')
    expect(onMissed).toHaveBeenCalledTimes(2)

    stop()
    expect(fake.client.removeChannel).toHaveBeenCalledTimes(1)
  })
})
