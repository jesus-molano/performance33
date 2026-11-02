import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { REMOTE_BATCH_MS, STORAGE_KEYS } from '@/config/app'
import { createSeedData } from '@/data/seed'
import { DOMAIN_TABLES, type DomainTable } from '@/lib/dataRows'
import type { AppData } from '@/types'
import type { DbRow } from './dbRows'
import type { RemoteChange } from './repository'
import { PermanentWriteError, type RowEvent, type RowGateway } from './rowGateway'
import { SupabaseRepository } from './supabaseRepository'

/** In-memory server: one shared database and a live feed per connected window. */
class FakeServer {
  tables = Object.fromEntries(DOMAIN_TABLES.map((t) => [t, new Map<string, DbRow>()])) as Record<DomainTable, Map<string, DbRow>>
  subscribers = new Set<(event: RowEvent) => void>()
  writes: Array<{ table: DomainTable; ids: string[] }> = []
  offline = false
  refuse = new Set<string>()

  gateway(): RowGateway {
    return {
      fetchAll: async (table) => {
        this.failIfOffline()
        return [...this.tables[table].values()]
      },
      upsert: async (table, rows) => {
        this.failIfOffline()
        if (rows.some((row) => this.refuse.has(row.id))) throw new PermanentWriteError('refused')
        this.writes.push({ table, ids: rows.map((r) => r.id) })
        for (const row of rows) {
          this.tables[table].set(row.id, row)
          this.publish({ table, id: row.id, row })
        }
      },
      remove: async (table, ids) => {
        this.failIfOffline()
        const deleted = ids.filter((id) => this.tables[table].has(id) && !this.refuse.has(id))
        this.writes.push({ table, ids: deleted })
        for (const id of deleted) {
          this.tables[table].delete(id)
          this.publish({ table, id, row: null })
        }
        return deleted
      },
      subscribe: (onEvent) => {
        this.subscribers.add(onEvent)
        return () => this.subscribers.delete(onEvent)
      },
    }
  }

  private publish(event: RowEvent) {
    for (const subscriber of this.subscribers) subscriber(event)
  }

  private failIfOffline() {
    if (this.offline) throw new Error('Failed to fetch')
  }
}

const META = { source: 'test', revision: 1 }
const push = (repo: SupabaseRepository, data: AppData) => repo.save(() => data, META)
const seed = createSeedData('2026-10-31')
const withGoal = (data: AppData, id: string, goal: string): AppData => ({
  ...data,
  clients: data.clients.map((c) => (c.id === id ? { ...c, goal } : c)),
})

function stubBrowser() {
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
  })
  vi.stubGlobal('window', { addEventListener: () => undefined, removeEventListener: () => undefined, localStorage: globalThis.localStorage })
  return store
}

interface Device {
  repo: SupabaseRepository
  received: RemoteChange[]
}

async function connect(server: FakeServer, origin: string): Promise<Device> {
  const repo = new SupabaseRepository(server.gateway(), origin)
  const received: RemoteChange[] = []
  repo.subscribe((change) => received.push(change))
  await repo.load()
  return { repo, received }
}

async function serverWithSeed(): Promise<FakeServer> {
  const server = new FakeServer()
  const admin = await connect(server, 'setup')
  await push(admin.repo, seed)
  server.subscribers.clear()
  server.writes = []
  return server
}

