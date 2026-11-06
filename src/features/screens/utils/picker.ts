// What the 'Mandar a pantalla' picker and the top bar status show. Pure: no React, no storage.

import type { ScreenView, SectionRef, SectionTarget } from '@/features/screens/types'
import { defaultScreenName, gridFor, parseSectionId, sectionId } from './sections'

export interface PickerTile {
  ref: SectionRef
  /** First name of who it shows, or null when free (also for a client that no longer exists). */
  occupant: string | null
  /** It already shows the person being sent (any day). */
  isTarget: boolean
  /** The last section this device sent someone to. */
  isLast: boolean
}

export interface PickerScreen {
  id: number
  name: string
  online: boolean
  columns: number
  rows: number
  tiles: PickerTile[]
}

const sameRef = (a: SectionRef | null, b: SectionRef) => a !== null && sectionId(a) === sectionId(b)

/** One card per screen, its sections in the order and grid the TV uses. */
export function buildPickerScreens(
  views: readonly ScreenView[],
  names: ReadonlyMap<string, string>,
  target: SectionTarget,
  last: SectionRef | null,
): PickerScreen[] {
  return views.map((view) => ({
    id: view.id,
    name: view.name,
    online: view.online,
    ...gridFor(view.sections),
    tiles: view.contents.map((content, i) => {
      const ref = { screen: view.id, section: i + 1 }
      return {
        ref,
        occupant: content.clientId ? (names.get(content.clientId) ?? null) : null,
        isTarget: content.clientId !== null && content.clientId === target.clientId,
        isLast: sameRef(last, ref),
      }
    }),
  }))
}

/** The last destination this device stored, while that screen still has that section. */
export function resolveLastDestination(raw: string | null, views: readonly ScreenView[]): SectionRef | null {
  const ref = raw ? parseSectionId(raw) : null
  if (!ref) return null
  const view = views.find((v) => v.id === ref.screen)
  return view && ref.section <= view.sections ? ref : null
}

/** Who a section shows before a send replaces it: null when free or when it already shows that person. */
export function replacedOccupant(views: readonly ScreenView[], ref: SectionRef, clientId: string, names: ReadonlyMap<string, string>): string | null {
  const current = views.find((v) => v.id === ref.screen)?.contents[ref.section - 1]?.clientId ?? null
  return current && current !== clientId ? (names.get(current) ?? null) : null
}

export const screenNameOf = (views: readonly ScreenView[], screen: number): string =>
  views.find((v) => v.id === screen)?.name ?? defaultScreenName(screen)

export type ScreensSummaryTone = 'all' | 'some' | 'none'

export interface ScreensSummary {
  tone: ScreensSummaryTone
  open: number
  total: number
  /** Names of the screens whose TV window is not open. */
  closed: string[]
}

/** 'Pantallas 2/2', '1 sin conexión' or 'Ninguna abierta'; null while the gym has no screens. */
export function summarizeScreens(views: readonly ScreenView[]): ScreensSummary | null {
  if (!views.length) return null
  const closed = views.filter((v) => !v.online).map((v) => v.name)
  const open = views.length - closed.length
  const tone: ScreensSummaryTone = !closed.length ? 'all' : open ? 'some' : 'none'
  return { tone, open, total: views.length, closed }
}
