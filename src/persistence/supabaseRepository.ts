// The shared cloud. Only rows that really changed are written, so two coaches editing different
// clients never overwrite each other (same row: last write wins). `base` is the last version known
// to be on the server; every save and every live update is measured against it.

import { CLOUD_REFETCH_INTERVAL_MS, CLOUD_REFETCH_MIN_GAP_MS, REMOTE_BATCH_MS } from '@/config/app'
import { toDisplayData } from '@/lib/display'
import { deepEqual } from '@/lib/deepEqual'
import { diffRowSets, DOMAIN_TABLES, toRowSet, type DomainRow, type DomainTable, type RowChange, type RowSet } from '@/lib/dataRows'
import type { AppData, DisplayData } from '@/types'
import { appDataFromDb, rowFromDb, rowToDb, type DbRow } from './dbRows'
import { clearDisplayCache, listenDisplayCache, readDisplayCache, writeDisplayCache } from './displayCache'
import type { ChangeMeta, DisplayChange, RemoteChange, Repository } from './repository'
import { PermanentWriteError, type RowEvent, type RowGateway } from './rowGateway'

const SOURCE = 'cloud'

const echoKey = (table: DomainTable, id: string) => `${table}:${id}`
type RowWrite = RowChange & { row: NonNullable<RowChange['row']> }
const isWrite = (change: RowChange): change is RowWrite => change.row !== null

export class SupabaseRepository implements Repository {
  readonly sharesDataAcrossTabs = false

  private readonly gateway: RowGateway
  private readonly origin: string
  private base: RowSet | null = null
  /** Saves run one after another, always from the latest `base`. */
  private queue: Promise<void> = Promise.resolve()
  private savesStarted = 0
  private lastFetchAt = 0
  private revision = 0
  private listener: ((change: RemoteChange) => void) | null = null
  /** Our own deletes: their live event carries only the id, so it cannot be told apart by origin. */
  private readonly deleteEchoes = new Set<string>()
  /** Live changes waiting to be applied. `base` and the store are updated together when they are, never apart. */
  private readonly incoming = new Map<string, RowChange>()
  private incomingTimer: ReturnType<typeof setTimeout> | null = null

  constructor(gateway: RowGateway, origin: string) {
    this.gateway = gateway
    this.origin = origin
  }

  /** Never null: an empty database is an empty dataset (the demo is only loaded on request). */
  async load(): Promise<AppData> {
    const data = await this.fetchData()
    this.base = toRowSet(data)
    return data
  }

  save(getData: () => AppData, meta: ChangeMeta): Promise<void> {
    writeDisplayCache(toDisplayData(getData()), meta)
    const run = this.queue.then(() => this.push(getData()))
    this.queue = run.catch(() => undefined)
    return run
  }

  async saveDisplay(data: DisplayData, meta: ChangeMeta): Promise<void> {
    writeDisplayCache(data, meta)
  }

  async clear(): Promise<void> {
    clearDisplayCache()
  }

  release(): void {
    this.base = null
    this.deleteEchoes.clear()
    this.incoming.clear()
  }

  loadDisplaySync(): DisplayData | null {
    return readDisplayCache()
  }

  subscribeDisplay(listener: (change: DisplayChange) => void): () => void {
    return listenDisplayCache(listener)
  }

  subscribe(listener: (change: RemoteChange) => void): () => void {
    this.listener = listener
    const catchUp = () => void this.refetch()
    const catchUpSoon = () => {
      if (Date.now() - this.lastFetchAt >= CLOUD_REFETCH_MIN_GAP_MS) catchUp()
    }
    const stopGateway = this.gateway.subscribe((event) => this.onRowEvent(event), catchUp)
    const interval = setInterval(catchUp, CLOUD_REFETCH_INTERVAL_MS)
    window.addEventListener('focus', catchUpSoon)
    window.addEventListener('online', catchUp)
    return () => {
      this.listener = null
      stopGateway()
      clearInterval(interval)
      window.removeEventListener('focus', catchUpSoon)
      window.removeEventListener('online', catchUp)
      if (this.incomingTimer) clearTimeout(this.incomingTimer)
      this.incomingTimer = null
    }
  }

