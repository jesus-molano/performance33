// Hash routes (works on any static host).
//
//   #/                                       → pick-coach  (¿Quién eres?)
//   #/clientes                               → clients
//   #/clientes/:clientId                     → client
//   #/clientes/:clientId/programa/:programId → program (editor)
//   #/ajustes?tab=marca|biblioteca|monitores|datos → settings
//   #/pantalla/:clientId?dia=2&programa=pid  → display (single client, no app chrome)
//   #/tv?slots=cid:1,-,cid:2                 → tv (1-4 columns, '-' = empty, no app chrome)

import { TV_DEFAULT_SLOTS, TV_EMPTY_SLOT_TOKEN, TV_MAX_SLOTS, TV_MIN_SLOTS } from '@/config/app'
import { clamp } from '@/lib/numbers'

export interface TvSlot {
  clientId: string | null
  /** 1-based day number. */
  day: number
}

export const SETTINGS_TABS = ['marca', 'biblioteca', 'monitores', 'datos'] as const
export type SettingsTab = (typeof SETTINGS_TABS)[number]

export type Route =
  | { name: 'pick-coach' }
  | { name: 'clients' }
  | { name: 'client'; clientId: string }
  | { name: 'program'; clientId: string; programId: string }
  | { name: 'settings'; tab: SettingsTab }
  | { name: 'display'; clientId: string; day: number | null; programId: string | null }
  | { name: 'tv'; slots: TvSlot[] }
  | { name: 'not-found'; path: string }

export type RouteName = Route['name']

/** Routes rendered without the dashboard chrome and without loading private data. */
export function isScreenRoute(route: Route): route is Extract<Route, { name: 'display' | 'tv' }> {
  return route.name === 'display' || route.name === 'tv'
}

const parseDay = (raw: string | null | undefined): number | null => {
  const n = Number(raw)
  return Number.isInteger(n) && n >= 1 ? n : null
}

function parseTvSlot(raw: string): TvSlot {
  const [clientId, day] = raw.split(':')
  if (!clientId || clientId === TV_EMPTY_SLOT_TOKEN) return { clientId: null, day: 1 }
  return { clientId: decodeURIComponent(clientId), day: parseDay(day) ?? 1 }
}

/**
 * 'cid:1,-,cid:2' → one slot per entry, clamped to TV_MIN_SLOTS..TV_MAX_SLOTS.
 * Missing list → TV_DEFAULT_SLOTS empty slots. Old 3-slot URLs ('cid:1,cid:2,') keep working.
 */
export function parseTvSlots(raw: string | null): TvSlot[] {
  const parts = raw ? raw.split(',') : []
  const count = parts.length ? clamp(parts.length, TV_MIN_SLOTS, TV_MAX_SLOTS) : TV_DEFAULT_SLOTS
  return Array.from({ length: count }, (_, i) => parseTvSlot(parts[i] ?? ''))
}

export function serializeTvSlots(slots: TvSlot[]): string {
  return slots
    .slice(0, TV_MAX_SLOTS)
    .map((slot) => (slot.clientId ? `${encodeURIComponent(slot.clientId)}:${slot.day || 1}` : TV_EMPTY_SLOT_TOKEN))
    .join(',')
}

const enc = encodeURIComponent

/** Hash path builders. Use with navigate() or as <a href>. */
export const paths = {
  pickCoach: () => '#/',
  clients: () => '#/clientes',
  client: (clientId: string) => `#/clientes/${enc(clientId)}`,
  program: (clientId: string, programId: string) => `#/clientes/${enc(clientId)}/programa/${enc(programId)}`,
  settings: (tab?: SettingsTab) => (tab ? `#/ajustes?tab=${tab}` : '#/ajustes'),
  display: (clientId: string, day?: number | null, programId?: string | null) => {
    const query = new URLSearchParams()
    if (day) query.set('dia', String(day))
    if (programId) query.set('programa', programId)
    const qs = query.toString()
    return `#/pantalla/${enc(clientId)}${qs ? `?${qs}` : ''}`
  },
  tv: (slots: TvSlot[] = []) => `#/tv?slots=${serializeTvSlots(slots)}`,
}

function parseSettingsTab(raw: string | null): SettingsTab {
  return SETTINGS_TABS.find((t) => t === raw) ?? 'marca'
}

export function parseRoute(hash: string): Route {
  const raw = hash.replace(/^#/, '') || '/'
  const [pathPart, queryPart = ''] = raw.split('?')
  const query = new URLSearchParams(queryPart)
  const seg = pathPart.split('/').filter(Boolean).map((s) => decodeURIComponent(s))

  if (seg.length === 0) return { name: 'pick-coach' }
  if (seg[0] === 'clientes') {
    if (seg.length === 1) return { name: 'clients' }
    if (seg.length === 2) return { name: 'client', clientId: seg[1] }
    if (seg.length === 4 && seg[2] === 'programa') return { name: 'program', clientId: seg[1], programId: seg[3] }
  }
  if (seg[0] === 'ajustes' && seg.length === 1) return { name: 'settings', tab: parseSettingsTab(query.get('tab')) }
  if (seg[0] === 'pantalla' && seg.length === 2) {
    return { name: 'display', clientId: seg[1], day: parseDay(query.get('dia')), programId: query.get('programa') }
  }
  if (seg[0] === 'tv' && seg.length === 1) return { name: 'tv', slots: parseTvSlots(query.get('slots')) }
  return { name: 'not-found', path: pathPart }
}

const toHash = (path: string) => (path.startsWith('#') ? path : `#${path}`)

/** Navigate to a hash path (adds a history entry). */
export function navigate(path: string): void {
  const target = toHash(path)
  if (window.location.hash !== target) window.location.hash = target
}

/** Replace the current hash without a history entry (TV slot changes, day switch). */
export function replaceRoute(path: string): void {
  const url = `${window.location.pathname}${window.location.search}${toHash(path)}`
  window.history.replaceState(null, '', url)
  window.dispatchEvent(new HashChangeEvent('hashchange'))
}

/** Absolute URL for a hash path: '#/pantalla/abc' → 'https://host/#/pantalla/abc'. */
export function absoluteHashUrl(hashPath: string): string {
  return `${window.location.href.split('#')[0]}${toHash(hashPath)}`
}