describe('SupabaseRepository', () => {
  let storage: Map<string, string>

  beforeEach(() => {
    vi.useFakeTimers()
    storage = stubBrowser()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('loads an empty database as empty data, never as demo data', async () => {
    const repo = new SupabaseRepository(new FakeServer().gateway(), 'a')
    const data = await repo.load()
    expect(data.clients).toEqual([])
  })

  it('round-trips the whole dataset', async () => {
    const server = await serverWithSeed()
    const data = await new SupabaseRepository(server.gateway(), 'a').load()
    const byId = <T extends { id: string }>(items: T[]) => [...items].sort((x, y) => x.id.localeCompare(y.id))
    expect(byId(data.clients)).toEqual(byId(seed.clients))
    expect(byId(data.programs)).toEqual(byId(seed.programs))
    expect(byId(data.notes)).toEqual(byId(seed.notes))
    expect(data.branding).toEqual(seed.branding)
  })

  it('writes only the rows that changed', async () => {
    const server = await serverWithSeed()
    const { repo } = await connect(server, 'a')
    const data = await new SupabaseRepository(server.gateway(), 'b').load()
    await push(repo, withGoal(data, seed.clients[0].id, 'Nuevo'))
    expect(server.writes).toEqual([{ table: 'clients', ids: [seed.clients[0].id] }])
  })

  it('two coaches on different clients never overwrite each other', async () => {
    const server = await serverWithSeed()
    const a = await connect(server, 'a')
    const b = await connect(server, 'b')
    const dataA = await new SupabaseRepository(server.gateway(), 'x').load()
    await push(a.repo, withGoal(dataA, seed.clients[0].id, 'De A'))
    // B saves its stale copy with a different client edited: A's row is not touched.
    await push(b.repo, withGoal(dataA, seed.clients[1].id, 'De B'))
    const final = await new SupabaseRepository(server.gateway(), 'z').load()
    expect(final.clients.find((c) => c.id === seed.clients[0].id)?.goal).toBe('De A')
    expect(final.clients.find((c) => c.id === seed.clients[1].id)?.goal).toBe('De B')
  })

  it('delivers a remote change once, with the previous version, and ignores its own echo', async () => {
    const server = await serverWithSeed()
    const a = await connect(server, 'a')
    const b = await connect(server, 'b')
    const data = await new SupabaseRepository(server.gateway(), 'x').load()
    await push(a.repo, withGoal(data, seed.clients[0].id, 'De A'))
    vi.advanceTimersByTime(REMOTE_BATCH_MS)
    expect(a.received).toEqual([])
    expect(b.received).toHaveLength(1)
    const change = b.received[0]
    if (change.kind !== 'rows') throw new Error('expected rows')
    expect(change.changes).toMatchObject([{ table: 'clients', id: seed.clients[0].id, row: { goal: 'De A' } }])
    expect(change.changes[0].previous).toMatchObject({ goal: seed.clients[0].goal })
  })

  it('a save waiting its turn uses the data of that moment, not of when it was requested', async () => {
    const server = await serverWithSeed()
    const { repo } = await connect(server, 'a')
    let data = await new SupabaseRepository(server.gateway(), 'x').load()
    const [first, second] = seed.clients
    const firstSave = push(repo, withGoal(data, first.id, 'Primero'))
    data = withGoal(withGoal(data, first.id, 'Primero'), second.id, 'Segundo')
    const secondSave = repo.save(() => data, META)
    data = withGoal(data, second.id, 'Último')
    await Promise.all([firstSave, secondSave])
    expect(server.tables.clients.get(second.id)?.data).toMatchObject({ goal: 'Último' })
  })

  it('a stale copy cannot overwrite a live change that has not reached the screen yet', async () => {
    const server = await serverWithSeed()
    const a = await connect(server, 'a')
    const b = await connect(server, 'b')
    const data = await new SupabaseRepository(server.gateway(), 'x').load()
    const [first, second] = seed.clients
    await push(a.repo, withGoal(data, first.id, 'De A'))
    // B has not applied it yet (batching): saving now only touches what B changed.
    await push(b.repo, withGoal(data, second.id, 'De B'))
    expect(server.tables.clients.get(first.id)?.data).toMatchObject({ goal: 'De A' })
    vi.advanceTimersByTime(REMOTE_BATCH_MS)
    const change = b.received[0]
    if (change.kind !== 'rows') throw new Error('expected rows')
    expect(change.changes.map((c) => c.id)).toEqual([first.id])
  })

  it('ignores the echo of its own delete, even after undoing it', async () => {
    const server = await serverWithSeed()
    const held: RowEvent[] = []
    const { repo, received } = await connect(server, 'a')
    const [subscriber] = server.subscribers
    server.subscribers.clear()
    server.subscribers.add((event) => held.push(event))
    const data = await new SupabaseRepository(server.gateway(), 'x').load()
    const noteId = seed.notes[0].id
    await push(repo, { ...data, notes: data.notes.filter((n) => n.id !== noteId) })
    await push(repo, data)
    for (const event of held) subscriber(event)
    vi.advanceTimersByTime(REMOTE_BATCH_MS)
    expect(received).toEqual([])
  })

  it('rejects when offline, keeps the change pending and saves it later', async () => {
    const server = await serverWithSeed()
    const { repo } = await connect(server, 'a')
    const data = await new SupabaseRepository(server.gateway(), 'x').load()
    const edited = withGoal(data, seed.clients[0].id, 'Sin conexión')
    server.offline = true
    await expect(push(repo, edited)).rejects.toThrow()
    server.offline = false
    await push(repo, edited)
    expect(server.tables.clients.get(seed.clients[0].id)?.data).toMatchObject({ goal: 'Sin conexión' })
  })

  it('a refused row goes back to the server version; the rest are saved', async () => {
    const server = await serverWithSeed()
    const { repo, received } = await connect(server, 'a')
    const data = await new SupabaseRepository(server.gateway(), 'x').load()
    const [first, second] = seed.clients
    server.refuse.add(first.id)
    await push(repo, withGoal(withGoal(data, first.id, 'Prohibido'), second.id, 'Permitido'))
    expect(server.tables.clients.get(second.id)?.data).toMatchObject({ goal: 'Permitido' })
    expect(received).toHaveLength(1)
    const change = received[0]
    if (change.kind !== 'rows') throw new Error('expected rows')
    expect(change.rejected).toBe(true)
    expect(change.changes).toMatchObject([{ id: first.id, row: { goal: first.goal } }])
  })

  it('a refetch finds what was missed while disconnected', async () => {
    const server = await serverWithSeed()
    const a = await connect(server, 'a')
    server.subscribers.clear()
    const b = await connect(server, 'b')
    const data = await new SupabaseRepository(server.gateway(), 'x').load()
    await push(b.repo, withGoal(data, seed.clients[0].id, 'Mientras tanto'))
    await a.repo.refetch()
    expect(a.received).toHaveLength(1)
    await a.repo.refetch()
    expect(a.received).toHaveLength(1)
  })

  it('never puts private data on the device', async () => {
    const server = await serverWithSeed()
    const { repo } = await connect(server, 'a')
    const data = await new SupabaseRepository(server.gateway(), 'x').load()
    await push(repo, withGoal(data, seed.clients[0].id, 'Otro'))
    expect([...storage.keys()]).toEqual([STORAGE_KEYS.display])
    expect(storage.get(STORAGE_KEYS.display)).not.toContain(seed.notes[0].text)
    expect(storage.get(STORAGE_KEYS.display)).not.toContain(seed.clients[1].goal)
  })

  it('never writes after release (signed out): emptying the store cannot delete shared data', async () => {
    const server = await serverWithSeed()
    const { repo } = await connect(server, 'a')
    const data = await new SupabaseRepository(server.gateway(), 'x').load()
    repo.release()
    await push(repo, { ...data, clients: [], notes: [], programs: [] })
    expect(server.writes).toEqual([])
    expect(server.tables.clients.size).toBe(seed.clients.length)
  })

  it('stores the note author in the column, and the column wins on read', async () => {
    const server = await serverWithSeed()
    const note = seed.notes[0]
    const stored = server.tables.notes.get(note.id)
    expect(stored?.author_staff_id).toBe(note.authorId)
    expect(stored?.client_id).toBe(note.clientId)
    server.tables.notes.set(note.id, { ...(stored as DbRow), data: { ...note, authorId: 'falsificado' } })
    const data = await new SupabaseRepository(server.gateway(), 'x').load()
    expect(data.notes.find((n) => n.id === note.id)?.authorId).toBe(note.authorId)
  })
})