  /** Reloads everything and applies the differences. Skipped if a save overlaps: it could look like a remote change. */
  async refetch(): Promise<void> {
    await this.queue
    if (!this.base) return
    const started = this.savesStarted
    let remote: RowSet
    try {
      remote = toRowSet(await this.fetchData())
    } catch {
      return
    }
    if (!this.base || started !== this.savesStarted) return
    const changes = diffRowSets(this.base, remote)
    this.base = remote
    this.deleteEchoes.clear()
    if (changes.length > 0) this.emit(changes)
  }

  private async fetchData(): Promise<AppData> {
    this.lastFetchAt = Date.now()
    const pairs = await Promise.all(DOMAIN_TABLES.map(async (table) => [table, await this.gateway.fetchAll(table)] as const))
    return appDataFromDb(Object.fromEntries(pairs) as Record<DomainTable, DbRow[]>)
  }

  private async push(data: AppData): Promise<void> {
    if (!this.base) return
    const changes = diffRowSets(this.base, toRowSet(data))
    if (changes.length === 0) return
    this.savesStarted++
    const rejected: RowChange[] = []
    let missed = false
    for (const table of DOMAIN_TABLES) {
      const writes = changes.filter((change): change is RowWrite => change.table === table && isWrite(change))
      if (writes.length > 0) await this.writeRows(table, writes, rejected)
    }
    for (const table of [...DOMAIN_TABLES].reverse()) {
      const deletes = changes.filter((change) => change.table === table && !isWrite(change))
      if (deletes.length > 0) missed = (await this.deleteRows(table, deletes)) || missed
    }
    if (rejected.length > 0) this.emit(rejected, true)
    if (missed) void this.refetch()
  }

  /** On a refusal, tries row by row so that only the offending rows are lost. */
  private async writeRows(table: DomainTable, writes: RowWrite[], rejected: RowChange[]): Promise<void> {
    try {
      await this.gateway.upsert(table, writes.map((change) => rowToDb(change, this.origin)))
      for (const change of writes) this.remember(table, change.id, change.row)
    } catch (error) {
      if (!(error instanceof PermanentWriteError)) throw error
      if (writes.length > 1) {
        for (const change of writes) await this.writeRows(table, [change], rejected)
        return
      }
      const known = this.base?.[table].get(writes[0].id) ?? null
      rejected.push({ table, id: writes[0].id, row: known } as RowChange)
    }
  }

  /** Returns true when the server deleted fewer rows than asked (refused, or already gone). */
  private async deleteRows(table: DomainTable, deletes: RowChange[]): Promise<boolean> {
    const ids = deletes.map((change) => change.id)
    const deleted = await this.gateway.remove(table, ids)
    for (const id of deleted) this.deleteEchoes.add(echoKey(table, id))
    for (const id of ids) this.base?.[table].delete(id)
    return deleted.length < ids.length
  }

  private remember(table: DomainTable, id: string, row: DomainRow): void {
    this.base?.[table].set(id, row)
  }

  private onRowEvent({ table, id, row: raw }: RowEvent): void {
    if (!this.base) return
    if (raw?.client_origin === this.origin) return
    if (!raw && this.deleteEchoes.delete(echoKey(table, id))) return
    const key = echoKey(table, id)
    const previous = this.incoming.get(key)?.previous ?? this.base[table].get(id) ?? null
    const row = raw ? rowFromDb(table, raw) : null
    this.incoming.set(key, { table, id, row, previous } as RowChange)
    this.incomingTimer ??= setTimeout(() => this.flushIncoming(), REMOTE_BATCH_MS)
  }

  private flushIncoming(): void {
    this.incomingTimer = null
    const changes = [...this.incoming.values()].filter((change) => !deepEqual(change.previous, change.row))
    this.incoming.clear()
    for (const change of changes) {
      if (change.row) this.remember(change.table, change.id, change.row)
      else this.base?.[change.table].delete(change.id)
    }
    if (changes.length > 0) this.emit(changes)
  }

  private emit(changes: RowChange[], rejected = false): void {
    this.listener?.({ source: SOURCE, revision: ++this.revision, kind: 'rows', changes, rejected })
  }
}
