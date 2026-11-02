// What a TV window reads for itself in the cloud, so it stays live with no dashboard open.
// Every row is sanitised the moment it arrives: this module never keeps a private field, and it never
// asks for the tables with nothing to show (notes, library).

import { CLOUD_REFETCH_INTERVAL_MS, CLOUD_REFETCH_MIN_GAP_MS, CLOUD_REFETCH_RETRY_MS, REMOTE_BATCH_MS } from '@/config/app'
import { DEFAULT_BRANDING } from '@/config/branding'
import { deepEqual } from '@/lib/deepEqual'
import { toPublicClient, toPublicProgram } from '@/lib/display'
import type { DomainTable } from '@/lib/dataRows'
import type { Branding, Client, DisplayData, Program, PublicClient, PublicProgram } from '@/types'
import { rowFromDb, type DbRow } from './dbRows'
import type { RowGateway } from './rowGateway'

const DISPLAY_TABLES = ['settings', 'clients', 'programs'] as const satisfies readonly DomainTable[]
type DisplayTable = (typeof DISPLAY_TABLES)[number]
const isDisplayTable = (table: DomainTable): table is DisplayTable => (DISPLAY_TABLES as readonly DomainTable[]).includes(table)

interface FeedState {
  branding: Branding
  clients: Map<string, PublicClient>
  programs: Map<string, PublicProgram>
}

function applyRow(state: FeedState, table: DisplayTable, id: string, raw: DbRow | null): void {
  if (table === 'settings') {
    if (raw) state.branding = rowFromDb(table, raw) as Branding
  } else if (table === 'clients') {
    if (raw) state.clients.set(id, toPublicClient(rowFromDb(table, raw) as Client))
    else state.clients.delete(id)
  } else if (raw) {
    state.programs.set(id, toPublicProgram(rowFromDb(table, raw) as Program))
  } else {
    state.programs.delete(id)
  }
}

const toDisplayData = (state: FeedState): DisplayData => ({
  branding: state.branding,
  clients: [...state.clients.values()],
  programs: [...state.programs.values()],
})

/**
 * Loads, follows and passes on only what changed. Failed reads keep the last data: the TV goes on showing it.
 * Live events before the first good read wait: on their own they would look like a gym with only that one person.
 */
export function startCloudDisplayFeed(gateway: RowGateway, emit: (data: DisplayData) => void): () => void {
  const state: FeedState = { branding: { ...DEFAULT_BRANDING }, clients: new Map(), programs: new Map() }
  let stopped = false
  let loaded = false
  let lastEmitted: DisplayData | null = null
  let lastFetchAt = 0
  let eventsSeen = 0
  let batchTimer: ReturnType<typeof setTimeout> | null = null
  let retryTimer: ReturnType<typeof setTimeout> | null = null

  const publish = () => {
    const data = toDisplayData(state)
    if (deepEqual(lastEmitted, data)) return
    lastEmitted = data
    emit(data)
  }

  const reload = async () => {
    const eventsAtStart = eventsSeen
    lastFetchAt = Date.now()
    let rows: Record<DisplayTable, DbRow[]>
    try {
      const [settings, clients, programs] = await Promise.all(DISPLAY_TABLES.map((table) => gateway.fetchAll(table)))
      rows = { settings, clients, programs }
    } catch {
      return
    }
    if (stopped) return
    // A live change landed while reading: this copy may not include it. Read again soon.
    if (eventsAtStart !== eventsSeen) {
      retryTimer ??= setTimeout(() => {
        retryTimer = null
        void reload()
      }, CLOUD_REFETCH_RETRY_MS)
      return
    }
    state.clients.clear()
    state.programs.clear()
    for (const table of DISPLAY_TABLES) for (const raw of rows[table]) applyRow(state, table, raw.id, raw)
    loaded = true
    publish()
  }

  const reloadSoon = () => {
    if (Date.now() - lastFetchAt >= CLOUD_REFETCH_MIN_GAP_MS) void reload()
  }
  const reloadNow = () => void reload()

  const stopGateway = gateway.subscribe(
    ({ table, id, row }) => {
      if (!isDisplayTable(table)) return
      eventsSeen++
      applyRow(state, table, id, row)
      if (!loaded) return
      batchTimer ??= setTimeout(() => {
        batchTimer = null
        publish()
      }, REMOTE_BATCH_MS)
    },
    reloadNow,
    DISPLAY_TABLES,
  )
  const interval = setInterval(reloadNow, CLOUD_REFETCH_INTERVAL_MS)
  window.addEventListener('focus', reloadSoon)
  window.addEventListener('online', reloadNow)
  void reload()

  return () => {
    stopped = true
    stopGateway()
    clearInterval(interval)
    window.removeEventListener('focus', reloadSoon)
    window.removeEventListener('online', reloadNow)
    if (batchTimer) clearTimeout(batchTimer)
    if (retryTimer) clearTimeout(retryTimer)
  }
}
