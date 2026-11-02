import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CLOUD_REFETCH_RETRY_MS, CLOUD_WRITE_BATCH_SIZE, REMOTE_BATCH_MS, STORAGE_KEYS } from '@/config/app'
import { createSeedData } from '@/data/seed'
import { DOMAIN_TABLES, type DomainTable } from '@/lib/dataRows'
import type { AppData } from '@/types'
import type { DbRow } from './dbRows'
import type { DisplayChange, RemoteChange } from './repository'
import { PermanentWriteError, type RowEvent, type RowGateway } from './rowGateway'
import { SupabaseRepository } from './supabaseRepository'

/** In-memory server: one shared database and a live feed per connected window. */
class FakeServer {
  tables = Object.fromEntries(DOMAIN_TABLES.map((t) => [t, new Map<string, DbRow>()])) as Record<DomainTable, Map<string, DbRow>>
  subscribers = new Set<(event: RowEvent) => void>()
  writes: Array<{ table: DomainTable; ids: string[] }> = []
  offline = false
  refuse = new Set<string>()
  seedPending = true

  gateway(): RowGateway {
    return {
      insertMissing: async (table, rows) => {
        this.failIfOffline()
        this.writes.push({ table, ids: rows.map((r) => r.id) })
        for (const row of rows) if (!this.tables[table].has(row.id)) this.tables[table].set(row.id, row)
      },
      librarySeedPending: async () => {
        this.failIfOffline()
        return this.seedPending
      },
      finishLibrarySeed: async () => {
        this.seedPending = false
      },
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
    setItem: vi.fn((key: string, value: string) => void store.set(key, value)),
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

  it('a save queued before the session ended never runs in the next one', async () => {
    const server = await serverWithSeed()
    let release = () => {}
    const gateway = server.gateway()
    const hung = new Promise<void>((resolve) => (release = resolve))
    const repo = new SupabaseRepository(
      {
        ...gateway,
        upsert: async (table, rows) => {
          await hung
          await gateway.upsert(table, rows)
        },
      },
      'a',
    )
    const data = await repo.load()
    const first = push(repo, withGoal(data, seed.clients[0].id, 'Colgado'))
    const second = push(repo, { ...data, clients: [], programs: [], notes: [] })
    await vi.advanceTimersByTimeAsync(0)
    repo.release()
    await repo.load()
    release()
    await Promise.all([first, second])
    expect(server.tables.clients.size).toBe(seed.clients.length)
    expect(server.writes.flatMap((w) => w.ids)).toEqual([seed.clients[0].id])
  })

  it('its own delete is not taken for a remote one, even when the live event beats the response', async () => {
    const server = await serverWithSeed()
    const { repo, received } = await connect(server, 'a')
    const data = await new SupabaseRepository(server.gateway(), 'x').load()
    await push(repo, { ...data, notes: data.notes.filter((n) => n.id !== seed.notes[0].id) })
    vi.advanceTimersByTime(REMOTE_BATCH_MS)
    expect(received).toEqual([])
  })

  it('forgets the echo of a delete that did not happen, so a real one later still counts', async () => {
    const server = await serverWithSeed()
    const { repo, received } = await connect(server, 'a')
    const data = await new SupabaseRepository(server.gateway(), 'x').load()
    const noteId = seed.notes[0].id
    server.refuse.add(noteId)
    await push(repo, { ...data, notes: data.notes.filter((n) => n.id !== noteId) })
    await vi.advanceTimersByTimeAsync(0)
    received.length = 0
    server.refuse.delete(noteId)
    await server.gateway().remove('notes', [noteId])
    vi.advanceTimersByTime(REMOTE_BATCH_MS)
    expect(received).toHaveLength(1)
  })

  it('a live change arriving during a reload is not undone by the older copy', async () => {
    const server = await serverWithSeed()
    const gateway = server.gateway()
    const client = seed.clients[0]
    let during: (() => void) | null = null
    const repo = new SupabaseRepository(
      {
        ...gateway,
        fetchAll: async (table) => {
          const rows = await gateway.fetchAll(table)
          during?.()
          during = null
          return rows
        },
      },
      'a',
    )
    const received: RemoteChange[] = []
    repo.subscribe((change) => received.push(change))
    await repo.load()
    during = () => {
      const row = server.tables.clients.get(client.id) as DbRow
      const newer = { ...row, data: { ...(row.data as object), goal: 'Más nuevo' }, client_origin: 'b' }
      server.tables.clients.set(client.id, newer)
      for (const subscriber of server.subscribers) subscriber({ table: 'clients', id: client.id, row: newer })
    }
    await repo.refetch()
    expect(received).toEqual([])
    await vi.advanceTimersByTimeAsync(CLOUD_REFETCH_RETRY_MS)
    const goals = received.flatMap((change) => (change.kind === 'rows' ? change.changes.map((c) => (c.row as { goal?: string } | null)?.goal) : []))
    expect(goals.at(-1)).toBe('Más nuevo')
    expect(goals).not.toContain(client.goal)
  })

  it('a full device still saves to the cloud, with a smaller copy for the screens', async () => {
    const server = await serverWithSeed()
    const { repo } = await connect(server, 'a')
    const data = await new SupabaseRepository(server.gateway(), 'x').load()
    const setItem = vi.mocked(localStorage.setItem)
    setItem.mockImplementationOnce(() => {
      throw new DOMException('full', 'QuotaExceededError')
    })
    await push(repo, withGoal(data, seed.clients[0].id, 'Sin sitio'))
    expect(server.tables.clients.get(seed.clients[0].id)?.data).toMatchObject({ goal: 'Sin sitio' })
    const copy = JSON.parse(storage.get(STORAGE_KEYS.display) ?? '{}') as { data: AppData }
    expect(copy.data.programs.length).toBeLessThan(seed.programs.length)
    expect(copy.data.clients.every((c) => !c.archived)).toBe(true)
  })

  it('still saves to the cloud when the device blocks storage altogether', async () => {
    const server = await serverWithSeed()
    const { repo } = await connect(server, 'a')
    const data = await new SupabaseRepository(server.gateway(), 'x').load()
    vi.mocked(localStorage.setItem).mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })
    await push(repo, withGoal(data, seed.clients[0].id, 'Bloqueado'))
    expect(server.tables.clients.get(seed.clients[0].id)?.data).toMatchObject({ goal: 'Bloqueado' })
  })

