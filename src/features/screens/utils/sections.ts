// Pure rules for screens and sections: ids, layout, and the writes each change needs (only the sections that change).

import {
  TV_DEFAULT_SCREEN_COUNT,
  TV_DEFAULT_SECTIONS,
  TV_MAX_SCREENS,
  TV_MAX_SECTIONS,
  TV_MIN_SECTIONS,
  TV_SCREEN_NAME_MAX_LENGTH,
  TV_TWO_ROWS_FROM,
} from '@/config/app'
import { moveItem } from '@/lib/arrays'
import { clamp } from '@/lib/numbers'
import type { ScreenConfig, ScreenSection, SectionContent, SectionMap, SectionRef, SectionTarget, SectionWrite } from '@/features/screens/types'

export const EMPTY_SECTION: SectionContent = { clientId: null, day: 1, assignedAt: '' }

const isIntBetween = (n: number, min: number, max: number) => Number.isInteger(n) && n >= min && n <= max

export const isValidScreenId = (id: number): boolean => isIntBetween(id, 1, TV_MAX_SCREENS)

export const clampSectionCount = (count: number): number =>
  Number.isFinite(count) ? clamp(Math.round(count), TV_MIN_SECTIONS, TV_MAX_SECTIONS) : TV_DEFAULT_SECTIONS

export const sectionId = ({ screen, section }: SectionRef): string => `${screen}:${section}`

export function parseSectionId(id: string): SectionRef | null {
  const match = /^(\d+):(\d+)$/.exec(id)
  if (!match) return null
  const ref = { screen: Number(match[1]), section: Number(match[2]) }
  return isValidScreenId(ref.screen) && isIntBetween(ref.section, 1, TV_MAX_SECTIONS) ? ref : null
}

export const defaultScreenName = (id: number): string => `Pantalla ${id}`

export const defaultScreen = (id: number): ScreenConfig => ({ id, name: defaultScreenName(id), sections: TV_DEFAULT_SECTIONS })

/** What the gym gets the first time it has no screens. */
export const defaultScreens = (): ScreenConfig[] => Array.from({ length: TV_DEFAULT_SCREEN_COUNT }, (_, i) => defaultScreen(i + 1))

/** Columns × rows of a screen: 1-3 side by side, 4 in 2 × 2, 5-6 in 3 × 2. */
export function gridFor(count: number): { columns: number; rows: number } {
  const sections = clampSectionCount(count)
  const rows = sections >= TV_TWO_ROWS_FROM ? 2 : 1
  return { columns: Math.ceil(sections / rows), rows }
}

export const toSectionMap = (sections: readonly ScreenSection[]): SectionMap =>
  Object.fromEntries(sections.map((section) => [sectionId(section), section]))

export function contentOf(sections: SectionMap, ref: SectionRef): SectionContent {
  const row = sections[sectionId(ref)]
  return row ? { clientId: row.clientId, day: row.day, assignedAt: row.assignedAt } : EMPTY_SECTION
}

/** What each section of a screen shows, in order (`count` sections, empty ones included). */
export const screenContents = (sections: SectionMap, screen: number, count: number): SectionContent[] =>
  Array.from({ length: count }, (_, i) => contentOf(sections, { screen, section: i + 1 }))

/** First section with nobody, or null when every one is taken. */
export function firstFreeSection(sections: SectionMap, screen: number, count: number): number | null {
  const index = screenContents(sections, screen, count).findIndex((content) => !content.clientId)
  return index === -1 ? null : index + 1
}

/** Where a client is being shown right now. */
export const findClientSections = (sections: SectionMap, clientId: string): SectionRef[] =>
  Object.values(sections)
    .filter((row) => row.clientId === clientId)
    .map(({ screen, section }) => ({ screen, section }))

export const isScreenEmpty = (sections: SectionMap, screen: number): boolean =>
  !Object.values(sections).some((row) => row.screen === screen && row.clientId)

/** Rows past the last section of a screen (left when it gets fewer sections). */
export const sectionIdsBeyond = (sections: SectionMap, screen: number, count: number): string[] =>
  Object.values(sections)
    .filter((row) => row.screen === screen && row.section > count)
    .map(sectionId)

