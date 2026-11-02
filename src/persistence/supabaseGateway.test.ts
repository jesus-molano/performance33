import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import { createSupabaseGateway } from './supabaseGateway'

vi.mock('@/lib/ids', () => ({ newId: () => 'tab' }))

function fakeClient() {
  const topics: string[] = []
  const channel = { on: () => channel, subscribe: () => channel }
  const client = {
    channel: (topic: string) => {
      topics.push(topic)
      return channel
    },
    removeChannel: vi.fn(),
  }
  return { client: client as unknown as SupabaseClient, topics }
}

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
