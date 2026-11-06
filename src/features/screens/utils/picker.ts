// What the 'Mandar a pantalla' picker and the top bar status show. Pure: no React, no storage.

import { PICKER_WIDE_COLUMNS } from '@/features/screens/config/screens'
import type { ScreenView, SectionRef, SectionTarget } from '@/features/screens/types'
import { defaultScreenName, gridFor, parseSectionId, sectionId } from './sections'

export interface PickerTile {
  ref: SectionRef
  /** First name of who it shows, or null when free (also for a client that no longer exists). */
  occupant: string | null
  /** It already shows the person being sent: that day ('same') or another one ('other-day', see shownDay). */
  here: 'same' | 'other-day' | null
  /** Day it shows now. */
  shownDay: number
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

const hereState = (content: SectionTarget, target: SectionTarget): PickerTile['here'] =>
  content.clientId === null || content.clientId !== target.clientId ? null : content.day === target.day ? 'same' : 'other-day'

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
        here: hereState(content, target),
        shownDay: content.day,
        isLast: sameRef(last, ref),
      }
    }),
  }))
}

/** 4 or more sections side by side: the card takes the whole width of the picker, and the tiles say only the number on phones. */
export const isWideScreen = (screen: Pick<PickerScreen, 'columns'>): boolean => screen.columns >= PICKER_WIDE_COLUMNS

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

/** The section a send takes the person out of (the first other one showing them), or null. */
export function movedFromSection(views: readonly ScreenView[], ref: SectionRef, clientId: string): SectionRef | null {
  for (const view of views) {
    const index = view.contents.findIndex((content, i) => content.clientId === clientId && sectionId({ screen: view.id, section: i + 1 }) !== sectionId(ref))
    if (index !== -1) return { screen: view.id, section: index + 1 }
  }
  return null
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

/** 'Pantallas 2/2', '1 sin abrir' or 'Ninguna abierta'; null while the gym has no screens. */
export function summarizeScreens(views: readonly ScreenView[]): ScreensSummary | null {
  if (!views.length) return null
  const closed = views.filter((v) => !v.online).map((v) => v.name)
  const open = views.length - closed.length
  const tone: ScreensSummaryTone = !closed.length ? 'all' : open ? 'some' : 'none'
  return { tone, open, total: views.length, closed }
}