const sameContent = (a: SectionContent, b: SectionContent) => a.clientId === b.clientId && a.day === b.day && a.assignedAt === b.assignedAt

/** Keeps only the writes that change something. */
const changed = (sections: SectionMap, writes: SectionWrite[]): SectionWrite[] =>
  writes.filter((write) => !sameContent(contentOf(sections, write.ref), write.content))

/** A client and day in one section; sending what it already shows changes nothing. */
export function planAssign(sections: SectionMap, ref: SectionRef, target: SectionTarget, now: string): SectionWrite[] {
  const current = contentOf(sections, ref)
  if (current.clientId === target.clientId && current.day === target.day) return []
  return [{ ref, content: { clientId: target.clientId, day: target.day, assignedAt: now } }]
}

export const planClear = (sections: SectionMap, ref: SectionRef, now: string): SectionWrite[] =>
  contentOf(sections, ref).clientId ? [{ ref, content: { ...EMPTY_SECTION, assignedAt: now } }] : []

/** Sends a client to a section and takes them out of any other one: a person is on one screen at a time. */
export function planSend(sections: SectionMap, ref: SectionRef, target: SectionTarget, now: string): SectionWrite[] {
  const assign = planAssign(sections, ref, target, now)
  if (!target.clientId) return assign
  const others = findClientSections(sections, target.clientId).filter((other) => sectionId(other) !== sectionId(ref))
  return [...assign, ...others.flatMap((other) => planClear(sections, other, now))]
}

export function planSwap(sections: SectionMap, a: SectionRef, b: SectionRef): SectionWrite[] {
  return changed(sections, [
    { ref: a, content: contentOf(sections, b) },
    { ref: b, content: contentOf(sections, a) },
  ])
}

/** Moves what section `from` shows to position `to`, the ones in between shift (1-based, like dragging a column). */
export function planReorder(sections: SectionMap, screen: number, count: number, from: number, to: number): SectionWrite[] {
  const inRange = (n: number) => isIntBetween(n, 1, count)
  if (from === to || !inRange(from) || !inRange(to)) return []
  const moved = moveItem(screenContents(sections, screen, count), from - 1, to - 1)
  return changed(
    sections,
    moved.map((content, i) => ({ ref: { screen, section: i + 1 }, content })),
  )
}

/** Fills a screen from a list (an old ?slots= link), keeping the order. */
export const planFill = (sections: SectionMap, screen: number, targets: readonly SectionTarget[], now: string): SectionWrite[] =>
  targets.flatMap((target, i) => (target.clientId ? planAssign(sections, { screen, section: i + 1 }, target, now) : []))

/** What those sections showed before: writing it back undoes them. */
export const previousOf = (sections: SectionMap, writes: readonly SectionWrite[]): SectionWrite[] =>
  writes.map(({ ref }) => ({ ref, content: contentOf(sections, ref) }))

export const toSection = ({ ref, content }: SectionWrite): ScreenSection => ({ ...ref, ...content })

export function applyWrites(sections: SectionMap, writes: readonly SectionWrite[]): SectionMap {
  if (!writes.length) return sections
  return { ...sections, ...toSectionMap(writes.map(toSection)) }
}

export const withoutSections = (sections: SectionMap, ids: readonly string[]): SectionMap =>
  ids.length ? Object.fromEntries(Object.entries(sections).filter(([id]) => !ids.includes(id))) : sections

/** A screen as saved: whole number of sections in range, a name (its default when blank). */
export function normalizeScreen(screen: ScreenConfig): ScreenConfig {
  const name = screen.name.trim().slice(0, TV_SCREEN_NAME_MAX_LENGTH)
  return { id: screen.id, name: name || defaultScreenName(screen.id), sections: clampSectionCount(screen.sections) }
}

export const upsertScreen = (screens: readonly ScreenConfig[], screen: ScreenConfig): ScreenConfig[] =>
  [...screens.filter((s) => s.id !== screen.id), screen].sort((a, b) => a.id - b.id)