  it('a refetch after clearing a value finds nothing new: it stays cleared', async () => {
    const server = await serverWithSeed()
    const { repo, received } = await connect(server, 'a')
    const data = await new SupabaseRepository(server.gateway(), 'x').load()
    const program = data.programs.find((p) => p.days.some((d) => d.blocks.some((b) => Object.keys(b.params).length > 0)))
    if (!program) throw new Error('missing program')
    const cleared = {
      ...program,
      days: program.days.map((day, index) => ({
        ...day,
        name: index === 0 ? '' : day.name,
        blocks: day.blocks.map((block) => ({ ...block, params: {} })),
      })),
    }
    await push(repo, { ...data, programs: data.programs.map((p) => (p.id === program.id ? cleared : p)) })
    await repo.refetch()
    expect(received).toEqual([])
    const reloaded = await new SupabaseRepository(server.gateway(), 'z').load()
    expect(reloaded.programs.find((p) => p.id === program.id)?.days[0].name).toBe('')
  })

  it('stores the note author in the column, and the column wins on read', async () => {
    const server = await serverWithSeed()
    const note = seed.notes[0]
    const stored = server.tables.notes.get(note.id)
    expect(stored?.author_profile_id).toBe(note.authorId)
    expect(stored?.client_id).toBe(note.clientId)
    server.tables.notes.set(note.id, { ...(stored as DbRow), data: { ...note, authorId: 'falsificado' } })
    const data = await new SupabaseRepository(server.gateway(), 'x').load()
    expect(data.notes.find((n) => n.id === note.id)?.authorId).toBe(note.authorId)
  })
})

describe('SupabaseRepository initial library', () => {
  const library = seed.library

  beforeEach(() => {
    stubBrowser()
  })

  it('uploads it once in batches and comes back with the whole dataset', async () => {
    const server = new FakeServer()
    const { repo } = await connect(server, 'a')
    const data = await repo.seedLibrary(library)
    expect(data?.library).toHaveLength(library.length)
    const batches = server.writes.filter((write) => write.table === 'library_exercises')
    expect(batches.length).toBeGreaterThan(1)
    expect(Math.max(...batches.map((batch) => batch.ids.length))).toBeLessThanOrEqual(CLOUD_WRITE_BATCH_SIZE)
    expect(server.seedPending).toBe(false)
    expect(await repo.seedLibrary(library)).toBeNull()
  })

  it('does nothing when it is not pending: an emptied library stays empty', async () => {
    const server = new FakeServer()
    server.seedPending = false
    const { repo } = await connect(server, 'a')
    expect(await repo.seedLibrary(library)).toBeNull()
    expect(server.writes).toEqual([])
  })

  it('a failed upload stays pending, and the retry keeps what was already there', async () => {
    const server = new FakeServer()
    server.tables.library_exercises.set(library[0].id, { id: library[0].id, data: { ...library[0], name: 'Editado' } })
    const { repo } = await connect(server, 'a')
    server.offline = true
    await expect(repo.seedLibrary(library)).rejects.toThrow()
    server.offline = false
    expect(server.seedPending).toBe(true)
    const data = await repo.seedLibrary(library)
    expect(data?.library.find((exercise) => exercise.id === library[0].id)?.name).toBe('Editado')
  })

  it('big saves go in batches too', async () => {
    const server = new FakeServer()
    const { repo } = await connect(server, 'a')
    await push(repo, { ...(await repo.load()), library })
    const batches = server.writes.filter((write) => write.table === 'library_exercises')
    expect(batches.flatMap((batch) => batch.ids)).toHaveLength(library.length)
    expect(Math.max(...batches.map((batch) => batch.ids.length))).toBeLessThanOrEqual(CLOUD_WRITE_BATCH_SIZE)
  })
})

describe('SupabaseRepository display windows', () => {
  it('read by themselves, with no dashboard, and only ever store sanitised data', async () => {
    const store = stubBrowser()
    const server = new FakeServer()
    const [client] = seed.clients
    server.tables.clients.set(client.id, { id: client.id, data: { ...client, goal: 'SECRETO' } })
    server.tables.notes.set('n1', { id: 'n1', data: { text: 'NOTA SECRETA' }, client_id: client.id })
    const repo = new SupabaseRepository(server.gateway(), 'ventana-a')
    const received: DisplayChange[] = []
    const stop = repo.subscribeDisplay((change) => received.push(change))
    await vi.waitFor(() => expect(received).toHaveLength(1))
    expect(received[0].data.clients.map((c) => c.id)).toEqual([client.id])
    expect(received[0].source).toContain('ventana-a')
    expect(JSON.stringify(received)).not.toContain('SECRETO')
    expect(store.get(STORAGE_KEYS.display)).toContain(client.id)
    expect(store.get(STORAGE_KEYS.display)).not.toContain('SECRETO')
    stop()
  })
})
