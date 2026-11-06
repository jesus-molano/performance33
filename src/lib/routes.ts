// Hash routes (works on any static host).
//
//   #/ or #/clientes                         → clients
//   #/clientes/:clientId                     → client
//   #/clientes/:clientId/programa/:programId → program (editor)
//   #/ajustes?tab=marca|biblioteca|pantallas|equipo|datos → settings
//   #/pantalla/:clientId?dia=2&programa=pid  → display (single client, no app chrome)
//   #/tv?pantalla=2                          → tv (Pantalla N, default 1, no app chrome; its sections live in the database)
//   #/tv?slots=cid:1,-,cid:2&pantalla=2      → old TV links: the list fills that screen once, if it was empty

import { TV_DEFAULT_SCREEN, TV_EMPTY_SLOT_TOKEN, TV_MAX_SCREENS, TV_MAX_SECTIONS, TV_MIN_SECTIONS } from '@/config/app'
import { clamp } from '@/lib/numbers'

export interface TvSlot {
  clientId: string | null
  /** 1-based day number. */
  day: number
}

export const SETTINGS_TABS = ['marca', 'biblioteca', 'pantallas', 'equipo', 'datos'] as const
export type SettingsTab = (typeof SETTINGS_TABS)[number]

export type Route =
  | { name: 'clients' }
  | { name: 'client'; clientId: string }
  | { name: 'program'; clientId: string; programId: string }
  | { name: 'settings'; tab: SettingsTab }
  | { name: 'display'; clientId: string; day: number | null; programId: string | null }
  /** `legacySlots`: the list of an old ?slots= link, null when there is none. */
  | { name: 'tv'; screen: number; legacySlots: TvSlot[] | null }
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

/** Number of a named TV screen; a missing or invalid one (old URLs) is Pantalla 1. */
export function parseTvScreen(raw: string | null): number {
  const screen = parseDay(raw)
  return screen && screen <= TV_MAX_SCREENS ? screen : TV_DEFAULT_SCREEN
}

function parseTvSlot(raw: string): TvSlot {
  const [clientId, day] = raw.split(':')
  if (!clientId || clientId === TV_EMPTY_SLOT_TOKEN) return { clientId: null, day: 1 }
  return { clientId: decodeURIComponent(clientId), day: parseDay(day) ?? 1 }
}

/**
 * Old links: 'cid:1,-,cid:2' → one slot per entry, clamped to TV_MIN_SECTIONS..TV_MAX_SECTIONS.
 * Missing or empty list → null. Old 3-slot URLs ('cid:1,cid:2,') keep their 3 columns.
 */
export function parseLegacyTvSlots(raw: string | null): TvSlot[] | null {
  if (!raw) return null
  const parts = raw.split(',')
  return Array.from({ length: clamp(parts.length, TV_MIN_SECTIONS, TV_MAX_SECTIONS) }, (_, i) => parseTvSlot(parts[i] ?? ''))
}

/** Same text format as the old links: also a compact key for a set of slots. */
export function serializeTvSlots(slots: readonly TvSlot[]): string {
  return slots
    .slice(0, TV_MAX_SECTIONS)
    .map((slot) => (slot.clientId ? `${encodeURIComponent(slot.clientId)}:${slot.day || 1}` : TV_EMPTY_SLOT_TOKEN))
    .join(',')
}

const enc = encodeURIComponent

/** Hash path builders. Use with navigate() or as <a href>. */
export const paths = {
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
  tv: (screen: number = TV_DEFAULT_SCREEN) => `#/tv?pantalla=${screen}`,
}

function parseSettingsTab(raw: string | null): SettingsTab {
  return SETTINGS_TABS.find((t) => t === raw) ?? 'marca'
}

export function parseRoute(hash: string): Route {
  const raw = hash.replace(/^#/, '') || '/'
  const [pathPart, queryPart = ''] = raw.split('?')
  const query = new URLSearchParams(queryPart)
  const seg = pathPart.split('/').filter(Boolean).map((s) => decodeURIComponent(s))

  if (seg.length === 0) return { name: 'clients' }
  if (seg[0] === 'clientes') {
    if (seg.length === 1) return { name: 'clients' }
    if (seg.length === 2) return { name: 'client', clientId: seg[1] }
    if (seg.length === 4 && seg[2] === 'programa') return { name: 'program', clientId: seg[1], programId: seg[3] }
  }
  if (seg[0] === 'ajustes' && seg.length === 1) return { name: 'settings', tab: parseSettingsTab(query.get('tab')) }
  if (seg[0] === 'pantalla' && seg.length === 2) {
    return { name: 'display', clientId: seg[1], day: parseDay(query.get('dia')), programId: query.get('programa') }
  }
  if (seg[0] === 'tv' && seg.length === 1) {
    return { name: 'tv', screen: parseTvScreen(query.get('pantalla')), legacySlots: parseLegacyTvSlots(query.get('slots')) }
  }
  return { name: 'not-found', path: pathPart }
}

const toHash = (path: string) => (path.startsWith('#') ? path : `#${path}`)

/** Navigate to a hash path (adds a history entry). */
export function navigate(path: string): void {
  const target = toHash(path)
  if (window.location.hash !== target) window.location.hash = target
}

let pagesVisited = 0
if (typeof window !== 'undefined') window.addEventListener('hashchange', () => pagesVisited++)

/** Back to the previous page of the app. False when this is the first one (opened directly): there is nothing to go back to. */
export function goBackInApp(): boolean {
  if (pagesVisited === 0) return false
  window.history.back()
  return true
}

/** Replace the current hash without a history entry (day switch, an old TV link once read). */
export function replaceRoute(path: string): void {
  const url = `${window.location.pathname}${window.location.search}${toHash(path)}`
  window.history.replaceState(null, '', url)
  window.dispatchEvent(new HashChangeEvent('hashchange'))
}

/** Absolute URL for a hash path: '#/pantalla/abc' → 'https://host/#/pantalla/abc'. */
export function absoluteHashUrl(hashPath: string): string {
  return `${window.location.href.split('#')[0]}${toHash(hashPath)}`
}
