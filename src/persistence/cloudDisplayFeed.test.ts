import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CLOUD_REFETCH_INTERVAL_MS, CLOUD_REFETCH_RETRY_MS, REMOTE_BATCH_MS } from '@/config/app'
import { createSeedData } from '@/data/seed'
import type { DomainTable } from '@/lib/dataRows'
import type { DisplayData } from '@/types'
import { startCloudDisplayFeed } from './cloudDisplayFeed'
import type { DbRow } from './dbRows'
import type { RowEvent, RowGateway } from './rowGateway'

const seed = createSeedData('2026-10-31')
const secretClient = seed.clients[0]

function fakeServer() {
  const tables: Partial<Record<DomainTable, DbRow[]>> = {
    settings: [{ id: 'main', data: { ...seed.branding, gymName: 'Gimnasio' } }],
    clients: [{ id: secretClient.id, data: { ...secretClient, goal: 'SECRETO' } }],
    programs: [],
    notes: [{ id: 'n1', data: { text: 'NOTA SECRETA' } }],
  }
  let onEvent: (event: RowEvent) => void = () => undefined
  const server = {
    tables,
    fetched: [] as DomainTable[],
    subscribedTo: [] as readonly DomainTable[],
    offline: false,
    publish: (event: RowEvent) => onEvent(event),
    gateway: {
      fetchAll: async (table: DomainTable) => {
        if (server.offline) throw new Error('Failed to fetch')
        server.fetched.push(table)
        return tables[table] ?? []
      },
      subscribe: (listener: (event: RowEvent) => void, _missed: () => void, subscribedTo: readonly DomainTable[] = []) => {
        onEvent = listener
        server.subscribedTo = subscribedTo
        return () => undefined
      },
    } as unknown as RowGateway,
  }
  return server
}

describe('startCloudDisplayFeed', () => {
  let received: DisplayData[]
  const last = () => received.at(-1)
  const settle = () => vi.advanceTimersByTimeAsync(REMOTE_BATCH_MS)

  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('window', { addEventListener: () => undefined, removeEventListener: () => undefined })
    received = []
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('loads by itself, and never touches the tables with private content', async () => {
    const server = fakeServer()
    const stop = startCloudDisplayFeed(server.gateway, (data) => received.push(data))
    await settle()
    expect(last()?.branding.gymName).toBe('Gimnasio')
    expect(last()?.clients.map((client) => client.id)).toEqual([secretClient.id])
    expect(server.fetched).not.toContain('notes')
    expect(server.fetched).not.toContain('library_exercises')
    expect(server.subscribedTo).toEqual(['settings', 'clients', 'programs'])
    stop()
  })

  it('never keeps a private field', async () => {
    const server = fakeServer()
    const stop = startCloudDisplayFeed(server.gateway, (data) => received.push(data))
    await settle()
    server.publish({ table: 'clients', id: secretClient.id, row: { id: secretClient.id, data: { ...secretClient, firstName: 'Nuevo', goal: 'SECRETO' } } })
    await settle()
    expect(last()?.clients[0].firstName).toBe('Nuevo')
    expect(JSON.stringify(received)).not.toContain('SECRETO')
    stop()
  })

  it('an edit from another device appears without a reload, and a delete goes away', async () => {
    const server = fakeServer()
    const stop = startCloudDisplayFeed(server.gateway, (data) => received.push(data))
    await settle()
    const [program] = seed.programs
    server.publish({ table: 'programs', id: program.id, row: { id: program.id, data: program } })
    await settle()
    expect(last()?.programs.map((p) => p.id)).toEqual([program.id])
    server.publish({ table: 'programs', id: program.id, row: null })
    await settle()
    expect(last()?.programs).toEqual([])
    stop()
  })

  it('stays quiet when nothing really changed', async () => {
    const server = fakeServer()
    const stop = startCloudDisplayFeed(server.gateway, (data) => received.push(data))
    await settle()
    expect(received).toHaveLength(1)
    await vi.advanceTimersByTimeAsync(CLOUD_REFETCH_INTERVAL_MS)
    expect(received).toHaveLength(1)
    stop()
  })

  it('without connection it keeps showing the last data, and catches up later', async () => {
    const server = fakeServer()
    const stop = startCloudDisplayFeed(server.gateway, (data) => received.push(data))
    await settle()
    server.offline = true
    await vi.advanceTimersByTimeAsync(CLOUD_REFETCH_INTERVAL_MS)
    expect(received).toHaveLength(1)
    server.offline = false
    server.tables.clients = []
    await vi.advanceTimersByTimeAsync(CLOUD_REFETCH_INTERVAL_MS)
    expect(last()?.clients).toEqual([])
    stop()
  })

  it('a read overlapped by a live change is repeated, not trusted', async () => {
    const server = fakeServer()
    let release: (rows: DbRow[]) => void = () => undefined
    const original = server.gateway.fetchAll
    server.gateway.fetchAll = (table) =>
      table === 'clients' && !server.fetched.includes('clients')
        ? new Promise((resolve) => {
            server.fetched.push('clients')
            release = resolve
          })
        : original(table)
    const stop = startCloudDisplayFeed(server.gateway, (data) => received.push(data))
    server.publish({ table: 'clients', id: 'nuevo', row: { id: 'nuevo', data: { ...secretClient, id: 'nuevo' } } })
    release([])
    await settle()
    expect(last()?.clients.map((client) => client.id)).toEqual(['nuevo'])
    server.tables.clients = [{ id: 'nuevo', data: { ...secretClient, id: 'nuevo' } }]
    await vi.advanceTimersByTimeAsync(CLOUD_REFETCH_RETRY_MS)
    expect(last()?.clients.map((client) => client.id)).toEqual(['nuevo'])
    stop()
  })
})
